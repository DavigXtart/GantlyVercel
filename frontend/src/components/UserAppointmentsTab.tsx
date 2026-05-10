import { useState, useEffect } from 'react';
import { CalendarDays, History } from 'lucide-react';
import { calendarService } from '../services/api';
import EmptyState from './ui/EmptyState';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';

interface UserAppointmentsTabProps {
  setTab: (tab: string) => void;
}

export default function UserAppointmentsTab({ setTab }: UserAppointmentsTabProps) {
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);

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
        <LoadingSpinner text="Cargando historial de citas..." />
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
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(apt.startTime).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
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
                    {/* Cancel button for upcoming, non-cancelled appointments */}
                    {!isCancelled && new Date(apt.startTime) > new Date() && (
                      <button
                        onClick={async () => {
                          if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;
                          try {
                            await calendarService.cancelAppointment(apt.id);
                            toast.success('Cita cancelada correctamente');
                            await loadPastAppointments();
                          } catch (err: any) {
                            toast.error(err.response?.data?.error || 'Error al cancelar la cita');
                          }
                        }}
                        className="text-xs px-3 py-1 rounded-full font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
