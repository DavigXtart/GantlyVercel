import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowLeft, Eye } from 'lucide-react';
import { matchingService, userPsychologistService, profileService, calendarService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import StarRating from './ui/StarRating';
import { toast } from './ui/Toast';
import MatchingAnimation from './MatchingAnimation';
import PsychProfileCard from './PsychProfileCard';
import { parseProfileJson } from '../utils/parseProfileJson';

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

function getMatchColor(p: number) {
  if (p >= 80) return 'bg-gantly-emerald text-white';
  if (p >= 60) return 'bg-gantly-blue text-white';
  if (p >= 40) return 'bg-gantly-gold text-gantly-navy';
  return 'bg-red-500 text-white';
}

function getMatchLabel(p: number) {
  if (p >= 80) return 'Excelente afinidad';
  if (p >= 60) return 'Buena afinidad';
  if (p >= 40) return 'Afinidad moderada';
  return 'Afinidad baja';
}

export default function MatchingPsychologists({ onSelect, onBack }: MatchingPsychologistsProps) {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);

  // Detail view state
  const [selectedPsychologist, setSelectedPsychologist] = useState<number | null>(null);
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [psychologistRating, setPsychologistRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [psychologistRatings, setPsychologistRatings] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Card-level profiles (for chips/bio on cards)
  const [cardProfiles, setCardProfiles] = useState<Record<number, any>>({});

  const [showAnimation, setShowAnimation] = useState(true);
  const [, setDataLoaded] = useState(false);

  useEffect(() => {
    loadPsychologists();
  }, []);

  useEffect(() => {
    if (!loading && psychologists.length > 0) {
      setDataLoaded(true);
      // Pre-load profiles for specialization chips on cards
      psychologists.forEach((p) => {
        profileService.getPsychologistProfile(p.id).then((prof) => {
          setCardProfiles((prev) => ({ ...prev, [p.id]: prof }));
        }).catch(() => {});
      });
    }
  }, [loading, psychologists]);

  const loadPsychologists = async () => {
    try {
      setLoading(true);
      const data = await matchingService.getMatchingPsychologists();
      const sorted = [...data].sort((a: Psychologist, b: Psychologist) => b.matchPercentage - a.matchPercentage);

      if (sorted.length > 0 && sorted[0].matchPercentage <= 45) {
        setPsychologists([sorted[0]]);
      } else {
        setPsychologists(sorted.slice(0, 3));
      }
    } catch (error: any) {
      toast.error('No se pudieron cargar los psicólogos disponibles. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPsychologist = async (psychologistId: number) => {
    try {
      setSelecting(psychologistId);
      await userPsychologistService.selectPsychologist(psychologistId);
      toast.success('Psicólogo seleccionado correctamente');
      if (onSelect) onSelect(psychologistId);
    } catch (error: any) {
      toast.error('No se pudo seleccionar al psicólogo. Inténtalo de nuevo.');
    } finally {
      setSelecting(null);
    }
  };

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingProfile(true);
      const profile = await profileService.getPsychologistProfile(psychologistId);
      setPsychologistProfile(profile);

      // Load rating summary + individual ratings in parallel
      const [ratingRes, ratingsRes] = await Promise.allSettled([
        calendarService.getPsychologistRating(psychologistId),
        calendarService.getPsychologistRatings(psychologistId),
      ]);
      if (ratingRes.status === 'fulfilled') setPsychologistRating(ratingRes.value);
      if (ratingsRes.status === 'fulfilled') setPsychologistRatings(ratingsRes.value);

      setSelectedPsychologist(psychologistId);
    } catch (err: any) {
      toast.error('No se pudo cargar el perfil del psicólogo. Inténtalo de nuevo.');
    } finally {
      setLoadingProfile(false);
    }
  };

  /* ================================================================ */
  /*  Detail view (PsychProfileCard)                                   */
  /* ================================================================ */
  if (selectedPsychologist !== null && psychologistProfile) {
    if (loadingProfile) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      );
    }

    const matchPsych = psychologists.find((p) => p.id === selectedPsychologist);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
        <PsychProfileCard
          profile={psychologistProfile}
          ratingSummary={psychologistRating}
          ratings={psychologistRatings}
          matchPercentage={matchPsych?.matchPercentage}
          onBack={() => {
            setSelectedPsychologist(null);
            setPsychologistProfile(null);
            setPsychologistRating(null);
            setPsychologistRatings([]);
          }}
          onSelect={() => handleSelectPsychologist(selectedPsychologist)}
          selecting={selecting === selectedPsychologist}
        />
      </div>
    );
  }

  /* ================================================================ */
  /*  Animation                                                        */
  /* ================================================================ */
  if (showAnimation) {
    return <MatchingAnimation onComplete={() => setShowAnimation(false)} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  /* ================================================================ */
  /*  Empty state                                                      */
  /* ================================================================ */
  if (psychologists.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
        <div className="max-w-[1200px] mx-auto bg-white rounded-2xl p-10 md:p-[60px_40px] shadow-elevated text-center">
          <h2 className="text-[28px] font-heading font-bold text-gantly-navy mb-4">
            No se encontraron psicólogos compatibles
          </h2>
          <p className="text-base text-gantly-muted mb-8 font-body">
            En este momento no hay psicólogos disponibles que coincidan con tu perfil. Puedes intentarlo más adelante o usar un código de referencia si ya tienes un psicólogo.
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

  /* ================================================================ */
  /*  Cards grid                                                       */
  /* ================================================================ */
  const bestMatch = psychologists[0];
  const hasLowAffinity = bestMatch && bestMatch.matchPercentage <= 45;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-card mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gantly-muted hover:text-gantly-navy bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mb-6 font-semibold font-body hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={15} />
              Volver
            </button>
          )}
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gantly-navy mb-3">
            Psicólogos recomendados
          </h1>
          {hasLowAffinity ? (
            <>
              <div className="bg-gradient-to-br from-gantly-gold-50 to-gantly-gold-100 border-2 border-gantly-gold rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={28} className="text-amber-600" />
                  <h3 className="text-lg font-heading font-bold text-amber-800 m-0">
                    Baja afinidad detectada
                  </h3>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed m-0 font-body">
                  Los resultados muestran una afinidad baja. Te recomendamos <strong>completar el test de matching nuevamente con más precisión</strong>.
                </p>
              </div>
              <p className="text-base text-gantly-muted mb-6 font-body">
                A continuación encontrarás el psicólogo con mayor afinidad disponible:
              </p>
            </>
          ) : (
            <p className="text-base text-gantly-muted mb-6 font-body">
              Estos son los psicólogos que mejor se adaptan a tu perfil, ordenados por afinidad
            </p>
          )}
          <div className="flex gap-5 flex-wrap text-xs text-gantly-muted font-body">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gantly-emerald" />
              80%+ Excelente
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gantly-blue" />
              60-79% Buena
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gantly-gold" />
              40-59% Moderada
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6">
          {psychologists.map((psych) => {
            const matchLabel = getMatchLabel(psych.matchPercentage);
            const cardProfile = cardProfiles[psych.id];
            const specs = cardProfile ? parseProfileJson<string[]>(cardProfile.specializations, []) : [];
            const bio = cardProfile?.bio || '';

            return (
              <div
                key={psych.id}
                className="bg-white rounded-2xl shadow-card hover:-translate-y-0.5 hover:shadow-elevated transition-all border border-slate-100 overflow-hidden"
              >
                {/* Card body */}
                <div className="p-6">
                  {/* Top: avatar + info + match badge */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                      {psych.avatarUrl ? (
                        <img src={psych.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-slate-400">
                          {psych.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name + role + rating */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-heading font-bold text-gantly-navy truncate">{psych.name}</h3>
                      <p className="text-xs text-gantly-muted mb-1">Psicólogo/a</p>
                      {psych.averageRating != null && (
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={psych.averageRating} size="sm" />
                          <span className="text-xs font-semibold text-gantly-navy">
                            {psych.averageRating.toFixed(1)}
                          </span>
                          {psych.totalRatings != null && psych.totalRatings > 0 && (
                            <span className="text-xs text-gantly-muted">({psych.totalRatings})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Match badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ${getMatchColor(psych.matchPercentage)}`}>
                      {psych.matchPercentage}%
                    </span>
                  </div>

                  {/* Match label */}
                  <p className="text-xs font-semibold text-gantly-muted mb-3">{matchLabel}</p>

                  {/* Specialization chips */}
                  {specs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {specs.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gantly-blue/8 text-gantly-blue rounded-full text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                      {specs.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-gantly-muted rounded-full text-[11px] font-medium">
                          +{specs.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bio excerpt */}
                  {bio && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{bio}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPsychologistProfile(psych.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium text-gantly-blue bg-gantly-blue/8 rounded-xl cursor-pointer hover:bg-gantly-blue/15 transition-colors border-none"
                    >
                      <Eye size={15} />
                      Ver perfil
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPsychologist(psych.id);
                      }}
                      disabled={selecting === psych.id}
                      className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border-none transition-all ${
                        selecting === psych.id
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gantly-blue text-white cursor-pointer hover:bg-gantly-blue-600'
                      }`}
                    >
                      {selecting === psych.id ? 'Seleccionando...' : 'Seleccionar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
