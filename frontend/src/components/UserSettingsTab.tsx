import { useState, useEffect, lazy, Suspense } from 'react';
import { profileService, authService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';

const BillingPortal = lazy(() => import('./BillingPortal'));
const TwoFactorSetup = lazy(() => import('./TwoFactorSetup'));

type SettingsSection = 'perfil' | 'seguridad' | 'pagos' | 'privacidad';

interface UserSettingsTabProps {
  me: any;
  onBack: () => void;
  onMeUpdate: (updatedMe: any) => void;
}

export default function UserSettingsTab({ me, onBack, onMeUpdate }: UserSettingsTabProps) {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('perfil');
  const [editProfileForm, setEditProfileForm] = useState({ name: '', gender: '', birthDate: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (me) {
      setEditProfileForm({
        name: me.name ?? '',
        gender: me.gender ?? '',
        birthDate: me.birthDate ? (typeof me.birthDate === 'string' ? me.birthDate.slice(0, 10) : '') : '',
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
          <span className="material-symbols-outlined text-xl text-slate-500">arrow_back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue to-gantly-blue-600 flex items-center justify-center shadow-sm shadow-gantly-blue/20">
            <span className="material-symbols-outlined text-white text-lg">settings</span>
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
          { id: 'perfil' as SettingsSection, icon: 'person', label: 'Perfil' },
          { id: 'seguridad' as SettingsSection, icon: 'lock', label: 'Seguridad' },
          { id: 'pagos' as SettingsSection, icon: 'receipt_long', label: 'Pagos' },
          { id: 'privacidad' as SettingsSection, icon: 'shield', label: 'Privacidad' },
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
            <span className="material-symbols-outlined text-base">{s.icon}</span>
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
                        toast.error(err.response?.data?.error || 'Error al subir la foto');
                      } finally {
                        setUploadingAvatar(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-sm text-white font-medium hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300">
                    <span className="material-symbols-outlined text-base">upload</span>
                    {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                  </span>
                </label>
                <p className="text-xs text-slate-400">{`JPG, PNG. M\u00e1ximo 10MB.`}</p>
              </div>
            </div>
          </div>

          {/* Personal info card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">{`Informaci\u00f3n personal`}</h3>
            <div className="space-y-4">
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
                      const ageFromBirth = editProfileForm.birthDate
                        ? Math.floor((Date.now() - new Date(editProfileForm.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : undefined;
                      onMeUpdate({
                        ...me,
                        name: editProfileForm.name,
                        gender: editProfileForm.gender,
                        birthDate: editProfileForm.birthDate || undefined,
                        age: ageFromBirth,
                      });
                      toast.success('Perfil actualizado');
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || 'Error al guardar');
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
                    placeholder={`M\u00ednimo 6 caracteres`}
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
                    if (passwordForm.newPassword.length < 6) {
                      toast.error(`La nueva contrase\u00f1a debe tener al menos 6 caracteres`);
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
                <span className="material-symbols-outlined text-gantly-blue text-sm">download</span>
              </span>
              Descargar mis datos
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {`Descarga una copia de todos tus datos en formato JSON (Art. 20 RGPD \u2014 Derecho de portabilidad).`}
            </p>
            <button
              onClick={async () => {
                try {
                  const data = await profileService.exportMyData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mis-datos-psymatch-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Datos exportados correctamente');
                } catch {
                  toast.error('Error al exportar los datos');
                }
              }}
              className="bg-gradient-to-r from-gantly-blue to-gantly-blue-600 hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Descargar mis datos
            </button>
          </div>

          {/* Retention policy */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 text-sm">info</span>
              </span>
              {`Pol\u00edtica de retenci\u00f3n`}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {`Tus datos se conservan durante un m\u00e1ximo de 5 a\u00f1os desde tu registro, conforme a la legislaci\u00f3n sanitaria. Tras ese periodo, tus datos son anonimizados autom\u00e1ticamente.`}
            </p>
          </div>

          {/* Delete account */}
          <div className="border-2 border-red-200 bg-red-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
              </span>
              Zona de peligro
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {`Eliminar tu cuenta es una acci\u00f3n irreversible. Todos tus datos ser\u00e1n eliminados permanentemente (Art. 17 RGPD \u2014 Derecho de supresi\u00f3n).`}
            </p>
            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  `\u00bfEst\u00e1s seguro de que quieres eliminar tu cuenta? Esta acci\u00f3n es IRREVERSIBLE y todos tus datos ser\u00e1n eliminados permanentemente.`
                );
                if (!confirmed) return;
                const doubleConfirmed = window.confirm(
                  `\u00daltima confirmaci\u00f3n: \u00bfRealmente deseas eliminar tu cuenta y todos tus datos?`
                );
                if (!doubleConfirmed) return;
                try {
                  await profileService.deleteMyAccount();
                  toast.success('Cuenta eliminada correctamente');
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  window.location.reload();
                } catch {
                  toast.error('Error al eliminar la cuenta');
                }
              }}
              className="px-6 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 cursor-pointer transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">delete_forever</span>
              Eliminar mi cuenta permanentemente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
