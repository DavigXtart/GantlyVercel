import { useState, useEffect, lazy, Suspense } from 'react';
import { profileService, authService, gdprService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import ConfirmDialog from './ui/ConfirmDialog';
import { ArrowLeft, Settings, User, Lock, Receipt, Shield, Upload, Download, Info, AlertTriangle, Trash2, RotateCcw, HeartOff, Stethoscope, Phone, UserCheck, Moon, Sun, type LucideIcon } from 'lucide-react';

const BillingPortal = lazy(() => import('./BillingPortal'));
const TwoFactorSetup = lazy(() => import('./TwoFactorSetup'));

type SettingsSection = 'perfil' | 'seguridad' | 'pagos' | 'privacidad';

interface UserSettingsTabProps {
  me: any;
  onBack: () => void;
  onMeUpdate: (updatedMe: any) => void;
  onShowOnboarding?: () => void;
}

export default function UserSettingsTab({ me, onBack, onMeUpdate, onShowOnboarding }: UserSettingsTabProps) {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('perfil');
  const [editProfileForm, setEditProfileForm] = useState({ name: '', gender: '', birthDate: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [confirmWithdrawHealthConsent, setConfirmWithdrawHealthConsent] = useState(false);
  const [healthConsentWithdrawnAt, setHealthConsentWithdrawnAt] = useState<string | null>(null);
  const [intakeForm, setIntakeForm] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    referralSource: '',
    chiefComplaint: '',
  });
  const [savingIntake, setSavingIntake] = useState(false);

  useEffect(() => {
    if (me) {
      setEditProfileForm({
        name: me.name ?? '',
        gender: me.gender ?? '',
        birthDate: me.birthDate ? (typeof me.birthDate === 'string' ? me.birthDate.slice(0, 10) : '') : '',
      });
      setIntakeForm({
        emergencyContactName: me.emergencyContactName ?? '',
        emergencyContactPhone: me.emergencyContactPhone ?? '',
        referralSource: me.referralSource ?? '',
        chiefComplaint: me.chiefComplaint ?? '',
      });
    }
  }, [me]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-sm"
        >
          <ArrowLeft className="text-slate-500" size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue to-gantly-blue-600 flex items-center justify-center shadow-sm shadow-gantly-blue/20">
            <Settings className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{`Configuraci\u00f3n`}</h1>
            <p className="text-sm text-slate-500">Gestiona tu cuenta, seguridad y privacidad</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-8 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
        {([
          { id: 'perfil' as SettingsSection, Icon: User, label: 'Perfil' },
          { id: 'seguridad' as SettingsSection, Icon: Lock, label: 'Seguridad' },
          { id: 'pagos' as SettingsSection, Icon: Receipt, label: 'Pagos' },
          { id: 'privacidad' as SettingsSection, Icon: Shield, label: 'Privacidad' },
        ]).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSettingsSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
              settingsSection === s.id
                ? 'bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-white shadow-md shadow-gantly-blue/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <s.Icon size={16} />
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* === SECTION: Perfil === */}
      {settingsSection === 'perfil' && (
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">Foto de perfil</h3>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-gantly-blue-100 bg-gradient-to-br from-gantly-blue-100 to-gantly-blue-100 flex items-center justify-center flex-shrink-0 shadow-lg shadow-gantly-blue/10">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gantly-blue font-semibold">
                    {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !file.type.startsWith('image/')) {
                        toast.error(`Selecciona una imagen v\u00e1lida`);
                        return;
                      }
                      try {
                        setUploadingAvatar(true);
                        const res = await profileService.uploadAvatar(file);
                        onMeUpdate({ ...me, avatarUrl: res.avatarUrl });
                        toast.success('Foto actualizada');
                      } catch (err: any) {
                        toast.error('No se pudo subir la foto. Inténtalo de nuevo.');
                      } finally {
                        setUploadingAvatar(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-sm text-white font-medium hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300">
                    <Upload size={16} />
                    {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                  </span>
                </label>
                <p className="text-xs text-slate-500">{`JPG, PNG. M\u00e1ximo 10MB.`}</p>
              </div>
            </div>
          </div>

          {/* Re-trigger onboarding */}
          {onShowOnboarding && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Tutorial de inicio</h3>
              <p className="text-sm text-slate-500 mb-4">
                Vuelve a ver el asistente de bienvenida con los pasos para configurar tu cuenta.
              </p>
              <button
                type="button"
                onClick={onShowOnboarding}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-all duration-200"
              >
                <RotateCcw size={16} />
                Ver tutorial de inicio
              </button>
            </div>
          )}

          {/* Dark mode toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                {me?.darkMode ? <Moon className="text-indigo-400" size={14} /> : <Sun className="text-amber-500" size={14} />}
              </span>
              Apariencia
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Modo oscuro</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reduce la fatiga visual en entornos con poca luz</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const newValue = !me?.darkMode;
                  // Toggle class immediately for instant visual feedback
                  document.documentElement.classList.toggle('dark', newValue);
                  try {
                    localStorage.setItem('darkMode', String(newValue));
                  } catch { /* silent */ }
                  onMeUpdate({ ...me, darkMode: newValue });
                  try {
                    await profileService.update({ darkMode: newValue });
                  } catch {
                    // Revert on error
                    document.documentElement.classList.toggle('dark', !newValue);
                    onMeUpdate({ ...me, darkMode: !newValue });
                    toast.error('Error al cambiar el modo oscuro');
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer border-none flex-shrink-0 ${
                  me?.darkMode ? 'bg-indigo-500' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${
                  me?.darkMode ? 'left-[22px]' : 'left-[3px]'
                }`} />
              </button>
            </div>
          </div>

          {/* Personal info card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">{`Informaci\u00f3n personal`}</h3>
            <p className="text-xs text-slate-500 mb-4">Puedes corregir tus datos personales en cualquier momento (Art. 16 RGPD).</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={me?.email ?? ''}
                  disabled
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">El email no se puede cambiar directamente. Contacta a soporte si necesitas modificarlo.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{`G\u00e9nero`}</label>
                  <select
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                  >
                    <option value="">No especificado</option>
                    <option value="MALE">Hombre</option>
                    <option value="FEMALE">Mujer</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={editProfileForm.birthDate}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, birthDate: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={async () => {
                    try {
                      setSavingProfile(true);
                      await profileService.update({
                        name: editProfileForm.name || undefined,
                        gender: editProfileForm.gender || undefined,
                        birthDate: editProfileForm.birthDate || undefined,
                      });
                      // Re-fetch from server to confirm persistence
                      const updated = await profileService.me();
                      onMeUpdate(updated);
                      toast.success('Perfil actualizado');
                    } catch (err: any) {
                      toast.error('No se pudieron guardar los cambios. Inténtalo de nuevo.');
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                  className="bg-gradient-to-r from-gantly-blue to-gantly-blue-600 hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>

          {/* Datos medicos / intake card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Stethoscope className="text-emerald-600" size={14} />
              </span>
              Datos m&eacute;dicos
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informaci&oacute;n adicional para tu profesional de salud mental. Estos datos son confidenciales y solo visibles para tu psic&oacute;logo.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Contacto de emergencia (nombre)</label>
                  <input
                    type="text"
                    value={intakeForm.emergencyContactName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, emergencyContactName: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Contacto de emergencia (tel&eacute;fono)</label>
                  <input
                    type="tel"
                    value={intakeForm.emergencyContactPhone}
                    onChange={(e) => setIntakeForm({ ...intakeForm, emergencyContactPhone: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Fuente de referido</label>
                <select
                  value={intakeForm.referralSource}
                  onChange={(e) => setIntakeForm({ ...intakeForm, referralSource: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="">No especificado</option>
                  <option value="SEARCH_ENGINE">Buscador (Google, etc.)</option>
                  <option value="SOCIAL_MEDIA">Redes sociales</option>
                  <option value="RECOMMENDATION">Recomendaci&oacute;n personal</option>
                  <option value="INSURANCE">Seguro m&eacute;dico</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Motivo de consulta</label>
                <textarea
                  value={intakeForm.chiefComplaint}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setIntakeForm({ ...intakeForm, chiefComplaint: e.target.value });
                    }
                  }}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white resize-y"
                  placeholder="Describe brevemente el motivo por el que buscas ayuda profesional..."
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{intakeForm.chiefComplaint.length}/1000</p>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingIntake}
                  onClick={async () => {
                    try {
                      setSavingIntake(true);
                      await profileService.update({
                        emergencyContactName: intakeForm.emergencyContactName || undefined,
                        emergencyContactPhone: intakeForm.emergencyContactPhone || undefined,
                        referralSource: intakeForm.referralSource || undefined,
                        chiefComplaint: intakeForm.chiefComplaint || undefined,
                      });
                      onMeUpdate({
                        ...me,
                        emergencyContactName: intakeForm.emergencyContactName,
                        emergencyContactPhone: intakeForm.emergencyContactPhone,
                        referralSource: intakeForm.referralSource,
                        chiefComplaint: intakeForm.chiefComplaint,
                      });
                      toast.success('Datos m\u00e9dicos actualizados');
                    } catch (err: any) {
                      toast.error('No se pudieron guardar los datos médicos. Inténtalo de nuevo.');
                    } finally {
                      setSavingIntake(false);
                    }
                  }}
                  className="bg-gradient-to-r from-gantly-blue to-gantly-blue-600 hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingIntake ? 'Guardando...' : 'Guardar datos m\u00e9dicos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === SECTION: Seguridad === */}
      {settingsSection === 'seguridad' && (
        <div className="space-y-6">
          {/* Change password */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">{`Cambiar contrase\u00f1a`}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">{`Contrase\u00f1a actual`}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{`Nueva contrase\u00f1a`}</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                    placeholder="Min 10 chars, mayuscula y simbolo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{`Confirmar contrase\u00f1a`}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none transition-all duration-200 text-sm bg-slate-50 focus:bg-white"
                    placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  onClick={async () => {
                    if (passwordForm.newPassword.length < 10) {
                      toast.error('La nueva contrase\u00f1a debe tener al menos 10 caracteres');
                      return;
                    }
                    if (!/[A-Z]/.test(passwordForm.newPassword)) {
                      toast.error('Debe contener al menos una letra mayuscula');
                      return;
                    }
                    if (!/[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\]/.test(passwordForm.newPassword)) {
                      toast.error('Debe contener al menos un simbolo especial');
                      return;
                    }
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      toast.error(`Las contrase\u00f1as no coinciden`);
                      return;
                    }
                    try {
                      setSavingPassword(true);
                      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      toast.success(`Contrase\u00f1a actualizada`);
                    } catch (err: any) {
                      const msg = err.response?.data?.error ?? err.response?.data?.message ?? `Error al cambiar la contrase\u00f1a`;
                      toast.error(msg);
                    } finally {
                      setSavingPassword(false);
                    }
                  }}
                  className="bg-gradient-to-r from-gantly-blue to-gantly-blue-600 hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Guardando...' : `Cambiar contrase\u00f1a`}
                </button>
              </div>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">{`Autenticaci\u00f3n en dos pasos`}</h3>
            <Suspense fallback={<LoadingSpinner />}>
              <TwoFactorSetup
                isEnabled={me?.totpEnabled || false}
                onStatusChange={() => { authService.me().then((data: any) => onMeUpdate(data)).catch(() => {}); }}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* === SECTION: Pagos === */}
      {settingsSection === 'pagos' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">{`Facturaci\u00f3n y pagos`}</h3>
          <Suspense fallback={<LoadingSpinner />}>
            <BillingPortal />
          </Suspense>
        </div>
      )}

      {/* === SECTION: Privacidad === */}
      {settingsSection === 'privacidad' && (
        <div className="space-y-6">
          {/* Export data */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gantly-blue-50 flex items-center justify-center">
                <Download className="text-gantly-blue" size={14} />
              </span>
              Descargar mis datos
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {`Descarga una copia de todos tus datos en formato JSON (Art. 20 RGPD \u2014 Derecho de portabilidad).`}
            </p>
            <button
              onClick={async () => {
                try {
                  const data = await gdprService.exportData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mis-datos-gantly-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Datos exportados correctamente');
                } catch {
                  toast.error('Error al exportar los datos');
                }
              }}
              className="bg-gradient-to-r from-gantly-blue to-gantly-blue-600 hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 flex items-center gap-2"
            >
              <Download size={16} />
              Descargar mis datos
            </button>
          </div>

          {/* Retention policy */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Info className="text-slate-600" size={14} />
              </span>
              {`Pol\u00edtica de retenci\u00f3n`}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {`Tus datos se conservan durante un m\u00e1ximo de 5 a\u00f1os desde tu registro, conforme a la legislaci\u00f3n sanitaria. Tras ese periodo, tus datos son anonimizados autom\u00e1ticamente.`}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Tus datos se conservan mientras tu cuenta est&eacute; activa. Las cuentas no verificadas se eliminan tras 30 d&iacute;as.
              Las notificaciones antiguas se eliminan tras 90 d&iacute;as. Tras eliminar tu cuenta, tus datos se anonimizan en un plazo de 30 d&iacute;as.
            </p>
          </div>

          {/* Health data consent withdrawal */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <HeartOff className="text-amber-600" size={14} />
              </span>
              Consentimiento datos de salud
            </h3>
            {healthConsentWithdrawnAt ? (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Info className="text-slate-400 flex-shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Consentimiento retirado</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {`Retirado el ${new Date(healthConsentWithdrawnAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-2">
                  {`Puedes retirar tu consentimiento para el tratamiento de datos de salud en cualquier momento (Art. 7.3 y Art. 9 RGPD).`}
                </p>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {`Retirar el consentimiento no elimina tus datos ya tratados, ya que la legislaci\u00f3n sanitaria (Ley 41/2002) obliga a conservar el historial cl\u00ednico durante un m\u00ednimo de 5 a\u00f1os. Sin embargo, se bloquear\u00e1 cualquier nuevo procesamiento de tus datos de salud.`}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmWithdrawHealthConsent(true)}
                  className="px-5 py-2.5 rounded-xl border-2 border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition-all duration-200 flex items-center gap-2"
                >
                  <HeartOff size={16} />
                  Retirar consentimiento datos de salud
                </button>
              </>
            )}
          </div>

          {/* Delete account */}
          <div className="border-2 border-red-200 bg-red-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={14} />
              </span>
              Zona de peligro
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {`Eliminar tu cuenta es una acci\u00f3n irreversible. Todos tus datos ser\u00e1n eliminados permanentemente (Art. 17 RGPD \u2014 Derecho de supresi\u00f3n).`}
            </p>
            <button
              onClick={() => { setDeleteAccountPassword(''); setConfirmDeleteAccount(true); }}
              className="px-6 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 cursor-pointer transition-all duration-200 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Eliminar mi cuenta permanentemente
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmWithdrawHealthConsent}
        onClose={() => setConfirmWithdrawHealthConsent(false)}
        onConfirm={async () => {
          await gdprService.withdrawHealthDataConsent();
          setHealthConsentWithdrawnAt(new Date().toISOString());
          toast.success('Consentimiento de datos de salud retirado correctamente');
        }}
        title="Retirar consentimiento de datos de salud"
        message="Esta acci\u00f3n bloquear\u00e1 el procesamiento de tus datos de salud. Tus datos existentes se conservar\u00e1n seg\u00fan la legislaci\u00f3n sanitaria (5 a\u00f1os). \u00bfDeseas continuar?"
        variant="warning"
        confirmLabel="Retirar consentimiento"
      />

      <ConfirmDialog
        open={confirmDeleteAccount}
        onClose={() => { setConfirmDeleteAccount(false); setDeleteAccountPassword(''); }}
        onConfirm={async () => {
          if (!deleteAccountPassword.trim()) {
            toast.error('Debes introducir tu contrase\u00f1a');
            throw new Error('empty password');
          }
          await gdprService.deleteAccount(deleteAccountPassword);
          toast.success('Cuenta eliminada correctamente');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.reload();
        }}
        title="Eliminar cuenta"
        message="Esta acci\u00f3n es IRREVERSIBLE y todos tus datos ser\u00e1n eliminados permanentemente. Introduce tu contrase\u00f1a para confirmar."
        variant="danger"
        confirmLabel="Eliminar cuenta"
      >
        <input
          type="password"
          value={deleteAccountPassword}
          onChange={(e) => setDeleteAccountPassword(e.target.value)}
          placeholder="Tu contrase\u00f1a"
          className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all duration-200 placeholder:text-slate-500 mt-3"
          autoFocus
        />
      </ConfirmDialog>
    </div>
  );
}
