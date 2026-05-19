import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Phone, Globe, User, Calendar,
  FileText, MessageCircle, Download, Clock, ChevronRight,
} from 'lucide-react';
import { userClinicService, fileService } from '../services/api';
import { toast } from './ui/Toast';
import UserClinicChatTab from './UserClinicChatTab';

interface UserClinicPortalTabProps {
  hasClinic: boolean;
}

type SubTab = 'info' | 'citas' | 'documentos' | 'chat';

interface ClinicInfo {
  id: number;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  assignedPsychologistName?: string;
  assignedPsychologistAvatarUrl?: string;
}

interface ClinicAppointment {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  service?: string;
  psychologistName?: string;
  price?: number;
  paymentStatus?: string;
  modality?: string;
}

interface ClinicDocument {
  id: number;
  originalName: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  BOOKED: { label: 'Reservada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONFIRMED: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600 border-red-200' },
  FREE: { label: 'Libre', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  PENDING: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PAYMENT_LABELS: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Pagada', cls: 'text-emerald-600' },
  PENDING: { label: 'Pendiente', cls: 'text-amber-600' },
  EXPIRED: { label: 'Expirada', cls: 'text-red-500' },
  FAILED: { label: 'Fallida', cls: 'text-red-500' },
};

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UserClinicPortalTab({ hasClinic }: UserClinicPortalTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('info');
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [documents, setDocuments] = useState<ClinicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!hasClinic) return;
    setLoading(true);
    userClinicService.getMyClinic()
      .then(setClinic)
      .catch(() => toast.error('No se pudo cargar la información de la clínica'))
      .finally(() => setLoading(false));
  }, [hasClinic]);

  useEffect(() => {
    if (!hasClinic || subTab !== 'citas') return;
    setLoadingAppts(true);
    userClinicService.getMyClinicAppointments()
      .then(setAppointments)
      .catch(() => toast.error('No se pudieron cargar las citas'))
      .finally(() => setLoadingAppts(false));
  }, [hasClinic, subTab]);

  useEffect(() => {
    if (!hasClinic || subTab !== 'documentos') return;
    setLoadingDocs(true);
    userClinicService.getMyClinicDocuments()
      .then(setDocuments)
      .catch(() => toast.error('No se pudieron cargar los documentos'))
      .finally(() => setLoadingDocs(false));
  }, [hasClinic, subTab]);

  const subTabs: { id: SubTab; label: string; icon: typeof Building2 }[] = [
    { id: 'info', label: 'Informacion', icon: Building2 },
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clinic header card */}
      <div className="bg-white rounded-2xl border border-slate-200/80">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          {clinic?.logoUrl ? (
            <img src={clinic.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 size={20} className="text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-800 truncate">
              {clinic?.name || 'Mi Clinica'}
            </h2>
            {clinic?.address && (
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <MapPin size={11} className="flex-shrink-0" />
                {clinic.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {clinic?.phone && (
              <a href={`tel:${clinic.phone}`} className="text-xs text-slate-500 hover:text-gantly-blue flex items-center gap-1 transition-colors">
                <Phone size={12} /> {clinic.phone}
              </a>
            )}
            {clinic?.website && (
              <a href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-gantly-blue flex items-center gap-1 transition-colors">
                <Globe size={12} /> Web
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b border-slate-200/80" role="tablist">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={subTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer bg-transparent ${
              subTab === id
                ? 'border-gantly-blue text-gantly-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 'info' && (
        <div id="panel-info" role="tabpanel" aria-labelledby="tab-info" className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Datos de la clinica</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Nombre" value={clinic?.name} />
              <InfoField label="Email" value={clinic?.email} />
              <InfoField label="Teléfono" value={clinic?.phone} />
              <InfoField label="Direccion" value={clinic?.address} />
              <InfoField label="Web" value={clinic?.website} />
            </div>

            {clinic?.assignedPsychologistName && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2">Profesional asignado</p>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-gantly-blue/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {clinic.assignedPsychologistAvatarUrl ? (
                      <img src={clinic.assignedPsychologistAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-gantly-blue" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{clinic.assignedPsychologistName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'citas' && (
        <div id="panel-citas" role="tabpanel" aria-labelledby="tab-citas" className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Mis citas en la clinica</h3>
          </div>
          {loadingAppts ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 px-5">
              <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No tienes citas registradas en la clinica.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 text-[11px] text-slate-500 font-semibold">Fecha</th>
                    <th className="text-left px-4 py-2 text-[11px] text-slate-500 font-semibold">Hora</th>
                    <th className="text-left px-4 py-2 text-[11px] text-slate-500 font-semibold">Profesional</th>
                    <th className="text-left px-4 py-2 text-[11px] text-slate-500 font-semibold">Servicio</th>
                    <th className="text-left px-4 py-2 text-[11px] text-slate-500 font-semibold">Estado</th>
                    <th className="text-right px-4 py-2 text-[11px] text-slate-500 font-semibold">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => {
                    const start = new Date(appt.startTime);
                    const end = new Date(appt.endTime);
                    const statusCfg = STATUS_LABELS[appt.status] || STATUS_LABELS.PENDING;
                    const paymentCfg = PAYMENT_LABELS[appt.paymentStatus || ''];
                    return (
                      <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{appt.psychologistName || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{appt.service || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                          {paymentCfg && (
                            <span className={`ml-1.5 text-[10px] font-medium ${paymentCfg.cls}`}>
                              {paymentCfg.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700 font-medium">
                          {appt.price != null ? `${appt.price.toFixed(2)} \u20AC` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'documentos' && (
        <div id="panel-documentos" role="tabpanel" aria-labelledby="tab-documentos" className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Documentos compartidos</h3>
          </div>
          {loadingDocs ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 px-5">
              <FileText size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hay documentos compartidos.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.originalName}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {doc.fileSize != null && ` \u00B7 ${formatFileSize(doc.fileSize)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      fileService.downloadClinicDoc(doc.fileName).catch(() => toast.error('Error al descargar'));
                    }}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-gantly-blue transition-colors cursor-pointer bg-transparent border-none"
                    title="Descargar"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'chat' && (
        <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
          <UserClinicChatTab hasClinic={hasClinic} />
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700">{value || '-'}</p>
    </div>
  );
}
