import { useState, useEffect, useRef, useMemo } from 'react';
import { FileCheck, Pen, Eye, Clock, CheckCircle, XCircle, FileText, Check } from 'lucide-react';
import { consentService } from '../services/api';
import { toast } from './ui/Toast';
import EmptyState from './ui/EmptyState';
import { SkeletonList } from './ui/SkeletonLoader';
import SignaturePad, { type SignaturePadHandle } from './ui/SignaturePad';
import Modal from './ui/Modal';
import type { ConsentRequest, FormField } from '../services/types/consent';

interface UserConsentTabProps {
  userName?: string;
}

function parseFormSchema(schema?: string): FormField[] {
  if (!schema) return [];
  try {
    return JSON.parse(schema) as FormField[];
  } catch {
    return [];
  }
}

function shouldShowField(field: FormField, formValues: Record<string, string>): boolean {
  if (!field.showIf) return true;
  const [key, value] = field.showIf.split('=');
  return formValues[key] === value;
}

export default function UserConsentTab({ userName }: UserConsentTabProps) {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Signing state
  const [accepted, setAccepted] = useState(false);
  const [signerName, setSignerName] = useState(userName || '');
  const [signing, setSigning] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const signaturePadRef = useRef<SignaturePadHandle>(null);

  const formFields = useMemo(() => parseFormSchema(selectedRequest?.formSchema), [selectedRequest?.formSchema]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await consentService.getMyRequests();
      setRequests(data || []);
    } catch {
      toast.error('Error al cargar los consentimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (userName && !signerName) {
      setSignerName(userName);
    }
  }, [userName]);

  const openSigning = async (request: ConsentRequest) => {
    try {
      const full = await consentService.getRequest(request.id);
      setSelectedRequest(full);
      setAccepted(false);
      setSignerName(userName || '');
      setFormValues({});
      setShowSigningModal(true);
    } catch {
      toast.error('Error al cargar el consentimiento');
    }
  };

  const openView = async (request: ConsentRequest) => {
    try {
      const full = await consentService.getRequest(request.id);
      setSelectedRequest(full);
      setShowViewModal(true);
    } catch {
      toast.error('Error al cargar el consentimiento');
    }
  };

  const validateForm = (): boolean => {
    for (const field of formFields) {
      if (!shouldShowField(field, formValues)) continue;
      if (!field.required) continue;
      const val = formValues[field.key];
      if (field.type === 'checkbox') {
        if (val !== 'true') return false;
      } else {
        if (!val || !val.trim()) return false;
      }
    }
    return true;
  };

  const handleSign = async () => {
    if (!selectedRequest || !accepted || !signerName.trim()) return;
    if (formFields.length > 0 && !validateForm()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    const signatureData = signaturePadRef.current?.getSignatureData() || undefined;
    const formData = formFields.length > 0 ? JSON.stringify(formValues) : undefined;

    try {
      setSigning(true);
      await consentService.signRequest(selectedRequest.id, {
        signerName: signerName.trim(),
        signatureData,
        formData,
      });
      toast.success('Consentimiento firmado correctamente');
      setShowSigningModal(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (err: any) {
      toast.error('Error al firmar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSigning(false);
    }
  };

  const closeSigningModal = () => {
    setShowSigningModal(false);
    setSelectedRequest(null);
    setAccepted(false);
    setFormValues({});
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedRequest(null);
  };

  const setFieldValue = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador', icon: <FileText size={12} /> },
      SENT: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pendiente', icon: <Clock size={12} /> },
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

  const pendingRequests = requests.filter((r) => r.status === 'SENT');
  const signedRequests = requests.filter((r) => r.status === 'SIGNED');
  const otherRequests = requests.filter((r) => r.status !== 'SENT' && r.status !== 'SIGNED');

  const inputCls = 'w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200';

  const renderFormField = (field: FormField) => {
    if (!shouldShowField(field, formValues)) return null;
    const value = formValues[field.key] || '';
    const requiredMark = field.required ? <span className="text-red-500 ml-0.5">*</span> : null;

    return (
      <div key={field.key}>
        {field.type === 'checkbox' ? (
          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => setFieldValue(field.key, e.target.checked ? 'true' : 'false')}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gantly-blue focus:ring-gantly-blue cursor-pointer"
            />
            <span className="text-sm text-slate-700">{field.label}{requiredMark}</span>
          </label>
        ) : (
          <>
            <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">
              {field.label}{requiredMark}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setFieldValue(field.key, e.target.value)}
                rows={3}
                className={`${inputCls} h-auto py-2`}
              />
            ) : field.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => setFieldValue(field.key, e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">Seleccionar...</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setFieldValue(field.key, e.target.value)}
                className={inputCls}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <FileCheck size={18} className="text-gantly-blue" />
          <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Mis consentimientos</h3>
          {pendingRequests.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-1 font-medium bg-amber-50 text-amber-700">
              <Clock size={12} />
              {pendingRequests.length} pendiente{pendingRequests.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="p-5">
          {loading ? (
            <SkeletonList rows={3} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="w-12 h-12 text-slate-400" />}
              title="Sin consentimientos"
              description="No tienes consentimientos pendientes ni firmados."
            />
          ) : (
            <div className="space-y-3">
              {/* Pending first */}
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{r.documentTypeTitle || 'Consentimiento'}</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-slate-500 m-0">
                      {r.psychologistName ? `Enviado por ${r.psychologistName}` : 'Enviado'} el {formatDate(r.createdAt || r.sentAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSigning(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer hover:bg-gantly-blue/90 transition-colors duration-200 flex-shrink-0 ml-3"
                  >
                    <Pen size={14} />
                    Firmar
                  </button>
                </div>
              ))}

              {/* Signed */}
              {signedRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{r.documentTypeTitle || 'Consentimiento'}</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-slate-500 m-0">
                      Firmado el {formatDate(r.signedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openView(r)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors duration-200 flex-shrink-0 ml-3"
                  >
                    <Eye size={13} />
                    Ver
                  </button>
                </div>
              ))}

              {/* Others (DRAFT, REJECTED) */}
              {otherRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{r.documentTypeTitle || 'Consentimiento'}</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-slate-500 m-0">{formatDate(r.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openView(r)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors duration-200 flex-shrink-0 ml-3"
                  >
                    <Eye size={13} />
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Signing modal */}
      <Modal
        open={showSigningModal && !!selectedRequest}
        onClose={closeSigningModal}
        title="Firmar consentimiento"
        maxWidth="max-w-[640px]"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Rendered content */}
            {selectedRequest.renderedContent ? (
              <div
                className="prose prose-sm max-w-none text-slate-700 border border-slate-100 rounded-md p-4 bg-slate-50/50 max-h-[300px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: selectedRequest.renderedContent }}
              />
            ) : (
              <p className="text-sm text-slate-500">Sin contenido disponible</p>
            )}

            {/* Form fields (if formSchema exists) */}
            {formFields.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Datos del formulario</p>
                {formFields.map(renderFormField)}
              </div>
            )}

            {/* Acceptance checkbox */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gantly-blue focus:ring-gantly-blue cursor-pointer"
              />
              <span className="text-sm text-slate-700">He leido y acepto el contenido del documento</span>
            </label>

            {/* Signer name */}
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Nombre completo</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Tu nombre completo"
                className={inputCls}
              />
            </div>

            {/* Signature pad */}
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Firma</label>
              <SignaturePad ref={signaturePadRef} height={150} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeSigningModal}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={signing || !accepted || !signerName.trim() || (formFields.length > 0 && !validateForm())}
                className="flex items-center gap-1.5 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {signing ? 'Firmando...' : 'Firmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View signed modal */}
      <Modal
        open={showViewModal && !!selectedRequest}
        onClose={closeViewModal}
        title={selectedRequest?.documentTypeTitle || 'Consentimiento'}
        maxWidth="max-w-[640px]"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 -mt-2 mb-3">
              {statusBadge(selectedRequest.status)}
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {selectedRequest.renderedContent ? (
                <div
                  className="prose prose-sm max-w-none text-slate-700 border border-slate-100 rounded-md p-4 bg-slate-50/50"
                  dangerouslySetInnerHTML={{ __html: selectedRequest.renderedContent }}
                />
              ) : (
                <p className="text-sm text-slate-500">Sin contenido disponible</p>
              )}
            </div>

            {selectedRequest.status === 'SIGNED' && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Firma</p>
                {selectedRequest.signerName && (
                  <p className="text-sm text-slate-700">Firmado por: <span className="font-medium">{selectedRequest.signerName}</span></p>
                )}
                {selectedRequest.signedAt && (
                  <p className="text-sm text-slate-500">Fecha: {formatDate(selectedRequest.signedAt)}</p>
                )}
                {selectedRequest.signatureData && (
                  <div className="border border-slate-200 rounded-md p-2 bg-white inline-block">
                    <img
                      src={selectedRequest.signatureData}
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
                onClick={closeViewModal}
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
