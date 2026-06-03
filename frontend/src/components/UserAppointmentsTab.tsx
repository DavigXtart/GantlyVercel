import { useState, useEffect } from 'react';
import { CalendarDays, History, FileText, RefreshCw } from 'lucide-react';
import { calendarService } from '../services/api';
import EmptyState from './ui/EmptyState';
import LoadingSpinner from './ui/LoadingSpinner';
import ConfirmDialog from './ui/ConfirmDialog';
import { toast } from './ui/Toast';

interface UserAppointmentsTabProps {
  setTab: (tab: string) => void;
}

export default function UserAppointmentsTab({ setTab }: UserAppointmentsTabProps) {
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<number | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeStart, setRescheduleTimeStart] = useState('');
  const [rescheduleTimeEnd, setRescheduleTimeEnd] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const loadPastAppointments = async () => {
    try {
      setLoadingPastAppointments(true);
      const appointments = await calendarService.getPastAppointments();
      setPastAppointments(appointments || []);
    } catch (err: any) {
      toast.error(
        'Error al cargar las citas pasadas: ' +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoadingPastAppointments(false);
    }
  };

  useEffect(() => {
    loadPastAppointments();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Historial de citas
      </h2>

      {loadingPastAppointments ? (
        <LoadingSpinner />
      ) : pastAppointments.length === 0 ? (
        <EmptyState
          icon={<History className="w-12 h-12 text-slate-300" />}
          title="Sin historial de citas"
          description="Cuando tengas citas completadas, apareceran aqui con opcion de valorar."
          action={
            <button
              type="button"
              onClick={() => setTab('calendario')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20"
            >
              <CalendarDays size={16} />
              Ver calendario
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pastAppointments
            .slice()
            .sort(
              (a, b) =>
                new Date(b.startTime).getTime() -
                new Date(a.startTime).getTime(),
            )
            .map((apt) => {
              const status = apt.status as string | undefined;
              const isBooked = status === 'BOOKED';
              const isConfirmed = status === 'CONFIRMED';
              const isPaid = apt.paymentStatus === 'PAID';
              const isPending = status === 'REQUESTED';
              const isCancelled =
                status === 'CANCELLED' || status === 'CANCELED';

              const statusLabel = isBooked || isPaid
                ? 'Pagada'
                : isConfirmed
                ? 'Pago pendiente'
                : isPending
                ? 'Por confirmar'
                : isCancelled
                ? 'Cancelada'
                : status || 'Programada';

              const statusClasses = isBooked || isPaid
                ? 'bg-gantly-emerald/10 text-gantly-emerald'
                : isConfirmed
                ? 'bg-gantly-gold/10 text-gantly-gold'
                : isPending
                ? 'bg-slate-100 text-slate-600'
                : isCancelled
                ? 'bg-slate-100 text-slate-500'
                : 'bg-gantly-blue/10 text-gantly-blue';

              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(apt.startTime).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {' - '}
                        {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {apt.endTime &&
                          new Date(apt.endTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {apt.psychologist?.name || 'Terapia online'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClasses}`}
                      >
                        {statusLabel}
                      </span>
                      {/* Reschedule + Cancel buttons for upcoming, non-cancelled appointments */}
                      {!isCancelled && new Date(apt.startTime) > new Date() && (isBooked || isConfirmed) && (
                        <button
                          onClick={() => {
                            setRescheduleAppointment(apt);
                            const d = new Date(apt.startTime);
                            setRescheduleDate(d.toISOString().split('T')[0]);
                            setRescheduleTimeStart(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                            const e = new Date(apt.endTime);
                            setRescheduleTimeEnd(e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                          }}
                          className="text-xs px-3 py-1 rounded-full font-medium bg-gantly-blue/10 text-gantly-blue border border-gantly-blue/20 hover:bg-gantly-blue/20 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1"><RefreshCw size={11} /> Reagendar</span>
                        </button>
                      )}
                      {!isCancelled && new Date(apt.startTime) > new Date() && (
                        <button
                          onClick={() => setCancelAppointmentId(apt.id)}
                          className="text-xs px-3 py-1 rounded-full font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  {apt.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <div className="flex items-start gap-2">
                        <FileText size={14} className="text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Notas del profesional:</p>
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{apt.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <ConfirmDialog
        open={cancelAppointmentId !== null}
        onClose={() => setCancelAppointmentId(null)}
        onConfirm={async () => {
          if (cancelAppointmentId === null) return;
          try {
            await calendarService.cancelAppointment(cancelAppointmentId);
            toast.success('Cita cancelada correctamente');
            await loadPastAppointments();
          } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al cancelar la cita');
          }
        }}
        title="Cancelar cita"
        message="¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer."
        variant="danger"
        confirmLabel="Cancelar cita"
      />

      {/* Reschedule dialog */}
      <ConfirmDialog
        open={rescheduleAppointment !== null}
        onClose={() => setRescheduleAppointment(null)}
        onConfirm={async () => {
          if (!rescheduleAppointment || !rescheduleDate || !rescheduleTimeStart || !rescheduleTimeEnd) {
            toast.error('Completa la fecha y hora');
            throw new Error('missing fields');
          }
          try {
            setRescheduling(true);
            const newStart = new Date(`${rescheduleDate}T${rescheduleTimeStart}:00`).toISOString();
            const newEnd = new Date(`${rescheduleDate}T${rescheduleTimeEnd}:00`).toISOString();
            await calendarService.rescheduleAppointment(rescheduleAppointment.id, newStart, newEnd);
            toast.success('Cita reagendada correctamente');
            await loadPastAppointments();
            setRescheduleAppointment(null);
          } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Error al reagendar la cita');
            throw err;
          } finally {
            setRescheduling(false);
          }
        }}
        title="Reagendar cita"
        message="Selecciona la nueva fecha y hora para tu cita. Se notificará al profesional del cambio."
        variant="info"
        confirmLabel={rescheduling ? 'Reagendando...' : 'Confirmar reagendamiento'}
      >
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Nueva fecha</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none bg-slate-50 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Hora inicio</label>
              <input
                type="time"
                value={rescheduleTimeStart}
                onChange={(e) => setRescheduleTimeStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Hora fin</label>
              <input
                type="time"
                value={rescheduleTimeEnd}
                onChange={(e) => setRescheduleTimeEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
