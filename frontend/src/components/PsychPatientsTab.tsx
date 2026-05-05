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
    <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="m-0 text-2xl font-bold text-gantly-blue-600">
          Mis Pacientes
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm transition-all hover:scale-105"
        >
          Refrescar
        </button>
      </div>

      {/* Buscador y filtros */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={patientSearchTerm}
          onChange={(e) => setPatientSearchTerm(e.target.value)}
          className="p-2.5 px-3.5 rounded-xl border border-slate-200 text-[15px] min-w-[220px] flex-1"
        />
        <select
          value={patientFilterGender}
          onChange={(e) => setPatientFilterGender(e.target.value)}
          className="p-2.5 px-3.5 rounded-xl border border-slate-200 text-[15px] min-w-[150px]"
        >
          <option value="">Todos los generos</option>
          <option value="MALE">Hombre</option>
          <option value="FEMALE">Mujer</option>
          <option value="OTHER">Otro</option>
        </select>
        <select
          value={patientFilterLastVisit}
          onChange={(e) => setPatientFilterLastVisit(e.target.value)}
          className="p-2.5 px-3.5 rounded-xl border border-slate-200 text-[15px] min-w-[180px]"
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
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-slate-800 mb-4">
                Pacientes Activos ({activePatients.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activePatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl transition-all cursor-pointer flex flex-col min-h-[260px] hover:border-gantly-blue-400 hover:shadow-card"
                  >
                    <div className="flex items-center gap-4 mb-4 flex-1 min-h-0">
                      <div className="w-[60px] h-[60px] flex-shrink-0 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-2xl border-[3px] border-white shadow-sm">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-lg font-semibold text-slate-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-sm text-slate-500 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={p.email}>
                          {p.email}
                        </div>
                        {p.lastVisit && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div className="text-xs text-slate-400 italic mt-1">
                            Sin visitas registradas
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(p.id);
                        }}
                        className="w-full py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg font-semibold cursor-pointer text-sm transition-all hover:scale-[1.02]"
                      >
                        Abrir Chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(p.id, 'DISCHARGED');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 rounded-lg font-semibold cursor-pointer text-[13px] transition-all"
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
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-slate-800 mb-4">
              Menores de edad ({minorPatients.length})
            </h4>
            {minorPatients.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">
                Los pacientes con fecha de nacimiento o edad menor de 18 anos apareceran aqui. Pueden requerir consentimiento firmado antes de acceder a todo el contenido.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                      className={`p-6 rounded-xl transition-all cursor-pointer flex flex-col min-h-[280px] border-2 ${
                        consentSigned
                          ? 'bg-slate-50 border-slate-200 hover:border-gantly-blue-400 hover:shadow-card'
                          : 'bg-gradient-to-br from-orange-50 to-amber-50 border-amber-300/50 hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4 flex-1 min-h-0">
                        <div className="w-[60px] h-[60px] flex-shrink-0 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-2xl border-[3px] border-white shadow-sm">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="text-lg font-semibold text-slate-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={p.name}>
                            {p.name}
                          </div>
                          <div className="text-sm text-slate-500 mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap" title={p.email}>
                            {p.email}
                          </div>
                          <div className={`text-xs font-bold ${consentSigned ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {consentSigned ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(p.id);
                          }}
                          className="w-full py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg font-semibold cursor-pointer text-sm transition-all"
                        >
                          Abrir Chat
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
                            className="w-full py-2.5 bg-orange-50 text-amber-700 border border-amber-300/50 rounded-lg font-bold cursor-pointer text-[13px] transition-all hover:bg-orange-100"
                          >
                            Adjuntar consentimiento
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(p.id, 'DISCHARGED');
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 rounded-lg font-semibold cursor-pointer text-[13px]"
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
              <h4 className="text-xl font-semibold text-slate-800 mb-4">
                Pacientes Dados de Alta ({dischargedPatients.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {dischargedPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    className="p-6 bg-slate-50 border-2 border-slate-300 rounded-xl opacity-70 transition-all cursor-pointer min-h-[260px] flex flex-col hover:border-gantly-blue-400 hover:shadow-card hover:opacity-90"
                  >
                    <div className="flex items-center gap-4 mb-4 flex-1 min-h-0">
                      <div className="w-[60px] h-[60px] flex-shrink-0 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-2xl border-[3px] border-white shadow-sm">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-lg font-semibold text-slate-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-sm text-slate-500 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={p.email}>
                          {p.email}
                        </div>
                        {p.lastVisit && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div className="text-xs text-slate-400 italic mt-1">
                            Sin visitas registradas
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(p.id);
                        }}
                        className="w-full py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg font-semibold cursor-pointer text-sm transition-all hover:scale-[1.02]"
                      >
                        Abrir Chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(p.id, 'ACTIVE');
                        }}
                        className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-lg font-semibold cursor-pointer text-[13px] transition-all"
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
          className="fixed inset-0 bg-black/35 flex items-center justify-center p-6 z-[9999]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] bg-white rounded-2xl border border-slate-200 shadow-elevated p-6"
          >
            <div className="flex justify-between items-center gap-3">
              <div>
                <div className="text-lg font-extrabold text-gantly-text">Adjuntar consentimiento</div>
                <div className="text-[13px] text-slate-500 mt-1">
                  Selecciona el tipo de documento y el lugar. El contenido se rellenara automaticamente (psicologo, fecha, hora, etc.).
                </div>
              </div>
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                className="border-none bg-transparent cursor-pointer text-slate-500 text-lg disabled:cursor-not-allowed"
                aria-label="Cerrar"
                disabled={sendingConsent}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Tipo de documento
                </label>
                <select
                  value={consentForm.documentTypeId || 0}
                  onChange={(e) => setConsentForm({ ...consentForm, documentTypeId: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 px-3 rounded-xl border border-slate-200 text-sm"
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
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Lugar (opcional)
                </label>
                <input
                  type="text"
                  value={consentForm.place}
                  onChange={(e) => setConsentForm({ ...consentForm, place: e.target.value })}
                  placeholder="Ej: Madrid"
                  className="w-full p-2.5 px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end mt-5">
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                disabled={sendingConsent}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold cursor-pointer disabled:cursor-not-allowed"
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
                className="px-3.5 py-2.5 rounded-xl border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white font-extrabold cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
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
