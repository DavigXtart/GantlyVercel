import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import JSZip from 'jszip';
import { testService } from '../services/api';
import { toast } from './ui/Toast';
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
  value: number;
  position: number;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Array<Question & { answers: Answer[] }>;
}

interface TestFlowProps {
  testId: number;
  onBack: () => void;
  onComplete: () => void;
}

export default function TestFlow({ testId, onBack, onComplete }: TestFlowProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [airBalloonData, setAirBalloonData] = useState<any>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    // Cargar el test con timeout para evitar que se quede cargando indefinidamente
    const loadTestWithTimeout = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted && !test) {
          console.error('Timeout: No se pudo cargar el test en 10 segundos');
          toast.error('El test está tardando demasiado en cargar. Verifica que el backend esté corriendo.');
          if (onBack) {
            onBack();
          }
        }
      }, 10000); // 10 segundos de timeout
      
      try {
        await loadTest();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
    
    loadTestWithTimeout();
    
    // Cargar animaciones Lottie (archivos ZIP comprimidos) - esto no bloquea
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
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [testId, onBack]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await testService.get(testId);
      if (data.questions) {
        data.questions.sort((a: Question, b: Question) => a.position - b.position);
        data.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(data);
    } catch (err: any) {
      console.error('Error cargando test:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      toast.error('Error al cargar el test: ' + errorMsg);
      // Volver atrás si hay error
      if (onBack) {
        onBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    const newAnswers = {
      ...answers,
      [questionId]: { answerId, numericValue }
    };
    
    setAnswers(newAnswers);
    
    if (autoAdvance) {
      setTimeout(() => {
        if (!test) return;
        
        const currentIndex = test.questions.findIndex(q => q.id === questionId);
        if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
          setCurrentQuestionIndex(currentIndex + 1);
        } else if (currentIndex === test.questions.length - 1) {
          const allAnswered = test.questions.every(q => newAnswers[q.id]);
          if (allAnswered) {
            if (confirm('¿Has completado todas las preguntas. ¿Deseas enviar el test?')) {
              handleSubmitWithAnswers(newAnswers);
            }
          }
        }
      }, 400);
    }
  };

  const handleNext = () => {
    if (!test) return;
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitWithAnswers = async (answersToSubmit: Record<number, { answerId?: number; numericValue?: number }>) => {
    if (!test) return;
    
    try {
      setSubmitting(true);
      const submitData = test.questions.map(q => ({
        questionId: q.id,
        answerId: answersToSubmit[q.id]?.answerId,
        numericValue: answersToSubmit[q.id]?.numericValue
      }));
      
      await testService.submitAnswers(testId, submitData);
      toast.success('Test completado correctamente');
      onComplete();
    } catch (err: any) {
      console.error('Error enviando respuestas:', err);
      toast.error('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;
    
    const unanswered = test.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Por favor, responde todas las preguntas. Te faltan ${unanswered.length} pregunta(s).`);
      return;
    }

    if (!confirm('¿Estás seguro de que deseas enviar tus respuestas? No podrás modificarlas después.')) {
      return;
    }

    await handleSubmitWithAnswers(answers);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}>
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
        
        <div style={{
          background: 'rgba(250, 232, 214, 0.85)',
          border: '1px solid rgba(90, 146, 112, 0.2)',
          borderRadius: '24px',
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          position: 'relative',
          zIndex: 2,
        }}>
          <p style={{ fontSize: '18px', color: '#3a5a4a', fontWeight: 500, margin: 0 }}>
            Cargando test...
          </p>
        </div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}>
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
        
        <div style={{
          background: 'rgba(250, 232, 214, 0.85)',
          border: '1px solid rgba(90, 146, 112, 0.2)',
          borderRadius: '24px',
          padding: '48px 40px',
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          position: 'relative',
          zIndex: 2,
        }}>
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
            Este test no tiene preguntas aún.
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
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const allAnswered = test.questions.every(q => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

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
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '28px'
        }}
      >
        {/* Top navigation */}
        <div
          style={{
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#5a9270',
              letterSpacing: '-0.02em',
            }}>
              Gantly
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#1a2e22',
                fontFamily: "'Nunito', sans-serif",
              }}>
                {test.title || test.code || `Test #${test.id}`}
              </h2>
              {test.description && (
                <p style={{ 
                  margin: '4px 0 0', 
                  fontSize: '15px', 
                  color: '#3a5a4a',
                }}>
                  {test.description}
                </p>
              )}
            </div>
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
            Salir
          </button>
        </div>

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
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: '#d4e0d8',
                  color: '#3a5a4a',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  display: 'inline-block',
                  marginBottom: '12px',
                }}
              >
                Pregunta {currentQuestionIndex + 1} de {test.questions.length}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#3a5a4a', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
                <span>{Math.round(progress)}% completado</span>
                <span>{test.questions.length - (currentQuestionIndex + 1)} restantes</span>
              </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                margin: '0 0 8px', 
                fontSize: 'clamp(24px, 3vw, 32px)', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Nunito', sans-serif",
                lineHeight: 1.4,
              }}>
                {currentQuestion.text}
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#3a5a4a', 
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Tu respuesta es confidencial
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: '1px solid rgba(90, 146, 112, 0.3)',
                  background: currentQuestionIndex === 0 ? '#f8f9fa' : 'rgba(250, 232, 214, 0.85)',
                  color: currentQuestionIndex === 0 ? '#cbd5d1' : '#3a5a4a',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (currentQuestionIndex !== 0) {
                    e.currentTarget.style.background = 'rgba(250, 232, 214, 1)';
                    e.currentTarget.style.borderColor = '#5a9270';
                    e.currentTarget.style.color = '#5a9270';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentQuestionIndex !== 0) {
                    e.currentTarget.style.background = 'rgba(250, 232, 214, 0.85)';
                    e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                    e.currentTarget.style.color = '#3a5a4a';
                  }
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === test.questions.length - 1}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  background: currentQuestionIndex === test.questions.length - 1 ? '#cbd5d1' : '#5a9270',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: currentQuestionIndex === test.questions.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (currentQuestionIndex !== test.questions.length - 1) {
                    e.currentTarget.style.background = '#4a8062';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentQuestionIndex !== test.questions.length - 1) {
                    e.currentTarget.style.background = '#5a9270';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>

          {/* Respuestas */}
          {currentQuestion.type === 'SINGLE' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {currentQuestion.answers.map((answer) => {
                const isSelected = currentAnswer?.answerId === answer.id;
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
          )}

          {currentQuestion.type === 'MULTI' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {currentQuestion.answers.map((answer) => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, isSelected ? undefined : answer.id)}
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
          )}

          {currentQuestion.type === 'SCALE' && (
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
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                        background: isSelected ? '#d4e0d8' : '#f8f9fa',
                        color: isSelected ? '#1a2e22' : '#3a5a4a',
                        fontSize: '18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: "'Inter', sans-serif",
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
                      {value}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)',
                  background: 'rgba(250, 232, 214, 0.7)',
                  color: '#3a5a4a',
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                <span>Puntaje actual</span>
                <strong style={{ fontSize: '20px', color: '#5a9270', fontWeight: 700 }}>
                  {currentAnswer?.numericValue !== undefined ? currentAnswer.numericValue : '—'}
                </strong>
              </div>
            </div>
          )}

          {currentQuestion.type !== 'SINGLE' && currentQuestion.type !== 'MULTI' && currentQuestion.type !== 'SCALE' && (
            <p style={{ 
              color: '#3a5a4a', 
              fontStyle: 'italic', 
              textAlign: 'center', 
              padding: '40px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Tipo de pregunta no soportado: {currentQuestion.type}
            </p>
          )}
        </div>

        {/* Bottom actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            background: 'rgba(250, 232, 214, 0.85)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '24px 32px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ 
            color: '#3a5a4a', 
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif",
          }}>
            {isLastQuestion ? 'Listo para enviar' : 'Responde con sinceridad'}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onBack}
              style={{
                padding: '12px 24px',
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
            {isLastQuestion && allAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '14px 32px',
                  borderRadius: '24px',
                  border: 'none',
                  background: submitting ? '#cbd5d1' : '#5a9270',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = '#4a8062';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = '#5a9270';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                  }
                }}
              >
                {submitting ? 'Enviando...' : 'Enviar evaluación'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === test.questions.length - 1}
                style={{
                  padding: '14px 32px',
                  borderRadius: '24px',
                  border: 'none',
                  background: currentQuestionIndex === test.questions.length - 1 ? '#cbd5d1' : '#5a9270',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: currentQuestionIndex === test.questions.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (currentQuestionIndex !== test.questions.length - 1) {
                    e.currentTarget.style.background = '#4a8062';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentQuestionIndex !== test.questions.length - 1) {
                    e.currentTarget.style.background = '#5a9270';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

