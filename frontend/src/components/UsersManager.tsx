import { useState, useEffect, type ReactNode } from 'react';
import { adminService, calendarService, resultsService } from '../services/api';
import BarChart from './BarChart';
import FactorChart from './FactorChart';
import InitialTestSummary from './InitialTestSummary';

// --- Pending psychologist types & helpers ---
interface PendingPsychologist {
  profileId: number; userId: number; name: string; email: string;
  licenseNumber: string | null; education: string | null; certifications: string | null;
  experience: string | null; specializations: string | null; createdAt: string;
  rejectionReason: string | null; bio: string | null; languages: string | null;
  linkedinUrl: string | null; website: string | null; avatarUrl: string | null;
  gender: string | null; age: number | null; interests: string | null;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

interface EducationItem { degree?: string; field?: string; institution?: string; startDate?: string; endDate?: string; }
interface ExperienceItem { title?: string; company?: string; startDate?: string; endDate?: string; description?: string; }
interface CertificationItem { name?: string; issuer?: string; date?: string; credentialId?: string; }
interface LanguageItem { language?: string; level?: string; }

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="m-0 mb-1.5 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  testsCompleted?: number;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  tests: Array<{
    testId: number;
    testCode: string;
    testTitle: string;
    answers: Array<{
      questionId: number;
      questionText: string;
      questionPosition?: number;
      questionType?: string;
      answerId?: number;
      answerText?: string;
      answerValue?: number;
      numericValue?: number;
      textValue?: string;
      createdAt: string;
    }>;
  }>;
}

interface UsersManagerProps {
  filterRole?: 'USER' | 'PSYCHOLOGIST';
}

interface PsychologistSummary {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  averageRating: number | null;
  totalRatings: number;
  activePatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string }>;
  dischargedPatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string }>;
  scheduledAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number; patientName: string; patientEmail: string }>;
  pastAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number; patientName: string; patientEmail: string }>;
  totalBilled: number;
}

export default function UsersManager({ filterRole }: UsersManagerProps = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [psychologistSummary, setPsychologistSummary] = useState<PsychologistSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestForStats, setSelectedTestForStats] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [overallStats, setOverallStats] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [pendingPsychologists, setPendingPsychologists] = useState<PendingPsychologist[]>([]);
  const [selectedPendingId, setSelectedPendingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query)
    );
  });

  const pendingUserIds = new Set(pendingPsychologists.map(p => p.userId));
  const regularUsers = filteredUsers.filter(user => user.role === 'USER');
  const psychologists = filteredUsers.filter(user => user.role === 'PSYCHOLOGIST' && !pendingUserIds.has(user.id));
  const displayedUsers = filterRole === 'USER' ? regularUsers : filterRole === 'PSYCHOLOGIST' ? psychologists : filteredUsers;

  useEffect(() => {
    loadUsers();
    loadTests();
    if (filterRole === 'PSYCHOLOGIST') loadPendingPsychologists();
  }, []);

  const loadPendingPsychologists = async () => {
    try {
      const data = await adminService.getPendingPsychologists();
      setPendingPsychologists(data);
    } catch { /* silently fail */ }
  };

  const handleApprovePsychologist = async (profileId: number) => {
    try {
      await adminService.approvePsychologist(profileId);
      setPendingPsychologists(prev => prev.filter(p => p.profileId !== profileId));
      setSelectedPendingId(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aprobar');
    }
  };

  const handleRejectPsychologist = async (profileId: number) => {
    try {
      await adminService.rejectPsychologist(profileId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      setSelectedPendingId(null);
      loadPendingPsychologists();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al rechazar');
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      if (filterRole === 'PSYCHOLOGIST') {
        loadPsychologistSummary(selectedUserId);
      } else {
        loadUserDetails(selectedUserId);
      }
    } else {
      setUserDetails(null);
      setPsychologistSummary(null);
    }
  }, [selectedUserId, filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (err) {
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    try {
      const data = await adminService.listTests();
      setTests(data || []);
    } catch (err) {
      // error handled silently
    }
  };

  const loadUserStats = async (userId: number, testId: number) => {
    try {
      setLoading(true);
      const data = await resultsService.getUserTest(userId, testId);
      setUserStats(data);
    } catch (err) {
      alert('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadPsychologistSummary = async (psychologistId: number) => {
    try {
      setLoading(true);
      setUserDetails(null);
      const data = await adminService.getPsychologistSummary(psychologistId);
      setPsychologistSummary(data);
    } catch (err) {
      alert('Error al cargar los datos del psicólogo');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: number) => {
    try {
      setLoading(true);
      setPsychologistSummary(null);
      const data = await adminService.getUserDetails(userId);
      setUserDetails(data);
      // precalcular media general de factores entre tests completados por el usuario
      try {
        const testIds = (data?.tests || []).map((t: any) => t.testId);
        if (testIds.length > 0) {
          const results = await Promise.all(
            testIds.map((tid: number) => resultsService.getUserTest(userId, tid).catch(() => null))
          );
          const factors: Record<string, { name: string; sum: number; count: number }> = {};
          for (const r of results) {
            if (!r || !r.factors) continue;
            for (const f of r.factors) {
              const key = f.factorCode || f.factorName || String(f.factorId);
              if (!factors[key]) factors[key] = { name: f.factorName || key, sum: 0, count: 0 };
              factors[key].sum += Number(f.percentage) || 0;
              factors[key].count += 1;
            }
          }
          const averaged = Object.entries(factors).map(([code, v]) => ({
            code,
            name: v.name,
            percentage: v.count > 0 ? v.sum / v.count : 0,
          }));
          setOverallStats({ factors: averaged });
        } else {
          setOverallStats(null);
        }
      } catch (e) {
        // error handled silently
      }
    } catch (err) {
      alert('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Panel de psicólogo pendiente (full page)
  if (filterRole === 'PSYCHOLOGIST' && selectedPendingId) {
    const p = pendingPsychologists.find(pp => pp.profileId === selectedPendingId);
    if (!p) { setSelectedPendingId(null); return null; }
    const educationItems = parseJson<EducationItem[]>(p.education, []);
    const experienceItems = parseJson<ExperienceItem[]>(p.experience, []);
    const certItems = parseJson<CertificationItem[]>(p.certifications, []);
    const specItems = parseJson<string[]>(p.specializations, []);
    const langItems = parseJson<LanguageItem[]>(p.languages, []);
    const interestItems = parseJson<string[]>(p.interests, []);
    const hasEducation = educationItems.length > 0;
    const hasExperience = experienceItems.length > 0;
    const hasCerts = certItems.length > 0;
    const hasSpecs = specItems.length > 0;
    const hasLangs = langItems.length > 0;
    const hasInterests = interestItems.length > 0;

    return (
      <div>
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3.5">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-gantly-gold-200" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gantly-gold flex items-center justify-center text-[22px] font-bold text-white flex-shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="m-0 font-heading font-bold text-slate-800">{p.name}</h2>
                <p className="text-slate-500 mt-1">{p.email}</p>
              </div>
            </div>
            <button className="btn-secondary w-auto px-6 py-3" onClick={() => { setSelectedPendingId(null); setRejectingId(null); setRejectReason(''); }}>
              ← Volver
            </button>
          </div>

          {/* Info badges */}
          <div className="flex gap-3 flex-wrap mb-6">
            {p.licenseNumber && (
              <span className="text-[13px] bg-orange-50 border border-orange-200 rounded-lg px-3.5 py-1.5 text-orange-800 font-medium">
                N. Colegiado: {p.licenseNumber}
              </span>
            )}
            {p.gender && <span className="text-[13px] bg-slate-50 rounded-lg px-3.5 py-1.5 text-slate-700">{p.gender}</span>}
            {p.age != null && <span className="text-[13px] bg-slate-50 rounded-lg px-3.5 py-1.5 text-slate-700">{p.age} anos</span>}
            <span className="text-[13px] bg-gantly-gold-50 rounded-lg px-3.5 py-1.5 text-amber-700 font-medium">
              Pendiente de aprobacion
            </span>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <p><strong>Registrado:</strong> {formatDate(p.createdAt)}</p>
          </div>

          {/* Rejection reason */}
          {p.rejectionReason && (
            <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl">
              <p className="m-0 text-sm text-red-600"><strong>Motivo rechazo anterior:</strong> {p.rejectionReason}</p>
            </div>
          )}

          {/* Profile sections */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 mb-6">
            <div>
              {p.bio && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Sobre mi</h3>
                  <p className="mt-2 mb-0 text-sm text-slate-700 leading-relaxed">{p.bio}</p>
                </div>
              )}

              {(hasEducation || p.education) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Formacion</h3>
                  {hasEducation ? educationItems.map((ed, i) => (
                    <div key={i} className="mt-2.5 text-sm text-slate-700">
                      <div><strong>{ed.degree}</strong>{ed.field ? ` en ${ed.field}` : ''}{ed.institution ? ` — ${ed.institution}` : ''}</div>
                      {(ed.startDate || ed.endDate) && <div className="text-[13px] text-slate-400">{ed.startDate || '?'} - {ed.endDate || 'Actualidad'}</div>}
                    </div>
                  )) : <p className="mt-2 mb-0 text-sm text-slate-700">{p.education}</p>}
                </div>
              )}

              {(hasExperience || p.experience) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Experiencia</h3>
                  {hasExperience ? experienceItems.map((ex, i) => (
                    <div key={i} className="mt-2.5 text-sm text-slate-700">
                      <div><strong>{ex.title}</strong>{ex.company ? ` — ${ex.company}` : ''}</div>
                      {(ex.startDate || ex.endDate) && <div className="text-[13px] text-slate-400">{ex.startDate || '?'} - {ex.endDate || 'Actualidad'}</div>}
                      {ex.description && <div className="text-[13px] text-slate-500 mt-1">{ex.description}</div>}
                    </div>
                  )) : <p className="mt-2 mb-0 text-sm text-slate-700">{p.experience}</p>}
                </div>
              )}
            </div>

            <div>
              {(hasCerts || p.certifications) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Certificaciones</h3>
                  {hasCerts ? certItems.map((c, i) => (
                    <div key={i} className="mt-2.5 text-sm text-slate-700">
                      <div><strong>{c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ''}{c.date ? ` (${c.date})` : ''}</div>
                      {c.credentialId && <div className="text-[13px] text-slate-400">ID: {c.credentialId}</div>}
                    </div>
                  )) : <p className="mt-2 mb-0 text-sm text-slate-700">{p.certifications}</p>}
                </div>
              )}

              {(hasSpecs || p.specializations) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Especialidades</h3>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {hasSpecs ? specItems.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-[13px] bg-gantly-emerald-50 text-gantly-emerald-800 border border-gantly-emerald-200">{s}</span>
                    )) : <p className="m-0 text-sm text-slate-700">{p.specializations}</p>}
                  </div>
                </div>
              )}

              {(hasLangs || p.languages) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Idiomas</h3>
                  <div className="mt-2.5">
                    {hasLangs ? langItems.map((l, i) => (
                      <span key={i} className="mr-3 text-sm text-slate-700">{l.language}{l.level ? ` (${l.level})` : ''}{i < langItems.length - 1 ? ',' : ''}</span>
                    )) : <p className="m-0 text-sm text-slate-700">{p.languages}</p>}
                  </div>
                </div>
              )}

              {hasInterests && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Intereses</h3>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {interestItems.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-[13px] bg-gantly-blue-50 text-gantly-blue-700 border border-gantly-blue-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(p.linkedinUrl || p.website) && (
                <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-4">
                  <h3 className="font-heading font-bold text-slate-800">Links</h3>
                  <div className="flex gap-4 flex-wrap mt-2.5">
                    {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gantly-blue-500 hover:text-gantly-blue-700">LinkedIn</a>}
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gantly-blue-500 hover:text-gantly-blue-700">Web</a>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap items-center p-5 bg-gantly-gold-50 rounded-xl border border-gantly-gold-200">
            <button className="btn px-7 py-2.5 text-sm bg-gantly-emerald rounded-lg" onClick={() => handleApprovePsychologist(p.profileId)}>
              Aprobar
            </button>
            {rejectingId === p.profileId ? (
              <div className="flex gap-2 items-center flex-wrap">
                <input type="text" placeholder="Motivo (opcional)" value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm min-w-[200px] focus:border-gantly-blue-500 outline-none" />
                <button onClick={() => handleRejectPsychologist(p.profileId)}
                  className="px-4 py-2 bg-red-600 text-white border-none rounded-lg text-[13px] cursor-pointer hover:bg-red-700 transition-colors">
                  Confirmar rechazo
                </button>
                <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                  className="px-4 py-2 bg-slate-200 border-none rounded-lg text-[13px] cursor-pointer hover:bg-slate-300 transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setRejectingId(p.profileId)}
                className="px-7 py-2.5 text-sm bg-red-50 text-red-600 border border-red-300 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                Rechazar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Panel de psicólogo (admin)
  if (filterRole === 'PSYCHOLOGIST' && selectedUserId) {
    if (loading && !psychologistSummary) {
      return (
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
          <div className="loading">Cargando datos del psicólogo...</div>
        </div>
      );
    }
    if (!psychologistSummary) return null;
    const ps = psychologistSummary;
    return (
      <div>
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-heading font-bold text-slate-800">{ps.name}</h2>
              <p className="text-slate-500 mt-1">{ps.email}</p>
            </div>
            <button
              className="btn-secondary w-auto px-6 py-3"
              onClick={() => {
                setSelectedUserId(null);
                setPsychologistSummary(null);
              }}
            >
              ← Volver
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-8">
                <div
                  onClick={async () => {
                    if (ps.totalRatings === 0) return;
                    setShowRatingsModal(true);
                    setLoadingRatings(true);
                    try {
                      const list = await calendarService.getPsychologistRatings(ps.id);
                      setRatingsList(list);
                    } catch (e) {
                      setRatingsList([]);
                    } finally {
                      setLoadingRatings(false);
                    }
                  }}
                  className={`p-4 bg-slate-50 rounded-xl border border-slate-200 ${ps.totalRatings > 0 ? 'cursor-pointer hover:bg-slate-100 transition-colors' : 'opacity-80'}`}
                  title={ps.totalRatings > 0 ? 'Click para ver todas las reseñas' : undefined}
                >
                  <div className="text-sm text-slate-500">Valoración media</div>
                  <div className="text-2xl font-bold text-gantly-blue-500">
                    {ps.averageRating != null ? `${ps.averageRating.toFixed(1)} ★` : '—'}
                  </div>
                  <div className="text-xs text-slate-500">({ps.totalRatings} valoraciones)</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-500">Total facturado</div>
                  <div className="text-2xl font-bold text-gantly-emerald">
                    {ps.totalBilled != null ? `${Number(ps.totalBilled).toFixed(2)} €` : '0 €'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-500">Pacientes activos</div>
                  <div className="text-2xl font-bold text-gantly-blue-500">{ps.activePatients.length}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-500">Pacientes dados de alta</div>
                  <div className="text-2xl font-bold text-gantly-blue-500">{ps.dischargedPatients.length}</div>
                </div>
              </div>

              {showRatingsModal && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-6"
                  onClick={() => setShowRatingsModal(false)}
                >
                  <div
                    className="bg-white rounded-xl max-w-[520px] w-full max-h-[80vh] overflow-hidden flex flex-col shadow-elevated"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="m-0 font-heading font-bold text-slate-800">Reseñas de pacientes</h3>
                      <button
                        className="btn-secondary px-4 py-2 text-sm"
                        onClick={() => setShowRatingsModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="px-6 py-5 overflow-y-auto flex-1">
                      {loadingRatings ? (
                        <p className="text-slate-500">Cargando reseñas...</p>
                      ) : ratingsList.length === 0 ? (
                        <p className="text-slate-500">No hay reseñas</p>
                      ) : (
                        ratingsList.map((r, i) => (
                          <div
                            key={i}
                            className="p-4 mb-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <strong className="text-slate-800">{r.patientName}</strong>
                              <span className="text-amber-400 text-base">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            </div>
                            {r.comment && <p className="m-0 text-sm text-slate-500">{r.comment}</p>}
                            <div className="text-xs text-slate-400 mt-2">{formatDate(r.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <p><strong>Registrado:</strong> {formatDate(ps.createdAt)}</p>
              </div>

              <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
                <h3 className="font-heading font-bold text-slate-800">Pacientes activos ({ps.activePatients.length})</h3>
                {ps.activePatients.length === 0 ? (
                  <p className="text-slate-500">No hay pacientes activos</p>
                ) : (
                  <ul className="list-none p-0">
                    {ps.activePatients.map(p => (
                      <li key={p.id} className="p-3 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800">{p.name}</strong> — <span className="text-slate-500">{p.email}</span>
                        </div>
                        <span className="text-xs text-slate-400">Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
                <h3 className="font-heading font-bold text-slate-800">Pacientes dados de alta ({ps.dischargedPatients.length})</h3>
                {ps.dischargedPatients.length === 0 ? (
                  <p className="text-slate-500">No hay pacientes dados de alta</p>
                ) : (
                  <ul className="list-none p-0">
                    {ps.dischargedPatients.map(p => (
                      <li key={p.id} className="p-3 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800">{p.name}</strong> — <span className="text-slate-500">{p.email}</span>
                        </div>
                        <span className="text-xs text-slate-400">Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
                <h3 className="font-heading font-bold text-slate-800">Citas agendadas ({ps.scheduledAppointments.length})</h3>
                {ps.scheduledAppointments.length === 0 ? (
                  <p className="text-slate-500">No hay citas agendadas</p>
                ) : (
                  <ul className="list-none p-0">
                    {ps.scheduledAppointments.map(a => (
                      <li key={a.id} className="p-3 border-b border-slate-100">
                        <div><strong className="text-slate-800">{a.patientName}</strong> — <span className="text-slate-500">{a.patientEmail}</span></div>
                        <div className="text-sm text-slate-500">
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
                <h3 className="font-heading font-bold text-slate-800">Citas pasadas ({ps.pastAppointments.length})</h3>
                {ps.pastAppointments.length === 0 ? (
                  <p className="text-slate-500">No hay citas pasadas</p>
                ) : (
                  <ul className="list-none p-0 max-h-[300px] overflow-y-auto">
                    {ps.pastAppointments.slice(0, 50).map(a => (
                      <li key={a.id} className="p-3 border-b border-slate-100">
                        <div><strong className="text-slate-800">{a.patientName}</strong> — <span className="text-slate-500">{a.patientEmail}</span></div>
                        <div className="text-sm text-slate-500">
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {ps.pastAppointments.length > 50 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Mostrando las 50 más recientes de {ps.pastAppointments.length} citas
                  </p>
                )}
              </div>
        </div>
      </div>
    );
  }

  // Panel de paciente (respuestas a tests)
  if (selectedUserId && userDetails) {
    return (
      <div>
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-heading font-bold text-slate-800">{userDetails.name}</h2>
              <p className="text-slate-500 mt-1">{userDetails.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                className="btn-secondary w-auto px-6 py-3"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
              >
                ← Volver
              </button>
              <button
                className="btn w-auto px-6 py-3"
                onClick={async () => {
                  try {
                    const blob = new Blob([await resultsService.exportUserAll(userDetails.id)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const safeName = userDetails.name.replace(/[^a-zA-Z0-9]/g, '_');
                    a.download = `resultados_${safeName}.xlsx`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    alert('Error al exportar los datos del paciente');
                  }
                }}
              >
                Exportar paciente
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <p><strong>Fecha de registro:</strong> {formatDate(userDetails.createdAt)}</p>
          </div>

          {overallStats && overallStats.factors && overallStats.factors.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
              <h3 className="font-heading font-bold text-slate-800">Media general (todos los tests) - Factores</h3>
              <div className="flex gap-6 items-center flex-wrap mt-3">
                <div className="flex-1 min-w-[260px]">
                  <BarChart
                    data={overallStats.factors.map((f: any) => ({
                      label: f.code || f.name,
                      value: Number(f.percentage) || 0,
                    }))}
                    maxValue={100}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Estadísticas por Test</h3>
              <div className="flex gap-3 items-center">
                <select
                  value={selectedTestForStats ?? ''}
                  onChange={(e) => {
                    const testId = e.target.value ? Number(e.target.value) : null;
                    setSelectedTestForStats(testId);
                    if (testId && userDetails) {
                      loadUserStats(userDetails.id, testId);
                    } else {
                      setUserStats(null);
                    }
                  }}
                  className="px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:border-gantly-blue-500 outline-none"
                >
                  <option value="">Selecciona test…</option>
                  {tests.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title || t.code}</option>
                  ))}
                </select>
              </div>
            </div>
            {!selectedTestForStats && (
              <p className="text-slate-500 mt-2">Selecciona un test para ver sus estadísticas.</p>
            )}
            {selectedTestForStats && loading && (
              <p className="text-slate-500 mt-2">Cargando estadísticas...</p>
            )}
            {selectedTestForStats && !loading && userStats && (
              <div className="mt-4">
                {userStats.subfactors && userStats.subfactors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-heading font-semibold text-slate-700">Subfactores (gráfico)</h4>
                    <div className="flex gap-6 items-center flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <BarChart
                        data={userStats.subfactors.map((sf: any) => ({
                          label: sf.subfactorName || sf.subfactorCode,
                          value: Number(sf.percentage) || 0,
                        }))}
                        maxValue={100}
                      />
                    </div>
                    </div>
                  </div>
                )}
                {userStats.factors && userStats.factors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-heading font-semibold text-slate-700">Factores (gráfico)</h4>
                    <div className="flex gap-6 items-center flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <FactorChart
                        data={userStats.factors.map((f: any) => {
                          // Convertir porcentaje a escala 1-10
                          const percentage = Number(f.percentage) || 0;
                          const value = Math.round((percentage / 100) * 10);
                          const code = f.factorCode || '';
                          return {
                            label: code,
                            value: Math.max(1, Math.min(10, value)),
                          };
                        })}
                        maxValue={10}
                      />
                    </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          {userDetails.tests.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p>Este usuario aún no ha completado ningún test.</p>
            </div>
          ) : (
            <div className="tests-list">
              {userDetails.tests.map((test) => (
                <div key={test.testId} className="bg-white rounded-xl shadow-soft border border-slate-200 p-5 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-slate-800">{test.testTitle}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Código: {test.testCode}
                      </p>
                    </div>
                  </div>

                    <div className="mt-5">
                      {test.testCode === 'INITIAL' && test.answers.length > 0 && (
                        <InitialTestSummary test={test} />
                      )}
                    <h4 className="text-lg font-heading font-semibold text-slate-700 mb-4">
                      Respuestas ({test.answers.length})
                    </h4>
                    <div className="answers-list">
                      {test.answers.map((answer, idx) => (
                        <div key={answer.questionId} className="answer-card-admin mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="question-number text-xs w-6 h-6 flex items-center justify-center rounded-full bg-gantly-blue-50 text-gantly-blue-600 font-semibold">
                                {idx + 1}
                              </span>
                              <strong className="text-[15px] text-slate-800">{answer.questionText}</strong>
                            </div>
                            <div className="pl-8">
                              {answer.answerText ? (
                                <div>
                                  <p className="my-1 text-sm text-slate-700">
                                    <strong>Respuesta:</strong> {answer.answerText}
                                    {answer.answerValue !== undefined && answer.answerValue !== null && (
                                      <span className="text-slate-400 ml-2">
                                        (Valor: {answer.answerValue})
                                      </span>
                                    )}
                                  </p>
                                  {answer.textValue && (
                                    <p className="my-1 text-[13px] text-slate-500">
                                      <strong>Detalle:</strong> {answer.textValue}
                                    </p>
                                  )}
                                </div>
                              ) : answer.textValue ? (
                                <p className="my-1 text-sm text-slate-700">
                                  <strong>Detalle:</strong> {answer.textValue}
                                </p>
                              ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                <p className="my-1 text-sm text-slate-700">
                                  <strong>Valor numérico:</strong> {answer.numericValue}
                                </p>
                              ) : (
                                <p className="my-1 text-sm text-slate-400 italic">
                                  Sin respuesta registrada
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDate(answer.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="font-heading font-bold text-slate-800">
              {filterRole === 'USER' ? 'Pacientes' :
               filterRole === 'PSYCHOLOGIST' ? 'Psicólogos' :
               'Usuarios Registrados'} ({displayedUsers.length})
            </h2>
            {searchTerm.trim() && (
              <p className="m-0 text-sm text-slate-500">
                Mostrando {displayedUsers.length} coincidencia(s)
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 text-[15px] min-w-[220px] focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
            />
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading">Cargando usuarios...</div>
        ) : displayedUsers.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>
              {filterRole === 'USER' ? 'No hay pacientes registrados aún.' :
               filterRole === 'PSYCHOLOGIST' ? 'No hay psicólogos registrados aún.' :
               searchTerm.trim() ? `No se encontraron usuarios que coincidan con "${searchTerm}".` :
               'No hay usuarios registrados aún.'}
            </p>
          </div>
        ) : (
          <div className="users-grid">
            {displayedUsers.map(user => (
              <div
                key={user.id}
                className="user-card-admin bg-gradient-to-b from-white to-gantly-cloud-100 border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-card hover:-translate-y-0.5 transition-all"
                onClick={() => setSelectedUserId(user.id)}
              >
                <h3 className="font-heading font-bold text-slate-800">{user.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {user.email}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Registrado: {formatDate(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending psychologists section */}
      {filterRole === 'PSYCHOLOGIST' && pendingPsychologists.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 border-l-4 border-l-gantly-gold p-6 mt-6">
          <h2 className="m-0 mb-4 font-heading font-bold text-slate-800">Pendientes de aprobacion ({pendingPsychologists.length})</h2>
          <div className="users-grid">
            {pendingPsychologists.map(p => (
              <div
                key={p.profileId}
                className="user-card-admin cursor-pointer border-gantly-gold-200 bg-gantly-gold-50 rounded-xl p-4 hover:shadow-card hover:-translate-y-0.5 transition-all"
                onClick={() => setSelectedPendingId(p.profileId)}
              >
                <h3 className="font-heading font-bold text-slate-800">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{p.email}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Registrado: {formatDate(p.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
