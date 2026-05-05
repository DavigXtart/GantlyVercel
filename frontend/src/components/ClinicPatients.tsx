import { useState, useEffect, useCallback, useRef } from 'react';
import { clinicService, fileService } from '../services/api';
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
    <div className="flex justify-center py-10">
      <div className="w-9 h-9 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const lc = status?.toLowerCase() ?? '';
  let classes = 'px-2.5 py-0.5 rounded-xl text-xs font-semibold ';
  let label = status;
  if (lc === 'active' || lc === 'activo') {
    classes += 'bg-gantly-emerald-50 text-gantly-emerald-700';
    label = 'Activo';
  } else if (lc === 'discharged' || lc === 'alta') {
    classes += 'bg-slate-100 text-slate-500';
    label = 'Alta';
  } else {
    classes += 'bg-slate-100 text-slate-500';
  }
  return <span className={classes}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return null;
  const lc = status.toLowerCase();
  let classes = 'px-2.5 py-0.5 rounded-xl text-xs font-semibold ';
  let label = status;
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') {
    classes += 'bg-gantly-emerald-50 text-gantly-emerald-700';
    label = 'Pagada';
  } else if (lc === 'pending' || lc === 'pendiente') {
    classes += 'bg-gantly-gold-50 text-gantly-gold-700';
    label = 'Pendiente';
  } else if (lc === 'cancelled' || lc === 'cancelado' || lc === 'cancelada') {
    classes += 'bg-red-50 text-red-700';
    label = 'Cancelada';
  } else {
    classes += 'bg-slate-100 text-slate-600';
  }
  return <span className={classes}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Appointment status dot
// ---------------------------------------------------------------------------
function ApptDot({ status }: { status: string }) {
  const lc = status?.toLowerCase() ?? '';
  let colorClass = 'bg-slate-400';
  if (lc === 'confirmed' || lc === 'booked' || lc === 'realizada') colorClass = 'bg-gantly-emerald';
  else if (lc === 'cancelled' || lc === 'cancelada') colorClass = 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`} />;
}

// ---------------------------------------------------------------------------
// Expandable section
// ---------------------------------------------------------------------------
function ExpandableSection({ label, value }: { label: string; value?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-transparent border-none text-left py-2.5 cursor-pointer flex justify-between items-center text-[13px] text-slate-700 font-medium hover:bg-slate-50/50 rounded-lg px-2 transition-colors duration-200"
      >
        {label}
        <span className="text-[11px] text-slate-400">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div className="pb-2.5 px-2 text-[13px] text-slate-500 leading-relaxed">
          {value || <span className="italic">Sin información</span>}
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
    <div className="p-6">
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar paciente por nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3.5 h-12 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200 bg-white"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : patients.length === 0 ? (
        <div className="text-center p-12 text-slate-400 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
          <span className="text-sm">No hay pacientes{search ? ' que coincidan con la búsqueda' : ' registrados aún'}.</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_1fr_120px_1fr_100px_100px] bg-slate-50/80 px-4 py-3 text-xs font-heading font-bold text-slate-400 uppercase tracking-widest">
            <span>N.º</span>
            <span>Nombre</span>
            <span>Email</span>
            <span>Teléfono</span>
            <span>Psicólogo</span>
            <span className="text-center">Citas</span>
            <span>Estado</span>
          </div>

          {/* Rows */}
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="grid grid-cols-[60px_1fr_1fr_120px_1fr_100px_100px] px-4 py-3 border-t border-slate-100 cursor-pointer text-sm items-center hover:bg-gantly-blue/[0.02] hover:border-l-4 hover:border-l-gantly-blue transition-all duration-200"
            >
              <span className="text-slate-500 text-xs">
                {p.patientNumber != null ? `#${p.patientNumber}` : '—'}
              </span>
              <span className="font-heading font-semibold text-gantly-text">{p.name}</span>
              <span className="text-slate-500 text-[13px]">{p.email}</span>
              <span className="text-slate-500 text-[13px]">{p.phone || '—'}</span>
              <span className="text-slate-700 text-[13px]">{p.assignedPsychologistName || '—'}</span>
              <span className="text-center text-slate-700 text-[13px]">{p.totalAppointments}</span>
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
type DetailTab = 'citas' | 'documentos' | 'datos' | 'chat';

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

  // Chat (Feature F)
  type ChatMsg = { id: number; sender: string; content: string; createdAt: string };
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Payment link (Feature E)
  const [paymentLinkLoading, setPaymentLinkLoading] = useState<number | null>(null);

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
      // Load initial chat messages
      clinicService.getChatMessages(patient.id).then(setChatMessages).catch(() => {});
    }
  }, [patient, loadDocuments]);

  // Poll chat every 5s when on chat tab
  useEffect(() => {
    if (tab !== 'chat' || !patient) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await clinicService.getChatMessages(patient.id);
        setChatMessages(msgs);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [tab, patient]);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    if (tab === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, tab]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || !patient || sendingChat) return;
    const text = chatInput.trim();
    setChatInput('');
    setSendingChat(true);
    try {
      const msg = await clinicService.sendChatMessage(patient.id, text);
      setChatMessages(prev => [...prev, msg]);
    } catch { /* ignore */ } finally {
      setSendingChat(false);
    }
  };

  const handlePaymentLink = async (appointmentId: number) => {
    setPaymentLinkLoading(appointmentId);
    try {
      const result = await clinicService.sendPaymentLink(appointmentId);
      window.open(result.url, '_blank');
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al generar el link de pago');
    } finally {
      setPaymentLinkLoading(null);
    }
  };

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
      <div className="p-6 bg-red-50 text-red-700 rounded-lg m-6">
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

  const tabBtnClass = (t: DetailTab) =>
    `px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm transition-all duration-200 font-heading ${
      tab === t
        ? 'font-bold text-gantly-blue border-b-2 border-gantly-blue'
        : 'font-normal text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
    }`;

  return (
    <div className="flex h-full min-h-0">
      {/* ---- Sidebar ---- */}
      <aside className="w-[300px] min-w-[300px] border-r border-slate-100 shadow-sm p-5 overflow-y-auto bg-white flex flex-col gap-4">
        {/* Back button */}
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-gantly-blue hover:text-gantly-blue/80 font-heading font-semibold text-sm text-left p-0 flex items-center gap-1 transition-colors duration-200"
        >
          &larr; Pacientes
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-gantly-blue to-gantly-cyan text-white flex items-center justify-center text-[26px] font-bold tracking-wider">
            {initials(patient.name)}
          </div>
          <div className="text-center">
            <div className="font-heading font-bold text-lg text-gantly-text">{patient.name}</div>
            {patient.patientNumber != null && (
              <div className="text-xs text-slate-500 mt-0.5">N.º {patient.patientNumber}</div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[13px] text-slate-700">
            <span className="material-symbols-outlined text-base text-slate-400">mail</span>
            <span>{patient.email}</span>
          </div>
          {patient.phone && (
            <div className="flex items-center gap-2 text-[13px] text-slate-700">
              <span className="material-symbols-outlined text-base text-slate-400">phone</span>
              <span>{patient.phone}</span>
            </div>
          )}
        </div>

        {/* Notes (sidebar quick notes) */}
        <div>
          <div className="text-xs font-heading font-semibold text-slate-500 uppercase mb-1.5">
            Notas
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añadir notas sobre este paciente..."
            rows={4}
            className="w-full border-2 border-slate-200 rounded-xl px-2.5 py-2 text-[13px] resize-y outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
          />
        </div>

        {/* Medical info expandable */}
        <div>
          <div className="text-xs font-heading font-semibold text-slate-500 uppercase mb-1">
            Otra información médica
          </div>
          <ExpandableSection label="Alergias" value={patient.allergies} />
          <ExpandableSection label="Medicación" value={patient.medication} />
          <ExpandableSection label="Antecedentes médicos" value={patient.medicalHistory} />
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab bar */}
        <div className="border-b-2 border-slate-100 flex pl-6">
          <button className={tabBtnClass('citas')} onClick={() => setTab('citas')}>
            Citas ({patient.appointments?.length ?? 0})
          </button>
          <button className={tabBtnClass('documentos')} onClick={() => setTab('documentos')}>
            Documentos
          </button>
          <button className={tabBtnClass('chat')} onClick={() => setTab('chat')}>
            Chat
          </button>
          <button className={tabBtnClass('datos')} onClick={() => setTab('datos')}>
            Datos del paciente
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* CITAS tab */}
          {tab === 'citas' && (
            <div className="flex flex-col gap-2.5">
              {(!patient.appointments || patient.appointments.length === 0) ? (
                <div className="text-slate-400 text-center p-10 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                  <span className="text-sm">No hay citas para este paciente.</span>
                </div>
              ) : (
                [...patient.appointments]
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white rounded-2xl border-2 border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 px-4 py-3.5"
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <ApptDot status={appt.status} />
                          <div>
                            <div className="font-medium text-sm text-slate-900">
                              {fmtDateTime(appt.startTime)}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {appt.psychologistName}
                              {appt.service ? ` · ${appt.service}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <PaymentBadge status={appt.paymentStatus} />
                          {appt.paymentStatus === 'PENDING' && appt.price != null && Number(appt.price) > 0 && (
                            <button
                              onClick={() => handlePaymentLink(appt.id)}
                              disabled={paymentLinkLoading === appt.id}
                              title="Enviar link de pago al paciente"
                              className={`px-3 py-1.5 rounded-xl border-2 border-gantly-blue text-xs text-gantly-blue font-medium flex items-center gap-1 transition-all duration-200 ${
                                paymentLinkLoading === appt.id ? 'bg-gantly-blue-50 cursor-wait' : 'bg-white hover:bg-gantly-blue hover:text-white cursor-pointer'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">link</span>
                              {paymentLinkLoading === appt.id ? 'Generando...' : 'Link de pago'}
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Session note inline editor */}
                      {editingNoteId === appt.id ? (
                        <div className="mt-2">
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            rows={2}
                            placeholder="Nota administrativa..."
                            className="w-full border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 resize-none outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={async () => {
                                await clinicService.updateAppointmentNotes(appt.id, noteText);
                                setEditingNoteId(null);
                              }}
                              className="text-xs bg-gantly-blue text-white border-none rounded-md px-2.5 py-1 cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-xs bg-transparent border-none text-slate-500 cursor-pointer px-1.5 py-1"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-start gap-1">
                          {appt.clinicNotes && (
                            <span className="text-xs text-slate-500 flex-1">{appt.clinicNotes}</span>
                          )}
                          <button
                            onClick={() => { setEditingNoteId(appt.id); setNoteText(appt.clinicNotes || ''); }}
                            title="Editar nota"
                            className="bg-transparent border-none cursor-pointer text-slate-300 hover:text-gantly-blue p-0.5 ml-auto flex-shrink-0 leading-none transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">edit_note</span>
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
            <div className="flex flex-col gap-3">
              {/* Upload button */}
              <div>
                <label
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-heading font-semibold text-white shadow-md transition-all duration-300 ${
                    uploadingDoc ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-gantly-blue to-gantly-cyan cursor-pointer hover:shadow-lg hover:shadow-gantly-blue/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  {uploadingDoc ? 'Subiendo...' : 'Subir documento'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleDocUpload}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    disabled={uploadingDoc}
                  />
                </label>
              </div>

              {loadingDocs ? (
                <Spinner />
              ) : documents.length === 0 ? (
                <div className="text-center p-12 text-slate-400 text-sm flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-slate-300">folder_open</span>
                  <span>Sin documentos para este paciente.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 bg-white"
                    >
                      <span className="material-symbols-outlined text-xl text-slate-400">description</span>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-[13px] text-slate-900 truncate">
                          {doc.originalName}
                        </p>
                        <p className="m-0 text-[11px] text-slate-400 mt-0.5">
                          {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <button
                        onClick={() => fileService.downloadClinicDoc(doc.fileName)}
                        className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-gantly-blue leading-none p-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                      <button
                        onClick={() => handleDocDelete(doc.id)}
                        className="bg-transparent border-none cursor-pointer text-slate-300 hover:text-red-500 leading-none p-0.5 transition-colors"
                        title="Eliminar documento"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHAT tab (Feature F) */}
          {tab === 'chat' && (
            <div className="flex flex-col h-full min-h-[400px]">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center p-12 text-slate-400 text-sm flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-slate-300">chat_bubble_outline</span>
                    <span>Sin mensajes. Inicia la conversación con el paciente.</span>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isClinic = msg.sender === 'CLINIC';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isClinic ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-3.5 py-2 text-[13px] leading-relaxed ${
                            isClinic
                              ? 'bg-gradient-to-r from-gantly-blue to-gantly-blue/90 text-white rounded-2xl rounded-br-sm'
                              : 'bg-slate-100 text-gantly-text rounded-2xl rounded-bl-sm'
                          }`}
                        >
                          <p className="m-0">{msg.content}</p>
                          <p className={`m-0 mt-1 text-[10px] text-right ${isClinic ? 'opacity-70' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>
              {/* Input area */}
              <div className="border-t border-slate-200 pt-3 flex gap-2 items-end">
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  placeholder="Escribe un mensaje..."
                  rows={2}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-[13px] resize-none outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || sendingChat}
                  className={`flex items-center gap-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white flex-shrink-0 transition-all duration-200 ${
                    !chatInput.trim() || sendingChat
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gantly-blue to-gantly-cyan cursor-pointer hover:shadow-md hover:shadow-gantly-blue/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* DATOS DEL PACIENTE tab */}
          {tab === 'datos' && (
            <div className="max-w-[560px] flex flex-col gap-6">
              {/* Datos generales */}
              <section>
                <h3 className="text-sm font-heading font-bold text-gantly-text mb-3.5">
                  Datos generales
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Nombre
                    <input value={patient.name} readOnly className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-500 outline-none" />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Teléfono
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Sin teléfono"
                      className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-white text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Fecha de nacimiento
                    <input value={fmtDate(patient.birthDate)} readOnly className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-500 outline-none" />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Género
                    <input value={patient.gender ?? '—'} readOnly className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-500 outline-none" />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Tipo
                    <select
                      value={patientType}
                      onChange={(e) => setPatientType(e.target.value)}
                      className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-white text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 cursor-pointer transition-all duration-200"
                    >
                      <option value="PRIVATE">Privado</option>
                      <option value="INSURANCE">De aseguradora</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* Datos administrativos */}
              <section>
                <h3 className="text-sm font-heading font-bold text-gantly-text mb-3.5">
                  Datos administrativos
                </h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentSigned}
                      onChange={(e) => setConsentSigned(e.target.checked)}
                      className="w-5 h-5 accent-gantly-blue"
                    />
                    Consentimiento RGPD firmado
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Estado del paciente
                    <select
                      value={patientStatus}
                      onChange={(e) => setPatientStatus(e.target.value)}
                      className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-white text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 cursor-pointer transition-all duration-200"
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
                <h3 className="text-sm font-heading font-bold text-gantly-text mb-3.5">
                  Psicólogo asignado
                </h3>
                <input
                  value={patient.psychologistName ?? '—'}
                  readOnly
                  className="px-2.5 h-12 border-2 border-slate-200 rounded-xl text-[13px] bg-slate-50 text-slate-500 outline-none w-full"
                />
              </section>

              {/* Historial médico */}
              <section>
                <h3 className="text-sm font-heading font-bold text-gantly-text mb-3.5">
                  Información médica
                </h3>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Alergias
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      rows={2}
                      className="px-2.5 py-2 border-2 border-slate-200 rounded-xl text-[13px] resize-y outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Medicación actual
                    <textarea
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      rows={2}
                      className="px-2.5 py-2 border-2 border-slate-200 rounded-xl text-[13px] resize-y outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
                    Antecedentes médicos
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      rows={3}
                      className="px-2.5 py-2 border-2 border-slate-200 rounded-xl text-[13px] resize-y outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                    />
                  </label>
                </div>
              </section>

              {/* Save button */}
              <div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-xl px-6 h-12 font-heading font-bold text-sm text-white transition-all duration-300 ${
                    saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-gantly-blue to-gantly-cyan cursor-pointer shadow-md hover:shadow-lg hover:shadow-gantly-blue/25'
                  }`}
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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <h2 className="m-0 font-heading font-bold text-gantly-text text-xl">Pacientes</h2>
        {view === 'list' && (
          <span className="text-sm text-slate-400 font-body ml-1">{patients.length} registrados</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'list' ? (
          <div className="flex-1 overflow-y-auto">
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
          <div className="flex-1 overflow-hidden flex">
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
