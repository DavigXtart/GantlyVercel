import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Camera, CalendarDays, Calendar, Users, CheckSquare, Clock, AlertCircle,
  ArrowRight, ChevronRight, CalendarCheck, Video, UserPlus, Settings,
  Star, FileText, BarChart3, TrendingUp, X,
} from 'lucide-react';
import { psychService, jitsiService } from '../services/api';
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
    if (h >= 6 && h < 12) return 'Buenos días';
    if (h >= 12 && h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const upcomingAppointment = slots
    .filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user)
    .filter(apt => apt.startTime && new Date(apt.startTime) > new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const pendingTasksCount = tasks.filter(t => t.createdBy === 'PSYCHOLOGIST' && !t.completedAt).length;
  const totalTasks = tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length;
  const completedTasks = tasks.filter(t => t.createdBy === 'PSYCHOLOGIST' && t.completedAt).length;
  const upcomingCount = slots.filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user && new Date(s.startTime) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Hero welcome — compact asymmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main greeting — spans 7 cols */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-3xl p-7 md:p-9 shadow-2xl shadow-gantly-blue/15 bg-gradient-brand">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gantly-cyan/10 rounded-full blur-xl" />
          <div className="relative z-10 flex items-center gap-5">
            <label className="cursor-pointer relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl shadow-black/20 bg-white/10 flex items-center justify-center">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt={me.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-white font-heading font-bold">
                    {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Camera size={20} className="text-white" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </label>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-white truncate">
                {getGreeting()}, {me?.name?.split(' ')[0] || 'Profesional'}
              </h1>
              <p className="text-white/70 mt-1 text-sm font-body truncate">
                {me?.email}
                {me?.createdAt && (
                  <span> · Miembro desde {new Date(me.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                )}
              </p>
              {myRating && myRating.averageRating !== null && (
                <div
                  onClick={onShowRatingsModal}
                  className="flex items-center gap-1.5 mt-2 cursor-pointer"
                  title={myRating.totalRatings > 0 ? 'Click para ver todas las resenas' : undefined}
                >
                  <span className="text-gantly-gold text-sm">
                    {'★'.repeat(Math.round(myRating.averageRating))}{'☆'.repeat(5 - Math.round(myRating.averageRating))}
                  </span>
                  <span className="text-sm text-white/70 font-medium font-body">
                    {myRating.averageRating.toFixed(1)} ({myRating.totalRatings})
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => onNavigateTab('calendario')}
                  className="bg-white text-gantly-text hover:bg-white/90 rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-black/10 flex items-center gap-2"
                >
                  <CalendarDays size={16} />
                  Calendario
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onLoadPsychologistProfile();
                    onNavigateTab('editar-perfil-profesional');
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 border border-white/20 flex items-center gap-2"
                >
                  <Settings size={16} />
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>

          {/* Toggle aceptando pacientes */}
          <div className="relative z-10 flex items-center gap-3 mt-5 pt-5 border-t border-white/10">
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
                    toast.error('No se pudo actualizar la disponibilidad. Inténtalo de nuevo.');
                  }
                }}
                className="sr-only"
              />
              <span className={`absolute inset-0 rounded-full transition-colors duration-200 ${me?.isFull ? 'bg-red-400' : 'bg-gantly-emerald'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${me?.isFull ? 'translate-x-4' : ''}`} />
              </span>
            </label>
            <span className="text-sm text-white/80 font-body">
              {me?.isFull ? 'Agenda llena — no apareces en recomendaciones' : 'Aceptando nuevos pacientes'}
            </span>
          </div>
        </div>

        {/* Appointment spotlight — spans 5 cols */}
        <div className="lg:col-span-5 relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gantly-emerald/5 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gantly-emerald/10 flex items-center justify-center">
                <CalendarCheck size={18} className="text-gantly-emerald" />
              </div>
              <span className="text-xs font-body font-semibold text-gantly-emerald uppercase tracking-wider">Proxima cita</span>
            </div>
            {upcomingAppointment ? (
              <>
                <p className="text-2xl font-heading font-bold text-gantly-text">
                  {new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm text-gantly-muted mt-1 font-body">
                  {new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {upcomingAppointment.user && <span className="ml-1">· {upcomingAppointment.user.name || upcomingAppointment.user.email}</span>}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-heading font-semibold text-gantly-text">Sin citas programadas</p>
                <p className="text-sm text-gantly-muted mt-1 font-body">Publica horarios en tu calendario</p>
              </>
            )}
          </div>
          <div className="relative mt-4">
            {upcomingAppointment ? (
              <button
                type="button"
                className="w-full px-4 py-2.5 bg-gantly-emerald text-white text-sm font-heading font-semibold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gantly-emerald/25 transition-all duration-300 flex items-center justify-center gap-2"
                onClick={async () => {
                  if (me && upcomingAppointment.user) {
                    try {
                      const roomInfo = await jitsiService.getRoomInfo(upcomingAppointment.user.email);
                      onStartVideoCall(roomInfo.roomName, { email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                    } catch (error: any) {
                      toast.error('No se pudo iniciar la videollamada. Verifica que tengas una cita activa.');
                    }
                  }
                }}
              >
                <Video size={16} />
                Iniciar Videollamada
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('calendario')}
                className="w-full px-4 py-2.5 bg-gantly-cloud text-gantly-blue text-sm font-heading font-semibold rounded-xl cursor-pointer hover:bg-gantly-blue hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Ir al calendario
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Matching test warning */}
      {matchingTestCompleted === false && (
        <div className="p-5 bg-gantly-gold/10 border border-gantly-gold/20 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gantly-gold flex items-center justify-center shadow-md shadow-gantly-gold/20 flex-shrink-0">
                <AlertCircle size={18} className="text-gantly-navy" />
              </div>
              <div>
                <h3 className="text-base font-heading font-semibold text-gantly-text mb-0.5">
                  Test de Matching Pendiente
                </h3>
                <p className="text-sm font-body text-gantly-muted m-0">
                  Completa el test para que los pacientes puedan encontrarte.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('matching-test')}
              className="px-5 py-2.5 bg-gantly-gold text-gantly-navy rounded-xl font-heading font-medium hover:bg-gantly-gold/90 transition-all duration-300 cursor-pointer text-sm whitespace-nowrap shadow-lg shadow-gantly-gold/20 border-none"
            >
              Completar Test
            </button>
          </div>
        </div>
      )}

      {/* Asymmetric bento — varied card sizes */}
      <div className="grid grid-cols-6 lg:grid-cols-12 gap-5">
        {/* Patients — large horizontal card spanning 7 cols */}
        <button
          type="button"
          onClick={() => onNavigateTab('pacientes')}
          className="col-span-6 lg:col-span-7 group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gantly-blue/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-blue/30 text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gantly-blue/[0.02] to-transparent" />
          <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-gantly-blue/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-heading font-extrabold text-gantly-text">{patients.length}</span>
                <span className="text-sm font-body text-gantly-muted">pacientes activos</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-body text-gantly-muted">
                  {upcomingCount} citas pendientes
                </span>
                {pendingRequests.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-gantly-gold bg-gantly-gold/10 px-2 py-0.5 rounded-full">
                    <Clock size={12} />
                    {pendingRequests.length} por confirmar
                  </span>
                )}
              </div>
            </div>
            <ArrowRight size={24} className="text-gantly-muted/40 group-hover:text-gantly-blue group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </button>

        {/* Tasks + Pending Requests stacked — 5 cols */}
        <div className="col-span-6 lg:col-span-5 grid grid-rows-2 gap-5">
          <button
            type="button"
            onClick={() => onNavigateTab('tareas')}
            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-emerald/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-emerald/30 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-emerald/5 rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gantly-emerald flex items-center justify-center shadow-md shadow-gantly-emerald/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <CheckSquare size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-2xl font-heading font-extrabold text-gantly-text">{pendingTasksCount}</span>
                <p className="text-xs text-gantly-muted font-body font-medium">Tareas activas</p>
              </div>
              <ChevronRight size={24} className="text-gantly-muted/30 group-hover:text-gantly-emerald transition-colors" />
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const referral = await psychService.getReferralUrl();
                if (referral && referral.referralCode && referral.fullUrl) {
                  setReferralCode(referral.referralCode);
                  setReferralUrl(referral.fullUrl);
                  setShowReferralModal(true);
                } else {
                  toast.error('No se pudo obtener el código de referencia.');
                }
              } catch (error: any) {
                toast.error('No se pudo obtener el enlace de referencia. Inténtalo de nuevo.');
              }
            }}
            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-navy/5 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-navy/20 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-navy/[0.03] rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gantly-navy flex items-center justify-center shadow-md shadow-gantly-navy/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <UserPlus size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-heading font-bold text-gantly-text">Invitar Paciente</span>
                <p className="text-xs text-gantly-muted font-body font-medium">Enlace de referencia</p>
              </div>
              <ChevronRight size={24} className="text-gantly-muted/30 group-hover:text-gantly-navy transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Explore section — asymmetric 3-card layout */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-gantly-blue to-gantly-cyan" />
          <h3 className="text-lg font-heading font-bold text-gantly-text">Acceso rápido</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Calendar — wider */}
          <button
            type="button"
            onClick={() => onNavigateTab('calendario')}
            className="md:col-span-5 group relative rounded-2xl p-7 border border-gantly-blue/10 hover:border-gantly-blue/30 hover:shadow-xl hover:shadow-gantly-blue/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #F0F8FF 0%, #ffffff 40%, #ECFEFF 100%)' }}
          >
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gantly-blue/5 rounded-full group-hover:scale-[2] transition-transform duration-700" />
            <div className="absolute top-4 right-4 w-20 h-20 border border-gantly-blue/10 rounded-full group-hover:scale-125 group-hover:rotate-45 transition-all duration-700" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:rotate-6 transition-transform duration-300">
                <CalendarDays size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-blue transition-colors">Calendario</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body leading-relaxed">
                {upcomingCount > 0
                  ? `${upcomingCount} citas programadas`
                  : 'Gestiona tus horarios y citas'}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-blue font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Ver agenda <TrendingUp size={14} />
              </span>
            </div>
          </button>

          {/* Tests assigned — medium */}
          <button
            type="button"
            onClick={() => onNavigateTab('tests-asignados')}
            className="md:col-span-4 group relative bg-white rounded-2xl p-7 border border-gantly-gold/10 hover:border-gantly-gold/30 hover:shadow-xl hover:shadow-gantly-gold/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gantly-gold/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gantly-gold flex items-center justify-center shadow-lg shadow-gantly-gold/20 group-hover:rotate-6 transition-transform duration-300">
                <FileText size={20} className="text-gantly-navy" />
              </div>
              <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-gold-700 transition-colors">Tests</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body">Asigna y revisa resultados</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-gold-700 font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Gestionar <ArrowRight size={14} />
              </span>
            </div>
          </button>

          {/* Billing — narrow */}
          <button
            type="button"
            onClick={() => onNavigateTab('facturacion')}
            className="md:col-span-3 group relative bg-white rounded-2xl p-7 border border-gantly-emerald/10 hover:border-gantly-emerald/30 hover:shadow-xl hover:shadow-gantly-emerald/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gantly-emerald/[0.03] to-transparent rounded-b-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gantly-emerald flex items-center justify-center shadow-lg shadow-gantly-emerald/20 group-hover:rotate-6 transition-transform duration-300">
                <BarChart3 size={20} className="text-white" />
              </div>
              <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-emerald transition-colors">Facturacion</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body">Ingresos y sesiones</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-emerald font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Ver detalle <ArrowRight size={14} />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Referral Modal */}
      {showReferralModal && referralCode && referralUrl && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowReferralModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl shadow-slate-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-heading font-bold text-gantly-text m-0">Invitar Paciente</h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none text-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4 font-body">
              Comparte este enlace con tus pacientes para que se unan directamente a tu consulta:
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">Enlace de invitacion</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white"
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
                  className="px-3 py-2 bg-gantly-blue text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">Código de referencia</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralCode);
                      toast.success('Código copiado al portapapeles');
                    } catch {
                      toast.error('Error al copiar el código');
                    }
                  }}
                  className="px-3 py-2 bg-gantly-blue text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
                >
                  Copiar
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-body">
              Los pacientes que usen este enlace o codigo se uniran automaticamente a tu consulta como pacientes asignados.
            </p>

            <button
              onClick={() => setShowReferralModal(false)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
