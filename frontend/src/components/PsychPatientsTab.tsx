import { useState, useMemo } from 'react';
import { consentService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';

interface PsychPatientsTabProps {
  patients: any[];
  loadingPatients: boolean;
  onRefresh: () => Promise<void>;
  onOpenChat: (patientId: number) => void;
  onViewPatient: (patientId: number) => void;
  onUpdateStatus: (patientId: number, status: 'ACTIVE' | 'DISCHARGED') => Promise<void>;
}

export default function PsychPatientsTab({
  patients,
  loadingPatients,
  onRefresh,
  onOpenChat,
  onViewPatient,
  onUpdateStatus,
}: PsychPatientsTabProps) {
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientFilterGender, setPatientFilterGender] = useState('');
  const [patientFilterLastVisit, setPatientFilterLastVisit] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentDocTypes, setConsentDocTypes] = useState<any[]>([]);
  const [consentForm, setConsentForm] = useState<{ userId: number; documentTypeId: number; place: string }>({ userId: 0, documentTypeId: 0, place: '' });
  const [sendingConsent, setSendingConsent] = useState(false);

  const filteredPatients = useMemo(() => {
    let filtered = patients;
    if (patientSearchTerm.trim()) {
      const query = patientSearchTerm.toLowerCase();
      filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(query) || (p.email || '').toLowerCase().includes(query));
    }
    if (patientFilterGender) {
      filtered = filtered.filter(p => p.gender === patientFilterGender);
    }
    if (patientFilterLastVisit) {
      const now = new Date();
      filtered = filtered.filter(p => {
        if (!p.lastVisit) return patientFilterLastVisit === 'none';
        const lastVisitDate = new Date(p.lastVisit);
        const daysDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        switch (patientFilterLastVisit) {
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          case '3months': return daysDiff <= 90;
          case 'more3months': return daysDiff > 90;
          case 'none': return false;
          default: return true;
        }
      });
    }
    return filtered;
  }, [patients, patientSearchTerm, patientFilterGender, patientFilterLastVisit]);

  const isPatientMinor = (p: any) => p.isMinor === true || p.minor === true;
  const minorPatients = useMemo(() => filteredPatients.filter(isPatientMinor), [filteredPatients]);
  const activePatients = useMemo(() => filteredPatients.filter(p => !isPatientMinor(p) && (p.status || 'ACTIVE') === 'ACTIVE'), [filteredPatients]);
  const dischargedPatients = useMemo(() => filteredPatients.filter(p => !isPatientMinor(p) && p.status === 'DISCHARGED'), [filteredPatients]);

  return (
    <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Mis Pacientes
        </h3>
        <button
          onClick={onRefresh}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Refrescar
        </button>
      </div>

      {/* Buscador y filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={patientSearchTerm}
          onChange={(e) => setPatientSearchTerm(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            fontSize: '15px',
            minWidth: '220px',
            flex: 1
          }}
        />
        <select
          value={patientFilterGender}
          onChange={(e) => setPatientFilterGender(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            fontSize: '15px',
            minWidth: '150px'
          }}
        >
          <option value="">Todos los generos</option>
          <option value="MALE">Hombre</option>
          <option value="FEMALE">Mujer</option>
          <option value="OTHER">Otro</option>
        </select>
        <select
          value={patientFilterLastVisit}
          onChange={(e) => setPatientFilterLastVisit(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            fontSize: '15px',
            minWidth: '180px'
          }}
        >
          <option value="">Todas las visitas</option>
          <option value="week">Ultima semana</option>
          <option value="month">Ultimo mes</option>
          <option value="3months">Ultimos 3 meses</option>
          <option value="more3months">Mas de 3 meses</option>
          <option value="none">Sin visitas</option>
        </select>
      </div>

      {loadingPatients ? (
        <LoadingSpinner text="Cargando pacientes..." />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon="👥"
          title={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "No se encontraron pacientes" : "No hay pacientes asignados"}
          description={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "Intenta cambiar los filtros de busqueda." : "Aun no tienes pacientes asignados. Los pacientes apareceran aqui una vez que se registren y te seleccionen."}
        />
      ) : (
        <>
          {/* Pacientes Activos */}
          {activePatients.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                Pacientes Activos ({activePatients.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {activePatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    style={{
                      padding: '24px',
                      background: '#f9fafb',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '260px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        border: '3px solid white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                          {p.email}
                        </div>
                        {p.lastVisit && (
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' }}>
                            Sin visitas registradas
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(p.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        💬 Abrir Chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(p.id, 'DISCHARGED');
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                        }}
                      >
                        Dar de Alta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menores de edad */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
              Menores de edad ({minorPatients.length})
            </h4>
            {minorPatients.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Los pacientes con fecha de nacimiento o edad menor de 18 anos apareceran aqui. Pueden requerir consentimiento firmado antes de acceder a todo el contenido.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {minorPatients.map((p: any) => {
                  const consentSigned = p.consentStatus === 'SIGNED';
                  const canOpenFullProfile = consentSigned;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!canOpenFullProfile) {
                          toast.warning('Consentimiento pendiente: solo puedes abrir chat o enviar el consentimiento.');
                          return;
                        }
                        onViewPatient(p.id);
                      }}
                      style={{
                        padding: '24px',
                        background: consentSigned ? '#f9fafb' : 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
                        border: consentSigned ? '2px solid #e5e7eb' : '2px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '280px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = consentSigned ? '#5a9270' : 'rgba(245, 158, 11, 0.55)';
                        e.currentTarget.style.boxShadow = consentSigned ? '0 4px 12px rgba(102, 126, 234, 0.15)' : '0 6px 18px rgba(245, 158, 11, 0.18)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = consentSigned ? '#e5e7eb' : 'rgba(245, 158, 11, 0.35)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          flexShrink: 0,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          border: '3px solid white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                            {p.email}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: consentSigned ? '#059669' : '#b45309' }}>
                            {consentSigned ? '✅ Consentimiento firmado' : '⚠️ Consentimiento pendiente'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(p.id);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                        >
                          💬 Abrir Chat
                        </button>

                        {!consentSigned ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const types = await consentService.listDocumentTypes();
                                setConsentDocTypes(types || []);
                                const first = (types || [])[0];
                                setConsentForm({ userId: p.id, documentTypeId: first?.id || 0, place: '' });
                                setShowConsentModal(true);
                              } catch (err: any) {
                                toast.error('No se pudieron cargar los tipos de documento');
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: '#fff7ed',
                              color: '#b45309',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'all 0.2s'
                            }}
                          >
                            📎 Adjuntar consentimiento
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(p.id, 'DISCHARGED');
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Dar de Alta
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pacientes Dados de Alta */}
          {dischargedPatients.length > 0 && (
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                Pacientes Dados de Alta ({dischargedPatients.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {dischargedPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    style={{
                      padding: '24px',
                      background: '#f9fafb',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      opacity: 0.7,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      minHeight: '260px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.opacity = '0.7';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        border: '3px solid white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                          {p.email}
                        </div>
                        {p.lastVisit && (
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' }}>
                            Sin visitas registradas
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(p.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        💬 Abrir Chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(p.id, 'ACTIVE');
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          border: '1px solid #93c5fd',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#bfdbfe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#dbeafe';
                        }}
                      >
                        Reactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Enviar consentimiento a menor */}
      {showConsentModal && (
        <div
          onClick={() => !sendingConsent && setShowConsentModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              padding: '22px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a2e22' }}>Adjuntar consentimiento</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  Selecciona el tipo de documento y el lugar. El contenido se rellenara automaticamente (psicologo, fecha, hora, etc.).
                </div>
              </div>
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: sendingConsent ? 'not-allowed' : 'pointer', color: '#6b7280', fontSize: '18px' }}
                aria-label="Cerrar"
                disabled={sendingConsent}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>
                  Tipo de documento
                </label>
                <select
                  value={consentForm.documentTypeId || 0}
                  onChange={(e) => setConsentForm({ ...consentForm, documentTypeId: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                >
                  {(consentDocTypes || []).length === 0 && <option value={0}>No hay tipos disponibles</option>}
                  {(consentDocTypes || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>
                  Lugar (opcional)
                </label>
                <input
                  type="text"
                  value={consentForm.place}
                  onChange={(e) => setConsentForm({ ...consentForm, place: e.target.value })}
                  placeholder="Ej: Madrid"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                disabled={sendingConsent}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f3f4f6',
                  color: '#374151',
                  fontWeight: 700,
                  cursor: sendingConsent ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingConsent || !consentForm.userId || !consentForm.documentTypeId}
                onClick={async () => {
                  try {
                    setSendingConsent(true);
                    await consentService.sendConsent(consentForm.userId, consentForm.documentTypeId, consentForm.place || undefined);
                    toast.success('Consentimiento enviado');
                    setShowConsentModal(false);
                    await onRefresh();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || err.response?.data?.message || 'Error al enviar el consentimiento');
                  } finally {
                    setSendingConsent(false);
                  }
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: sendingConsent ? '#cbd5d1' : 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                  color: 'white',
                  fontWeight: 800,
                  cursor: sendingConsent ? 'not-allowed' : 'pointer',
                }}
              >
                {sendingConsent ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
