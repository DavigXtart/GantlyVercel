import { useState, useEffect } from 'react';
import { companyService } from '../services/api';

interface PsychologistSummary {
  id: number;
  name: string;
  email: string;
  referralCode: string;
  averageRating: number | null;
  totalRatings: number;
  activePatients: number;
  upcomingAppointments: number;
}

interface PsychologistDetail extends Omit<PsychologistSummary, 'activePatients'> {
  createdAt: string | null;
  activePatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string | null }>;
  dischargedPatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string | null }>;
  scheduledAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number | null; patientName: string | null; patientEmail: string | null }>;
  pastAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number | null; patientName: string | null; patientEmail: string | null }>;
  totalBilled: number;
}

const formatDate = (dateString?: string | null) => {
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
    return '—';
  }
};

interface AvailableSlot {
  id: number;
  startTime: string;
  endTime: string;
  price: number | null;
}

export default function CompanyDashboard() {
  const [companyMe, setCompanyMe] = useState<{ name: string; email: string; referralCode: string } | null>(null);
  const [psychologists, setPsychologists] = useState<PsychologistSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PsychologistDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyMe();
    loadPsychologists();
  }, []);

  const loadCompanyMe = async () => {
    try {
      const data = await companyService.getMe();
      setCompanyMe(data);
    } catch {
      setCompanyMe(null);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const loadPsychologists = async () => {
    try {
      setLoading(true);
      const data = await companyService.getPsychologists();
      setPsychologists(data || []);
    } catch (err) {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      const data = await companyService.getPsychologistDetail(id);
      setDetail(data as PsychologistDetail);
    } catch (err) {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const openBooking = async () => {
    if (!selectedId) return;
    setShowBooking(true);
    setSelectedSlotId(null);
    setSelectedPatientId(null);
    setBookingMsg(null);
    try {
      const now = new Date().toISOString();
      const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const slots = await companyService.getPsychologistAvailability(selectedId, now, to);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleBook = async () => {
    if (!selectedId || !selectedSlotId || !selectedPatientId) return;
    setBookingLoading(true);
    setBookingMsg(null);
    try {
      await companyService.bookForPatient(selectedId, selectedSlotId, selectedPatientId);
      setBookingMsg('Cita agendada exitosamente');
      setShowBooking(false);
      loadDetail(selectedId);
    } catch (err: any) {
      setBookingMsg(err?.response?.data?.error || err?.response?.data?.message || 'Error al agendar la cita');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && psychologists.length === 0) {
    return (
      <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando psicólogos...</p>
      </div>
    );
  }

  if (detail) {
    const ps = detail;
    return (
      <div className="container" style={{ maxWidth: '1200px', padding: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>{ps.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{ps.email}</p>
              {ps.referralCode && (
                <p style={{ fontSize: '14px', color: '#5a9270', marginTop: '4px' }}>
                  Enlace: /{ps.referralCode}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-primary"
                onClick={openBooking}
                style={{ width: 'auto', padding: '12px 24px' }}
              >
                Agendar cita
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setSelectedId(null); setShowBooking(false); }}
                style={{ width: 'auto', padding: '12px 24px' }}
              >
                ← Volver
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
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

          {bookingMsg && (
            <div style={{
              marginBottom: '16px', padding: '12px 16px', borderRadius: '8px',
              background: bookingMsg.includes('exitosamente') ? '#ecfdf5' : '#fef2f2',
              color: bookingMsg.includes('exitosamente') ? '#065f46' : '#991b1b',
              border: `1px solid ${bookingMsg.includes('exitosamente') ? '#a7f3d0' : '#fecaca'}`
            }}>
              {bookingMsg}
            </div>
          )}

          {showBooking && (
            <div className="card" style={{ marginBottom: '24px', border: '2px solid #5a9270' }}>
              <h3 style={{ marginTop: 0 }}>Agendar cita para paciente</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Paciente</label>
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                >
                  <option value="">Selecciona un paciente...</option>
                  {ps.activePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.email}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Horario disponible</label>
                {availableSlots.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No hay horarios disponibles en los próximos 60 días.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    {availableSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '12px 16px',
                          borderBottom: '1px solid #e5e7eb', background: selectedSlotId === slot.id ? '#ecfdf5' : 'white',
                          border: 'none', borderLeft: selectedSlotId === slot.id ? '3px solid #5a9270' : '3px solid transparent',
                          cursor: 'pointer', fontSize: '14px'
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{formatDate(slot.startTime)}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          hasta {formatDate(slot.endTime)} — {slot.price != null ? `${Number(slot.price).toFixed(2)} €` : '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-primary"
                  onClick={handleBook}
                  disabled={!selectedSlotId || !selectedPatientId || bookingLoading}
                  style={{ width: 'auto', padding: '10px 24px', opacity: (!selectedSlotId || !selectedPatientId) ? 0.5 : 1 }}
                >
                  {bookingLoading ? 'Agendando...' : 'Confirmar cita'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowBooking(false)}
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {ps.createdAt && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
              <p><strong>Registrado:</strong> {formatDate(ps.createdAt)}</p>
            </div>
          )}

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3>Pacientes activos ({ps.activePatients.length})</h3>
            {ps.activePatients.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No hay pacientes activos</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {ps.activePatients.map(p => (
                  <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><strong>{p.name}</strong> — {p.email}</div>
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
                    <div><strong>{p.name}</strong> — {p.email}</div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignado: {formatDate(p.assignedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3>Próximas citas ({ps.scheduledAppointments.length})</h3>
            {ps.scheduledAppointments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No hay citas agendadas</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {ps.scheduledAppointments.map(a => (
                  <li key={a.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div><strong>{a.patientName || '—'}</strong> — {a.patientEmail || '—'}</div>
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
                    <div><strong>{a.patientName || '—'}</strong> — {a.patientEmail || '—'}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', padding: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>{companyMe?.name || 'Panel empresa'}</h1>
            {companyMe?.email && <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{companyMe.email}</p>}
          </div>
          {companyMe?.referralCode && (
            <div style={{
              padding: '12px 20px',
              background: '#f0f5f3',
              borderRadius: '12px',
              border: '1px solid rgba(90, 146, 112, 0.3)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Código para psicólogos</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#5a9270', fontFamily: 'monospace' }}>{companyMe.referralCode}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                Comparte este código con tus psicólogos para que se registren vinculados a tu empresa.
              </p>
            </div>
          )}
        </div>

        <h2 style={{ marginTop: 0 }}>Psicólogos contratados</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Visualiza los psicólogos vinculados a tu empresa, sus citas y pacientes.
        </p>

        {psychologists.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No tienes psicólogos contratados. Comparte tu código de empresa para que se registren.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {psychologists.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#5a9270';
                  e.currentTarget.style.background = '#f0f5f3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = '#f9fafb';
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>{p.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{p.email}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>{p.averageRating != null ? `${p.averageRating.toFixed(1)} ★` : '—'}</span>
                  <span>{p.activePatients} pacientes</span>
                  <span>{p.upcomingAppointments} citas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
