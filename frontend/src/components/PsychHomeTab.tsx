import { useState } from 'react';
import { Camera, CalendarDays, Calendar, Users, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { psychService, calendarService, jitsiService } from '../services/api';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';

interface PsychHomeTabProps {
  me: any;
  patients: any[];
  tasks: any[];
  slots: any[];
  pendingRequests: any[];
  matchingTestCompleted: boolean | null;
  myRating: { averageRating: number | null; totalRatings: number } | null;
  onSetMe: (me: any) => void;
  onNavigateTab: (tab: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowRatingsModal: () => void;
  onStartVideoCall: (room: string, otherUser: { email: string; name: string }) => void;
  onLoadPsychologistProfile: () => Promise<void>;
}

export default function PsychHomeTab({
  me,
  patients,
  tasks,
  slots,
  pendingRequests,
  matchingTestCompleted,
  myRating,
  onSetMe,
  onNavigateTab,
  onAvatarChange,
  onShowRatingsModal,
  onStartVideoCall,
  onLoadPsychologistProfile,
}: PsychHomeTabProps) {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const upcomingAppointment = slots
    .filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user)
    .filter(apt => {
      if (!apt.startTime || !apt.endTime) return false;
      return new Date(apt.startTime) > new Date();
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const kpiCards = [
    {
      label: 'Pacientes',
      value: patients.length,
      icon: Users,
      color: 'text-gantly-blue',
      bg: 'bg-gantly-blue/5',
    },
    {
      label: 'Tareas',
      value: tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length,
      icon: CheckSquare,
      color: 'text-gantly-emerald',
      bg: 'bg-gantly-emerald/5',
    },
    {
      label: 'Por confirmar',
      value: pendingRequests.length,
      icon: Clock,
      color: pendingRequests.length > 0 ? 'text-gantly-gold' : 'text-slate-500',
      bg: pendingRequests.length > 0 ? 'bg-gantly-gold/5' : 'bg-slate-50',
      onClick: () => {
        onNavigateTab('calendario');
        setTimeout(() => {
          const el = document.getElementById('solicitudes-pendientes');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
    },
    {
      label: 'Citas pendientes',
      value: slots.filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user && new Date(s.startTime) > new Date()).length,
      icon: CalendarDays,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile card - flat white */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          {/* Avatar */}
          <label className="cursor-pointer relative group flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gantly-blue/10 flex items-center justify-center">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt={me.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-gantly-blue">
                  {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <Camera size={20} className="text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </label>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-heading font-bold text-slate-800 truncate mb-0.5">
              {getGreeting()}, {me?.name?.split(' ')[0] || 'Profesional'}
            </h1>
            <p className="text-sm text-slate-500 mt-0">
              {me?.email}
              {me?.createdAt && (
                <span className="text-slate-400"> · Miembro desde {new Date(me.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
              )}
            </p>
            {myRating && myRating.averageRating !== null && (
              <div
                onClick={onShowRatingsModal}
                className="flex items-center gap-1.5 mt-1.5 cursor-pointer"
                title={myRating.totalRatings > 0 ? 'Click para ver todas las resenas' : undefined}
              >
                <span className="text-gantly-gold text-sm">
                  {'★'.repeat(Math.round(myRating.averageRating))}{'☆'.repeat(5 - Math.round(myRating.averageRating))}
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  {myRating.averageRating.toFixed(1)} ({myRating.totalRatings} valoraciones)
                </span>
              </div>
            )}
          </div>

          {/* Toggle Aceptando nuevos pacientes */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {me?.isFull ? 'Lleno' : 'Aceptando pacientes'}
              </div>
              <div className="text-[11px] text-slate-500">
                {me?.isFull ? 'No en recomendaciones' : 'En recomendaciones'}
              </div>
            </div>
            <label className="relative inline-block w-9 h-5 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={me?.isFull || false}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  const previousValue = me?.isFull || false;
                  onSetMe({ ...me, isFull: newValue });
                  try {
                    const response: any = await psychService.updateIsFull(newValue);
                    if (response && response.isFull !== undefined) {
                      onSetMe({ ...me, isFull: response.isFull });
                      toast.success(response.isFull ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                    } else {
                      const psychProfile: any = await psychService.getProfile();
                      if (psychProfile && psychProfile.isFull !== undefined) {
                        onSetMe({ ...me, isFull: psychProfile.isFull });
                        toast.success(psychProfile.isFull ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                      } else {
                        toast.success(newValue ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                      }
                    }
                  } catch (error: any) {
                    onSetMe({ ...me, isFull: previousValue });
                    toast.error('Error al actualizar: ' + (error.response?.data?.error || error.message));
                  }
                }}
                className="sr-only"
              />
              <span className={`absolute inset-0 rounded-full transition-colors duration-200 ${me?.isFull ? 'bg-red-400' : 'bg-gantly-emerald'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${me?.isFull ? 'translate-x-4' : ''}`} />
              </span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={async () => {
              await onLoadPsychologistProfile();
              onNavigateTab('editar-perfil-profesional');
            }}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
          >
            Editar Perfil
          </button>
          <button
            onClick={async () => {
              try {
                const referral = await psychService.getReferralUrl();
                if (referral && referral.referralCode && referral.fullUrl) {
                  setReferralCode(referral.referralCode);
                  setReferralUrl(referral.fullUrl);
                  setShowReferralModal(true);
                } else {
                  toast.error('No se pudo obtener el codigo de referencia. Contacta con tu empresa.');
                }
              } catch (error: any) {
                const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
                toast.error('Error al obtener el codigo de referencia: ' + errorMsg);
              }
            }}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
          >
            Invitar Paciente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={kpi.onClick}
              className={`bg-white rounded-xl border border-slate-200/80 p-4 ${kpi.onClick ? 'cursor-pointer hover:border-slate-300' : ''} transition-colors duration-200`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon size={16} className={kpi.color} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Test de Matching - Aviso si no esta completo */}
      {matchingTestCompleted === false && (
        <div className="bg-white rounded-xl border border-gantly-gold/30 p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gantly-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle size={16} className="text-gantly-gold" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-semibold text-slate-800 mb-0.5">
                  Test de Matching Pendiente
                </h3>
                <p className="text-sm text-slate-500 m-0">
                  Completa el test de matching para que los pacientes puedan encontrarte.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('matching-test')}
              className="px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors duration-200 cursor-pointer border-none whitespace-nowrap"
            >
              Completar Test
            </button>
          </div>
        </div>
      )}

      {/* Proxima cita */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="px-0 py-0 mb-4">
          <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <CalendarDays size={14} />
            Proxima cita
          </h3>
        </div>
        {upcomingAppointment ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-base font-heading font-bold text-slate-800">
                {new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                {upcomingAppointment.user && (
                  <span> · {upcomingAppointment.user.name || upcomingAppointment.user.email}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors duration-200 cursor-pointer border-none"
              onClick={async () => {
                if (me && upcomingAppointment.user) {
                  try {
                    const roomInfo = await jitsiService.getRoomInfo(upcomingAppointment.user.email);
                    onStartVideoCall(roomInfo.roomName, { email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                  }
                }
              }}
            >
              Iniciar Videollamada
            </button>
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays className="w-12 h-12 text-gantly-blue/40" />}
            title="Sin citas proximas"
            description="Publica horarios disponibles en tu calendario para que los pacientes puedan reservar."
            action={
              <button
                type="button"
                onClick={() => onNavigateTab('calendario')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gantly-blue text-white text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-gantly-blue/90 border-none"
              >
                <Calendar size={16} />
                Ir al calendario
              </button>
            }
            className="py-6"
          />
        )}
      </div>

      {/* Referral Modal */}
      {showReferralModal && referralCode && referralUrl && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowReferralModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full border border-slate-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-heading font-bold text-slate-800 m-0">Invitar Paciente</h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none text-lg"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Comparte este enlace con tus pacientes para que se unan directamente a tu consulta:
            </p>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">Enlace de invitacion</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 h-9 px-3 rounded-md border border-slate-200 text-sm bg-white"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralUrl);
                      toast.success('Enlace copiado al portapapeles');
                    } catch {
                      toast.error('Error al copiar el enlace');
                    }
                  }}
                  className="px-3 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">Codigo de referencia</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="flex-1 h-9 px-3 rounded-md border border-slate-200 text-sm bg-white font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralCode);
                      toast.success('Codigo copiado al portapapeles');
                    } catch {
                      toast.error('Error al copiar el codigo');
                    }
                  }}
                  className="px-3 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
                >
                  Copiar
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Los pacientes que usen este enlace o codigo se uniran automaticamente a tu consulta como pacientes asignados.
            </p>

            <button
              onClick={() => setShowReferralModal(false)}
              className="w-full px-4 py-2 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
