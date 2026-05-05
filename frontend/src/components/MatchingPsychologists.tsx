import { useState, useEffect } from 'react';
import { matchingService } from '../services/api';
import { userPsychologistService } from '../services/api';
import { profileService } from '../services/api';
import { calendarService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';
import MatchingAnimation from './MatchingAnimation';

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
  const [showAnimation, setShowAnimation] = useState(true);
  const [, setDataLoaded] = useState(false);

  useEffect(() => {
    // Cargar datos en segundo plano mientras se muestra la animacion
    loadPsychologists();
  }, []);

  useEffect(() => {
    // Cuando los datos esten cargados, marcar como listo
    if (!loading && psychologists.length > 0) {
      setDataLoaded(true);
    }
  }, [loading, psychologists]);

  const loadPsychologists = async () => {
    try {
      setLoading(true);
      const data = await matchingService.getMatchingPsychologists();
      // Ordenar por matchPercentage descendente
      const sorted = [...data].sort((a, b) => b.matchPercentage - a.matchPercentage);

      // Si el mejor tiene menos del 45%, mostrar solo el primero
      if (sorted.length > 0 && sorted[0].matchPercentage <= 45) {
        setPsychologists([sorted[0]]);
      } else {
        // Mostrar los 3 mejores (o menos si hay menos de 3)
        setPsychologists(sorted.slice(0, 3));
      }
    } catch (error: any) {
      toast.error('Error al cargar psicologos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPsychologist = async (psychologistId: number) => {
    try {
      setSelecting(psychologistId);
      await userPsychologistService.selectPsychologist(psychologistId);
      toast.success('Psicologo seleccionado correctamente');
      if (onSelect) {
        onSelect(psychologistId);
      }
    } catch (error: any) {
      toast.error('Error al seleccionar psicologo: ' + (error.response?.data?.error || error.message));
    } finally {
      setSelecting(null);
    }
  };

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingProfile(true);
      const profile = await profileService.getPsychologistProfile(psychologistId);
      setPsychologistProfile(profile);

      // Cargar valoracion del psicologo
      try {
        const rating = await calendarService.getPsychologistRating(psychologistId);
        setPsychologistRating(rating);
      } catch (err) {
        // error handled silently
      }

      setSelectedPsychologist(psychologistId);
    } catch (err: any) {
      toast.error('Error al cargar el perfil del psicologo: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingProfile(false);
    }
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 80) return '#059669'; // gantly-emerald
    if (percentage >= 60) return '#2E93CC'; // gantly-blue
    if (percentage >= 40) return '#F0C930'; // gantly-gold
    return '#ef4444'; // red
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

  // Mostrar animacion primero
  if (showAnimation) {
    return (
      <MatchingAnimation
        onComplete={() => {
          setShowAnimation(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (psychologists.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
        <div className="max-w-[1200px] mx-auto bg-white rounded-2xl p-10 md:p-[60px_40px] shadow-elevated text-center">
          <h2 className="text-[28px] font-heading font-bold text-gantly-navy mb-4">
            No se encontraron psicologos compatibles
          </h2>
          <p className="text-base text-gantly-muted mb-8 font-body">
            Por favor, completa el test de matching para encontrar psicologos que se adapten a tus necesidades.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-8 py-3 bg-gantly-blue text-white border-none rounded-xl cursor-pointer font-semibold text-base font-body hover:bg-gantly-blue-600 transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  // Verificar si el mejor match tiene menos del 45%
  const bestMatch = psychologists.length > 0 ? psychologists[0] : null;
  const hasLowAffinity = bestMatch && bestMatch.matchPercentage <= 45;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-card mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-50 text-gantly-muted border border-gray-200 rounded-lg cursor-pointer mb-6 font-semibold font-body hover:bg-gray-100 transition-colors"
            >
              &larr; Volver
            </button>
          )}
          <h1 className="text-4xl font-heading font-bold text-gantly-navy mb-3">
            Psicologos recomendados
          </h1>
          {hasLowAffinity ? (
            <>
              <div className="bg-gradient-to-br from-gantly-gold-50 to-gantly-gold-100 border-2 border-gantly-gold rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[32px]">⚠️</span>
                  <h3 className="text-xl font-heading font-bold text-amber-800 m-0">
                    Baja afinidad detectada
                  </h3>
                </div>
                <p className="text-base text-amber-900 leading-relaxed m-0 font-body">
                  Los resultados del matching muestran una afinidad baja. Para encontrar psicologos que se adapten mejor a tus necesidades, te recomendamos <strong>completar el test de matching nuevamente con mas precision</strong>, pensando detenidamente en tus respuestas.
                </p>
              </div>
              <p className="text-lg text-gantly-muted mb-6 font-body">
                A continuacion encontraras el psicologo con mayor afinidad disponible:
              </p>
            </>
          ) : (
            <p className="text-lg text-gantly-muted mb-6 font-body">
              Estos son los psicologos que mejor se adaptan a tu perfil, ordenados por afinidad
            </p>
          )}
          <div className="flex gap-6 flex-wrap text-sm text-gantly-muted font-body">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gantly-emerald" />
              <span>80%+ Excelente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gantly-blue" />
              <span>60-79% Buena</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gantly-gold" />
              <span>40-59% Moderada</span>
            </div>
          </div>
        </div>

        {/* Psychologists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          {psychologists.map((psychologist) => {
            const matchColor = getMatchColor(psychologist.matchPercentage);
            const matchLabel = getMatchLabel(psychologist.matchPercentage);

            const isSuperRecommended = psychologist.averageRating !== null && psychologist.averageRating !== undefined && psychologist.averageRating > 4;

            return (
              <div
                key={psychologist.id}
                className="bg-white rounded-2xl p-8 shadow-card hover:-translate-y-1 hover:shadow-elevated transition-all cursor-pointer relative overflow-hidden border border-gray-100"
                onClick={() => loadPsychologistProfile(psychologist.id)}
              >
                {/* Super Recomendado Badge */}
                {isSuperRecommended && (
                  <div className="absolute top-5 left-5 bg-gradient-to-r from-gantly-gold to-gantly-gold-500 text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-[0_2px_8px_rgba(240,201,48,0.4)] z-[2] flex items-center gap-1.5">
                    ⭐ Super Recomendado
                  </div>
                )}

                {/* Match Badge */}
                <div
                  className="absolute top-5 right-5 text-white px-4 py-2 rounded-full text-sm font-bold z-[2]"
                  style={{ background: matchColor, boxShadow: `0 2px 8px ${matchColor}40` }}
                >
                  {psychologist.matchPercentage}%
                </div>

                {/* Avatar */}
                <div
                  className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-gantly-blue to-gantly-blue-700 mx-auto mb-6 flex items-center justify-center text-[40px] text-white font-bold overflow-hidden"
                  style={{ border: `4px solid ${matchColor}40` }}
                >
                  {psychologist.avatarUrl ? (
                    <img
                      src={psychologist.avatarUrl}
                      alt={psychologist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    psychologist.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Name */}
                <h3 className="text-2xl font-heading font-bold text-gantly-navy mb-2 text-center">
                  {psychologist.name}
                </h3>

                {/* Match Label */}
                <p
                  className="text-sm font-semibold text-center mb-3 font-body"
                  style={{ color: matchColor }}
                >
                  {matchLabel}
                </p>

                {/* Rating */}
                {psychologist.averageRating !== null && psychologist.averageRating !== undefined && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="text-base"
                          style={{ color: star <= Math.round(psychologist.averageRating!) ? '#F0C930' : '#d1d5db' }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gantly-navy">
                      {typeof psychologist.averageRating === 'number' ? psychologist.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    {psychologist.totalRatings && psychologist.totalRatings > 0 && (
                      <span className="text-xs text-gantly-muted">
                        ({psychologist.totalRatings})
                      </span>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-col gap-3 mb-8 p-5 bg-gantly-cloud rounded-xl">
                  {psychologist.age && (
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gantly-muted">Edad:</span>
                      <span className="text-gantly-navy font-semibold">{psychologist.age} anos</span>
                    </div>
                  )}
                  {psychologist.gender && (
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gantly-muted">Genero:</span>
                      <span className="text-gantly-navy font-semibold">{psychologist.gender}</span>
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
                  className={`w-full py-3.5 px-6 text-white border-none rounded-xl font-semibold text-base font-body transition-all ${
                    selecting === psychologist.id
                      ? 'bg-gray-300 cursor-not-allowed shadow-none'
                      : 'bg-gantly-blue cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:scale-[1.02]'
                  }`}
                >
                  {selecting === psychologist.id ? 'Seleccionando...' : 'Seleccionar este psicologo'}
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
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
        <div className="max-w-[900px] mx-auto bg-white rounded-2xl shadow-card p-8 md:p-10 border border-gantly-blue/10">
          {/* Header con boton volver */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="m-0 text-[28px] font-heading font-bold text-gantly-navy">
              Perfil del Psicologo
            </h2>
            <button
              onClick={() => {
                setSelectedPsychologist(null);
                setPsychologistProfile(null);
                setPsychologistRating(null);
              }}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-semibold cursor-pointer text-sm font-body hover:bg-gray-200 transition-colors"
            >
              &larr; Volver
            </button>
          </div>

          {/* Header del perfil */}
          <div className="bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-8 md:p-10 rounded-2xl border-2 border-gantly-blue/20 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-soft">
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white shadow-card bg-gray-200 flex items-center justify-center text-5xl shrink-0">
              {psychologistProfile.avatarUrl ? (
                <img src={psychologistProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">
                  {psychologistProfile.name?.charAt(0).toUpperCase() || 'PS'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="m-0 mb-2 text-[32px] font-heading font-bold text-gray-800">
                {psychologistProfile.name}
              </h3>
              <div className="text-lg text-gantly-muted mb-3 font-body">
                {psychologistProfile.email}
              </div>
              {psychologistRating && psychologistRating.averageRating !== null && psychologistRating.averageRating !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="text-lg"
                        style={{ color: star <= Math.round(psychologistRating.averageRating!) ? '#F0C930' : '#d1d5db' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-base font-semibold text-gray-800 font-body">
                    {typeof psychologistRating.averageRating === 'number' ? psychologistRating.averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-sm text-gantly-muted font-body">
                    ({psychologistRating.totalRatings} {psychologistRating.totalRatings === 1 ? 'valoracion' : 'valoraciones'})
                  </span>
                </div>
              )}
              {psychologistProfile.specializations && (() => {
                try {
                  const specs = JSON.parse(psychologistProfile.specializations);
                  if (Array.isArray(specs) && specs.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {specs.map((spec: string, idx: number) => (
                          <span key={idx} className="px-3 py-1.5 bg-gantly-blue-50 text-gantly-blue-700 rounded-full text-[13px] font-medium font-body">
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

          {/* Biografia */}
          {psychologistProfile.bio && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="m-0 mb-4 text-xl font-heading font-semibold text-gray-800">Sobre mi</h3>
              <p className="m-0 text-base leading-relaxed text-gray-600 font-body">
                {psychologistProfile.bio}
              </p>
            </div>
          )}

          {/* Educacion */}
          {psychologistProfile.education && (() => {
            try {
              const education = JSON.parse(psychologistProfile.education);
              if (Array.isArray(education) && education.length > 0) {
                return (
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="m-0 mb-5 text-xl font-heading font-semibold text-gray-800">Educacion</h3>
                    <div className="flex flex-col gap-4">
                      {education.map((edu: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-semibold text-gray-800 mb-1 font-body">
                            {edu.degree || 'Titulo'} {edu.field ? `en ${edu.field}` : ''}
                          </div>
                          <div className="text-base text-gantly-blue mb-1 font-body">
                            {edu.institution || 'Institucion'}
                          </div>
                          <div className="text-sm text-gantly-muted font-body">
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
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="m-0 mb-5 text-xl font-heading font-semibold text-gray-800">Certificaciones</h3>
                    <div className="flex flex-col gap-4">
                      {certs.map((cert: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-semibold text-gray-800 mb-1 font-body">
                            {cert.name || 'Certificacion'}
                          </div>
                          <div className="text-sm text-gantly-muted mb-1 font-body">
                            Emitido por: {cert.issuer || 'N/A'}
                          </div>
                          {cert.date && (
                            <div className="text-sm text-gantly-muted mb-1 font-body">
                              Fecha: {cert.date}
                            </div>
                          )}
                          {cert.credentialId && (
                            <div className="text-[13px] text-gray-400 font-mono">
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
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="m-0 mb-5 text-xl font-heading font-semibold text-gray-800">Experiencia Profesional</h3>
                    <div className="flex flex-col gap-4">
                      {experience.map((exp: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="text-lg font-semibold text-gray-800 mb-1 font-body">
                            {exp.title || 'Cargo'}
                          </div>
                          <div className="text-base text-gantly-blue mb-1 font-body">
                            {exp.company || 'Empresa'}
                          </div>
                          {exp.description && (
                            <div className="text-sm text-gray-600 mt-2 leading-relaxed font-body">
                              {exp.description}
                            </div>
                          )}
                          <div className="text-sm text-gantly-muted mt-2 font-body">
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

          {/* Boton para seleccionar */}
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => {
                if (selectedPsychologist) {
                  handleSelectPsychologist(selectedPsychologist);
                }
              }}
              disabled={selecting === selectedPsychologist}
              className={`px-8 py-3.5 text-white border-none rounded-xl font-semibold text-base font-body transition-all ${
                selecting === selectedPsychologist
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-gantly-blue cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600'
              }`}
            >
              {selecting === selectedPsychologist ? 'Seleccionando...' : 'Seleccionar este psicologo'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
