import { useState, useEffect, useCallback, useRef } from 'react';
import { clinicService, fileService } from '../services/api';
import type { ClinicPatientSummary, ClinicPatientDetail, UpdatePatientReq } from '../services/api';
import { Search, Mail, Phone, CalendarX, Link as LinkIcon, Pencil, Upload, FolderOpen, FileText, Download, Trash2, MessageCircle, Send } from 'lucide-react';

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
  let classes = 'px-2.5 py-0.5 rounded-full text-xs font-semibold ';
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
  let classes = 'px-2.5 py-0.5 rounded-full text-xs font-semibold ';
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
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar paciente por nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm bg-white text-slate-900 outline-none focus:border-gantly-blue/50 transition-all placeholder:text-slate-400"
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
        <div className="text-center p-12 text-slate-500 flex flex-col items-center gap-3">
          <Search className="text-slate-500" size={32} />
          <span className="text-sm">No hay pacientes{search ? ' que coincidan con la búsqueda' : ' registrados aún'}.</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_1fr_120px_1fr_100px_100px] bg-slate-50/80 px-4 py-3 text-[11px] font-medium text-slate-500">
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
              className="grid grid-cols-[60px_1fr_1fr_120px_1fr_100px_100px] px-4 py-3 border-t border-slate-100 cursor-pointer text-sm items-center hover:bg-slate-50 transition-all duration-200"
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
    `px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm transition-all duration-200 ${
      tab === t
        ? 'font-semibold text-gantly-blue border-b-2 border-gantly-blue'
        : 'font-normal text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
    }`;

  const inputCls = "h-9 px-3 border border-slate-200 rounded-md text-sm bg-white text-slate-900 outline-none focus:border-gantly-blue/50 transition-all";
  const readOnlyCls = "h-9 px-3 border border-slate-200 rounded-md text-sm bg-slate-50 text-slate-500 outline-none";
  const labelCls = "text-[11px] font-medium text-slate-500 mb-1 block";
  const textareaCls = "w-full px-3 py-2 border border-slate-200 rounded-md text-sm resize-y outline-none focus:border-gantly-blue/50 transition-all placeholder:text-slate-400";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ---- Patient header ---- */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-gantly-blue text-sm p-0 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            &larr;
          </button>
          <div className="size-10 rounded-full bg-gantly-blue text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-slate-900 m-0 truncate">{patient.name}</h3>
              {patient.patientNumber != null && (
                <span className="text-[11px] text-slate-400 flex-shrink-0">N.º {patient.patientNumber}</span>
              )}
              <StatusBadge status={patient.status ?? 'active'} />
            </div>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail size={12} className="text-slate-400" />
                {patient.email}
              </span>
              {patient.phone && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone size={12} className="text-slate-400" />
                  {patient.phone}
                </span>
              )}
              {patient.psychologistName && (
                <span className="text-xs text-slate-500">
                  Psicólogo: <span className="font-medium text-slate-700">{patient.psychologistName}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tab bar ---- */}
      <div className="bg-white border-b border-slate-200 flex px-6">
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
          Ficha del paciente
        </button>
      </div>

      {/* ---- Tab content ---- */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* CITAS tab — table layout */}
        {tab === 'citas' && (
          <div>
            {(!patient.appointments || patient.appointments.length === 0) ? (
              <div className="text-slate-400 text-center py-16 flex flex-col items-center gap-2">
                <CalendarX size={28} />
                <span className="text-sm">No hay citas para este paciente.</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_120px_120px_40px] gap-3 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">Fecha y hora</span>
                  <span className="text-[11px] font-medium text-slate-500">Profesional / Servicio</span>
                  <span className="text-[11px] font-medium text-slate-500">Estado</span>
                  <span className="text-[11px] font-medium text-slate-500">Pago</span>
                  <span />
                </div>
                {/* Rows */}
                {[...patient.appointments]
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((appt) => (
                    <div key={appt.id} className="border-b border-slate-100 last:border-b-0">
                      <div className="grid grid-cols-[1fr_1fr_120px_120px_40px] gap-3 px-5 py-3 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <ApptDot status={appt.status} />
                          <span className="text-sm text-slate-900">{fmtDateTime(appt.startTime)}</span>
                        </div>
                        <div>
                          <span className="text-sm text-slate-700">{appt.psychologistName}</span>
                          {appt.service && <span className="text-xs text-slate-400 ml-1.5">· {appt.service}</span>}
                        </div>
                        <div>
                          <span className={`text-xs font-medium ${
                            ['confirmed', 'booked'].includes(appt.status?.toLowerCase()) ? 'text-emerald-600' :
                            appt.status?.toLowerCase() === 'cancelled' ? 'text-red-500' : 'text-slate-500'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentBadge status={appt.paymentStatus} />
                          {appt.paymentStatus === 'PENDING' && appt.price != null && Number(appt.price) > 0 && (
                            <button
                              onClick={() => handlePaymentLink(appt.id)}
                              disabled={paymentLinkLoading === appt.id}
                              title="Link de pago"
                              className={`p-1 rounded-md text-gantly-blue transition-colors ${
                                paymentLinkLoading === appt.id ? 'opacity-50 cursor-wait' : 'hover:bg-gantly-blue/10 cursor-pointer'
                              } bg-transparent border-none`}
                            >
                              <LinkIcon size={14} />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => { setEditingNoteId(editingNoteId === appt.id ? null : appt.id); setNoteText(appt.clinicNotes || ''); }}
                          title="Nota"
                          className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-gantly-blue p-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      {/* Inline note */}
                      {editingNoteId === appt.id && (
                        <div className="px-5 pb-3">
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            rows={2}
                            placeholder="Nota administrativa..."
                            className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 resize-none outline-none focus:border-gantly-blue/50 transition-all"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-1.5">
                            <button
                              onClick={async () => { await clinicService.updateAppointmentNotes(appt.id, noteText); setEditingNoteId(null); }}
                              className="text-xs bg-gantly-blue text-white border-none rounded-md px-3 py-1 cursor-pointer hover:bg-gantly-blue/90"
                            >
                              Guardar
                            </button>
                            <button onClick={() => setEditingNoteId(null)} className="text-xs bg-transparent border-none text-slate-500 cursor-pointer px-2 py-1 hover:text-slate-700">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                      {!editingNoteId && appt.clinicNotes && (
                        <div className="px-5 pb-2.5 -mt-1">
                          <span className="text-xs text-slate-400 italic">{appt.clinicNotes}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTOS tab */}
        {tab === 'documentos' && (
          <div>
            <div className="mb-4">
              <label
                className={`inline-flex items-center gap-1.5 rounded-md h-8 px-4 text-xs font-semibold text-white transition-all ${
                  uploadingDoc ? 'bg-slate-400 cursor-not-allowed' : 'bg-gantly-blue cursor-pointer hover:bg-gantly-blue/90'
                }`}
              >
                <Upload size={14} />
                {uploadingDoc ? 'Subiendo...' : 'Subir documento'}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleDocUpload} accept=".pdf,.doc,.docx,.jpg,.png" disabled={uploadingDoc} />
              </label>
            </div>

            {loadingDocs ? (
              <Spinner />
            ) : documents.length === 0 ? (
              <div className="text-slate-400 text-center py-16 flex flex-col items-center gap-2">
                <FolderOpen size={28} />
                <span className="text-sm">Sin documentos para este paciente.</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                {documents.map((doc, i) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <FileText className="text-slate-400 flex-shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm text-slate-900 truncate">{doc.originalName}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">{new Date(doc.uploadedAt).toLocaleDateString('es-ES')}</span>
                    <button onClick={() => fileService.downloadClinicDoc(doc.fileName)} className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-gantly-blue p-1 rounded-md hover:bg-slate-100 transition-colors">
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDocDelete(doc.id)} className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT tab */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full min-h-[400px] max-w-3xl">
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-4">
              {chatMessages.length === 0 ? (
                <div className="text-slate-400 text-center py-16 flex flex-col items-center gap-2">
                  <MessageCircle size={28} />
                  <span className="text-sm">Sin mensajes. Inicia la conversación con el paciente.</span>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isClinic = msg.sender === 'CLINIC';
                  return (
                    <div key={msg.id} className={`flex ${isClinic ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[60%] px-3.5 py-2 text-[13px] leading-relaxed ${
                        isClinic
                          ? 'bg-gantly-blue text-white rounded-2xl rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm'
                      }`}>
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
            <div className="border-t border-slate-200 pt-3 flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Escribe un mensaje..."
                rows={2}
                className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-[13px] resize-none outline-none focus:border-gantly-blue/50 transition-all placeholder:text-slate-400"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || sendingChat}
                className={`flex items-center gap-1 rounded-md h-9 px-4 text-xs font-semibold text-white flex-shrink-0 transition-all border-none ${
                  !chatInput.trim() || sendingChat ? 'bg-slate-400 cursor-not-allowed' : 'bg-gantly-blue cursor-pointer hover:bg-gantly-blue/90'
                }`}
              >
                <Send size={14} />
                Enviar
              </button>
            </div>
          </div>
        )}

        {/* FICHA DEL PACIENTE tab — full-width two-column grid */}
        {tab === 'datos' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Card 1: Datos generales */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Datos generales</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className={labelCls}>Nombre</label>
                      <input value={patient.name} readOnly className={`w-full ${readOnlyCls}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Sin teléfono" className={`w-full ${inputCls}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Fecha de nacimiento</label>
                      <input value={fmtDate(patient.birthDate)} readOnly className={`w-full ${readOnlyCls}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Género</label>
                      <input value={patient.gender ?? '—'} readOnly className={`w-full ${readOnlyCls}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Tipo de paciente</label>
                      <select value={patientType} onChange={(e) => setPatientType(e.target.value)} className={`w-full ${inputCls} cursor-pointer`}>
                        <option value="PRIVATE">Privado</option>
                        <option value="INSURANCE">De aseguradora</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Psicólogo asignado</label>
                      <input value={patient.psychologistName ?? '—'} readOnly className={`w-full ${readOnlyCls}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Administrativo */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Administrativo</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelCls}>Estado del paciente</label>
                    <select value={patientStatus} onChange={(e) => setPatientStatus(e.target.value)} className={`w-full ${inputCls} cursor-pointer`}>
                      <option value="ACTIVE">Activo</option>
                      <option value="DISCHARGED">Alta</option>
                      <option value="INACTIVE">Baja</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={consentSigned} onChange={(e) => setConsentSigned(e.target.checked)} className="w-4 h-4 accent-gantly-blue rounded" />
                    Consentimiento RGPD firmado
                  </label>
                </div>
              </div>

              {/* Card 3: Notas clínicas */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Notas clínicas</h3>
                </div>
                <div className="p-5">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añadir notas sobre este paciente..."
                    rows={5}
                    className={textareaCls}
                  />
                </div>
              </div>

              {/* Card 4: Información médica */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Información médica</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className={labelCls}>Alergias</label>
                    <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} className={textareaCls} placeholder="Sin alergias conocidas" />
                  </div>
                  <div>
                    <label className={labelCls}>Medicación actual</label>
                    <textarea value={medication} onChange={(e) => setMedication(e.target.value)} rows={2} className={textareaCls} placeholder="Sin medicación" />
                  </div>
                  <div>
                    <label className={labelCls}>Antecedentes médicos</label>
                    <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={2} className={textareaCls} placeholder="Sin antecedentes" />
                  </div>
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`rounded-md h-9 px-5 font-semibold text-sm text-white transition-all border-none ${
                  saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-gantly-blue cursor-pointer hover:bg-gantly-blue/90'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
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
    <div className="flex-1 flex flex-col min-h-0">
      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
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
        <div className="flex-1 flex flex-col min-h-0">
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
  );
}
