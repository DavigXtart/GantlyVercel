import { useState, useEffect } from 'react';
import { matchingService } from '../services/api';
import { userPsychologistService } from '../services/api';
import { profileService } from '../services/api';
import { calendarService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';

interface Psychologist {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  gender?: string;
  age?: number;
  affinityScore: number;
  matchPercentage: number;
  averageRating?: number | null;
  totalRatings?: number;
}

interface MatchingPsychologistsProps {
  onSelect?: (psychologistId: number) => void;
  onBack?: () => void;
}

export default function MatchingPsychologists({ onSelect, onBack }: MatchingPsychologistsProps) {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] = useState<number | null>(null);
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [psychologistRating, setPsychologistRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      setLoading(true);
      const data = await matchingService.getMatchingPsychologists();
      setPsychologists(data);
    } catch (error: any) {
      console.error('Error cargando psicólogos:', error);
      toast.error('Error al cargar psicólogos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPsychologist = async (psychologistId: number) => {
    try {
      setSelecting(psychologistId);
      await userPsychologistService.selectPsychologist(psychologistId);
      toast.success('Psicólogo seleccionado correctamente');
      if (onSelect) {
        onSelect(psychologistId);
      }
    } catch (error: any) {
      console.error('Error seleccionando psicólogo:', error);
      toast.error('Error al seleccionar psicólogo: ' + (error.response?.data?.error || error.message));
    } finally {
      setSelecting(null);
    }
  };

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingProfile(true);
      const profile = await profileService.getPsychologistProfile(psychologistId);
      setPsychologistProfile(profile);
      
      // Cargar valoración del psicólogo
      try {
        const rating = await calendarService.getPsychologistRating(psychologistId);
        setPsychologistRating(rating);
      } catch (err) {
        console.error('Error cargando valoración del psicólogo:', err);
      }
      
      setSelectedPsychologist(psychologistId);
    } catch (err: any) {
      console.error('Error cargando perfil del psicólogo:', err);
      toast.error('Error al cargar el perfil del psicólogo: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingProfile(false);
    }
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 80) return '#10b981'; // Verde
    if (percentage >= 60) return '#5a9270'; // Verde medio
    if (percentage >= 40) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  const getMatchLabel = (percentage: number): string => {
    if (percentage >= 80) return 'Excelente afinidad';
    if (percentage >= 60) return 'Buena afinidad';
    if (percentage >= 40) return 'Afinidad moderada';
    return 'Afinidad baja';
  };

  // Si hay un perfil seleccionado, mostrar la vista del perfil
  if (selectedPsychologist !== null && psychologistProfile) {
    return renderPsychologistProfile();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (psychologists.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '20px',
          padding: '60px 40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1a2e22',
            marginBottom: '16px'
          }}>
            No se encontraron psicólogos compatibles
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            Por favor, completa el test de matching para encontrar psicólogos que se adapten a tus necesidades.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                background: '#f8f9fa',
                color: '#3a5a4a',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '24px',
                fontWeight: 600
              }}
            >
              ← Volver
            </button>
          )}
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#1a2e22',
            marginBottom: '12px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Psicólogos recomendados
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Estos son los psicólogos que mejor se adaptan a tu perfil, ordenados por afinidad
          </p>
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981' }} />
              <span>80%+ Excelente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#5a9270' }} />
              <span>60-79% Buena</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f59e0b' }} />
              <span>40-59% Moderada</span>
            </div>
          </div>
        </div>

        {/* Psychologists Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {psychologists.map((psychologist) => {
            const matchColor = getMatchColor(psychologist.matchPercentage);
            const matchLabel = getMatchLabel(psychologist.matchPercentage);
            
            const isSuperRecommended = psychologist.averageRating !== null && psychologist.averageRating !== undefined && psychologist.averageRating > 4;
            
            return (
              <div
                key={psychologist.id}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: `2px solid ${matchColor}20`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => loadPsychologistProfile(psychologist.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Super Recomendado Badge */}
                {isSuperRecommended && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ⭐ Super Recomendado
                  </div>
                )}
                
                {/* Match Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: matchColor,
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: `0 2px 8px ${matchColor}40`,
                  zIndex: 2
                }}>
                  {psychologist.matchPercentage}%
                </div>

                {/* Avatar */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: '#fff',
                  fontWeight: 700,
                  overflow: 'hidden',
                  border: `4px solid ${matchColor}40`
                }}>
                  {psychologist.avatarUrl ? (
                    <img
                      src={psychologist.avatarUrl}
                      alt={psychologist.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    psychologist.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1a2e22',
                  marginBottom: '8px',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {psychologist.name}
                </h3>

                {/* Match Label */}
                <p style={{
                  fontSize: '14px',
                  color: matchColor,
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  {matchLabel}
                </p>

                {/* Rating */}
                {psychologist.averageRating !== null && psychologist.averageRating !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            fontSize: '16px',
                            color: star <= Math.round(psychologist.averageRating!) ? '#fbbf24' : '#d1d5db'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e22' }}>
                      {typeof psychologist.averageRating === 'number' ? psychologist.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    {psychologist.totalRatings && psychologist.totalRatings > 0 && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        ({psychologist.totalRatings})
                      </span>
                    )}
                  </div>
                )}

                {/* Info */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '32px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  {psychologist.age && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Edad:</span>
                      <span style={{ color: '#1a2e22', fontWeight: 600 }}>{psychologist.age} años</span>
                    </div>
                  )}
                  {psychologist.gender && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Género:</span>
                      <span style={{ color: '#1a2e22', fontWeight: 600 }}>{psychologist.gender}</span>
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPsychologist(psychologist.id);
                  }}
                  disabled={selecting === psychologist.id}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: selecting === psychologist.id
                      ? '#d1d5db'
                      : 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: selecting === psychologist.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    boxShadow: selecting === psychologist.id
                      ? 'none'
                      : '0 4px 12px rgba(90, 146, 112, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selecting !== psychologist.id) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {selecting === psychologist.id ? 'Seleccionando...' : 'Seleccionar este psicólogo'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  function renderPsychologistProfile() {
    if (loadingProfile) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
          padding: '40px',
          border: '1px solid rgba(90, 146, 112, 0.15)'
        }}>
          {/* Header con botón volver */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a2e22' }}>
              Perfil del Psicólogo
            </h2>
            <button
              onClick={() => {
                setSelectedPsychologist(null);
                setPsychologistProfile(null);
                setPsychologistRating(null);
              }}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Volver
            </button>
          </div>

          {/* Header del perfil */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
            padding: '40px',
            borderRadius: '20px',
            border: '2px solid rgba(90, 146, 112, 0.3)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            boxShadow: '0 4px 16px rgba(90, 146, 112, 0.15)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid white',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              flexShrink: 0
            }}>
              {psychologistProfile.avatarUrl ? (
                <img src={psychologistProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '24px' }}>
                  {psychologistProfile.name?.charAt(0).toUpperCase() || 'PS'}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                {psychologistProfile.name}
              </h3>
              <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
                {psychologistProfile.email}
              </div>
              {psychologistRating && psychologistRating.averageRating !== null && psychologistRating.averageRating !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: '18px',
                          color: star <= Math.round(psychologistRating.averageRating!) ? '#fbbf24' : '#d1d5db'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {typeof psychologistRating.averageRating === 'number' ? psychologistRating.averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    ({psychologistRating.totalRatings} {psychologistRating.totalRatings === 1 ? 'valoración' : 'valoraciones'})
                  </span>
                </div>
              )}
              {psychologistProfile.specializations && (() => {
                try {
                  const specs = JSON.parse(psychologistProfile.specializations);
                  if (Array.isArray(specs) && specs.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {specs.map((spec: string, idx: number) => (
                          <span key={idx} style={{
                            padding: '6px 12px',
                            background: '#dcfce7',
                            color: '#15803d',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500
                          }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}
            </div>
          </div>

          {/* Biografía */}
          {psychologistProfile.bio && (
            <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Sobre mí</h3>
              <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#4b5563' }}>
                {psychologistProfile.bio}
              </p>
            </div>
          )}

          {/* Educación */}
          {psychologistProfile.education && (() => {
            try {
              const education = JSON.parse(psychologistProfile.education);
              if (Array.isArray(education) && education.length > 0) {
                return (
                  <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Educación</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {education.map((edu: any, idx: number) => (
                        <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                            {edu.degree || 'Título'} {edu.field ? `en ${edu.field}` : ''}
                          </div>
                          <div style={{ fontSize: '16px', color: '#667eea', marginBottom: '4px' }}>
                            {edu.institution || 'Institución'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate || edu.endDate || ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}

          {/* Certificaciones */}
          {psychologistProfile.certifications && (() => {
            try {
              const certs = JSON.parse(psychologistProfile.certifications);
              if (Array.isArray(certs) && certs.length > 0) {
                return (
                  <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Certificaciones</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {certs.map((cert: any, idx: number) => (
                        <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                            {cert.name || 'Certificación'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            Emitido por: {cert.issuer || 'N/A'}
                          </div>
                          {cert.date && (
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                              Fecha: {cert.date}
                            </div>
                          )}
                          {cert.credentialId && (
                            <div style={{ fontSize: '13px', color: '#9ca3af', fontFamily: 'monospace' }}>
                              ID: {cert.credentialId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}

          {/* Experiencia */}
          {psychologistProfile.experience && (() => {
            try {
              const experience = JSON.parse(psychologistProfile.experience);
              if (Array.isArray(experience) && experience.length > 0) {
                return (
                  <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Experiencia Profesional</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {experience.map((exp: any, idx: number) => (
                        <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                            {exp.title || 'Cargo'}
                          </div>
                          <div style={{ fontSize: '16px', color: '#667eea', marginBottom: '4px' }}>
                            {exp.company || 'Empresa'}
                          </div>
                          {exp.description && (
                            <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', lineHeight: '1.6' }}>
                              {exp.description}
                            </div>
                          )}
                          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                            {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate ? `Desde ${exp.startDate}` : exp.endDate ? `Hasta ${exp.endDate}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}

          {/* Botón para seleccionar */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (selectedPsychologist) {
                  handleSelectPsychologist(selectedPsychologist);
                }
              }}
              disabled={selecting === selectedPsychologist}
              style={{
                padding: '14px 32px',
                background: selecting === selectedPsychologist
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: selecting === selectedPsychologist ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '16px',
                boxShadow: selecting === selectedPsychologist
                  ? 'none'
                  : '0 4px 12px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {selecting === selectedPsychologist ? 'Seleccionando...' : 'Seleccionar este psicólogo'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

