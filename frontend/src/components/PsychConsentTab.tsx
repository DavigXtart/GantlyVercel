import { useState, useEffect, useMemo } from 'react';
import { FileCheck, Send, Eye, Plus, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { consentService } from '../services/api';
import { toast } from './ui/Toast';
import EmptyState from './ui/EmptyState';
import { SkeletonList } from './ui/SkeletonLoader';
import Modal from './ui/Modal';
import type { ConsentRequest, ConsentDocumentType, FormField } from '../services/types/consent';

interface PsychConsentTabProps {
  patients: Array<{ id: number; name: string }>;
}

function parseFormSchema(schema?: string): FormField[] {
  if (!schema) return [];
  try {
    return JSON.parse(schema) as FormField[];
  } catch {
    return [];
  }
}

function parseFormData(data?: string): Record<string, string> {
  if (!data) return {};
  try {
    return JSON.parse(data) as Record<string, string>;
  } catch {
    return {};
  }
}

export default function PsychConsentTab({ patients }: PsychConsentTabProps) {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [documentTypes, setDocumentTypes] = useState<ConsentDocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<ConsentRequest | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');
  const [place, setPlace] = useState('');

  const viewFormFields = useMemo(() => parseFormSchema(viewingRequest?.formSchema), [viewingRequest?.formSchema]);
  const viewFormData = useMemo(() => parseFormData(viewingRequest?.formData), [viewingRequest?.formData]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await consentService.getSentRequests();
      setRequests(data || []);
    } catch {
      toast.error('Error al cargar los consentimientos');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const data = await consentService.getDocumentTypes();
      setDocumentTypes((data || []).filter((d: ConsentDocumentType) => d.active));
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadRequests();
    loadDocumentTypes();
  }, []);

  const handleSend = async () => {
    if (!selectedPatientId || !selectedDocTypeId) {
      toast.error('Selecciona paciente y tipo de documento');
      return;
    }
    try {
      setSending(true);
      await consentService.createRequest({
        userId: Number(selectedPatientId),
        documentTypeId: Number(selectedDocTypeId),
        place: place.trim() || undefined,
      });
      toast.success('Consentimiento enviado correctamente');
      setShowSendModal(false);
      setSelectedPatientId('');
      setSelectedDocTypeId('');
      setPlace('');
      await loadRequests();
    } catch (err: any) {
      toast.error('Error al enviar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleView = async (request: ConsentRequest) => {
    try {
      const full = await consentService.getRequest(request.id);
      setViewingRequest(full);
      setShowViewModal(true);
    } catch {
      toast.error('Error al cargar el consentimiento');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador', icon: <FileText size={12} /> },
      SENT: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Enviado', icon: <Clock size={12} /> },
      SIGNED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Firmado', icon: <CheckCircle size={12} /> },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rechazado', icon: <XCircle size={12} /> },
    };
    const s = map[status] || map.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-1 font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const inputCls = 'w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-gantly-blue" />
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Consentimientos</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer hover:bg-gantly-blue/90 transition-colors duration-200"
          >
            <Plus size={14} />
            Nuevo consentimiento
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <SkeletonList rows={4} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="w-12 h-12 text-slate-400" />}
              title="Sin consentimientos"
              description="Envia un consentimiento a un paciente para empezar."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Paciente</th>
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Tipo documento</th>
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Estado</th>
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Fecha envio</th>
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Fecha firma</th>
                    <th className="text-left py-2 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{r.userName || `Paciente #${r.userId}`}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.documentTypeTitle || r.documentTypeCode || '-'}</td>
                      <td className="py-2.5 px-3">{statusBadge(r.status)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(r.sentAt || r.createdAt)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(r.signedAt)}</td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleView(r)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                        >
                          <Eye size={13} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Send consent modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Enviar consentimiento"
        maxWidth="max-w-[480px]"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Paciente</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Seleccionar paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Tipo de documento</label>
            <select
              value={selectedDocTypeId}
              onChange={(e) => setSelectedDocTypeId(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Seleccionar tipo</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Lugar (opcional)</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ej: Madrid"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSendModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !selectedPatientId || !selectedDocTypeId}
              className="flex items-center gap-1.5 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View content modal */}
      <Modal
        open={showViewModal && !!viewingRequest}
        onClose={() => { setShowViewModal(false); setViewingRequest(null); }}
        title={viewingRequest?.documentTypeTitle || 'Consentimiento'}
        maxWidth="max-w-[640px]"
      >
        {viewingRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 -mt-2 mb-3">
              {statusBadge(viewingRequest.status)}
            </div>

            {/* Rendered content */}
            <div className="max-h-[50vh] overflow-y-auto">
              {viewingRequest.renderedContent ? (
                <div
                  className="prose prose-sm max-w-none text-slate-700 border border-slate-100 rounded-md p-4 bg-slate-50/50"
                  dangerouslySetInnerHTML={{ __html: viewingRequest.renderedContent }}
                />
              ) : (
                <p className="text-sm text-slate-500">Sin contenido disponible</p>
              )}
            </div>

            {/* Form data display (if the consent has form data) */}
            {viewingRequest.status === 'SIGNED' && viewFormFields.length > 0 && Object.keys(viewFormData).length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-3">Datos del formulario</p>
                <div className="space-y-2">
                  {viewFormFields.map((field) => {
                    const value = viewFormData[field.key];
                    if (!value && value !== 'false') return null;
                    if (field.type === 'checkbox') {
                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <CheckCircle size={14} className={value === 'true' ? 'text-emerald-500' : 'text-slate-400'} />
                          <span className="text-sm text-slate-700">{field.label}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={field.key} className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2">
                        <span className="text-xs text-slate-500 font-medium min-w-[160px] shrink-0">{field.label}:</span>
                        <span className="text-sm text-slate-800">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signature if signed */}
            {viewingRequest.status === 'SIGNED' && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Firma</p>
                {viewingRequest.signerName && (
                  <p className="text-sm text-slate-700">Firmado por: <span className="font-medium">{viewingRequest.signerName}</span></p>
                )}
                {viewingRequest.signedAt && (
                  <p className="text-sm text-slate-500">Fecha: {formatDate(viewingRequest.signedAt)}</p>
                )}
                {viewingRequest.signatureData && (
                  <div className="border border-slate-200 rounded-md p-2 bg-white inline-block">
                    <img
                      src={viewingRequest.signatureData}
                      alt="Firma"
                      className="max-h-[120px] w-auto"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowViewModal(false); setViewingRequest(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
