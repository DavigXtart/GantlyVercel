import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import JSZip from 'jszip';
import { initialTestService } from '../services/api';
import backgroundPng from '../assets/Adobe Express - file (1).png';
import airBalloonLottieUrl from '../assets/Air Balloony.lottie?url';

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
}

interface Answer {
  id: number;
  text: string;
  value: number | null;
  position: number;
}

interface QuestionResponse {
  answerId?: number;
  answerIds?: number[];
  numericValue?: number;
  textValue?: string;
  multiTextValues?: Record<number, string>;
}

interface QuestionMeta {
  block: string;
  helper?: string;
  badge?: string;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Array<Question & { answers: Answer[] }>;
}

const DETAIL_INPUT_PATTERN = /especificar/i;

const getQuestionMeta = (position: number): QuestionMeta | null => {
  if (position === 1) {
    return { block: 'Bloque 1 · Motivo principal', helper: 'Cuéntanos qué te trae a terapia.' };
  }
  if (position === 2 || position === 3) {
    return { block: 'Bloque 2 · Preferencias del profesional', helper: 'Ayúdanos a adaptar el estilo del psicólogo.' };
  }
  if (position >= 4 && position <= 7) {
    return { block: 'Bloque 3 · Tu estilo y personalidad', helper: 'Escala de 1 (muy en desacuerdo) a 5 (muy de acuerdo).' };
  }
  if (position === 8 || position === 9) {
    return { block: 'Bloque 4 · Experiencia previa', helper: 'Nos ayuda a saber qué ha funcionado antes.' };
  }
  if (position === 10 || position === 11) {
    return { block: 'Bloque 5 · Disponibilidad', helper: 'Puedes elegir varias franjas si lo necesitas.' };
  }
  if (position === 12 || position === 13) {
    return { block: 'Bloque 6 · Presupuesto y urgencia', helper: 'Esto nos permite priorizar y ajustar sugerencias.' };
  }
  if (position === 14 || position === 15) {
    return { block: 'Bloque 7 · Contexto personal', helper: 'Información para ajustar el matching.' };
  }
  if (position === 16) {
    return { block: 'Resumen final', helper: 'Comparte cualquier detalle adicional.' };
  }
  return null;
};

interface InitialTestFlowProps {
  onComplete: (sessionId: string) => void;
  onBack: () => void;
}

export default function InitialTestFlow({ onComplete, onBack }: InitialTestFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionResponse>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [airBalloonData, setAirBalloonData] = useState<any>(null);

  useEffect(() => {
    initializeTest();
    // Cargar animaciones Lottie (archivos ZIP comprimidos)
    const loadLottieFile = async (url: string, setData: (data: any) => void, name: string) => {
      try {
        console.log(`Cargando ${name} desde ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log(`${name}: Archivo descargado, tamaño: ${arrayBuffer.byteLength} bytes`);
        const zip = await JSZip.loadAsync(arrayBuffer);
        console.log(`${name}: ZIP descomprimido, archivos:`, Object.keys(zip.files));
        
        // Los archivos .lottie contienen un manifest.json que indica el archivo de animación
        let jsonFile = null;
        const manifestFile = zip.file('manifest.json');
        
        if (manifestFile) {
          const manifestData = await manifestFile.async('string');
          const manifest = JSON.parse(manifestData);
          console.log(`${name}: Manifest encontrado:`, manifest);
          
          // El manifest tiene información sobre el archivo de animación
          // Puede estar en manifest.animations[0].file o similar
          if (manifest.animations && manifest.animations.length > 0) {
            const animationInfo = manifest.animations[0];
            console.log(`${name}: Información de animación:`, animationInfo);
            console.log(`${name}: Tipo de animationInfo:`, typeof animationInfo);
            console.log(`${name}: Keys de animationInfo:`, typeof animationInfo === 'object' ? Object.keys(animationInfo) : 'N/A');
            
            // El archivo puede estar en diferentes propiedades
            let animationFile = null;
            if (typeof animationInfo === 'string') {
              animationFile = animationInfo;
            } else if (typeof animationInfo === 'object' && animationInfo !== null) {
              // Intentar todas las propiedades posibles
              animationFile = animationInfo.file || 
                             animationInfo.id || 
                             animationInfo.uuid ||
                             animationInfo.path ||
                             animationInfo.name ||
                             (animationInfo.animations && animationInfo.animations[0]) ||
                             Object.values(animationInfo).find(v => typeof v === 'string' && v.length > 10);
            }
            
            if (animationFile && typeof animationFile === 'string') {
              // Buscar el archivo en la carpeta animations/ si existe
              let filePath = animationFile;
              if (!filePath.includes('/')) {
                filePath = `animations/${filePath}`;
              }
              if (!filePath.endsWith('.json')) {
                filePath = `${filePath}.json`;
              }
              jsonFile = zip.file(filePath);
              console.log(`${name}: Buscando archivo de animación: ${filePath}`);
            } else {
              console.log(`${name}: No se pudo extraer el nombre del archivo del manifest`);
            }
          }
        }
        
        // Si no encontramos el archivo a través del manifest, buscar cualquier JSON excepto manifest.json
        if (!jsonFile) {
          const jsonFiles = Object.keys(zip.files).filter(fname => 
            fname.endsWith('.json') && fname !== 'manifest.json'
          );
          if (jsonFiles.length > 0) {
            console.log(`${name}: Usando archivo JSON: ${jsonFiles[0]}`);
            jsonFile = zip.file(jsonFiles[0]);
          }
        }
        
        if (jsonFile) {
          const jsonData = await jsonFile.async('string');
          const parsedData = JSON.parse(jsonData);
          setData(parsedData);
          console.log(`${name}: Animación cargada correctamente`);
        } else {
          console.error(`No se encontró archivo JSON de animación en ${name}`);
          console.log(`${name}: Archivos disponibles:`, Object.keys(zip.files));
        }
      } catch (err) {
        console.error(`Error cargando ${name}:`, err);
      }
    };
    
    loadLottieFile(airBalloonLottieUrl, setAirBalloonData, 'Air Balloon');
  }, []);

  const initializeTest = async () => {
    try {
      setLoading(true);
      // Crear sesión temporal
      const newSessionId = await initialTestService.createSession();
      setSessionId(newSessionId);
      
      // Obtener el test inicial
      const testData = await initialTestService.getTest(newSessionId);
      if (testData.questions) {
        testData.questions.sort((a: Question, b: Question) => a.position - b.position);
        testData.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(testData);
    } catch (err: any) {
      console.error('Error inicializando test:', err);
      alert('Error al cargar el test inicial: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (questionId: number, value: string) => {
    const numericValue = value === '' ? undefined : Number(value);
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        numericValue,
      },
    }));
  };

  const handleTextChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textValue: value,
      },
    }));
  };

  const handleMultiAnswerDetailChange = (questionId: number, answerId: number, value: string) => {
    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};
      const nextTextMap = { ...(prevEntry.multiTextValues || {}) };
      nextTextMap[answerId] = value;
      return {
        ...prev,
        [questionId]: {
          ...prevEntry,
          multiTextValues: nextTextMap,
        },
      };
    });
  };

  const isQuestionAnswered = (question: Question & { answers: Answer[] }) => {
    const response = answers[question.id];
    if (!response) return false;

    if (question.type === 'MULTI') {
      return (response.answerIds || []).length > 0;
    }

    if (question.type === 'TEXT') {
      return Boolean(response.textValue && response.textValue.trim());
    }

    if (question.type === 'NUMBER') {
      return response.numericValue !== undefined && response.numericValue !== null && !Number.isNaN(response.numericValue);
    }

    if (question.type === 'SCALE') {
      return response.numericValue !== undefined && response.numericValue !== null;
    }

    return response.answerId !== undefined;
  };

  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextQuestion = () => {
    if (!test) return;
    setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1));
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    if (!test) return;
    const question = test.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};
      const nextEntries = { ...prev };

      if (question.type === 'MULTI') {
        const currentIds = new Set(prevEntry.answerIds || []);
        const nextTextValues = { ...(prevEntry.multiTextValues || {}) };
        if (answerId) {
          if (currentIds.has(answerId)) {
            currentIds.delete(answerId);
            delete nextTextValues[answerId];
          } else {
            currentIds.add(answerId);
          }
        }
        nextEntries[questionId] = {
          ...prevEntry,
          answerIds: Array.from(currentIds),
          multiTextValues: nextTextValues,
        };
      } else {
        nextEntries[questionId] = {
          ...prevEntry,
          answerId,
          numericValue,
        };
      }

      return nextEntries;
    });

    if (question.position === 8 && test) {
      const selectedAnswer = question.answers.find(a => a.id === answerId);
      const experienceQuestion = test.questions.find(q => q.position === 9);
      if (experienceQuestion) {
        if (selectedAnswer && selectedAnswer.text.toLowerCase().startsWith('no')) {
          const autoOption = experienceQuestion.answers.find(a => a.text.toLowerCase().includes('no he ido'));
          if (autoOption) {
            setAnswers(prev => ({
              ...prev,
              [experienceQuestion.id]: {
                ...prev[experienceQuestion.id],
                answerId: autoOption.id,
              },
            }));
          }
        } else {
          setAnswers(prev => {
            const updated = { ...prev };
            const current = updated[experienceQuestion.id];
            if (current && current.answerId) {
              delete updated[experienceQuestion.id];
            }
            return updated;
          });
        }
      }
    }

    if (autoAdvance && question.type !== 'MULTI') {
      setTimeout(() => {
        if (!test) return;
        setCurrentQuestionIndex(prevIndex => {
          const currentIndex = test.questions.findIndex(q => q.id === questionId);
          if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
            return currentIndex + 1;
          }
          return prevIndex;
        });
      }, 220);
    }
  };

  const buildSubmitPayload = (): { questionId: number; answerId?: number; numericValue?: number; textValue?: string }[] => {
    if (!test) return [];
    const payload: { questionId: number; answerId?: number; numericValue?: number; textValue?: string }[] = [];

    test.questions.forEach(question => {
      const response = answers[question.id];
      if (!response) return;

      if (question.type === 'MULTI') {
        (response.answerIds || []).forEach(answerId => {
          payload.push({
            questionId: question.id,
            answerId,
            textValue: response.multiTextValues?.[answerId]?.trim(),
          });
        });
        return;
      }

      if (question.type === 'TEXT') {
        if (response.textValue && response.textValue.trim()) {
          payload.push({ questionId: question.id, textValue: response.textValue.trim() });
        }
        return;
      }

      if (question.type === 'NUMBER') {
        if (response.numericValue !== undefined && response.numericValue !== null && !Number.isNaN(response.numericValue)) {
          payload.push({ questionId: question.id, numericValue: response.numericValue });
        }
        return;
      }

      payload.push({
        questionId: question.id,
        answerId: response.answerId,
        numericValue: response.numericValue,
        textValue: response.textValue && response.textValue.trim() ? response.textValue.trim() : undefined,
      });
    });

    return payload;
  };

  const handleSubmitWithAnswers = async () => {
    if (!test || !sessionId) return;

    try {
      setSubmitting(true);
      const submitData = buildSubmitPayload();
      await initialTestService.submitAnswers(sessionId, submitData);
      onComplete(sessionId);
    } catch (err: any) {
      console.error('Error enviando respuestas:', err);
      alert('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test || !sessionId) return;

    const unanswered = test.questions.filter(q => !isQuestionAnswered(q));
    if (unanswered.length > 0) {
      alert(`Por favor, responde todas las preguntas. Te faltan ${unanswered.length} pregunta(s).`);
      return;
    }

    await handleSubmitWithAnswers();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Background PNG */}
        <img 
          src={backgroundPng} 
          alt="background" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        
        {/* Lottie Animations */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: '5%',
              width: '200px',
              height: '200px',
            }}
          >
            {airBalloonData && <Lottie animationData={airBalloonData} loop={true} />}
          </div>
        </div>
        
        <div
          style={{
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <p style={{ fontSize: '18px', color: '#3a5a4a', fontWeight: 500, margin: 0 }}>
            Cargando evaluación inicial...
          </p>
        </div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Background PNG */}
        <img 
          src={backgroundPng} 
          alt="background" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        
        {/* Lottie Animations */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: '5%',
              width: '200px',
              height: '200px',
            }}
          >
            {airBalloonData && <Lottie animationData={airBalloonData} loop={true} />}
          </div>
        </div>
        
        <div
          style={{
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            maxWidth: '480px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <h2 style={{ 
            margin: '0 0 12px', 
            fontSize: '26px',
            color: '#1a2e22',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
          }}>
            Test no disponible
          </h2>
          <p style={{ 
            margin: '0 0 24px', 
            color: '#3a5a4a',
            fontSize: '16px',
          }}>
            El test inicial aún no está configurado.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              borderRadius: '24px',
              border: 'none',
              background: '#5a9270',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
              transition: 'all 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a8062';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
            }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const totalQuestions = test.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allAnswered = test.questions.every(q => isQuestionAnswered(q));
  const isCurrentAnswered = isQuestionAnswered(currentQuestion);
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionMeta = getQuestionMeta(currentQuestion.position);

  const renderSingleOptions = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      {currentQuestion.answers.map(answer => {
        const isSelected = currentAnswer?.answerId === answer.id;
        const requiresDetail = DETAIL_INPUT_PATTERN.test(answer.text);
        return (
          <div key={answer.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => handleAnswer(currentQuestion.id, answer.id, answer.value || undefined)}
              style={{
                padding: '18px 24px',
                borderRadius: '16px',
                border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                background: isSelected ? '#d4e0d8' : '#f8f9fa',
                color: '#1a2e22',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                textAlign: 'left',
                boxShadow: isSelected ? '0 4px 12px rgba(90, 146, 112, 0.2)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#5a9270';
                  e.currentTarget.style.background = 'rgba(250, 232, 214, 0.6)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 500, flex: 1 }}>{answer.text}</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? '#5a9270' : 'transparent',
                  color: isSelected ? '#ffffff' : 'transparent',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  marginLeft: '16px',
                }}
              >
                {isSelected && '✓'}
              </div>
            </button>
            {isSelected && requiresDetail && (
              <input
                type="text"
                value={currentAnswer?.textValue || ''}
                onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                placeholder="Especifica aquí..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(90, 146, 112, 0.4)',
                  fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderMultiOptions = () => {
    const selectedIds = new Set(currentAnswer?.answerIds || []);
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        {currentQuestion.answers.map(answer => {
          const isSelected = selectedIds.has(answer.id);
          const requiresDetail = DETAIL_INPUT_PATTERN.test(answer.text);
          return (
            <div key={answer.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleAnswer(currentQuestion.id, answer.id, undefined, false)}
                style={{
                  padding: '18px 24px',
                  borderRadius: '16px',
                  border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                  background: isSelected ? '#d4e0d8' : '#f8f9fa',
                  color: '#1a2e22',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  textAlign: 'left',
                  boxShadow: isSelected ? '0 4px 12px rgba(90, 146, 112, 0.2)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 500, flex: 1 }}>{answer.text}</span>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? '#5a9270' : 'transparent',
                    color: isSelected ? '#ffffff' : 'transparent',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                >
                  {isSelected && '✓'}
                </div>
              </button>
              {isSelected && requiresDetail && (
                <input
                  type="text"
                  value={currentAnswer?.multiTextValues?.[answer.id] || ''}
                  onChange={(e) => handleMultiAnswerDetailChange(currentQuestion.id, answer.id, e.target.value)}
                  placeholder="Especifica aquí..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(90, 146, 112, 0.4)',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderScaleOptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '12px' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
          const isSelected = currentAnswer?.numericValue === value;
          return (
            <button
              key={value}
              onClick={() => handleAnswer(currentQuestion.id, undefined, value, false)}
              style={{
                padding: '16px 0',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                background: isSelected ? '#5a9270' : '#f8f9fa',
                color: isSelected ? '#ffffff' : '#1a2e22',
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#5a9270' }}>
        <span>Muy en desacuerdo</span>
        <span>Muy de acuerdo</span>
      </div>
    </div>
  );

  const renderNumberInput = () => (
    <div style={{ marginTop: '12px' }}>
      <input
        type="number"
        min={1}
        max={120}
        value={currentAnswer?.numericValue ?? ''}
        onChange={(e) => handleNumberChange(currentQuestion.id, e.target.value)}
        placeholder="Ej. 28"
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(90, 146, 112, 0.4)',
          fontSize: '18px',
          fontFamily: "'Inter', sans-serif",
        }}
      />
    </div>
  );

  const renderTextInput = () => (
    <div style={{ marginTop: '12px' }}>
      <textarea
        value={currentAnswer?.textValue || ''}
        onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
        rows={4}
        placeholder="Comparte cualquier detalle que quieras que tengamos en cuenta..."
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(90, 146, 112, 0.4)',
          fontSize: '16px',
          fontFamily: "'Inter', sans-serif",
          resize: 'vertical',
        }}
      />
    </div>
  );

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'MULTI') return renderMultiOptions();
    if (currentQuestion.type === 'NUMBER') return renderNumberInput();
    if (currentQuestion.type === 'TEXT') return renderTextInput();
    if (currentQuestion.type === 'SCALE') return renderScaleOptions();
    return renderSingleOptions();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '80px 24px 80px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Background PNG */}
      <img 
        src={backgroundPng} 
        alt="background" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        onLoad={() => {
          console.log('Imagen de fondo cargada correctamente');
        }}
      />
      
      {/* Lottie Animations */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {/* Air Balloon Lottie */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '200px',
            height: '200px',
            zIndex: 10,
          }}
        >
          {airBalloonData ? (
            <Lottie animationData={airBalloonData} loop={true} />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'rgba(255,0,0,0.1)',
              border: '1px dashed red' 
            }}>
              Cargando globo...
            </div>
          )}
        </div>
      </div>
      {/* Top navigation */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#5a9270',
          letterSpacing: '-0.02em',
        }}>
          Psymatch
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            borderRadius: '24px',
            border: '1px solid rgba(90, 146, 112, 0.3)',
            background: 'rgba(250, 232, 214, 0.85)',
            color: '#3a5a4a',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(250, 232, 214, 1)';
            e.currentTarget.style.borderColor = '#5a9270';
            e.currentTarget.style.color = '#5a9270';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(250, 232, 214, 0.85)';
            e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
            e.currentTarget.style.color = '#3a5a4a';
          }}
        >
          Guardar y salir
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gap: '24px',
        }}
      >
        {/* Progress */}
        <div
          style={{
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '32px 40px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '28px', 
                color: '#1a2e22',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
              }}>
                {test.title}
              </h2>
              <p style={{ 
                margin: '8px 0 0', 
                color: '#3a5a4a', 
                fontSize: '16px', 
                maxWidth: '560px',
                lineHeight: 1.6,
              }}>
                {test.description}
              </p>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: '#d4e0d8',
                color: '#3a5a4a',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Pregunta {currentQuestionIndex + 1} de {test.questions.length}
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '999px',
              overflow: 'hidden',
              background: '#e0e8e3'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#5a9270',
                transition: 'width 0.45s ease',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: 'rgba(250, 232, 214, 0.9)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          }}
        >
          {questionMeta && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#5a9270', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                {questionMeta.block}
              </div>
              {questionMeta.helper && (
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#3a5a4a' }}>
                  {questionMeta.helper}
                </p>
              )}
            </div>
          )}
          <h3
            style={{
              margin: '0 0 32px',
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: '#1a2e22',
              lineHeight: 1.4,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
            }}
          >
            {currentQuestion.text}
          </h3>
          {renderQuestionContent()}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '24px 32px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)'
          }}
        >
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            className="btn-secondary"
            style={{
              padding: '12px 24px',
              borderRadius: '24px',
              border: 'none',
              background: 'rgba(255,255,255,0.7)',
              color: '#3a5a4a',
              fontWeight: 600,
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
            }}
          >
            ← Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{
                padding: '14px 32px',
                borderRadius: '24px',
                border: 'none',
                background: !allAnswered || submitting ? '#cbd5d1' : '#5a9270',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
                boxShadow: !allAnswered || submitting ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {submitting ? 'Enviando...' : 'Enviar evaluación'}
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={!isCurrentAnswered}
              style={{
                padding: '14px 32px',
                borderRadius: '24px',
                border: 'none',
                background: isCurrentAnswered ? '#5a9270' : '#cbd5d1',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isCurrentAnswered ? 'pointer' : 'not-allowed',
                boxShadow: isCurrentAnswered ? '0 4px 12px rgba(90, 146, 112, 0.3)' : 'none',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

