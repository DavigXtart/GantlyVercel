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
    <div style={{ marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
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
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fde68a' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{p.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{p.email}</p>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => { setSelectedPendingId(null); setRejectingId(null); setRejectReason(''); }}
              style={{ width: 'auto', padding: '12px 24px' }}>
              ← Volver
            </button>
          </div>

          {/* Info badges */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {p.licenseNumber && (
              <span style={{ fontSize: '13px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '6px 14px', color: '#9a3412', fontWeight: 500 }}>
                N. Colegiado: {p.licenseNumber}
              </span>
            )}
            {p.gender && <span style={{ fontSize: '13px', background: '#f0f5f3', borderRadius: '8px', padding: '6px 14px', color: '#374151' }}>{p.gender}</span>}
            {p.age != null && <span style={{ fontSize: '13px', background: '#f0f5f3', borderRadius: '8px', padding: '6px 14px', color: '#374151' }}>{p.age} anos</span>}
            <span style={{ fontSize: '13px', background: '#fefce8', borderRadius: '8px', padding: '6px 14px', color: '#92400e' }}>
              Pendiente de aprobacion
            </span>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
            <p><strong>Registrado:</strong> {formatDate(p.createdAt)}</p>
          </div>

          {/* Rejection reason */}
          {p.rejectionReason && (
            <div style={{ marginBottom: '24px', padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}><strong>Motivo rechazo anterior:</strong> {p.rejectionReason}</p>
            </div>
          )}

          {/* Profile sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div>
              {p.bio && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Sobre mi</h3>
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{p.bio}</p>
                </div>
              )}

              {(hasEducation || p.education) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Formacion</h3>
                  {hasEducation ? educationItems.map((ed, i) => (
                    <div key={i} style={{ marginTop: '10px', fontSize: '14px', color: '#374151' }}>
                      <div><strong>{ed.degree}</strong>{ed.field ? ` en ${ed.field}` : ''}{ed.institution ? ` — ${ed.institution}` : ''}</div>
                      {(ed.startDate || ed.endDate) && <div style={{ fontSize: '13px', color: '#9ca3af' }}>{ed.startDate || '?'} - {ed.endDate || 'Actualidad'}</div>}
                    </div>
                  )) : <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#374151' }}>{p.education}</p>}
                </div>
              )}

              {(hasExperience || p.experience) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Experiencia</h3>
                  {hasExperience ? experienceItems.map((ex, i) => (
                    <div key={i} style={{ marginTop: '10px', fontSize: '14px', color: '#374151' }}>
                      <div><strong>{ex.title}</strong>{ex.company ? ` — ${ex.company}` : ''}</div>
                      {(ex.startDate || ex.endDate) && <div style={{ fontSize: '13px', color: '#9ca3af' }}>{ex.startDate || '?'} - {ex.endDate || 'Actualidad'}</div>}
                      {ex.description && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{ex.description}</div>}
                    </div>
                  )) : <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#374151' }}>{p.experience}</p>}
                </div>
              )}
            </div>

            <div>
              {(hasCerts || p.certifications) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Certificaciones</h3>
                  {hasCerts ? certItems.map((c, i) => (
                    <div key={i} style={{ marginTop: '10px', fontSize: '14px', color: '#374151' }}>
                      <div><strong>{c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ''}{c.date ? ` (${c.date})` : ''}</div>
                      {c.credentialId && <div style={{ fontSize: '13px', color: '#9ca3af' }}>ID: {c.credentialId}</div>}
                    </div>
                  )) : <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#374151' }}>{p.certifications}</p>}
                </div>
              )}

              {(hasSpecs || p.specializations) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Especialidades</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {hasSpecs ? specItems.map((s, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{s}</span>
                    )) : <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>{p.specializations}</p>}
                  </div>
                </div>
              )}

              {(hasLangs || p.languages) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Idiomas</h3>
                  <div style={{ marginTop: '10px' }}>
                    {hasLangs ? langItems.map((l, i) => (
                      <span key={i} style={{ marginRight: '12px', fontSize: '14px', color: '#374151' }}>{l.language}{l.level ? ` (${l.level})` : ''}{i < langItems.length - 1 ? ',' : ''}</span>
                    )) : <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>{p.languages}</p>}
                  </div>
                </div>
              )}

              {hasInterests && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Intereses</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {interestItems.map((s, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(p.linkedinUrl || p.website) && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3>Links</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#2563eb' }}>LinkedIn</a>}
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#2563eb' }}>Web</a>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: '#fefce8', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <button className="btn" onClick={() => handleApprovePsychologist(p.profileId)}
              style={{ padding: '10px 28px', fontSize: '14px', background: '#059669', borderRadius: '8px' }}>
              Aprobar
            </button>
            {rejectingId === p.profileId ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Motivo (opcional)" value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '200px' }} />
                <button onClick={() => handleRejectPsychologist(p.profileId)}
                  style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  Confirmar rechazo
                </button>
                <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                  style={{ padding: '8px 18px', background: '#e5e7eb', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setRejectingId(p.profileId)}
                style={{ padding: '10px 28px', fontSize: '14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer' }}>
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
        <div className="card">
          <div className="loading">Cargando datos del psicólogo...</div>
        </div>
      );
    }
    if (!psychologistSummary) return null;
    const ps = psychologistSummary;
    return (
      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>{ps.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{ps.email}</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedUserId(null);
                setPsychologistSummary(null);
              }}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              ← Volver
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
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
                  style={{
                    padding: '16px',
                    background: '#f0f5f3',
                    borderRadius: '12px',
                    border: '1px solid rgba(90, 146, 112, 0.2)',
                    cursor: ps.totalRatings > 0 ? 'pointer' : 'default',
                    opacity: ps.totalRatings > 0 ? 1 : 0.8
                  }}
                  title={ps.totalRatings > 0 ? 'Click para ver todas las reseñas' : undefined}
                >
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Valoración media</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>
                    {ps.averageRating != null ? `${ps.averageRating.toFixed(1)} ★` : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({ps.totalRatings} valoraciones)</div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total facturado</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>
                    {ps.totalBilled != null ? `${Number(ps.totalBilled).toFixed(2)} €` : '0 €'}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pacientes activos</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>{ps.activePatients.length}</div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pacientes dados de alta</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>{ps.dischargedPatients.length}</div>
                </div>
              </div>

              {showRatingsModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '24px'
                  }}
                  onClick={() => setShowRatingsModal(false)}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      maxWidth: '520px',
                      width: '100%',
                      maxHeight: '80vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Reseñas de pacientes</h3>
                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => setShowRatingsModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                      {loadingRatings ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando reseñas...</p>
                      ) : ratingsList.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay reseñas</p>
                      ) : (
                        ratingsList.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '16px',
                              marginBottom: '12px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <strong>{r.patientName}</strong>
                              <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            </div>
                            {r.comment && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{r.comment}</p>}
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{formatDate(r.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
                <p><strong>Registrado:</strong> {formatDate(ps.createdAt)}</p>
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Pacientes activos ({ps.activePatients.length})</h3>
                {ps.activePatients.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay pacientes activos</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.activePatients.map(p => (
                      <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.name}</strong> — {p.email}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Pacientes dados de alta ({ps.dischargedPatients.length})</h3>
                {ps.dischargedPatients.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay pacientes dados de alta</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.dischargedPatients.map(p => (
                      <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.name}</strong> — {p.email}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Citas agendadas ({ps.scheduledAppointments.length})</h3>
                {ps.scheduledAppointments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay citas agendadas</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.scheduledAppointments.map(a => (
                      <li key={a.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div><strong>{a.patientName}</strong> — {a.patientEmail}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Citas pasadas ({ps.pastAppointments.length})</h3>
                {ps.pastAppointments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay citas pasadas</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                    {ps.pastAppointments.slice(0, 50).map(a => (
                      <li key={a.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div><strong>{a.patientName}</strong> — {a.patientEmail}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {ps.pastAppointments.length > 50 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
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
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>{userDetails.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{userDetails.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                style={{ width: 'auto', padding: '12px 24px' }}
              >
                ← Volver
              </button>
              <button
                className="btn"
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
                style={{ width: 'auto', padding: '12px 24px' }}
              >
                Exportar paciente
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
            <p><strong>Fecha de registro:</strong> {formatDate(userDetails.createdAt)}</p>
          </div>

          {overallStats && overallStats.factors && overallStats.factors.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3>Media general (todos los tests) - Factores</h3>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
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

          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Estadísticas por Test</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                  style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                >
                  <option value="">Selecciona test…</option>
                  {tests.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title || t.code}</option>
                  ))}
                </select>
              </div>
            </div>
            {!selectedTestForStats && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Selecciona un test para ver sus estadísticas.</p>
            )}
            {selectedTestForStats && loading && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Cargando estadísticas...</p>
            )}
            {selectedTestForStats && !loading && userStats && (
              <div style={{ marginTop: '16px' }}>
                {userStats.subfactors && userStats.subfactors.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Subfactores (gráfico)</h4>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
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
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Factores (gráfico)</h4>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
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
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>Este usuario aún no ha completado ningún test.</p>
            </div>
          ) : (
            <div className="tests-list">
              {userDetails.tests.map((test) => (
                <div key={test.testId} className="card" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3>{test.testTitle}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Código: {test.testCode}
                      </p>
                    </div>
                  </div>

                    <div style={{ marginTop: '20px' }}>
                      {test.testCode === 'INITIAL' && test.answers.length > 0 && (
                        <InitialTestSummary test={test} />
                      )}
                    <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                      Respuestas ({test.answers.length})
                    </h4>
                    <div className="answers-list">
                      {test.answers.map((answer, idx) => (
                        <div key={answer.questionId} className="answer-card-admin" style={{ marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span className="question-number" style={{ fontSize: '12px', width: '24px', height: '24px' }}>
                                {idx + 1}
                              </span>
                              <strong style={{ fontSize: '15px' }}>{answer.questionText}</strong>
                            </div>
                            <div style={{ paddingLeft: '32px' }}>
                              {answer.answerText ? (
                                <div>
                                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>Respuesta:</strong> {answer.answerText}
                                    {answer.answerValue !== undefined && answer.answerValue !== null && (
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                        (Valor: {answer.answerValue})
                                      </span>
                                    )}
                                  </p>
                                  {answer.textValue && (
                                    <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                      <strong>Detalle:</strong> {answer.textValue}
                                    </p>
                                  )}
                                </div>
                              ) : answer.textValue ? (
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                  <strong>Detalle:</strong> {answer.textValue}
                                </p>
                              ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                  <strong>Valor numérico:</strong> {answer.numericValue}
                                </p>
                              ) : (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Sin respuesta registrada
                                </p>
                              )}
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2>
              {filterRole === 'USER' ? 'Pacientes' : 
               filterRole === 'PSYCHOLOGIST' ? 'Psicólogos' : 
               'Usuarios Registrados'} ({displayedUsers.length})
            </h2>
            {searchTerm.trim() && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Mostrando {displayedUsers.length} coincidencia(s)
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                minWidth: '220px'
              }}
            />
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading">Cargando usuarios...</div>
        ) : displayedUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
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
                className="user-card-admin"
                onClick={() => setSelectedUserId(user.id)}
                style={{ cursor: 'pointer' }}
              >
                <h3>{user.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {user.email}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Registrado: {formatDate(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending psychologists section */}
      {filterRole === 'PSYCHOLOGIST' && pendingPsychologists.length > 0 && (
        <div className="card" style={{ marginTop: '24px', borderLeft: '4px solid #f59e0b' }}>
          <h2 style={{ margin: '0 0 16px' }}>Pendientes de aprobacion ({pendingPsychologists.length})</h2>
          <div className="users-grid">
            {pendingPsychologists.map(p => (
              <div
                key={p.profileId}
                className="user-card-admin"
                onClick={() => setSelectedPendingId(p.profileId)}
                style={{ cursor: 'pointer', borderColor: '#fde68a', background: '#fefce8' }}
              >
                <h3>{p.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.email}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
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

