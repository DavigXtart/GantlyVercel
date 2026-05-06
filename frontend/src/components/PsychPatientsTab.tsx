import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
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
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">group</span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="m-0 text-2xl font-bold text-slate-800">Mis Pacientes</h3>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{patients.length}</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium cursor-pointer text-sm transition-all duration-300"
        >
          Refrescar
        </button>
      </div>

      {/* Buscador y filtros */}
      <div className="flex gap-3 mb-6 flex-wrap items-center bg-white p-4 rounded-2xl border border-slate-100">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={patientSearchTerm}
            onChange={(e) => setPatientSearchTerm(e.target.value)}
            className="h-12 w-full pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <select
          value={patientFilterGender}
          onChange={(e) => setPatientFilterGender(e.target.value)}
          className="h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-800 min-w-[140px]"
        >
          <option value="">Todos los generos</option>
          <option value="MALE">Hombre</option>
          <option value="FEMALE">Mujer</option>
          <option value="OTHER">Otro</option>
        </select>
        <select
          value={patientFilterLastVisit}
          onChange={(e) => setPatientFilterLastVisit(e.target.value)}
          className="h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-800 min-w-[160px]"
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
          icon={<Users className="w-12 h-12 text-slate-300" />}
          title={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "No se encontraron pacientes" : "No hay pacientes asignados"}
          description={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "Intenta cambiar los filtros de busqueda." : "Aun no tienes pacientes asignados. Los pacientes apareceran aqui una vez que se registren y te seleccionen."}
        />
      ) : (
        <>
          {/* Pacientes Activos */}
          {activePatients.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Pacientes Activos
                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{activePatients.length}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activePatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col min-h-[200px]"
                  >
                    <div className="flex items-center gap-3 mb-4 flex-1 min-h-0">
                      <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (p.name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</div>
                        <div className="text-sm text-slate-500 truncate" title={p.email}>{p.email}</div>
                        {p.lastVisit && (
                          <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">event_available</span>
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div className="text-xs text-slate-400 italic mt-1.5">Sin visitas registradas</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenChat(p.id); }}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 text-white border-none rounded-xl font-medium cursor-pointer text-sm transition-all duration-300"
                      >
                        Abrir Chat
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(p.id, 'DISCHARGED'); }}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-medium cursor-pointer text-xs transition-all duration-300"
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
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Menores de edad
              <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{minorPatients.length}</span>
            </h4>
            {minorPatients.length === 0 ? (
              <p className="text-sm text-slate-400 mb-4 bg-white p-4 rounded-xl border border-dashed border-slate-200">
                Los pacientes con fecha de nacimiento o edad menor de 18 anos apareceran aqui.
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
                      className={`bg-white rounded-2xl p-6 border hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col min-h-[220px] ${
                        consentSigned ? 'border-slate-100' : 'border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4 flex-1 min-h-0">
                        <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (p.name || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</div>
                          <div className="text-sm text-slate-500 truncate" title={p.email}>{p.email}</div>
                          <div className={`text-xs font-semibold mt-1.5 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            consentSigned
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className="material-symbols-outlined text-[12px]">{consentSigned ? 'verified' : 'pending'}</span>
                            {consentSigned ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenChat(p.id); }}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 text-white border-none rounded-xl font-medium cursor-pointer text-sm transition-all duration-300"
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
                            className="w-full py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 rounded-xl font-medium cursor-pointer text-xs transition-all duration-300 hover:shadow-md"
                          >
                            Adjuntar consentimiento
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateStatus(p.id, 'DISCHARGED'); }}
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-medium cursor-pointer text-xs transition-all duration-300"
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
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Pacientes Dados de Alta
                <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-xs font-semibold">{dischargedPatients.length}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {dischargedPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onViewPatient(p.id)}
                    className="bg-white rounded-2xl p-6 border border-slate-100 opacity-60 hover:opacity-90 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4 flex-1 min-h-0">
                      <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xl font-bold">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (p.name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</div>
                        <div className="text-sm text-slate-500 truncate" title={p.email}>{p.email}</div>
                        {p.lastVisit && (
                          <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">event_available</span>
                            Ultima visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {!p.lastVisit && (
                          <div className="text-xs text-slate-400 italic mt-1.5">Sin visitas registradas</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenChat(p.id); }}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 text-white border-none rounded-xl font-medium cursor-pointer text-sm transition-all duration-300"
                      >
                        Abrir Chat
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(p.id, 'ACTIVE'); }}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-medium cursor-pointer text-xs transition-all duration-300"
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
            className="w-full max-w-[520px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-8"
          >
            <div className="flex justify-between items-center gap-3">
              <div>
                <div className="text-lg font-bold text-slate-800">Adjuntar consentimiento</div>
                <div className="text-xs text-slate-500 mt-1">
                  Selecciona el tipo de documento y el lugar. El contenido se rellenara automaticamente.
                </div>
              </div>
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                className="w-8 h-8 rounded-lg border-none bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-200 text-lg disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                aria-label="Cerrar"
                disabled={sendingConsent}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de documento</label>
                <select
                  value={consentForm.documentTypeId || 0}
                  onChange={(e) => setConsentForm({ ...consentForm, documentTypeId: parseInt(e.target.value, 10) })}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  {(consentDocTypes || []).length === 0 && <option value={0}>No hay tipos disponibles</option>}
                  {(consentDocTypes || []).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lugar (opcional)</label>
                <input
                  type="text"
                  value={consentForm.place}
                  onChange={(e) => setConsentForm({ ...consentForm, place: e.target.value })}
                  placeholder="Ej: Madrid"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => !sendingConsent && setShowConsentModal(false)}
                disabled={sendingConsent}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium cursor-pointer text-sm disabled:cursor-not-allowed hover:bg-slate-100 transition-all duration-300"
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
                className="px-5 py-2.5 rounded-xl border-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 text-white font-medium cursor-pointer text-sm disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
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
