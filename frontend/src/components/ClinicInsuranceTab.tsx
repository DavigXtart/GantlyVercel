import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import type { InsuranceCompany, InsurancePolicy } from '../services/api';
import {
  Shield, FileText, Plus, Pencil, Trash2, Search, Building2, Check, X,
} from 'lucide-react';
import { toast } from './ui/Toast';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso?: string): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Add / Edit Insurance Company Modal
// ---------------------------------------------------------------------------
function CompanyModalContent({
  initial,
  onSave,
  saving,
}: {
  initial?: Partial<InsuranceCompany>;
  onSave: (data: Partial<InsuranceCompany>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    nif: initial?.nif || '',
    address: initial?.address || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    contactPerson: initial?.contactPerson || '',
  });

  const inputCls = "w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition-all placeholder:text-slate-400";
  const labelCls = "text-[11px] font-medium text-slate-500 mb-1 block";

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="company-name" className={labelCls}>Nombre *</label>
        <input id="company-name" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ej: Adeslas" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="company-nif" className={labelCls}>NIF</label>
          <input id="company-nif" type="text" value={form.nif} onChange={e => setForm(p => ({ ...p, nif: e.target.value }))} className={inputCls} placeholder="A12345678" />
        </div>
        <div>
          <label htmlFor="company-phone" className={labelCls}>Teléfono</label>
          <input id="company-phone" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+34 900 000 000" />
        </div>
      </div>
      <div>
        <label htmlFor="company-address" className={labelCls}>Dirección</label>
        <input id="company-address" type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Calle, número, ciudad" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="company-email" className={labelCls}>Email</label>
          <input id="company-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="contacto@aseguradora.com" />
        </div>
        <div>
          <label htmlFor="company-contact" className={labelCls}>Persona de contacto</label>
          <input id="company-contact" type="text" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="h-8 px-4 rounded-md bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Policy Modal
// ---------------------------------------------------------------------------
function PolicyModalContent({
  companies,
  patients,
  onSave,
  saving,
}: {
  companies: InsuranceCompany[];
  patients: Array<{ id: number; name: string }>;
  onSave: (patientId: number, data: Partial<InsurancePolicy>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    patientId: '' as string | number,
    insuranceCompanyId: '' as string | number,
    policyNumber: '',
    holderName: '',
    expirationDate: '',
  });

  const inputCls = "w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition-all placeholder:text-slate-400";
  const labelCls = "text-[11px] font-medium text-slate-500 mb-1 block";

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="policy-patient" className={labelCls}>Paciente *</label>
        <select
          id="policy-patient"
          value={form.patientId}
          onChange={e => setForm(p => ({ ...p, patientId: Number(e.target.value) }))}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">Seleccionar paciente</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="policy-company" className={labelCls}>Aseguradora *</label>
        <select
          id="policy-company"
          value={form.insuranceCompanyId}
          onChange={e => setForm(p => ({ ...p, insuranceCompanyId: Number(e.target.value) }))}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">Seleccionar aseguradora</option>
          {companies.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="policy-number" className={labelCls}>Número de póliza *</label>
        <input id="policy-number" type="text" value={form.policyNumber} onChange={e => setForm(p => ({ ...p, policyNumber: e.target.value }))} className={inputCls} placeholder="POL-123456" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="policy-holder" className={labelCls}>Nombre del titular</label>
          <input id="policy-holder" type="text" value={form.holderName} onChange={e => setForm(p => ({ ...p, holderName: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label htmlFor="policy-expiration" className={labelCls}>Fecha de vencimiento</label>
          <input id="policy-expiration" type="date" value={form.expirationDate} onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => {
            if (!form.patientId || !form.insuranceCompanyId || !form.policyNumber.trim()) return;
            onSave(Number(form.patientId), {
              insuranceCompanyId: Number(form.insuranceCompanyId),
              policyNumber: form.policyNumber,
              holderName: form.holderName || undefined,
              expirationDate: form.expirationDate || undefined,
            });
          }}
          disabled={saving || !form.patientId || !form.insuranceCompanyId || !form.policyNumber.trim()}
          className="h-8 px-4 rounded-md bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none"
        >
          {saving ? 'Creando...' : 'Crear póliza'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicInsuranceTab() {
  // Insurance Companies
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  // Policies
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySearch, setPolicySearch] = useState('');

  // Patients (for policy modal)
  const [patients, setPatients] = useState<Array<{ id: number; name: string }>>([]);

  // ConfirmDialog state
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [deletePolicyId, setDeletePolicyId] = useState<number | null>(null);

  // Load data
  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const data = await clinicService.getInsuranceCompanies();
      setCompanies(data);
    } catch {
      setCompanies([]);
      toast.error('Error al cargar las aseguradoras');
    }
    finally { setLoadingCompanies(false); }
  }, []);

  const loadPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const data = await clinicService.getAllPolicies();
      setPolicies(data);
    } catch {
      setPolicies([]);
      toast.error('Error al cargar las pólizas');
    }
    finally { setLoadingPolicies(false); }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadPolicies();
    clinicService.getPatients().then(data => setPatients(data.map(p => ({ id: p.id, name: p.name })))).catch(() => {
      toast.error('Error al cargar los pacientes');
    });
  }, [loadCompanies, loadPolicies]);

  // --- Company CRUD ---
  async function handleSaveCompany(data: Partial<InsuranceCompany>) {
    setSavingCompany(true);
    try {
      if (editingCompany) {
        const updated = await clinicService.updateInsuranceCompany(editingCompany.id, data);
        setCompanies(prev => prev.map(c => c.id === editingCompany.id ? updated : c));
      } else {
        const created = await clinicService.createInsuranceCompany(data);
        setCompanies(prev => [...prev, created]);
      }
      setShowCompanyModal(false);
      setEditingCompany(null);
    } catch {
      toast.error('Error al guardar la aseguradora');
    }
    finally { setSavingCompany(false); }
  }

  async function handleToggleCompany(company: InsuranceCompany) {
    try {
      const updated = await clinicService.updateInsuranceCompany(company.id, { active: !company.active });
      setCompanies(prev => prev.map(c => c.id === company.id ? updated : c));
    } catch {
      toast.error('Error al cambiar el estado de la aseguradora');
    }
  }

  async function handleDeleteCompany(id: number) {
    try {
      await clinicService.deleteInsuranceCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Error al eliminar la aseguradora');
    }
  }

  // --- Policy CRUD ---
  async function handleSavePolicy(patientId: number, data: Partial<InsurancePolicy>) {
    setSavingPolicy(true);
    try {
      const created = await clinicService.createPatientPolicy(patientId, data);
      setPolicies(prev => [...prev, created]);
      setShowPolicyModal(false);
    } catch {
      toast.error('Error al crear la póliza');
    }
    finally { setSavingPolicy(false); }
  }

  async function handleDeletePolicy(id: number) {
    try {
      await clinicService.deletePatientPolicy(id);
      setPolicies(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Error al eliminar la póliza');
    }
  }

  // Filtered policies
  const filteredPolicies = policySearch.trim()
    ? policies.filter(p =>
        (p.patientName ?? '').toLowerCase().includes(policySearch.toLowerCase()) ||
        (p.insuranceCompanyName ?? '').toLowerCase().includes(policySearch.toLowerCase()) ||
        (p.policyNumber ?? '').toLowerCase().includes(policySearch.toLowerCase())
      )
    : policies;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Left: Aseguradoras (wider) */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-gantly-blue" />
              <h2 className="text-sm font-semibold text-slate-800">Aseguradoras</h2>
              <span className="text-[11px] text-slate-400">{companies.length}</span>
            </div>
            <button
              onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }}
              className="flex items-center gap-1 text-[11px] text-gantly-blue font-medium cursor-pointer bg-transparent hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
            >
              <Plus size={12} />
              Añadir
            </button>
          </div>

          {loadingCompanies ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 size={24} className="text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-400">Sin aseguradoras</p>
              <p className="text-xs text-slate-400 mt-0.5">Añade la primera aseguradora</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pl-5 pr-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">NIF</th>
                    <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contacto</th>
                    <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-right pr-5 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(company => (
                    <tr key={company.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="pl-5 pr-2 py-2.5">
                        <div className="text-xs font-medium text-slate-800">{company.name}</div>
                        {company.email && <div className="text-[11px] text-slate-400">{company.email}</div>}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-slate-600">{company.nif || '--'}</td>
                      <td className="px-2 py-2.5">
                        {company.contactPerson && <div className="text-xs text-slate-600">{company.contactPerson}</div>}
                        {company.phone && <div className="text-[11px] text-slate-400">{company.phone}</div>}
                        {!company.contactPerson && !company.phone && <span className="text-xs text-slate-400">--</span>}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-0.5 ${
                          company.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {company.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="pr-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingCompany(company); setShowCompanyModal(true); }}
                            className="text-slate-400 hover:text-gantly-blue hover:bg-gantly-blue/5 p-1.5 rounded-md transition-all cursor-pointer bg-transparent border-none"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleCompany(company)}
                            className={`p-1.5 rounded-md transition-all cursor-pointer bg-transparent border-none ${
                              company.active ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                            }`}
                            title={company.active ? 'Desactivar' : 'Activar'}
                          >
                            {company.active ? <X size={13} /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={() => setDeleteCompanyId(company.id)}
                            className="text-slate-300 hover:text-red-500 p-1.5 rounded-md transition-colors cursor-pointer bg-transparent border-none"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Pólizas de pacientes */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Pólizas de pacientes</h2>
              <span className="text-[11px] text-slate-400">{policies.length}</span>
            </div>
            <button
              onClick={() => setShowPolicyModal(true)}
              disabled={companies.filter(c => c.active).length === 0}
              className="flex items-center gap-1 text-[11px] text-gantly-blue font-medium cursor-pointer bg-transparent hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={12} />
              Añadir
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="policy-search"
                type="text"
                value={policySearch}
                onChange={e => setPolicySearch(e.target.value)}
                placeholder="Buscar por paciente, aseguradora..."
                className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:bg-white focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition-all placeholder:text-slate-400"
              />
              {policySearch && (
                <button onClick={() => setPolicySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingPolicies ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
              </div>
            ) : filteredPolicies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText size={24} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-400">
                  {policySearch ? 'Sin resultados' : 'Sin pólizas'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {policySearch ? 'Cambia la búsqueda' : 'Añade la primera póliza'}
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-2">
                {filteredPolicies.map(policy => {
                  const isExpired = policy.expirationDate && new Date(policy.expirationDate) < new Date();
                  return (
                    <div key={policy.id} className="rounded-lg border border-slate-100 p-3 hover:border-slate-200 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{policy.patientName || `Paciente #${policy.patientId}`}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{policy.insuranceCompanyName}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{policy.policyNumber}</span>
                            {policy.holderName && (
                              <span className="text-[10px] text-slate-400">Titular: {policy.holderName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`inline-flex items-center rounded-full text-[10px] font-medium px-2 py-0.5 ${
                            isExpired ? 'bg-red-50 text-red-600' : policy.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isExpired ? 'Vencida' : policy.active ? 'Activa' : 'Inactiva'}
                          </span>
                          {policy.expirationDate && (
                            <span className="text-[10px] text-slate-400">Vence: {fmtDate(policy.expirationDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => setDeletePolicyId(policy.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-md cursor-pointer bg-transparent border-none"
                          title="Eliminar póliza"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Modal */}
      <Modal
        open={showCompanyModal}
        onClose={() => { setShowCompanyModal(false); setEditingCompany(null); }}
        title={editingCompany?.id ? 'Editar aseguradora' : 'Nueva aseguradora'}
        maxWidth="max-w-md"
      >
        <CompanyModalContent
          initial={editingCompany ?? undefined}
          onSave={handleSaveCompany}
          saving={savingCompany}
        />
      </Modal>

      {/* Policy Modal */}
      <Modal
        open={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Nueva póliza"
        maxWidth="max-w-md"
      >
        <PolicyModalContent
          companies={companies}
          patients={patients}
          onSave={handleSavePolicy}
          saving={savingPolicy}
        />
      </Modal>

      {/* Confirm delete company */}
      <ConfirmDialog
        open={deleteCompanyId !== null}
        onClose={() => setDeleteCompanyId(null)}
        onConfirm={async () => {
          if (deleteCompanyId !== null) await handleDeleteCompany(deleteCompanyId);
        }}
        title="Eliminar aseguradora"
        message="Esta acción eliminará la aseguradora de forma permanente. ¿Estás seguro?"
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* Confirm delete policy */}
      <ConfirmDialog
        open={deletePolicyId !== null}
        onClose={() => setDeletePolicyId(null)}
        onConfirm={async () => {
          if (deletePolicyId !== null) await handleDeletePolicy(deletePolicyId);
        }}
        title="Eliminar póliza"
        message="Esta acción eliminará la póliza de forma permanente. ¿Estás seguro?"
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
