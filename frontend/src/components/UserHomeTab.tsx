import { useState, useEffect, type ReactNode } from 'react';
import {
  CheckSquare, ClipboardList, CalendarDays, BarChart3, FileText,
  Compass, MessageCircle, Settings, ArrowRight, ChevronRight,
  TrendingUp, CalendarCheck, Plus, Video, Check,
} from 'lucide-react';
import { jitsiService, personalAgendaService } from '../services/api';
import { toast } from './ui/Toast';
import MoodFace from './ui/MoodFace';

interface UserHomeTabProps {
  me: any;
  tasks: any[];
  assignedTests: any[];
  upcomingAppointment: any;
  hasPsychologist: boolean;
  setTab: (tab: string) => void;
  setShowVideoCall: (show: boolean) => void;
  setVideoCallRoom: (room: string | null) => void;
  setVideoCallOtherUser: (user: { email: string; name: string } | null) => void;
}

export default function UserHomeTab({
  me,
  tasks,
  assignedTests,
  upcomingAppointment,
  hasPsychologist,
  setTab,
  setShowVideoCall,
  setVideoCallRoom,
  setVideoCallOtherUser,
}: UserHomeTabProps) {
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null);

  // Check if user already logged mood today
  useEffect(() => {
    (async () => {
      try {
        const res = await personalAgendaService.getTodayEntry();
        if (res.entry) {
          setTodayMood(res.entry.moodRating);
          setMoodSubmitted(true);
        }
      } catch {
        // no entry today — that's fine
      }
    })();
  }, []);

  const handleQuickMood = async (rating: number) => {
    if (moodLoading || moodSubmitted) return;
    setMoodLoading(true);
    try {
      await personalAgendaService.saveEntry({
        moodRating: rating,
        emotions: [],
        activities: [],
        companions: [],
        location: '',
        notes: '',
      });
      setTodayMood(rating);
      setMoodSubmitted(true);
    } catch {
      toast.error('No se pudo registrar tu estado de animo');
    } finally {
      setMoodLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6">
      {/* Quick mood widget — UX-6 */}
      {!moodSubmitted ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row items-center gap-4">
          <p className="text-sm font-heading font-semibold text-slate-700 whitespace-nowrap">
            ¿Como te sientes hoy?
          </p>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                disabled={moodLoading}
                onClick={() => handleQuickMood(val)}
                className="cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 rounded-full"
                aria-label={['Muy triste', 'Triste', 'Neutral', 'Feliz', 'Muy feliz'][val - 1]}
              >
                <MoodFace value={val} size={40} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTab('agenda-personal')}
            className="text-xs text-gantly-blue hover:text-gantly-blue/80 font-medium cursor-pointer transition-colors ml-auto whitespace-nowrap"
          >
            Registro completo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          {todayMood && <MoodFace value={todayMood} size={32} />}
          <div className="flex items-center gap-2 text-sm text-gantly-emerald font-medium">
            <Check size={16} />
            Registrado
          </div>
          <button
            type="button"
            onClick={() => setTab('agenda-personal')}
            className="text-xs text-gantly-blue hover:text-gantly-blue/80 font-medium cursor-pointer transition-colors ml-auto whitespace-nowrap"
          >
            Ver agenda personal
          </button>
        </div>
      )}

      {/* Hero welcome — compact asymmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main greeting — spans 7 cols */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-3xl p-7 md:p-9 shadow-2xl shadow-gantly-blue/15 bg-gradient-brand">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gantly-cyan/10 rounded-full blur-xl" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl shadow-black/20 flex-shrink-0 bg-white/10 flex items-center justify-center">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt={me.name || 'Usuario'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-white font-heading font-bold">{me?.name ? me.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-white truncate">
                {getGreeting()}, {me?.name?.split(' ')[0] || 'usuario'}
              </h1>
              <p className="text-white/70 mt-1 text-sm font-body truncate">
                {upcomingAppointment
                  ? `Proxima cita: ${new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', { weekday: 'long' })} ${new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </p>
              <div className="flex flex-wrap gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setTab('calendario')}
                  className="bg-white text-gantly-text hover:bg-white/90 rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-black/10 flex items-center gap-2"
                >
                  <CalendarDays size={16} />
                  Calendario
                </button>
                {hasPsychologist && (
                  <button
                    type="button"
                    onClick={() => setTab('chat')}
                    className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 border border-white/20 flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                )}
              </div>
            </div>
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
                  {new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm text-gantly-muted mt-1 font-body">
                  {new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {upcomingAppointment.psychologist && <span className="ml-1">· {upcomingAppointment.psychologist.name}</span>}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-heading font-semibold text-gantly-text">Sin citas programadas</p>
                <p className="text-sm text-gantly-muted mt-1 font-body">Agenda una sesion cuando lo necesites</p>
              </>
            )}
          </div>
          <div className="relative mt-4">
            {upcomingAppointment?.paymentStatus === 'PAID' ? (
              <button
                type="button"
                className="w-full px-4 py-2.5 bg-gantly-emerald text-white text-sm font-heading font-semibold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gantly-emerald/25 transition-all duration-300 flex items-center justify-center gap-2"
                onClick={async () => {
                  const apt = upcomingAppointment;
                  if (me && apt?.psychologist) {
                    try {
                      const roomInfo = await jitsiService.getRoomInfo(apt.psychologist.email);
                      setVideoCallRoom(roomInfo.roomName);
                      setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                      setShowVideoCall(true);
                    } catch (error: any) {
                      toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                    }
                  }
                }}
              >
                <Video size={16} />
                Unirse a la llamada
              </button>
            ) : upcomingAppointment ? (
              <div className="w-full px-4 py-2.5 bg-gantly-gold/10 text-gantly-gold-700 text-sm font-body font-medium rounded-xl text-center border border-gantly-gold/20">
                Pago pendiente
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTab('calendario')}
                className="w-full px-4 py-2.5 bg-gantly-cloud text-gantly-blue text-sm font-heading font-semibold rounded-xl cursor-pointer hover:bg-gantly-blue hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Agendar cita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asymmetric bento — varied card sizes */}
      <div className="grid grid-cols-6 lg:grid-cols-12 gap-5">
        {/* Tasks — large horizontal card spanning 7 cols */}
        <button
          type="button"
          onClick={() => setTab('tareas')}
          className="col-span-6 lg:col-span-7 group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gantly-blue/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-blue/30 text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gantly-blue/[0.02] to-transparent" />
          <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-gantly-blue/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
              <CheckSquare size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-heading font-extrabold text-gantly-text">{tasks.filter((t) => !t.completedAt).length}</span>
                <span className="text-sm font-body text-gantly-muted">tareas pendientes</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gantly-cloud rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-full transition-all duration-500"
                    style={{ width: `${tasks.length > 0 ? (tasks.filter((t) => t.completedAt).length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-body text-gantly-muted whitespace-nowrap">
                  {tasks.filter((t) => t.completedAt).length}/{tasks.length} completadas
                </span>
              </div>
            </div>
            <ArrowRight size={24} className="text-gantly-muted/40 group-hover:text-gantly-blue group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </button>

        {/* Tests + Settings stacked — 5 cols */}
        <div className="col-span-6 lg:col-span-5 grid grid-rows-2 gap-5">
          <button
            type="button"
            onClick={() => setTab('tests-pendientes')}
            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-gold/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-gold/30 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-gold/5 rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gantly-gold flex items-center justify-center shadow-md shadow-gantly-gold/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <ClipboardList size={18} className="text-gantly-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-2xl font-heading font-extrabold text-gantly-text">{assignedTests.filter((t) => !t.completedAt).length}</span>
                <p className="text-xs text-gantly-muted font-body font-medium">Tests pendientes</p>
              </div>
              <ChevronRight size={24} className="text-gantly-muted/30 group-hover:text-gantly-gold-600 transition-colors" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab('configuracion')}
            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-navy/5 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-navy/20 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-navy/[0.03] rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gantly-navy flex items-center justify-center shadow-md shadow-gantly-navy/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Settings size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-heading font-bold text-gantly-text">Configuracion</span>
                <p className="text-xs text-gantly-muted font-body font-medium">Ajustes de cuenta</p>
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
          <h3 className="text-lg font-heading font-bold text-gantly-text">Explora</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Featured card — statistics (wider) */}
          <button
            type="button"
            onClick={() => setTab('mis-estadisticas')}
            className="md:col-span-5 group relative rounded-2xl p-7 border border-gantly-blue/10 hover:border-gantly-blue/30 hover:shadow-xl hover:shadow-gantly-blue/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #F0F8FF 0%, #ffffff 40%, #ECFEFF 100%)' }}
          >
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gantly-blue/5 rounded-full group-hover:scale-[2] transition-transform duration-700" />
            <div className="absolute top-4 right-4 w-20 h-20 border border-gantly-blue/10 rounded-full group-hover:scale-125 group-hover:rotate-45 transition-all duration-700" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:rotate-6 transition-transform duration-300">
                <BarChart3 size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-blue transition-colors">Mis estadisticas</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body leading-relaxed">Visualiza tu progreso y bienestar a lo largo del tiempo</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-blue font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Ver progreso <TrendingUp size={14} />
              </span>
            </div>
          </button>

          {/* Evaluaciones — medium */}
          <button
            type="button"
            onClick={() => setTab('evaluaciones')}
            className="md:col-span-4 group relative bg-white rounded-2xl p-7 border border-gantly-gold/10 hover:border-gantly-gold/30 hover:shadow-xl hover:shadow-gantly-gold/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gantly-gold/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gantly-gold flex items-center justify-center shadow-lg shadow-gantly-gold/20 group-hover:rotate-6 transition-transform duration-300">
                <FileText size={20} className="text-gantly-navy" />
              </div>
              <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-gold-700 transition-colors">Evaluaciones</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body">Tests clinicos y resultados</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-gold-700 font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Completar <ArrowRight size={14} />
              </span>
            </div>
          </button>

          {/* Descubrimiento — narrow, taller feel */}
          <button
            type="button"
            onClick={() => setTab('descubrimiento')}
            className="md:col-span-3 group relative bg-white rounded-2xl p-7 border border-gantly-emerald/10 hover:border-gantly-emerald/30 hover:shadow-xl hover:shadow-gantly-emerald/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gantly-emerald/[0.03] to-transparent rounded-b-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gantly-emerald flex items-center justify-center shadow-lg shadow-gantly-emerald/20 group-hover:rotate-6 transition-transform duration-300">
                <Compass size={20} className="text-white" />
              </div>
              <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-emerald transition-colors">Descubrir</h3>
              <p className="text-sm text-gantly-muted mt-1 font-body">Insights personalizados</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-gantly-emerald font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                Explorar <ArrowRight size={14} />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
