import { useState } from 'react';
import { Clock, CalendarDays, CalendarOff, Trash2, Plus } from 'lucide-react';
import { calendarService } from '../services/api';
import CalendarWeek from './CalendarWeek';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import Modal from './ui/Modal';

interface PsychCalendarTabProps {
  slots: any[];
  absences: Array<{ id: number; startTime: string; endTime: string; reason?: string }>;
  pendingRequests: any[];
  loadingSlots: boolean;
  psychologistProfile: any;
  patients: any[];
  calendarWeekStart: Date | null;
  onCalendarWeekChange: (weekStart: Date) => void;
  onReloadSlots: () => Promise<void>;
  onReloadPendingRequests: () => Promise<void>;
  onReloadAbsences: () => Promise<void>;
}

export default function PsychCalendarTab({
  slots,
  absences,
  pendingRequests,
  loadingSlots,
  psychologistProfile,
  patients,
  calendarWeekStart,
  onCalendarWeekChange,
  onReloadSlots,
  onReloadPendingRequests,
  onReloadAbsences,
}: PsychCalendarTabProps) {
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [savingAbsence, setSavingAbsence] = useState(false);
  const [confirmAppointmentId, setConfirmAppointmentId] = useState<number | null>(null);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<number | null>(null);
  const [deleteAbsenceId, setDeleteAbsenceId] = useState<number | null>(null);

  if (loadingSlots) {
    return <LoadingSpinner text="Cargando calendario..." />;
  }

  return (
    <div>
      <CalendarWeek
        mode="PSYCHO"
        slots={slots}
        absences={absences}
        initialWeekStart={calendarWeekStart || undefined}
        onWeekChange={onCalendarWeekChange}
        sessionPrices={psychologistProfile?.sessionPrices ? JSON.parse(psychologistProfile.sessionPrices) : null}
        patients={patients.map((p: any) => ({ id: p.id, name: p.name, email: p.email }))}
        onCreateSlot={async (start, end, price, recurrenceRule, recurrenceCount) => {
          try {
            const slotDate = new Date(start);
            const day = (slotDate.getDay() + 6) % 7;
            const slotWeekStart = new Date(slotDate);
            slotWeekStart.setDate(slotDate.getDate() - day);
            slotWeekStart.setHours(0, 0, 0, 0);
            onCalendarWeekChange(slotWeekStart);

            await calendarService.createSlot(start, end, price, recurrenceRule, recurrenceCount);
            await onReloadSlots();
            await onReloadPendingRequests();
            toast.success(recurrenceRule ? 'Serie de citas creada exitosamente' : 'Cita creada exitosamente');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al crear el slot');
          }
        }}
        onDeleteRecurrenceGroup={async (groupId) => {
          await calendarService.deleteRecurrenceGroup(groupId);
          await onReloadSlots();
          await onReloadPendingRequests();
        }}
        onCreateSlotsRange={async (slotsRange) => {
          try {
            for (const slot of slotsRange) {
              await calendarService.createSlot(slot.start, slot.end, slot.price);
            }
            await onReloadSlots();
            await onReloadPendingRequests();
            toast.success(`${slotsRange.length} citas creadas exitosamente`);
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al crear los slots');
            throw e;
          }
        }}
        onAssignToPatient={async (appointmentId, userId) => {
          try {
            const slot = slots.find(s => s.id === appointmentId);
            if (!slot) throw new Error('Cita no encontrada');
            await calendarService.deleteSlot(appointmentId);
            await calendarService.createForPatient(userId, slot.startTime, slot.endTime, slot.price);
            await onReloadSlots();
            await onReloadPendingRequests();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al asignar la cita');
            throw e;
          }
        }}
        onDeleteSlot={async (appointmentId) => {
          try {
            await calendarService.deleteSlot(appointmentId);
            await onReloadSlots();
            await onReloadPendingRequests();
          } catch {
            toast.error('Error al eliminar la ausencia');
          }
        }}
        onUpdateSlot={async (appointmentId, updates) => {
          try {
            await calendarService.updateSlot(appointmentId, updates);
            await onReloadSlots();
            await onReloadPendingRequests();
            toast.success('Cita actualizada exitosamente');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al actualizar la cita');
          }
        }}
      />

      {/* Solicitudes Pendientes */}
      {pendingRequests.length > 0 && (
        <div
          id="solicitudes-pendientes"
          className="mt-6 bg-white rounded-xl border border-slate-200/80"
        >
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-gantly-blue" />
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">
              Citas por confirmar
            </h3>
            <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req: any) => (
              <div
                key={req.id}
                className="rounded-lg p-4 border border-slate-200/80 bg-white hover:border-slate-300 transition-colors duration-200"
              >
                <div className="text-sm font-heading font-semibold text-slate-800 mb-1">
                  {new Date(req.appointment.startTime).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <div className="text-sm text-slate-500 mb-2">
                  {new Date(req.appointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(req.appointment.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {req.appointment.price && (
                  <div className="text-sm font-medium text-slate-700 mb-1">{req.appointment.price} EUR</div>
                )}
                <div className="text-sm text-slate-600 mb-1">{req.user.name || req.user.email}</div>
                <div className="text-[11px] text-slate-500 mb-3">
                  Solicitada: {new Date(req.requestedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAppointmentId(req.id)}
                    className="flex-1 px-3 py-2 bg-gantly-blue text-white rounded-md hover:bg-gantly-blue/90 transition-colors duration-200 text-sm font-medium cursor-pointer border-none"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setCancelAppointmentId(req.appointment.id)}
                    className="flex-1 px-3 py-2 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors duration-200 text-sm font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citas Confirmadas y Reservadas */}
      {slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).length > 0 && (
        <div
          id="citas-confirmadas"
          data-section="citas-confirmadas"
          className="mt-6 bg-white rounded-xl border border-slate-200/80"
        >
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <CalendarDays size={16} className="text-gantly-blue" />
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">
              Citas Confirmadas y Reservadas
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).map(apt => {
              const status = apt.status as string | undefined;
              const isConfirmed = status === 'CONFIRMED';
              const statusLabel = isConfirmed ? 'Confirmada' : 'Reservada';

              return (
                <div
                  key={apt.id}
                  className="rounded-lg p-4 border border-slate-200/80 bg-white hover:border-slate-300 transition-colors duration-200"
                >
                  <div className="text-sm font-heading font-semibold text-slate-800 mb-1">
                    {new Date(apt.startTime).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">
                    {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {apt.endTime && new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">{apt.user?.name || 'Paciente'}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isConfirmed ? 'bg-gantly-emerald/10 text-gantly-emerald' : 'bg-gantly-gold/10 text-gantly-gold'
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gestion de Ausencias */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200/80">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff size={16} className="text-slate-500" />
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Ausencias</h3>
          </div>
          <button
            onClick={() => {
              setShowAbsenceModal(true);
              setAbsenceStartDate('');
              setAbsenceEndDate('');
              setAbsenceReason('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
          >
            <Plus size={14} />
            Nueva ausencia
          </button>
        </div>
        <div className="p-5">
          {absences.length === 0 ? (
            <p className="text-sm text-slate-500 m-0">No tienes ausencias programadas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {absences.map(ab => (
                <div
                  key={ab.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {new Date(ab.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' - '}
                      {new Date(ab.endTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(ab.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(ab.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {ab.reason && (
                      <div className="text-[11px] text-slate-500 mt-1">{ab.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteAbsenceId(ab.id)}
                    className="ml-3 w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-500 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors duration-200"
                    title="Eliminar ausencia"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva ausencia */}
      <Modal
        open={showAbsenceModal}
        onClose={() => setShowAbsenceModal(false)}
        title="Registrar ausencia"
        maxWidth="max-w-[450px]"
      >
        <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
          Los slots libres dentro del periodo se eliminaran automaticamente.
        </p>
        <div className="mb-3">
          <label htmlFor="absence-start" className="block mb-1 text-[11px] text-slate-500 font-medium">
            Fecha y hora de inicio <span className="text-red-500">*</span>
          </label>
          <input
            id="absence-start"
            type="datetime-local"
            value={absenceStartDate}
            onChange={e => setAbsenceStartDate(e.target.value)}
            className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm outline-none transition-colors duration-200 focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label htmlFor="absence-end" className="block mb-1 text-[11px] text-slate-500 font-medium">
            Fecha y hora de fin <span className="text-red-500">*</span>
          </label>
          <input
            id="absence-end"
            type="datetime-local"
            value={absenceEndDate}
            onChange={e => setAbsenceEndDate(e.target.value)}
            className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm outline-none transition-colors duration-200 focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="absence-reason" className="block mb-1 text-[11px] text-slate-500 font-medium">
            Motivo (opcional)
          </label>
          <input
            id="absence-reason"
            type="text"
            value={absenceReason}
            onChange={e => setAbsenceReason(e.target.value)}
            maxLength={500}
            placeholder="Ej: Vacaciones, formacion..."
            className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm outline-none transition-colors duration-200 focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowAbsenceModal(false)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
          >
            Cancelar
          </button>
          <button
            disabled={savingAbsence}
            onClick={async () => {
              if (!absenceStartDate || !absenceEndDate) {
                toast.warning('Completa las fechas de inicio y fin');
                return;
              }
              const startIso = new Date(absenceStartDate).toISOString();
              const endIso = new Date(absenceEndDate).toISOString();
              if (new Date(endIso) <= new Date(startIso)) {
                toast.warning('La fecha de fin debe ser posterior a la de inicio');
                return;
              }
              setSavingAbsence(true);
              try {
                await calendarService.createAbsence(startIso, endIso, absenceReason || undefined);
                toast.success('Ausencia registrada exitosamente');
                setShowAbsenceModal(false);
                await onReloadAbsences();
                await onReloadSlots();
              } catch (e: any) {
                toast.error(e?.response?.data?.error || 'Error al registrar la ausencia');
              } finally {
                setSavingAbsence(false);
              }
            }}
            className="px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
          >
            {savingAbsence ? 'Guardando...' : 'Registrar ausencia'}
          </button>
        </div>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmAppointmentId !== null}
        onClose={() => setConfirmAppointmentId(null)}
        onConfirm={async () => {
          const reqId = confirmAppointmentId!;
          try {
            await calendarService.confirmAppointment(reqId);
            toast.success('Cita confirmada exitosamente. Se ha enviado un correo al paciente.');
            await onReloadSlots();
            await onReloadPendingRequests();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al confirmar la cita');
            throw e;
          }
        }}
        title="Confirmar cita"
        message={`Confirmar esta cita para ${pendingRequests.find(r => r.id === confirmAppointmentId)?.user?.name || pendingRequests.find(r => r.id === confirmAppointmentId)?.user?.email || 'el paciente'}?`}
        variant="info"
        confirmLabel="Confirmar"
      />

      <ConfirmDialog
        open={cancelAppointmentId !== null}
        onClose={() => setCancelAppointmentId(null)}
        onConfirm={async () => {
          const aptId = cancelAppointmentId!;
          try {
            await calendarService.cancelAppointment(aptId);
            toast.success('Cita cancelada exitosamente');
            await onReloadSlots();
            await onReloadPendingRequests();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al cancelar la cita');
            throw e;
          }
        }}
        title="Cancelar cita"
        message="¿Estás seguro de que quieres cancelar esta cita?"
        variant="danger"
        confirmLabel="Cancelar cita"
      />

      <ConfirmDialog
        open={deleteAbsenceId !== null}
        onClose={() => setDeleteAbsenceId(null)}
        onConfirm={async () => {
          const absId = deleteAbsenceId!;
          try {
            await calendarService.deleteAbsence(absId);
            toast.success('Ausencia eliminada');
            await onReloadAbsences();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Error al eliminar la ausencia');
            throw e;
          }
        }}
        title="Eliminar ausencia"
        message="¿Estás seguro de que quieres eliminar esta ausencia?"
        variant="danger"
        confirmLabel="Eliminar"
      />
    </div>
  );
}
