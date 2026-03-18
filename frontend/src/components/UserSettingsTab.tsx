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
          className="p-2 rounded-xl hover:bg-sage/10 transition-colors"
        >
          <span className="material-symbols-outlined text-xl text-sage">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-forest">{`Configuraci\u00f3n`}</h1>
          <p className="text-sm text-sage/60">Gestiona tu cuenta, seguridad y privacidad</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-sage/5 rounded-2xl p-1.5 mb-8">
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              settingsSection === s.id
                ? 'bg-white text-forest shadow-sm'
                : 'text-sage/60 hover:text-sage'
            }`}
          >
            <span className="material-symbols-outlined text-base">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* === SECTION: Perfil === */}
      {settingsSection === 'perfil' && (
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">Foto de perfil</h3>
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full overflow-hidden border-2 border-sage/15 bg-sage/5 flex items-center justify-center flex-shrink-0">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-forest font-semibold">
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
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage/10 text-sm text-sage font-medium hover:bg-sage/20 transition cursor-pointer">
                    <span className="material-symbols-outlined text-base">upload</span>
                    {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                  </span>
                </label>
                <p className="text-xs text-sage/40">{`JPG, PNG. M\u00e1ximo 10MB.`}</p>
              </div>
            </div>
          </div>

          {/* Personal info card */}
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">{`Informaci\u00f3n personal`}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">{`G\u00e9nero`}</label>
                  <select
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
                  >
                    <option value="">No especificado</option>
                    <option value="MALE">Hombre</option>
                    <option value="FEMALE">Mujer</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={editProfileForm.birthDate}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
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
                  className="px-6 py-2.5 rounded-xl bg-sage text-white text-sm font-medium hover:bg-sage/90 transition disabled:opacity-60"
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
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">{`Cambiar contrase\u00f1a`}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest mb-1.5">{`Contrase\u00f1a actual`}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">{`Nueva contrase\u00f1a`}</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
                    placeholder={`M\u00ednimo 6 caracteres`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest mb-1.5">{`Confirmar contrase\u00f1a`}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-sage/15 bg-cream/30 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none transition text-sm"
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
                  className="px-6 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-forest/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Guardando...' : `Cambiar contrase\u00f1a`}
                </button>
              </div>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">{`Autenticaci\u00f3n en dos pasos`}</h3>
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
        <div className="bg-white rounded-2xl p-6 border border-sage/10">
          <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">{`Facturaci\u00f3n y pagos`}</h3>
          <Suspense fallback={<LoadingSpinner />}>
            <BillingPortal />
          </Suspense>
        </div>
      )}

      {/* === SECTION: Privacidad === */}
      {settingsSection === 'privacidad' && (
        <div className="space-y-6">
          {/* Export data */}
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">Descargar mis datos</h3>
            <p className="text-sage/60 text-sm mb-4">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest/90 transition"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Descargar mis datos
            </button>
          </div>

          {/* Retention policy */}
          <div className="bg-white rounded-2xl p-6 border border-sage/10">
            <h3 className="text-sm font-semibold text-forest/50 uppercase tracking-wider mb-5">{`Pol\u00edtica de retenci\u00f3n`}</h3>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-sage/40 mt-0.5">info</span>
              <p className="text-sage/60 text-sm leading-relaxed">
                {`Tus datos se conservan durante un m\u00e1ximo de 5 a\u00f1os desde tu registro, conforme a la legislaci\u00f3n sanitaria. Tras ese periodo, tus datos son anonimizados autom\u00e1ticamente.`}
              </p>
            </div>
          </div>

          {/* Delete account */}
          <div className="bg-white rounded-2xl p-6 border border-red-100">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Zona de peligro</h3>
            <p className="text-sage/60 text-sm mb-4">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition"
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
