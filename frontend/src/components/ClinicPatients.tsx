import { useState, useEffect, useCallback, useRef } from 'react';
import { clinicService } from '../services/api';
import type { ClinicPatientSummary, ClinicPatientDetail, UpdatePatientReq } from '../services/api';

interface Props {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return iso;
  }
}

function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid #e5e7eb',
        borderTopColor: '#5a9270',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '40px auto',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const lc = status?.toLowerCase() ?? '';
  let bg = '#6b7280';
  let color = 'white';
  let label = status;
  if (lc === 'active' || lc === 'activo') {
    bg = '#dcfce7';
    color = '#166534';
    label = 'Activo';
  } else if (lc === 'discharged' || lc === 'alta') {
    bg = '#f3f4f6';
    color = '#6b7280';
    label = 'Alta';
  }
  return (
    <span
      style={{
        background: bg,
        color,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return null;
  const lc = status.toLowerCase();
  let bg = '#fef3c7';
  let color = '#92400e';
  let label = status;
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') {
    bg = '#dcfce7';
    color = '#166534';
    label = 'Pagada';
  } else if (lc === 'pending' || lc === 'pendiente') {
    bg = '#fef3c7';
    color = '#92400e';
    label = 'Pendiente';
  } else if (lc === 'cancelled' || lc === 'cancelado' || lc === 'cancelada') {
    bg = '#fee2e2';
    color = '#991b1b';
    label = 'Cancelada';
  }
  return (
    <span
      style={{
        background: bg,
        color,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Appointment status dot
// ---------------------------------------------------------------------------
function ApptDot({ status }: { status: string }) {
  const lc = status?.toLowerCase() ?? '';
  let color = '#9ca3af';
  if (lc === 'confirmed' || lc === 'booked' || lc === 'realizada') color = '#22c55e';
  else if (lc === 'cancelled' || lc === 'cancelada') color = '#ef4444';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Expandable section
// ---------------------------------------------------------------------------
function ExpandableSection({ label, value }: { label: string; value?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          textAlign: 'left',
          padding: '10px 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: '#374151',
          fontWeight: 500,
        }}
      >
        {label}
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 10, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          {value || <span style={{ fontStyle: 'italic' }}>Sin información</span>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient list view
// ---------------------------------------------------------------------------
function ListView({
  patients,
  loading,
  error,
  search,
  onSearchChange,
  onSelect,
}: {
  patients: ClinicPatientSummary[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (id: number) => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar paciente por nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          No hay pacientes{search ? ' que coincidan con la búsqueda' : ' registrados aún'}.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 120px 1fr 100px 100px',
              background: '#f9fafb',
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>N.º</span>
            <span>Nombre</span>
            <span>Email</span>
            <span>Teléfono</span>
            <span>Psicólogo</span>
            <span style={{ textAlign: 'center' }}>Citas</span>
            <span>Estado</span>
          </div>

          {/* Rows */}
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 1fr 120px 1fr 100px 100px',
                padding: '12px 16px',
                borderTop: '1px solid #f3f4f6',
                cursor: 'pointer',
                fontSize: 14,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f5f3')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                {p.patientNumber != null ? `#${p.patientNumber}` : '—'}
              </span>
              <span style={{ fontWeight: 500, color: '#111827' }}>{p.name}</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>{p.email}</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>{p.phone || '—'}</span>
              <span style={{ color: '#374151', fontSize: 13 }}>{p.assignedPsychologistName || '—'}</span>
              <span style={{ textAlign: 'center', color: '#374151', fontSize: 13 }}>{p.totalAppointments}</span>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient detail view
// ---------------------------------------------------------------------------
type DetailTab = 'citas' | 'documentos' | 'datos';

type DocumentItem = { id: number; originalName: string; fileName: string; fileSize: number | null; uploadedAt: string };

function DetailView({
  patient,
  loading,
  error,
  onBack,
  onSave,
  saving,
}: {
  patient: ClinicPatientDetail | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (id: number, req: UpdatePatientReq) => Promise<void>;
  saving: boolean;
}) {
  const [tab, setTab] = useState<DetailTab>('citas');

  // Editable fields (for "Datos del paciente" tab)
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medication, setMedication] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [consentSigned, setConsentSigned] = useState(false);
  const [patientStatus, setPatientStatus] = useState('');
  const [patientType, setPatientType] = useState('');
  const [phone, setPhone] = useState('');

  // Session notes inline editing (Feature B)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Documents (Feature C)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async (patientId: number) => {
    setLoadingDocs(true);
    try {
      setDocuments(await clinicService.listDocuments(patientId));
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (patient) {
      setNotes(patient.notes ?? '');
      setAllergies(patient.allergies ?? '');
      setMedication(patient.medication ?? '');
      setMedicalHistory(patient.medicalHistory ?? '');
      setConsentSigned(patient.consentSigned ?? false);
      setPatientStatus(patient.status ?? '');
      setPatientType(patient.patientType ?? '');
      setPhone(patient.phone ?? '');
      loadDocuments(patient.id);
    }
  }, [patient, loadDocuments]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patient) return;
    setUploadingDoc(true);
    try {
      const doc = await clinicService.uploadDocument(patient.id, file);
      setDocuments(prev => [doc, ...prev]);
    } catch { /* ignore */ } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDocDelete = async (docId: number) => {
    try {
      await clinicService.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch { /* ignore */ }
  };

  if (loading) return <Spinner />;
  if (error)
    return (
      <div style={{ padding: 24, color: '#991b1b', background: '#fee2e2', borderRadius: 8, margin: 24 }}>
        {error}
      </div>
    );
  if (!patient) return null;

  const handleSave = async () => {
    await onSave(patient.id, {
      notes,
      allergies,
      medication,
      medicalHistory,
      consentSigned,
      status: patientStatus,
      patientType,
      phone,
    });
  };

  const tabStyle = (t: DetailTab): React.CSSProperties => ({
    padding: '8px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#5a9270' : '#6b7280',
    borderBottom: tab === t ? '2px solid #5a9270' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* ---- Sidebar ---- */}
      <aside
        style={{
          width: 300,
          minWidth: 300,
          borderRight: '1px solid #e5e7eb',
          padding: 20,
          overflowY: 'auto',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#5a9270',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'left',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Pacientes
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#5a9270',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {initials(patient.name)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{patient.name}</div>
            {patient.patientNumber != null && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>N.º {patient.patientNumber}</div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
            <span>✉️</span>
            <span>{patient.email}</span>
          </div>
          {patient.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <span>📞</span>
              <span>{patient.phone}</span>
            </div>
          )}
        </div>

        {/* Notes (sidebar quick notes) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
            Notas
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añadir notas sobre este paciente..."
            rows={4}
            style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 13,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Medical info expandable */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>
            Otra información médica
          </div>
          <ExpandableSection label="Alergias" value={patient.allergies} />
          <ExpandableSection label="Medicación" value={patient.medication} />
          <ExpandableSection label="Antecedentes médicos" value={patient.medicalHistory} />
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', paddingLeft: 24 }}>
          <button style={tabStyle('citas')} onClick={() => setTab('citas')}>
            Citas ({patient.appointments?.length ?? 0})
          </button>
          <button style={tabStyle('documentos')} onClick={() => setTab('documentos')}>
            Documentos
          </button>
          <button style={tabStyle('datos')} onClick={() => setTab('datos')}>
            Datos del paciente
          </button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* CITAS tab */}
          {tab === 'citas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(!patient.appointments || patient.appointments.length === 0) ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
                  No hay citas para este paciente.
                </div>
              ) : (
                [...patient.appointments]
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((appt) => (
                    <div
                      key={appt.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        padding: '14px 18px',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <ApptDot status={appt.status} />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>
                              {fmtDateTime(appt.startTime)}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                              {appt.psychologistName}
                              {appt.service ? ` · ${appt.service}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <PaymentBadge status={appt.paymentStatus} />
                          <button
                            disabled
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              background: '#f9fafb',
                              fontSize: 12,
                              color: '#9ca3af',
                              cursor: 'not-allowed',
                            }}
                          >
                            Modificar cita
                          </button>
                        </div>
                      </div>
                      {/* Session note inline editor */}
                      {editingNoteId === appt.id ? (
                        <div style={{ marginTop: 8 }}>
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            rows={2}
                            placeholder="Nota administrativa..."
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 12,
                              color: '#111827',
                              resize: 'none',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button
                              onClick={async () => {
                                await clinicService.updateAppointmentNotes(appt.id, noteText);
                                setEditingNoteId(null);
                              }}
                              style={{
                                fontSize: 12,
                                background: '#5a9270',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              style={{
                                fontSize: 12,
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                padding: '4px 6px',
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          {appt.clinicNotes && (
                            <span style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>{appt.clinicNotes}</span>
                          )}
                          <button
                            onClick={() => { setEditingNoteId(appt.id); setNoteText(appt.clinicNotes || ''); }}
                            title="Editar nota"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#d1d5db',
                              padding: 2,
                              marginLeft: 'auto',
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#5a9270')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* DOCUMENTOS tab */}
          {tab === 'documentos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Upload button */}
              <div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                    background: uploadingDoc ? '#9ca3af' : '#5a9270',
                    color: 'white',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                  {uploadingDoc ? 'Subiendo...' : 'Subir documento'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleDocUpload}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    disabled={uploadingDoc}
                  />
                </label>
              </div>

              {loadingDocs ? (
                <Spinner />
              ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
                  Sin documentos para este paciente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        background: '#f9fafb',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#9ca3af' }}>description</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.originalName}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <a
                        href={`/uploads/${doc.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#9ca3af', lineHeight: 1 }}
                        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#5a9270')}
                        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                      </a>
                      <button
                        onClick={() => handleDocDelete(doc.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', lineHeight: 1, padding: 2 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                        title="Eliminar documento"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DATOS DEL PACIENTE tab */}
          {tab === 'datos' && (
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Datos generales */}
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                  Datos generales
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    Nombre
                    <input value={patient.name} readOnly style={inputStyle(true)} />
                  </label>
                  <label style={labelStyle}>
                    Teléfono
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Sin teléfono"
                      style={inputStyle(false)}
                    />
                  </label>
                  <label style={labelStyle}>
                    Fecha de nacimiento
                    <input value={fmtDate(patient.birthDate)} readOnly style={inputStyle(true)} />
                  </label>
                  <label style={labelStyle}>
                    Género
                    <input value={patient.gender ?? '—'} readOnly style={inputStyle(true)} />
                  </label>
                  <label style={labelStyle}>
                    Tipo
                    <select
                      value={patientType}
                      onChange={(e) => setPatientType(e.target.value)}
                      style={{ ...inputStyle(false), cursor: 'pointer' }}
                    >
                      <option value="PRIVATE">Privado</option>
                      <option value="INSURANCE">De aseguradora</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* Datos administrativos */}
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                  Datos administrativos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consentSigned}
                      onChange={(e) => setConsentSigned(e.target.checked)}
                      style={{ accentColor: '#5a9270', width: 16, height: 16 }}
                    />
                    Consentimiento RGPD firmado
                  </label>
                  <label style={labelStyle}>
                    Estado del paciente
                    <select
                      value={patientStatus}
                      onChange={(e) => setPatientStatus(e.target.value)}
                      style={{ ...inputStyle(false), cursor: 'pointer' }}
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="DISCHARGED">Alta</option>
                      <option value="INACTIVE">Baja</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* Psicólogo asignado */}
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                  Psicólogo asignado
                </h3>
                <input
                  value={patient.psychologistName ?? '—'}
                  readOnly
                  style={inputStyle(true)}
                />
              </section>

              {/* Historial médico */}
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                  Información médica
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={labelStyle}>
                    Alergias
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      rows={2}
                      style={textareaStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Medicación actual
                    <textarea
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      rows={2}
                      style={textareaStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Antecedentes médicos
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      rows={3}
                      style={textareaStyle}
                    />
                  </label>
                </div>
              </section>

              {/* Save button */}
              <div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: saving ? '#9ca3af' : '#5a9270',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
};

function inputStyle(readOnly: boolean): React.CSSProperties {
  return {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    background: readOnly ? '#f9fafb' : 'white',
    color: readOnly ? '#6b7280' : '#111827',
    outline: 'none',
  };
}

const textareaStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 13,
  resize: 'vertical',
  outline: 'none',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicPatients({ onBack: _onBack }: Props) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<ClinicPatientSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<ClinicPatientDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load patient list
  const loadPatients = useCallback(async (q?: string) => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const data = await clinicService.getPatients(q);
      setPatients(data);
    } catch {
      setErrorList('No se pudieron cargar los pacientes.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      loadPatients(search || undefined);
    }, 350);
    return () => clearTimeout(t);
  }, [search, loadPatients]);

  const handleSelect = async (id: number) => {
    setView('detail');
    setLoadingDetail(true);
    setErrorDetail(null);
    setSelectedPatient(null);
    try {
      const data = await clinicService.getPatient(id);
      setSelectedPatient(data);
    } catch {
      setErrorDetail('No se pudo cargar el paciente.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedPatient(null);
  };

  const handleSave = async (id: number, req: UpdatePatientReq) => {
    setSaving(true);
    try {
      const updated = await clinicService.updatePatient(id, req);
      setSelectedPatient(updated);
      // Refresh list
      loadPatients(search || undefined);
    } catch {
      // swallow silently; could add toast here
    } finally {
      setSaving(false);
    }
  };

  // Inject keyframe animation for spinner
  if (typeof document !== 'undefined' && !document.getElementById('clinic-spin-style')) {
    const style = document.createElement('style');
    style.id = 'clinic-spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Pacientes</h2>
        {view === 'list' && (
          <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>{patients.length} registrados</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'list' ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ListView
              patients={patients}
              loading={loadingList}
              error={errorList}
              search={search}
              onSearchChange={setSearch}
              onSelect={handleSelect}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <DetailView
              patient={selectedPatient}
              loading={loadingDetail}
              error={errorDetail}
              onBack={handleBack}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
}
