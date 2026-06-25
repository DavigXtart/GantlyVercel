import { useState, useEffect } from 'react';
import { Settings, Briefcase, Building2, Shield, Plus, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { psychService, authService } from '../services/api';
import { toast } from './ui/Toast';

interface ServiceItem {
  name: string;
  price: number;
  durationMinutes: number;
}

interface OfficeItem {
  name: string;
  color: string;
}

type SettingsSubTab = 'servicios' | 'despachos' | 'seguridad';

const OFFICE_COLORS = ['#2E93CC', '#22D3EE', '#059669', '#F0C930', '#9c7cc5', '#7cc5bc', '#c57ca0', '#6b8fad'];
const DURATION_OPTIONS = [30, 45, 50, 60, 90];

export default function PsychSettingsTab() {
  const [subTab, setSubTab] = useState<SettingsSubTab>('servicios');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await psychService.getProfile();
      if (profile.services) {
        try { setServices(JSON.parse(profile.services)); } catch { /* ignore */ }
      }
      if (profile.offices) {
        try { setOffices(JSON.parse(profile.offices)); } catch { /* ignore */ }
      }
      setLoaded(true);
    } catch {
      toast.error('Error al cargar ajustes');
    }
  };

  const saveServices = async (updated: ServiceItem[]) => {
    setSaving(true);
    try {
      await psychService.updateProfile({ services: JSON.stringify(updated) });
      setServices(updated);
      toast.success('Servicios guardados');
    } catch {
      toast.error('Error al guardar servicios');
    } finally {
      setSaving(false);
    }
  };

  const saveOffices = async (updated: OfficeItem[]) => {
    setSaving(true);
    try {
      await psychService.updateProfile({ offices: JSON.stringify(updated) });
      setOffices(updated);
      toast.success('Despachos guardados');
    } catch {
      toast.error('Error al guardar despachos');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    const updated = [...services, { name: '', price: 60, durationMinutes: 50 }];
    setServices(updated);
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string | number) => {
    const updated = services.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setServices(updated);
  };

  const removeService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    saveServices(updated);
  };

  const addOffice = () => {
    const usedColors = offices.map(o => o.color);
    const nextColor = OFFICE_COLORS.find(c => !usedColors.includes(c)) || OFFICE_COLORS[0];
    const updated = [...offices, { name: '', color: nextColor }];
    setOffices(updated);
  };

  const updateOffice = (index: number, field: keyof OfficeItem, value: string) => {
    const updated = offices.map((o, i) => i === index ? { ...o, [field]: value } : o);
    setOffices(updated);
  };

  const removeOffice = (index: number) => {
    const updated = offices.filter((_, i) => i !== index);
    saveOffices(updated);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.warning('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 10) {
      toast.warning('La contraseña debe tener al menos 10 caracteres');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.warning('La contraseña debe incluir al menos una mayúscula');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      toast.warning('La contraseña debe incluir al menos un símbolo');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al cambiar la contraseña';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const subTabs: { id: SettingsSubTab; label: string; icon: typeof Briefcase }[] = [
    { id: 'servicios', label: 'Servicios', icon: Briefcase },
    { id: 'despachos', label: 'Despachos', icon: Building2 },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {subTabs.map(st => {
          const Icon = st.icon;
          return (
            <button
              key={st.id}
              onClick={() => setSubTab(st.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 border-none ${
                subTab === st.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {st.label}
            </button>
          );
        })}
      </div>

      {/* Servicios */}
      {subTab === 'servicios' && (
        <div className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Catálogo de servicios</h3>
              <p className="text-[12px] text-slate-500 m-0 mt-1">Define los servicios que ofreces y sus precios</p>
            </div>
            <button
              onClick={addService}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
            >
              <Plus size={14} />
              Añadir
            </button>
          </div>
          <div className="p-5">
            {services.length === 0 ? (
              <p className="text-sm text-slate-500 m-0 text-center py-6">
                No tienes servicios configurados. Añade tu primer servicio.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {services.map((svc, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-slate-200/80 bg-slate-50/50">
                    <input
                      type="text"
                      value={svc.name}
                      onChange={e => updateService(i, 'name', e.target.value)}
                      placeholder="Nombre del servicio"
                      className="flex-1 h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={svc.price}
                          onChange={e => updateService(i, 'price', Number(e.target.value))}
                          min={0}
                          className="w-24 h-9 px-3 pr-7 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
                      </div>
                      <select
                        value={svc.durationMinutes}
                        onChange={e => updateService(i, 'durationMinutes', Number(e.target.value))}
                        className="h-9 px-2 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
                      >
                        {DURATION_OPTIONS.map(d => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeService(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer bg-transparent border-none"
                        title="Eliminar servicio"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {services.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const valid = services.filter(s => s.name.trim());
                    saveServices(valid);
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
                >
                  <Check size={15} />
                  {saving ? 'Guardando...' : 'Guardar servicios'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Despachos */}
      {subTab === 'despachos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Despachos</h3>
              <p className="text-[12px] text-slate-500 m-0 mt-1">Configura tus espacios de trabajo presenciales</p>
            </div>
            <button
              onClick={addOffice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
            >
              <Plus size={14} />
              Añadir
            </button>
          </div>
          <div className="p-5">
            {offices.length === 0 ? (
              <p className="text-sm text-slate-500 m-0 text-center py-6">
                No tienes despachos configurados. Añade tu primer despacho.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {offices.map((office, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-slate-200/80 bg-slate-50/50">
                    <input
                      type="text"
                      value={office.name}
                      onChange={e => updateOffice(i, 'name', e.target.value)}
                      placeholder="Nombre del despacho"
                      className="flex-1 h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {OFFICE_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateOffice(i, 'color', color)}
                            className="w-7 h-7 rounded-full border-2 cursor-pointer transition-all duration-200 flex items-center justify-center"
                            style={{
                              backgroundColor: color,
                              borderColor: office.color === color ? '#0A1628' : 'transparent',
                            }}
                            title={color}
                          >
                            {office.color === color && <Check size={12} className="text-white" />}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => removeOffice(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer bg-transparent border-none ml-2"
                        title="Eliminar despacho"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {offices.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const valid = offices.filter(o => o.name.trim());
                    saveOffices(valid);
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
                >
                  <Check size={15} />
                  {saving ? 'Guardando...' : 'Guardar despachos'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seguridad */}
      {subTab === 'seguridad' && (
        <div className="bg-white rounded-2xl border border-slate-200/80">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Cambiar contraseña</h3>
            <p className="text-[12px] text-slate-500 m-0 mt-1">Mínimo 10 caracteres, una mayúscula y un símbolo</p>
          </div>
          <div className="p-5 max-w-md">
            <div className="mb-4">
              <label className="block mb-1.5 text-[12px] text-slate-500 font-medium">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 text-[12px] text-slate-500 font-medium">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="mb-5">
              <label className="block mb-1.5 text-[12px] text-slate-500 font-medium">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="flex items-center gap-2 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
            >
              <Shield size={15} />
              {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
