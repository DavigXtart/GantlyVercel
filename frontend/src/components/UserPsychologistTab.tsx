import { useState, useMemo, useEffect } from 'react';
import {
  Brain, CalendarDays, CalendarX, Clock, History,
} from 'lucide-react';
import { profileService, calendarService, consentService, type ConsentRequest } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import PatientMatchingTest from './PatientMatchingTest';
import MatchingPsychologists from './MatchingPsychologists';
import { toast } from './ui/Toast';

interface UserPsychologistTabProps {
  me: any;
  psych: any;
  setPsych: (p: any) => void;
  hasPsychologist: boolean;
  setTab: (tab: string) => void;
  loadPsychologistProfile: (psychologistId: number) => void;
}

export default function UserPsychologistTab({
  me,
  psych,
  setPsych,
  hasPsychologist,
  setTab,
  loadPsychologistProfile,
}: UserPsychologistTabProps) {
  const [showMatchingTest, setShowMatchingTest] = useState(false);
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  const [matchingTestCompleted, setMatchingTestCompleted] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [usingReferralCode, setUsingReferralCode] = useState(false);

  // Past appointments
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);

  // Consent (minors)
  const [pendingConsents, setPendingConsents] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [signerNameForConsent, setSignerNameForConsent] = useState('');
  const [signingConsentId, setSigningConsentId] = useState<number | null>(null);

  const isMinor = useMemo(() => {
    if (!me) return false;
    if (me.birthDate) {
      const birth = new Date(me.birthDate);
      const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age < 18;
    }
    const age = me.age;
    return typeof age === 'number' && age < 18;
  }, [me]);

  // Load consents for minors
  useEffect(() => {
    if (!me || !isMinor) {
      setPendingConsents([]);
      return;
    }
    let cancelled = false;
    setLoadingConsents(true);
    consentService
      .getMyRequests()
      .then((list: ConsentRequest[]) => {
        if (!cancelled) setPendingConsents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setPendingConsents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingConsents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me?.id, isMinor]);

  // Load past appointments when has psychologist
  useEffect(() => {
    if (hasPsychologist) {
      loadPastAppointments();
    }
  }, [hasPsychologist]);

  const loadPastAppointments = async () => {
    try {
      setLoadingPastAppointments(true);
      const appointments = await calendarService.getPastAppointments();
      setPastAppointments(appointments || []);
    } catch (err: any) {
      toast.error(
        'Error al cargar las citas pasadas: ' +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoadingPastAppointments(false);
    }
  };

  const handleUseReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      toast.error('Por favor ingresa un código de referencia');
      return;
    }
    try {
      setUsingReferralCode(true);
      const result = await profileService.useReferralCode(referralCodeInput.trim());
      toast.success(result.message || 'Te has unido correctamente a la consulta');
      setReferralCodeInput('');
      // Reload psychologist data
      try {
        const psychData = await profileService.myPsychologist();
        setPsych(psychData);
      } catch {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al usar el código de referencia');
    } finally {
      setUsingReferralCode(false);
    }
  };

  // Matching test view
  if (showMatchingTest && !showMatchingResults) {
    return (
      <div>
        <PatientMatchingTest
          onComplete={() => {
            setShowMatchingTest(false);
            setShowMatchingResults(true);
            setMatchingTestCompleted(true);
          }}
          onBack={() => setShowMatchingTest(false)}
        />
      </div>
    );
  }

  // Matching results view
  if (showMatchingResults) {
    return (
      <div>
        <MatchingPsychologists
          onSelect={async () => {
            setShowMatchingResults(false);
            try {
              const psychData = await profileService.myPsychologist();
              setPsych(psychData);
            } catch {
              window.location.reload();
            }
          }}
          onBack={() => {
            setShowMatchingResults(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      {psych?.status === 'ASSIGNED' ? (
        <>
          {/* Minor with pending consent */}
          {hasPsychologist && isMinor && (loadingConsents || pendingConsents.length > 0) ? (
            <div className="space-y-6">
              {loadingConsents ? (
                <LoadingSpinner text="Cargando consentimiento..." />
              ) : (
                <>
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">
                      Consentimiento requerido (menores de 18 años)
                    </h3>
                    <p className="text-sm text-amber-700">
                      Tu psicólogo te ha enviado un documento de consentimiento. Debes leerlo y firmarlo para continuar.
                    </p>
                  </div>
                  {pendingConsents.map((c: any) => (
                    <div key={c.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <span className="font-medium text-slate-800">{c.documentTitle || 'Consentimiento'}</span>
                      </div>
                      <div className="p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                        {c.renderedContent || 'Sin contenido.'}
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={signingConsentId === c.id ? signerNameForConsent : ''}
                          onChange={(e) => setSignerNameForConsent(e.target.value)}
                          placeholder="Nombre del firmante (ej. padre/madre/tutor o el menor)"
                          className="flex-1 h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          disabled={!signerNameForConsent.trim() || signingConsentId !== null}
                          onClick={async () => {
                            if (!signerNameForConsent.trim()) return;
                            setSigningConsentId(c.id);
                            try {
                              await consentService.signRequest(c.id, { signerName: signerNameForConsent.trim() });
                              toast.success('Consentimiento firmado');
                              setSignerNameForConsent('');
                              const list = await consentService.getMyRequests();
                              setPendingConsents(Array.isArray(list) ? list : []);
                            } catch (err: any) {
                              toast.error(err.response?.data?.error || 'Error al firmar');
                            } finally {
                              setSigningConsentId(null);
                            }
                          }}
                          className="bg-gantly-blue hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {signingConsentId === c.id ? 'Firmando...' : 'Firmar consentimiento'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
          <>
          {/* Psychologist profile hero */}
          <div className="rounded-2xl overflow-hidden mb-6 border border-slate-100">
            <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>
            <div className="p-6 md:p-8 bg-gradient-brand">
              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-4 ring-white/20 shadow-lg">
                  {psych.psychologist?.avatarUrl ? (
                    <img
                      src={psych.psychologist.avatarUrl}
                      alt={psych.psychologist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white font-heading font-bold">
                      {(psych.psychologist?.name || 'P')[0]}
                    </span>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-heading font-bold text-white mb-1">
                    {psych.psychologist?.name}
                  </h2>
                  <p className="text-sm font-body text-white/70 mb-3">
                    {psych.psychologist?.email}
                  </p>
                  <button
                    type="button"
                    className="text-sm bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-heading font-semibold cursor-pointer hover:bg-white/30 transition-all duration-200 border border-white/20"
                    onClick={() =>
                      loadPsychologistProfile(psych.psychologist.id)
                    }
                  >
                    Ver perfil completo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Past appointments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                  <History size={14} className="text-gantly-blue" />
                </span>
                Mis citas pasadas
              </h3>
              {!loadingPastAppointments && pastAppointments.length > 0 && (
                <span className="text-xs font-heading font-bold text-gantly-blue bg-gantly-blue/10 px-2.5 py-1 rounded-full">
                  {pastAppointments.length} {pastAppointments.length === 1 ? 'cita' : 'citas'}
                </span>
              )}
            </div>
            {loadingPastAppointments ? (
              <LoadingSpinner text="Cargando citas pasadas..." />
            ) : pastAppointments.length === 0 ? (
              <div className="text-center py-10 bg-gantly-cloud/30 rounded-xl border-2 border-dashed border-slate-200">
                <CalendarX size={28} className="text-gantly-muted/40 mb-2 mx-auto block" />
                <p className="text-sm font-body text-gantly-muted">
                  Aún no tienes citas pasadas con tu psicólogo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastAppointments.map((apt: any) => {
                  const hasRating = !!apt.rating;
                  const comment = apt.rating?.comment || '';
                  return (
                    <div
                      key={apt.id}
                      className="bg-gantly-cloud/40 rounded-xl p-4 border border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-blue/15 transition-all duration-200">
                            <CalendarDays size={18} className="text-gantly-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-body font-semibold text-gantly-text">
                              {new Date(apt.startTime).toLocaleDateString(
                                'es-ES',
                                {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                },
                              )}
                            </p>
                            <p className="text-xs font-body text-gantly-muted mt-0.5 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(apt.startTime).toLocaleTimeString(
                                'es-ES',
                                { hour: '2-digit', minute: '2-digit' },
                              )}{' '}
                              -{' '}
                              {new Date(apt.endTime).toLocaleTimeString(
                                'es-ES',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  hasRating && star <= apt.rating.rating
                                    ? 'text-gantly-gold'
                                    : 'text-slate-200'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {hasRating && comment && (
                            <p className="text-[11px] font-body text-gantly-muted italic max-w-[160px] truncate">
                              &ldquo;{comment}&rdquo;
                            </p>
                          )}
                          {!hasRating && (
                            <span className="text-[10px] font-body text-gantly-muted/60">Sin valorar</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-brand-sm">
            <Brain size={28} className="text-white" />
          </div>
          <h3 className="text-xl font-heading font-bold text-gantly-text mb-2">
            {matchingTestCompleted ? 'No se encontraron psicólogos compatibles' : 'Encuentra tu psicólogo ideal'}
          </h3>
          <p className="text-sm font-body text-gantly-muted mb-8 max-w-md mx-auto">
            {matchingTestCompleted
              ? 'En este momento no hay psicólogos disponibles que coincidan con tu perfil. Puedes intentarlo más adelante, repetir el test o usar un código de referencia.'
              : 'Completa el test de matching para encontrar psicólogos que se adapten a tus necesidades, o usa un código de referencia si ya tienes un psicólogo.'}
          </p>

          {/* Referral code form */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-gantly-cloud/50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-base font-heading font-semibold text-gantly-text mb-2">
                ¿Tienes un código de referencia?
              </h4>
              <p className="text-sm font-body text-gantly-muted mb-4">
                Si un psicólogo te ha compartido un código o enlace, úsalo aquí para unirte directamente a su consulta.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  placeholder="Código de referencia (ej: juan-garcia)"
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue outline-none transition-all duration-200 text-sm font-body"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && referralCodeInput.trim()) {
                      handleUseReferralCode();
                    }
                  }}
                />
                <button
                  onClick={handleUseReferralCode}
                  disabled={!referralCodeInput.trim() || usingReferralCode}
                  className="bg-gantly-blue text-white px-5 py-3 rounded-xl font-heading font-semibold cursor-pointer hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {usingReferralCode ? 'Uniendo...' : 'Usar código'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-body text-gantly-muted mb-4 max-w-md mx-auto">
              {matchingTestCompleted
                ? 'Puedes repetir el test de matching o ver los resultados actuales.'
                : 'O completa nuestro test de matching para encontrar el profesional que mejor se adapte a tus necesidades.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="bg-gantly-blue text-white px-6 py-3 rounded-xl font-heading font-semibold cursor-pointer hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200"
                onClick={() => setShowMatchingTest(true)}
              >
                {matchingTestCompleted ? 'Repetir test de matching' : 'Comenzar test de matching'}
              </button>
              {matchingTestCompleted && (
                <button
                  type="button"
                  className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-heading font-semibold cursor-pointer hover:bg-slate-200 transition-all duration-200"
                  onClick={() => setShowMatchingResults(true)}
                >
                  Ver resultados
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
