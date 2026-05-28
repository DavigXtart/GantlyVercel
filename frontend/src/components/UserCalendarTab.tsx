import { useState, useEffect } from 'react';
import { CalendarDays, MessageCircle, FileText, Download } from 'lucide-react';
import { calendarService, stripeService } from '../services/api';
import CalendarWeek from './CalendarWeek';
import EmptyState from './ui/EmptyState';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';

interface UserCalendarTabProps {
  hasPsychologist: boolean;
  setTab: (tab: string) => void;
}

export default function UserCalendarTab({
  hasPsychologist,
  setTab,
}: UserCalendarTabProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const loadAvailability = async () => {
    try {
      setLoadingSlots(true);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const list = await calendarService.availability(
        from.toISOString(),
        to.toISOString(),
      );
      setSlots(list);
      try {
        const appointments = await calendarService.myAppointments();
        const validAppointments = appointments.filter(
          (apt: any) => apt.startTime && apt.endTime,
        );
        setMyAppointments(validAppointments);
      } catch {
        // error handled silently
      }
    } catch {
      toast.error('Error al cargar el calendario');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (hasPsychologist) {
      loadAvailability();
    }
  }, [hasPsychologist]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
          <CalendarDays size={20} className="text-gantly-blue" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gantly-text">Calendario</h2>
        {myAppointments.length > 0 && (
          <button
            type="button"
            onClick={() => calendarService.exportIcal().catch(() => toast.error('Error al exportar'))}
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
            title="Exportar citas a calendario externo (iCal)"
          >
            <Download size={14} />
            Exportar a calendario
          </button>
        )}
      </div>
      {loadingSlots ? (
        <LoadingSpinner />
      ) : (
        <CalendarWeek
          mode="USER"
          slots={slots}
          myAppointments={myAppointments}
          onBook={async (id) => {
            try {
              const result = await calendarService.book(id);
              if ((result as any).error) {
                toast.error((result as any).error);
                return;
              }
              await loadAvailability();
              toast.success(
                'Cita reservada exitosamente. Espera la confirmación del psicólogo.',
              );
            } catch (e: any) {
              const errorMsg =
                e.response?.data?.error || 'Error al reservar la cita';
              toast.error(errorMsg);
            }
          }}
        />
      )}

      {!loadingSlots && myAppointments.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6" data-section="mis-citas">
          <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-gantly-blue" />
            Mis citas
          </h3>

          <div className="space-y-3">
            {myAppointments.map((apt) => {
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
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(apt.startTime).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
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
                      {isConfirmed && apt.paymentStatus === 'PENDING' && (
                        <button
                          className="text-xs px-4 py-2 rounded-xl font-medium bg-gantly-blue text-white hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const { url } = await stripeService.createAppointmentCheckout(apt.id);
                              if (!url || !url.startsWith('https://checkout.stripe.com')) {
                                console.error('Invalid Stripe URL:', url);
                                alert('Error: URL de pago no valida');
                                return;
                              }
                              window.location.href = url;
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Error al iniciar el pago');
                            }
                          }}
                        >
                          Pagar {apt.price ? `${apt.price}\u20AC` : ''}
                        </button>
                      )}
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClasses}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                  {/* Pre-session notes from psychologist — UX-8 */}
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

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="text-sm text-gantly-blue hover:text-gantly-blue/80 font-heading font-semibold cursor-pointer transition-colors duration-200"
              onClick={() => {
                setTab('mis-citas');
              }}
            >
              Ver historial completo
            </button>
          </div>
        </div>
      )}

      {!loadingSlots && slots.length === 0 && myAppointments.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12 text-gantly-blue/40" />}
          title="Sin disponibilidad"
          description="Tu psicólogo aún no ha publicado horarios disponibles. Contacta por chat para coordinar tu primera cita."
          action={hasPsychologist ? (
            <button
              type="button"
              onClick={() => setTab('chat')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20"
            >
              <MessageCircle size={16} />
              Ir al chat
            </button>
          ) : undefined}
        />
      )}
    </div>
  );
}
