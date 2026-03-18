package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.dto.TestImportDtos;
import com.alvaro.psicoapp.dto.TestImportDtos.*;
import com.alvaro.psicoapp.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TestImportService {
	private static final Logger logger = LoggerFactory.getLogger(TestImportService.class);

	private final TestRepository testRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final FactorRepository factorRepository;
	private final SubfactorRepository subfactorRepository;

	public TestImportService(TestRepository testRepository, QuestionRepository questionRepository,
							 AnswerRepository answerRepository, FactorRepository factorRepository,
							 SubfactorRepository subfactorRepository) {
		this.testRepository = testRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.factorRepository = factorRepository;
		this.subfactorRepository = subfactorRepository;
	}

	public ParseResult parseExcel(MultipartFile file) {
		if (file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está vacío");
		}

		String filename = file.getOriginalFilename();
		if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se aceptan archivos .xlsx o .xls");
		}

		try (InputStream is = file.getInputStream()) {
			Workbook workbook = filename.endsWith(".xlsx") ? new XSSFWorkbook(is) : new HSSFWorkbook(is);
			Sheet sheet = workbook.getSheetAt(0);

			// Detectar formato: Delphos (pregunta en col D) o genérico (pregunta en col A)
			int format = detectFormat(sheet);
			logger.info("Formato Excel detectado: {}", format == 1 ? "Delphos" : "Genérico");

			String detectedTitle = format == 1 ? extractTitleDelphos(sheet) : extractTitleGeneric(sheet);
			List<ParsedQuestion> questions = format == 1 ? extractQuestionsDelphos(sheet) : extractQuestionsGeneric(sheet);

			workbook.close();
			return new ParseResult(detectedTitle, questions.size(), questions);
		} catch (ResponseStatusException e) {
			throw e;
		} catch (Exception e) {
			logger.error("Error al parsear Excel", e);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Error al parsear el archivo Excel: " + e.getMessage());
		}
	}

	@Transactional
	public ImportResponse importTest(TestImportDtos.ImportRequest req) {
		if (req.code == null || req.code.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código del test es obligatorio");
		}
		if (req.title == null || req.title.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título del test es obligatorio");
		}
		if (req.questions == null || req.questions.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El test debe tener al menos una pregunta");
		}

		if (testRepository.findByCode(req.code).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Ya existe un test con el código '" + req.code + "'");
		}

		TestEntity test = new TestEntity();
		test.setCode(req.code);
		test.setTitle(req.title);
		test.setDescription(req.description);
		test.setActive(true);
		test = testRepository.save(test);

		String testType = req.testType != null ? req.testType.toLowerCase() : "generic";
		switch (testType) {
			case "tcp" -> initTcpStructure(test);
			case "tca" -> initTcaStructure(test);
			case "ansiedad" -> initAnsiedadStructure(test);
			default -> {} // generic: no predefined structure
		}

		int totalAnswers = 0;
		for (ParsedQuestion pq : req.questions) {
			QuestionEntity question = new QuestionEntity();
			question.setTest(test);
			question.setText(pq.text());
			question.setType("SINGLE");
			question.setPosition(pq.position());
			question = questionRepository.save(question);

			if (pq.answers() != null) {
				for (ParsedAnswer pa : pq.answers()) {
					AnswerEntity answer = new AnswerEntity();
					answer.setQuestion(question);
					answer.setText(pa.text());
					answer.setValue(pa.value());
					answer.setPosition(pa.position());
					answerRepository.save(answer);
					totalAnswers++;
				}
			}
		}

		return new ImportResponse(test.getId(), test.getCode(), req.questions.size(), totalAnswers);
	}

	// ===================== FORMAT DETECTION =====================

	/**
	 * Detecta el formato del Excel.
	 * Formato 1 (Delphos): Cabecera "Correcta,Puntos,Respuesta,Pregunta/respuestas" y preguntas en col D
	 * Formato 2 (Genérico): Preguntas en col A con patrón "N - texto"
	 */
	private int detectFormat(Sheet sheet) {
		for (int i = 0; i <= Math.min(10, sheet.getLastRowNum()); i++) {
			Row row = sheet.getRow(i);
			if (row == null) continue;

			// Buscar cabecera Delphos: "Correcta" en col A o "Pregunta/respuestas" en col D
			String colA = getCellStringValue(row.getCell(0));
			String colD = getCellStringValue(row.getCell(3));

			if (colA != null && colA.trim().equalsIgnoreCase("Correcta")) return 1;
			if (colD != null && colD.trim().toLowerCase().contains("pregunta")) return 1;

			// Buscar pregunta Delphos en col D: "N - texto"
			if (colD != null && QUESTION_PATTERN.matcher(colD.trim()).find()) return 1;
		}
		return 2; // genérico
	}

	// ===================== DELPHOS FORMAT =====================
	// Estructura:
	// Row 0: Título del test
	// Row 2: Usuario, Inicio, Fin
	// Row 4: Tiempo, Puntaje, Total preguntas
	// Row 6: Cabecera (Correcta, Puntos, Respuesta, Pregunta/respuestas)
	// Row 7+: Preguntas y respuestas
	//   Pregunta: col D = "N - texto pregunta"
	//   Respuesta: col B = puntos, col C = "X" si seleccionada, col D = texto respuesta

	private String extractTitleDelphos(Sheet sheet) {
		// Título puede estar en fila 0 o fila 1 (si fila 0 está vacía)
		for (int i = 0; i <= Math.min(3, sheet.getLastRowNum()); i++) {
			Row row = sheet.getRow(i);
			if (row == null) continue;
			String val = getCellStringValue(row.getCell(0));
			if (val != null && !val.isBlank() && !val.trim().equalsIgnoreCase("Correcta")) {
				return val.replaceAll("^\\uFEFF", "").trim();
			}
			// También buscar en col 0 si está vacía, pero col podría estar en otra posición
			// Algunos Excels ponen el título centrado que cae en otra columna
			for (int col = 0; col <= 3; col++) {
				val = getCellStringValue(row.getCell(col));
				if (val != null && !val.isBlank() && val.length() > 3
						&& !val.trim().equalsIgnoreCase("Correcta")
						&& !val.trim().equalsIgnoreCase("Puntos")
						&& !val.trim().equalsIgnoreCase("Respuesta")
						&& !QUESTION_PATTERN.matcher(val.trim()).find()) {
					return val.replaceAll("^\\uFEFF", "").trim();
				}
			}
		}
		return "Test importado";
	}

	private List<ParsedQuestion> extractQuestionsDelphos(Sheet sheet) {
		List<ParsedQuestion> questions = new ArrayList<>();
		int currentRow = 0;

		while (currentRow <= sheet.getLastRowNum()) {
			Row row = sheet.getRow(currentRow);
			if (row == null) { currentRow++; continue; }

			// Buscar pregunta en col D (índice 3)
			String colD = getCellStringValue(row.getCell(3));
			if (colD == null || colD.isBlank()) { currentRow++; continue; }

			Matcher m = QUESTION_PATTERN.matcher(colD.trim());
			if (!m.find()) { currentRow++; continue; }

			int questionNum = Integer.parseInt(m.group(1));
			String questionText = m.group(2).trim();
			// Quitar ':' final si existe
			if (questionText.endsWith(":")) {
				questionText = questionText.substring(0, questionText.length() - 1).trim();
			}

			// Recoger respuestas en filas siguientes
			List<ParsedAnswer> answers = new ArrayList<>();
			int answerPos = 0;
			int nextRow = currentRow + 1;

			while (nextRow <= sheet.getLastRowNum()) {
				Row answerRow = sheet.getRow(nextRow);
				if (answerRow == null) { nextRow++; continue; }

				String answerColD = getCellStringValue(answerRow.getCell(3));

				// Si col D tiene otra pregunta (N - texto), parar
				if (answerColD != null && !answerColD.isBlank() && QUESTION_PATTERN.matcher(answerColD.trim()).find()) {
					break;
				}

				// Extraer respuesta: col B = puntos, col D = texto
				// (col C = "X" si seleccionada, pero solo necesitamos texto + valor para importar)
				if (answerColD != null && !answerColD.isBlank()) {
					Integer value = getCellNumericValue(answerRow.getCell(1));
					answerPos++;
					answers.add(new ParsedAnswer(answerColD.trim(), value != null ? value : 0, answerPos));
				}

				nextRow++;
			}

			questions.add(new ParsedQuestion(questionNum, questionText, answers));
			currentRow = nextRow;
		}

		return questions;
	}

	// ===================== GENERIC FORMAT =====================
	// Preguntas en col A: "N - texto" o "N. texto" o número en col A + texto en col B
	// Respuestas: filas siguientes con texto + valor numérico

	private static final Pattern QUESTION_PATTERN =
			Pattern.compile("^\\s*(\\d{1,3})\\s*[\\-\\.\\)\\:]\\s*(.+)$", Pattern.DOTALL);

	private String extractTitleGeneric(Sheet sheet) {
		for (int i = 0; i <= Math.min(5, sheet.getLastRowNum()); i++) {
			Row row = sheet.getRow(i);
			if (row == null) continue;

			String cellValue = getCellStringValue(row.getCell(0));
			if (cellValue != null && !cellValue.isBlank() && !QUESTION_PATTERN.matcher(cellValue).find() && !isAnswerRow(row)) {
				return cellValue.trim();
			}
		}
		return "Test importado";
	}

	private List<ParsedQuestion> extractQuestionsGeneric(Sheet sheet) {
		List<ParsedQuestion> questions = new ArrayList<>();
		int questionPosition = 0;
		int currentRow = 0;

		while (currentRow <= sheet.getLastRowNum()) {
			Row row = sheet.getRow(currentRow);
			if (row == null) { currentRow++; continue; }

			String firstCell = getCellStringValue(row.getCell(0));
			if (firstCell == null || firstCell.isBlank()) { currentRow++; continue; }

			String questionText = extractQuestionTextGeneric(firstCell, row);
			if (questionText != null) {
				questionPosition++;

				List<ParsedAnswer> answers = new ArrayList<>();
				int answerPos = 0;
				int nextRow = currentRow + 1;

				while (nextRow <= sheet.getLastRowNum()) {
					Row answerRow = sheet.getRow(nextRow);
					if (answerRow == null) { nextRow++; continue; }

					String answerFirstCell = getCellStringValue(answerRow.getCell(0));
					if (answerFirstCell != null && !answerFirstCell.isBlank()) {
						if (extractQuestionTextGeneric(answerFirstCell, answerRow) != null) {
							break;
						}
					}

					ParsedAnswer answer = extractAnswerGeneric(answerRow, ++answerPos);
					if (answer != null) {
						answers.add(answer);
					}
					nextRow++;
				}

				questions.add(new ParsedQuestion(questionPosition, questionText, answers));
				currentRow = nextRow;
			} else {
				currentRow++;
			}
		}

		return questions;
	}

	private String extractQuestionTextGeneric(String firstCell, Row row) {
		Matcher m = QUESTION_PATTERN.matcher(firstCell);
		if (m.find()) {
			return m.group(2).trim();
		}

		Cell cell0 = row.getCell(0);
		if (cell0 != null && cell0.getCellType() == CellType.NUMERIC) {
			double numVal = cell0.getNumericCellValue();
			if (numVal == Math.floor(numVal) && numVal >= 1 && numVal <= 999) {
				Cell cell1 = row.getCell(1);
				String text = getCellStringValue(cell1);
				if (text != null && !text.isBlank() && text.length() > 5) {
					return text.trim();
				}
			}
		}

		return null;
	}

	private ParsedAnswer extractAnswerGeneric(Row row, int position) {
		String text = null;
		Integer value = null;

		for (int col = 0; col < Math.min(5, row.getLastCellNum()); col++) {
			Cell cell = row.getCell(col);
			if (cell == null) continue;

			if (cell.getCellType() == CellType.NUMERIC) {
				if (value == null) {
					value = (int) cell.getNumericCellValue();
				}
			} else if (cell.getCellType() == CellType.STRING) {
				String cellText = cell.getStringCellValue().trim();
				if (!cellText.isBlank() && text == null) {
					text = cellText;
				}
			}
		}

		if (text != null && !text.isBlank()) {
			return new ParsedAnswer(text, value != null ? value : 0, position);
		}
		return null;
	}

	private boolean isAnswerRow(Row row) {
		return extractAnswerGeneric(row, 1) != null;
	}

	// ===================== UTILITIES =====================

	private String getCellStringValue(Cell cell) {
		if (cell == null) return null;
		return switch (cell.getCellType()) {
			case STRING -> cell.getStringCellValue();
			case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
			case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
			case FORMULA -> {
				try { yield cell.getStringCellValue(); }
				catch (Exception e) {
					try { yield String.valueOf((int) cell.getNumericCellValue()); }
					catch (Exception e2) { yield null; }
				}
			}
			default -> null;
		};
	}

	private Integer getCellNumericValue(Cell cell) {
		if (cell == null) return null;
		return switch (cell.getCellType()) {
			case NUMERIC -> (int) cell.getNumericCellValue();
			case STRING -> {
				try { yield Integer.parseInt(cell.getStringCellValue().trim()); }
				catch (NumberFormatException e) { yield null; }
			}
			default -> null;
		};
	}

	// ===================== DEFAULT STRUCTURE =====================

	// ===================== TCP: Test de Competencias Personales (16PF) =====================
	// 5 factores globales + 17 subfactores con etiquetas bipolares

	private void initTcpStructure(TestEntity test) {
		FactorEntity f1 = saveFactor(test, "sociales", "Competencias sociales", 1, "Introvertido", "Extravertido", "A+F+N(-)+Q2(-)");
		FactorEntity f2 = saveFactor(test, "autonomia", "Competencias de autonomía e independencia", 2, "Acomodaticio", "Independiente", "E+H+Q2+Q1");
		FactorEntity f3 = saveFactor(test, "apertura", "Competencias de apertura y adaptación", 3, "Duro/Rígido", "Receptivo/Flexible", "I+M+Q1_AP");
		FactorEntity f4 = saveFactor(test, "autocontrol", "Competencias de autocontrol", 4, "Desinhibido", "Autocontrolado", "G+Q3");
		FactorEntity f5 = saveFactor(test, "ansiedad", "Competencias de gestión de la ansiedad", 5, "Imperturbable", "Ansioso", "C+O+L+Q4");

		saveSubfactor(test, f1, "A", "Extroversión", 1, "Reservado", "Abierto");
		saveSubfactor(test, f1, "C", "Estabilidad", 2, "Turbable", "Estable");
		saveSubfactor(test, f1, "F", "Animación", 3, "Serio", "Animado");
		saveSubfactor(test, f1, "N(-)", "Espontaneidad / Privacidad–Astucia", 4, "Sencillo", "Calculador");
		saveSubfactor(test, f1, "Q2(-)", "Participación grupal", 5, "Dependiente del grupo", "Autosuficiente");
		saveSubfactor(test, f2, "E", "Dominancia", 1, "Sumiso", "Dominante");
		saveSubfactor(test, f2, "H", "Emprendimiento", 2, "Cohibido", "Emprendedor");
		saveSubfactor(test, f2, "Q2", "Autosuficiencia", 3, "Poco autosuficiente", "Autosuficiente");
		saveSubfactor(test, f2, "Q1", "Crítico", 4, "Conformista", "Crítico");
		saveSubfactor(test, f3, "I", "Idealismo", 1, "Realista", "Idealista");
		saveSubfactor(test, f3, "M", "Creatividad", 2, "Práctico", "Imaginativo");
		saveSubfactor(test, f3, "Q1_AP", "Apertura al cambio", 3, "Tradicional", "Abierto al cambio");
		saveSubfactor(test, f4, "G", "Sentido del deber", 1, "Despreocupado", "Consciente");
		saveSubfactor(test, f4, "Q3", "Control de emociones", 2, "Ocupado en sí mismo", "Controla emociones");
		saveSubfactor(test, f5, "O", "Aprensión", 1, "Sereno", "Aprensivo");
		saveSubfactor(test, f5, "L", "Vigilancia", 2, "Confiado", "Suspicaz");
		saveSubfactor(test, f5, "Q4", "Tensión", 3, "Relajado", "Tenso");
	}

	// ===================== TCA: Test de Competencias Académicas =====================
	// 3 factores (rasgos calculados): IG = INV + IV, INV = RA + APE, IV = RV + APN
	// 4 subfactores base: RA, APE (→ INV), RV, APN (→ IV)

	private void initTcaStructure(TestEntity test) {
		FactorEntity fIG  = saveFactor(test, "IG",  "Competencia Intelectual General", 1, null, null, "INV+IV");
		FactorEntity fINV = saveFactor(test, "INV", "Inteligencia no Verbal",          2, null, null, "RA+APE");
		FactorEntity fIV  = saveFactor(test, "IV",  "Inteligencia Verbal",             3, null, null, "RV+APN");

		saveSubfactor(test, fINV, "RA",  "Razonamiento Abstracto", 1, null, null);
		saveSubfactor(test, fINV, "APE", "Aptitud Espacial",       2, null, null);
		saveSubfactor(test, fIV,  "RV",  "Razonamiento Verbal",    3, null, null);
		saveSubfactor(test, fIV,  "APN", "Aptitud Numérica",       4, null, null);
	}

	// ===================== ANSIEDAD: Test de Ansiedad =====================
	// Sin factores globales, 3 subfactores (R1, R2, R3) con etiquetas bipolares

	private void initAnsiedadStructure(TestEntity test) {
		FactorEntity f1 = saveFactor(test, "ansiedad_global", "Ansiedad Global", 1, "Baja ansiedad", "Alta ansiedad", "R1+R2+R3");

		saveSubfactor(test, f1, "R1", "Cognitivo", 1, "Bajo cognitivo", "Alto cognitivo");
		saveSubfactor(test, f1, "R2", "Fisiológico", 2, "Bajo fisiológico", "Alto fisiológico");
		saveSubfactor(test, f1, "R3", "Motor", 3, "Bajo motor", "Alto motor");
	}

	private FactorEntity saveFactor(TestEntity test, String code, String name, int position,
									String minLabel, String maxLabel, String formula) {
		FactorEntity f = new FactorEntity();
		f.setTest(test);
		f.setCode(code);
		f.setName(name);
		f.setPosition(position);
		f.setMinLabel(minLabel);
		f.setMaxLabel(maxLabel);
		f.setFormula(formula);
		return factorRepository.save(f);
	}

	private void saveSubfactor(TestEntity test, FactorEntity factor, String code, String name, int position,
							   String minLabel, String maxLabel) {
		SubfactorEntity sf = new SubfactorEntity();
		sf.setTest(test);
		sf.setFactor(factor);
		sf.setCode(code);
		sf.setName(name);
		sf.setPosition(position);
		sf.setMinLabel(minLabel);
		sf.setMaxLabel(maxLabel);
		subfactorRepository.save(sf);
	}
}
