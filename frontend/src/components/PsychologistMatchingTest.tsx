import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import JSZip from 'jszip';
import { matchingService } from '../services/api';
import { toast } from './ui/Toast';
import backgroundPng from '../assets/Adobe Express - file (1).png';
import airBalloonLottieUrl from '../assets/Air Balloony.lottie?url';

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
  answers: Answer[];
}

interface Answer {
  id: number;
  text: string;
  value: number | null;
  position: number;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Question[];
}

interface PsychologistMatchingTestProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function PsychologistMatchingTest({ onComplete, onBack }: PsychologistMatchingTestProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; answerIds?: number[]; textValue?: string; numericValue?: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [airBalloonData, setAirBalloonData] = useState<any>(null);

  useEffect(() => {
    loadTest();
    
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
        // Continuar sin la animación si hay error
      }
    };
    
    loadLottieFile(airBalloonLottieUrl, setAirBalloonData, 'Air Balloon');
  }, []);

  const loadTest = async () => {
    try {
      setLoading(true);
      const testData = await matchingService.getPsychologistTest();
      if (testData.questions) {
        testData.questions.sort((a: Question, b: Question) => a.position - b.position);
        testData.questions.forEach((q: Question) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          }
        });
      }
      setTest(testData);
    } catch (error: any) {
      console.error('Error cargando test:', error);
      toast.error('Error al cargar el test: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar preguntas visibles basado en respuestas anteriores
  const getVisibleQuestions = (): Question[] => {
    if (!test) return [];
    
    const visible: Question[] = [];
    const question1 = test.questions.find(q => q.position === 1); // Modalidades
    const _question2 = test.questions.find(q => q.position === 2); // Formación en menores
    const _question3 = test.questions.find(q => q.position === 3); // Experiencia con menores
    
    for (const question of test.questions) {
      // Las preguntas 2 y 3 solo se muestran si en la pregunta 1 se marcó "Terapia infantojuvenil (menores)"
      if (question.position === 2 || question.position === 3) {
        if (question1) {
          const answer1 = answers[question1.id];
          if (answer1?.answerIds && answer1.answerIds.length > 0) {
            // Verificar si alguna de las respuestas seleccionadas es "Terapia infantojuvenil (menores)"
            const selectedAnswers = question1.answers.filter(a => answer1.answerIds?.includes(a.id));
            const hasMenores = selectedAnswers.some(a => 
              a.text.toLowerCase().includes('infantojuvenil') || 
              a.text.toLowerCase().includes('menores')
            );
            
            if (hasMenores) {
              visible.push(question);
            } else {
              continue; // No mostrar preguntas 2 y 3 si no se marcó menores
            }
          } else {
            continue; // Si no hay respuesta a la pregunta 1, no mostrar preguntas 2 y 3
          }
        } else {
          continue;
        }
      } else {
        visible.push(question);
      }
    }
    
    return visible;
  };

  const visibleQuestions = getVisibleQuestions();

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, textValue?: string, autoAdvance: boolean = true) => {
    if (!test) return;
    
    const question = test.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};
      
      if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
        const currentIds = prevEntry.answerIds || [];
        const nextIds = answerId !== undefined
          ? (currentIds.includes(answerId) 
              ? currentIds.filter(id => id !== answerId)
              : [...currentIds, answerId])
          : currentIds;
        
        return {
          ...prev,
          [questionId]: {
            ...prevEntry,
            answerIds: nextIds,
            textValue: textValue !== undefined ? textValue : prevEntry.textValue,
          }
        };
      } else {
        return {
          ...prev,
          [questionId]: {
            answerId: answerId !== undefined ? answerId : prevEntry.answerId,
            numericValue: numericValue !== undefined ? numericValue : prevEntry.numericValue,
            textValue: textValue !== undefined ? textValue : prevEntry.textValue,
          }
        };
      }
    });

    // Auto-avance a la siguiente pregunta (solo para preguntas SINGLE, no para MULTIPLE, TEXT o DATE)
    if (autoAdvance && question.type !== 'MULTIPLE' && question.type !== 'MULTI' && question.type !== 'TEXT' && question.type !== 'DATE') {
      setTimeout(() => {
        if (visibleQuestions.length === 0) return;
        setCurrentQuestionIndex(prevIndex => {
          const currentIndex = visibleQuestions.findIndex(q => q.id === questionId);
          if (currentIndex !== -1 && currentIndex < visibleQuestions.length - 1) {
            return currentIndex + 1;
          }
          return prevIndex;
        });
      }, 220);
    }
  };

  const isQuestionAnswered = (question: Question): boolean => {
    const answer = answers[question.id];
    if (!answer) return false;

    if (question.type === 'TEXT') {
      return !!(answer.textValue && answer.textValue.trim());
    }
    if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
      return !!(answer.answerIds && answer.answerIds.length > 0);
    }
    return answer.answerId !== undefined || answer.numericValue !== undefined;
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;

    // Verificar que todas las preguntas visibles estén respondidas
    const unansweredQuestions = visibleQuestions.filter(q => !isQuestionAnswered(q));
    if (unansweredQuestions.length > 0) {
      toast.error('Por favor responde todas las preguntas antes de continuar');
      return;
    }

    try {
      setSubmitting(true);

      // Convertir respuestas al formato esperado por el backend
      const submitAnswers: any[] = [];
      
      // Solo enviar respuestas de preguntas visibles
      for (const question of visibleQuestions) {
        const answer = answers[question.id];
        if (!answer) continue;

        if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
          if (answer.answerIds && answer.answerIds.length > 0) {
            for (const answerId of answer.answerIds) {
              submitAnswers.push({
                questionId: question.id,
                answerId: answerId
              });
            }
          }
        } else {
          const submitAnswer: any = { questionId: question.id };
          if (answer.answerId !== undefined) submitAnswer.answerId = answer.answerId;
          if (answer.numericValue !== undefined) submitAnswer.numericValue = answer.numericValue;
          if (answer.textValue !== undefined && answer.textValue.trim()) submitAnswer.textValue = answer.textValue;
          submitAnswers.push(submitAnswer);
        }
      }

      await matchingService.submitPsychologistTest(submitAnswers);
      toast.success('Test completado correctamente');
      onComplete();
    } catch (error: any) {
      console.error('Error enviando test:', error);
      toast.error('Error al enviar el test: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar el índice cuando cambian las preguntas visibles
  useEffect(() => {
    if (visibleQuestions.length > 0) {
      // Si el índice actual está fuera de rango, ajustarlo
      if (currentQuestionIndex >= visibleQuestions.length) {
        setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
      }
    }
  }, [visibleQuestions.length, currentQuestionIndex]);

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
            Cargando test de matching...
          </p>
        </div>
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
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
            El test de matching no está configurado.
          </p>
          {onBack && (
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
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  if (visibleQuestions.length === 0) {
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
            No hay preguntas disponibles
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const isCurrentAnswered = isQuestionAnswered(currentQuestion);

  const renderSingleOptions = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      {currentQuestion.answers.map(answer => {
        const isSelected = currentAnswer?.answerId === answer.id;
        return (
          <button
            key={answer.id}
            onClick={() => handleAnswer(currentQuestion.id, answer.id, undefined, undefined, true)}
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
          return (
            <button
              key={answer.id}
              onClick={() => handleAnswer(currentQuestion.id, answer.id)}
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
          );
        })}
      </div>
    );
  };

  const renderTextInput = () => (
    <div style={{ marginTop: '12px' }}>
      <textarea
        value={currentAnswer?.textValue || ''}
        onChange={(e) => handleAnswer(currentQuestion.id, undefined, undefined, e.target.value, false)}
        rows={4}
        placeholder="Escribe tu respuesta aquí..."
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
    if (currentQuestion.type === 'MULTIPLE' || currentQuestion.type === 'MULTI') return renderMultiOptions();
    if (currentQuestion.type === 'TEXT') return renderTextInput();
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
      />
      
      {/* Lottie Animations */}
      {airBalloonData && (
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
              zIndex: 10,
            }}
          >
            <Lottie animationData={airBalloonData} loop={true} />
          </div>
        </div>
      )}

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
        {onBack && (
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
        )}
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
              Pregunta {currentQuestionIndex + 1} de {visibleQuestions.length}
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
            style={{
              padding: '12px 24px',
              borderRadius: '24px',
              border: 'none',
              background: 'rgba(255,255,255,0.7)',
              color: '#3a5a4a',
              fontWeight: 600,
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ← Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentAnswered || submitting}
              style={{
                padding: '14px 32px',
                borderRadius: '24px',
                border: 'none',
                background: !isCurrentAnswered || submitting ? '#cbd5d1' : '#5a9270',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: !isCurrentAnswered || submitting ? 'not-allowed' : 'pointer',
                boxShadow: !isCurrentAnswered || submitting ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {submitting ? 'Enviando...' : 'Completar Test'}
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
