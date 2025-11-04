package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {
	private final TestResultRepository testResultRepository;
	private final FactorResultRepository factorResultRepository;
	private final UserRepository userRepository;
	private final TestRepository testRepository;

	public ExcelExportService(
			TestResultRepository testResultRepository,
			FactorResultRepository factorResultRepository,
			UserRepository userRepository,
			TestRepository testRepository) {
		this.testResultRepository = testResultRepository;
		this.factorResultRepository = factorResultRepository;
		this.userRepository = userRepository;
		this.testRepository = testRepository;
	}

	/**
	 * Exporta todos los resultados de un usuario a Excel
	 */
	public byte[] exportUserResults(Long userId) throws IOException {
		UserEntity user = userRepository.findById(userId).orElseThrow();
		
		Workbook workbook = new XSSFWorkbook();
		CreationHelper createHelper = workbook.getCreationHelper();

		// Estilos
		CellStyle headerStyle = workbook.createCellStyle();
		Font headerFont = workbook.createFont();
		headerFont.setBold(true);
		headerFont.setFontHeightInPoints((short) 12);
		headerStyle.setFont(headerFont);
		headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
		headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

		CellStyle dataStyle = workbook.createCellStyle();
		dataStyle.setDataFormat(createHelper.createDataFormat().getFormat("#,##0.00"));

		// Obtener todos los tests con resultados
		List<TestResultEntity> allResults = testResultRepository.findByUser(user);
		List<FactorResultEntity> allFactorResults = factorResultRepository.findByUser(user);

		// Agrupar por test
		java.util.Map<Long, List<TestResultEntity>> resultsByTest = allResults.stream()
				.collect(java.util.stream.Collectors.groupingBy(r -> r.getTest().getId()));

		int sheetIndex = 0;
		for (java.util.Map.Entry<Long, List<TestResultEntity>> entry : resultsByTest.entrySet()) {
			Long testId = entry.getKey();
			TestEntity test = testRepository.findById(testId).orElseThrow();
			List<TestResultEntity> testResults = entry.getValue();

			// Crear hoja para este test
			Sheet sheet = workbook.createSheet(test.getTitle());
			sheetIndex++;

			int rowNum = 0;

			// Título del test
			Row titleRow = sheet.createRow(rowNum++);
			Cell titleCell = titleRow.createCell(0);
			titleCell.setCellValue("Resultados del Test: " + test.getTitle());
			CellStyle titleStyle = workbook.createCellStyle();
			Font titleFont = workbook.createFont();
			titleFont.setBold(true);
			titleFont.setFontHeightInPoints((short) 14);
			titleStyle.setFont(titleFont);
			titleCell.setCellStyle(titleStyle);

			rowNum++; // Espacio

			// Encabezados de subfactores
			Row headerRow = sheet.createRow(rowNum++);
			headerRow.createCell(0).setCellValue("Subfactor");
			headerRow.createCell(1).setCellValue("Código");
			headerRow.createCell(2).setCellValue("Puntuación");
			headerRow.createCell(3).setCellValue("Puntuación Máxima");
			headerRow.createCell(4).setCellValue("Porcentaje (%)");

			for (int i = 0; i < 5; i++) {
				headerRow.getCell(i).setCellStyle(headerStyle);
			}

			// Datos de subfactores
			for (TestResultEntity result : testResults) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(result.getSubfactor().getName());
				row.createCell(1).setCellValue(result.getSubfactor().getCode());
				
				Cell scoreCell = row.createCell(2);
				scoreCell.setCellValue(result.getScore());
				scoreCell.setCellStyle(dataStyle);
				
				Cell maxScoreCell = row.createCell(3);
				maxScoreCell.setCellValue(result.getMaxScore());
				maxScoreCell.setCellStyle(dataStyle);
				
				Cell percentageCell = row.createCell(4);
				percentageCell.setCellValue(result.getPercentage());
				percentageCell.setCellStyle(dataStyle);
			}

			rowNum++; // Espacio

			// Encabezados de factores generales
			List<FactorResultEntity> testFactorResults = allFactorResults.stream()
					.filter(r -> r.getTest().getId().equals(testId))
					.toList();

			if (!testFactorResults.isEmpty()) {
				Row factorHeaderRow = sheet.createRow(rowNum++);
				factorHeaderRow.createCell(0).setCellValue("Factor General");
				factorHeaderRow.createCell(1).setCellValue("Código");
				factorHeaderRow.createCell(2).setCellValue("Puntuación");
				factorHeaderRow.createCell(3).setCellValue("Puntuación Máxima");
				factorHeaderRow.createCell(4).setCellValue("Porcentaje (%)");

				for (int i = 0; i < 5; i++) {
					factorHeaderRow.getCell(i).setCellStyle(headerStyle);
				}

				// Datos de factores generales
				for (FactorResultEntity result : testFactorResults) {
					Row row = sheet.createRow(rowNum++);
					row.createCell(0).setCellValue(result.getFactor().getName());
					row.createCell(1).setCellValue(result.getFactor().getCode());
					
					Cell scoreCell = row.createCell(2);
					scoreCell.setCellValue(result.getScore());
					scoreCell.setCellStyle(dataStyle);
					
					Cell maxScoreCell = row.createCell(3);
					maxScoreCell.setCellValue(result.getMaxScore());
					maxScoreCell.setCellStyle(dataStyle);
					
					Cell percentageCell = row.createCell(4);
					percentageCell.setCellValue(result.getPercentage());
					percentageCell.setCellStyle(dataStyle);
				}
			}

			// Ajustar ancho de columnas
			for (int i = 0; i < 5; i++) {
				sheet.autoSizeColumn(i);
			}
		}

		// Convertir a bytes
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return outputStream.toByteArray();
	}

	/**
	 * Exporta resultados de un test específico a Excel
	 */
	public byte[] exportTestResults(Long userId, Long testId) throws IOException {
		UserEntity user = userRepository.findById(userId).orElseThrow();
		TestEntity test = testRepository.findById(testId).orElseThrow();

		Workbook workbook = new XSSFWorkbook();
		CreationHelper createHelper = workbook.getCreationHelper();

		// Estilos
		CellStyle headerStyle = workbook.createCellStyle();
		Font headerFont = workbook.createFont();
		headerFont.setBold(true);
		headerFont.setFontHeightInPoints((short) 12);
		headerStyle.setFont(headerFont);
		headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
		headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

		CellStyle dataStyle = workbook.createCellStyle();
		dataStyle.setDataFormat(createHelper.createDataFormat().getFormat("#,##0.00"));

		Sheet sheet = workbook.createSheet(test.getTitle());
		int rowNum = 0;

		// Título
		Row titleRow = sheet.createRow(rowNum++);
		Cell titleCell = titleRow.createCell(0);
		titleCell.setCellValue("Resultados del Test: " + test.getTitle());
		CellStyle titleStyle = workbook.createCellStyle();
		Font titleFont = workbook.createFont();
		titleFont.setBold(true);
		titleFont.setFontHeightInPoints((short) 14);
		titleStyle.setFont(titleFont);
		titleCell.setCellStyle(titleStyle);

		rowNum++;

		// Subfactores
		List<TestResultEntity> subfactorResults = testResultRepository.findByUserAndTest(user, test);
		if (!subfactorResults.isEmpty()) {
			Row headerRow = sheet.createRow(rowNum++);
			headerRow.createCell(0).setCellValue("Subfactor");
			headerRow.createCell(1).setCellValue("Código");
			headerRow.createCell(2).setCellValue("Puntuación");
			headerRow.createCell(3).setCellValue("Puntuación Máxima");
			headerRow.createCell(4).setCellValue("Porcentaje (%)");

			for (int i = 0; i < 5; i++) {
				headerRow.getCell(i).setCellStyle(headerStyle);
			}

			for (TestResultEntity result : subfactorResults) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(result.getSubfactor().getName());
				row.createCell(1).setCellValue(result.getSubfactor().getCode());
				
				Cell scoreCell = row.createCell(2);
				scoreCell.setCellValue(result.getScore());
				scoreCell.setCellStyle(dataStyle);
				
				Cell maxScoreCell = row.createCell(3);
				maxScoreCell.setCellValue(result.getMaxScore());
				maxScoreCell.setCellStyle(dataStyle);
				
				Cell percentageCell = row.createCell(4);
				percentageCell.setCellValue(result.getPercentage());
				percentageCell.setCellStyle(dataStyle);
			}

			rowNum++;
		}

		// Factores generales
		List<FactorResultEntity> factorResults = factorResultRepository.findByUserAndTest(user, test);
		if (!factorResults.isEmpty()) {
			Row factorHeaderRow = sheet.createRow(rowNum++);
			factorHeaderRow.createCell(0).setCellValue("Factor General");
			factorHeaderRow.createCell(1).setCellValue("Código");
			factorHeaderRow.createCell(2).setCellValue("Puntuación");
			factorHeaderRow.createCell(3).setCellValue("Puntuación Máxima");
			factorHeaderRow.createCell(4).setCellValue("Porcentaje (%)");

			for (int i = 0; i < 5; i++) {
				factorHeaderRow.getCell(i).setCellStyle(headerStyle);
			}

			for (FactorResultEntity result : factorResults) {
				Row row = sheet.createRow(rowNum++);
				row.createCell(0).setCellValue(result.getFactor().getName());
				row.createCell(1).setCellValue(result.getFactor().getCode());
				
				Cell scoreCell = row.createCell(2);
				scoreCell.setCellValue(result.getScore());
				scoreCell.setCellStyle(dataStyle);
				
				Cell maxScoreCell = row.createCell(3);
				maxScoreCell.setCellValue(result.getMaxScore());
				maxScoreCell.setCellStyle(dataStyle);
				
				Cell percentageCell = row.createCell(4);
				percentageCell.setCellValue(result.getPercentage());
				percentageCell.setCellStyle(dataStyle);
			}
		}

		// Ajustar ancho de columnas
		for (int i = 0; i < 5; i++) {
			sheet.autoSizeColumn(i);
		}

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return outputStream.toByteArray();
	}
}

