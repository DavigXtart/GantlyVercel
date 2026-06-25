import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CalendarDays, CalendarOff, Trash2, Plus, ChevronDown, ChevronUp, X, CalendarClock, Info } from 'lucide-react';
import { calendarService } from '../services/api';
import type { DaySchedule } from '../services/api';
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
  const { t } = useTranslation();
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [savingAbsence, setSavingAbsence] = useState(false);
  const [confirmAppointmentId, setConfirmAppointmentId] = useState<number | null>(null);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<number | null>(null);
  const [deleteAbsenceId, setDeleteAbsenceId] = useState<number | null>(null);

  // New appointment modal state
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAptPatientId, setNewAptPatientId] = useState<number | ''>('');
  const [newAptDate, setNewAptDate] = useState('');
  const [newAptTime, setNewAptTime] = useState('09:00');
  const [newAptDuration, setNewAptDuration] = useState(50);
  const [newAptServiceIdx, setNewAptServiceIdx] = useState<number | ''>('');
  const [newAptModality, setNewAptModality] = useState<'ONLINE' | 'PRESENCIAL'>('PRESENCIAL');
  const [newAptOfficeIdx, setNewAptOfficeIdx] = useState<number | ''>('');
  const [newAptPrice, setNewAptPrice] = useState<number | ''>('');
  const [newAptNotes, setNewAptNotes] = useState('');
  const [savingNewApt, setSavingNewApt] = useState(false);

  // Weekly schedule state
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);

  const DEFAULT_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    enabled: i < 5, // Mon-Fri enabled
    startTime1: '09:00',
    endTime1: '14:00',
    startTime2: null,
    endTime2: null,
  }));

  const TIME_OPTIONS: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 22 && m > 0) break;
      TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const loadWeeklySchedule = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const data = await calendarService.getWeeklySchedule();
      if (data && data.length > 0) {
        setWeeklySchedule(data);
      } else {
        setWeeklySchedule(DEFAULT_SCHEDULE);
      }
    } catch {
      setWeeklySchedule(DEFAULT_SCHEDULE);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (showWeeklySchedule && weeklySchedule.length === 0) {
      loadWeeklySchedule();
    }
  }, [showWeeklySchedule, weeklySchedule.length, loadWeeklySchedule]);

  const updateDay = (dayIndex: number, updates: Partial<DaySchedule>) => {
    setWeeklySchedule(prev =>
      prev.map(d => (d.dayOfWeek === dayIndex ? { ...d, ...updates } : d))
    );
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await calendarService.saveWeeklySchedule(weeklySchedule);
      toast.success(t('weeklySchedule.saved'));
    } catch (e: any) {
      toast.error('No se pudo guardar el horario. Inténtalo de nuevo.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleGenerateSlots = async () => {
    setGeneratingSlots(true);
    try {
      const result = await calendarService.generateWeeklySlots();
      toast.success(t('weeklySchedule.generated', { created: result.slotsCreated, skipped: result.slotsSkipped }));
      await onReloadSlots();
    } catch (e: any) {
      toast.error('No se pudieron generar las citas. Inténtalo de nuevo.');
    } finally {
      setGeneratingSlots(false);
    }
  };

  // Parse services and offices from profile
  const profileServices: Array<{ name: string; price: number; durationMinutes: number }> = (() => {
    try { return psychologistProfile?.services ? JSON.parse(psychologistProfile.services) : []; } catch { return []; }
  })();
  const profileOffices: Array<{ name: string; color: string }> = (() => {
    try { return psychologistProfile?.offices ? JSON.parse(psychologistProfile.offices) : []; } catch { return []; }
  })();

  const APT_TIME_OPTIONS: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 22 && m > 0) break;
      APT_TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const handleCreateAppointment = async () => {
    if (!newAptPatientId || !newAptDate) {
      toast.warning('Selecciona un paciente y una fecha');
      return;
    }
    const [year, month, day] = newAptDate.split('-').map(Number);
    const [hour, minute] = newAptTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + newAptDuration * 60 * 1000);
    const price = newAptPrice !== '' ? Number(newAptPrice) : undefined;
    const service = newAptServiceIdx !== '' ? profileServices[newAptServiceIdx]?.name : undefined;
    const officeName = newAptOfficeIdx !== '' ? profileOffices[newAptOfficeIdx]?.name : undefined;
    const notes = [newAptNotes, officeName ? `Despacho: ${officeName}` : ''].filter(Boolean).join(' | ') || undefined;

    setSavingNewApt(true);
    try {
      await calendarService.createForPatient(
        Number(newAptPatientId),
        start.toISOString(),
        end.toISOString(),
        price,
        { service, modality: newAptModality, notes }
      );
      toast.success('Cita creada exitosamente');
      setShowNewAppointment(false);
      // Reset form
      setNewAptPatientId('');
      setNewAptDate('');
      setNewAptTime('09:00');
      setNewAptDuration(50);
      setNewAptServiceIdx('');
      setNewAptModality('PRESENCIAL');
      setNewAptOfficeIdx('');
      setNewAptPrice('');
      setNewAptNotes('');
      await onReloadSlots();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'No se pudo crear la cita';
      toast.error(msg);
    } finally {
      setSavingNewApt(false);
    }
  };

  if (loadingSlots) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Nueva cita button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowNewAppointment(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200"
        >
          <Plus size={15} />
          Nueva cita
        </button>
      </div>

      <CalendarWeek
        mode="PSYCHO"
        slots={slots}
        absences={absences}
        initialWeekStart={calendarWeekStart || undefined}
        onWeekChange={onCalendarWeekChange}
        sessionPrices={psychologistProfile?.sessionPrices ? JSON.parse(psychologistProfile.sessionPrices) : null}
        patients={patients.map((p: any) => ({ id: p.id, name: p.name, email: p.email }))}
        onCreateSlot={async (start, end, price, recurrenceRule, recurrenceCount, extras) => {
          try {
            const slotDate = new Date(start);
            const day = (slotDate.getDay() + 6) % 7;
            const slotWeekStart = new Date(slotDate);
            slotWeekStart.setDate(slotDate.getDate() - day);
            slotWeekStart.setHours(0, 0, 0, 0);
            onCalendarWeekChange(slotWeekStart);

            await calendarService.createSlot(start, end, price, recurrenceRule, recurrenceCount, extras);
            await onReloadSlots();
            await onReloadPendingRequests();
            toast.success(recurrenceRule ? 'Serie de citas creada exitosamente' : 'Cita creada exitosamente');
          } catch (e: any) {
            toast.error('No se pudo crear la cita. Inténtalo de nuevo.');
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
            toast.error('No se pudieron crear las citas. Inténtalo de nuevo.');
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
            toast.error('No se pudo asignar la cita. Inténtalo de nuevo.');
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
            toast.error('No se pudo actualizar la cita. Inténtalo de nuevo.');
          }
        }}
      />

      {/* Horario Semanal */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setShowWeeklySchedule(prev => !prev)}
          className="w-full px-5 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer bg-transparent border-x-0 border-t-0"
        >
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-gantly-blue" />
            <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">
              {t('weeklySchedule.title')}
            </h3>
          </div>
          {showWeeklySchedule ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {showWeeklySchedule && (
          <div className="p-5">
            {loadingSchedule ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner noText />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {weeklySchedule.map(day => (
                    <div
                      key={day.dayOfWeek}
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-colors duration-200 ${
                        day.enabled
                          ? 'border-slate-200/80 bg-white'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      {/* Toggle + Day name */}
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={day.enabled}
                          onClick={() => updateDay(day.dayOfWeek, { enabled: !day.enabled })}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 ${
                            day.enabled ? 'bg-gantly-blue' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                              day.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[13px] font-medium ${day.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                          {t(`weeklySchedule.daysShort.${day.dayOfWeek}`)}
                        </span>
                      </div>

                      {/* Time blocks or "Libre" */}
                      {day.enabled ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                          {/* Block 1 */}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={day.startTime1}
                              onChange={e => updateDay(day.dayOfWeek, { startTime1: e.target.value })}
                              className="h-8 px-2 rounded-md border border-slate-200 text-[13px] text-slate-700 bg-white outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 cursor-pointer"
                            >
                              {TIME_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <span className="text-slate-400 text-[11px]">-</span>
                            <select
                              value={day.endTime1}
                              onChange={e => updateDay(day.dayOfWeek, { endTime1: e.target.value })}
                              className="h-8 px-2 rounded-md border border-slate-200 text-[13px] text-slate-700 bg-white outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 cursor-pointer"
                            >
                              {TIME_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>

                          {/* Block 2 or add break button */}
                          {day.startTime2 !== null ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={day.startTime2 || ''}
                                onChange={e => updateDay(day.dayOfWeek, { startTime2: e.target.value })}
                                className="h-8 px-2 rounded-md border border-slate-200 text-[13px] text-slate-700 bg-white outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 cursor-pointer"
                              >
                                {TIME_OPTIONS.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <span className="text-slate-400 text-[11px]">-</span>
                              <select
                                value={day.endTime2 || ''}
                                onChange={e => updateDay(day.dayOfWeek, { endTime2: e.target.value })}
                                className="h-8 px-2 rounded-md border border-slate-200 text-[13px] text-slate-700 bg-white outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 cursor-pointer"
                              >
                                {TIME_OPTIONS.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => updateDay(day.dayOfWeek, { startTime2: null, endTime2: null })}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer bg-transparent border-none"
                                title="Eliminar bloque"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateDay(day.dayOfWeek, { startTime2: '16:00', endTime2: '20:00' })}
                              className="text-[12px] text-gantly-blue hover:text-gantly-blue/80 font-medium cursor-pointer bg-transparent border-none px-0 transition-colors duration-200"
                            >
                              {t('weeklySchedule.addBreak')}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400 italic">
                          {t('weeklySchedule.free')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="bg-gantly-blue text-white rounded-md h-9 px-4 text-[13px] font-semibold cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
                  >
                    {savingSchedule ? t('common.loading') : t('weeklySchedule.save')}
                  </button>
                  <button
                    onClick={handleGenerateSlots}
                    disabled={generatingSlots}
                    className="border border-slate-200 bg-white text-slate-600 rounded-md h-9 px-4 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors duration-200 disabled:opacity-60"
                  >
                    {generatingSlots ? t('weeklySchedule.generating') : t('weeklySchedule.generate')}
                  </button>
                  <div className="flex items-center gap-1.5 ml-0 sm:ml-auto">
                    <Info size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-400">
                      {t('weeklySchedule.info')}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
                    month: 'long',
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
                      month: 'long',
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
                      {new Date(ab.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      {' - '}
                      {new Date(ab.endTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
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
                toast.error('No se pudo registrar la ausencia. Inténtalo de nuevo.');
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

      {/* Modal nueva cita */}
      <Modal
        open={showNewAppointment}
        onClose={() => setShowNewAppointment(false)}
        title="Nueva cita"
        maxWidth="max-w-[520px]"
      >
        <div className="flex flex-col gap-3">
          {/* Paciente */}
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 font-medium">Paciente <span className="text-red-500">*</span></label>
            <select
              value={newAptPatientId}
              onChange={e => setNewAptPatientId(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
            >
              <option value="">Seleccionar paciente</option>
              {patients.filter((p: any) => p.status !== 'DISCHARGED').map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Fecha <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={newAptDate}
                onChange={e => setNewAptDate(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue"
              />
            </div>
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Hora</label>
              <select
                value={newAptTime}
                onChange={e => setNewAptTime(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
              >
                {APT_TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duración + Servicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Duración</label>
              <select
                value={newAptDuration}
                onChange={e => setNewAptDuration(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
              >
                {[30, 45, 50, 60, 90].map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Servicio</label>
              <select
                value={newAptServiceIdx}
                onChange={e => {
                  const idx = e.target.value !== '' ? Number(e.target.value) : '';
                  setNewAptServiceIdx(idx);
                  if (idx !== '' && profileServices[idx]) {
                    setNewAptPrice(profileServices[idx].price);
                    setNewAptDuration(profileServices[idx].durationMinutes);
                  }
                }}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
              >
                <option value="">Sin servicio</option>
                {profileServices.map((s, i) => (
                  <option key={i} value={i}>{s.name} ({s.price}€)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Modalidad + Despacho/Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Modalidad</label>
              <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
                {(['PRESENCIAL', 'ONLINE'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setNewAptModality(m); if (m === 'ONLINE') setNewAptOfficeIdx(''); }}
                    className={`flex-1 py-1.5 text-[12px] font-medium rounded cursor-pointer transition-all duration-200 border-none ${
                      newAptModality === m
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'bg-transparent text-slate-500'
                    }`}
                  >
                    {m === 'PRESENCIAL' ? 'Presencial' : 'Online'}
                  </button>
                ))}
              </div>
            </div>
            {newAptModality === 'PRESENCIAL' && profileOffices.length > 0 ? (
              <div>
                <label className="block mb-1 text-[11px] text-slate-500 font-medium">Despacho</label>
                <select
                  value={newAptOfficeIdx}
                  onChange={e => setNewAptOfficeIdx(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue cursor-pointer"
                >
                  <option value="">Sin despacho</option>
                  {profileOffices.map((o, i) => (
                    <option key={i} value={i}>{o.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-[11px] text-slate-500 font-medium">Precio (€)</label>
                <input
                  type="number"
                  value={newAptPrice}
                  onChange={e => setNewAptPrice(e.target.value ? Number(e.target.value) : '')}
                  min={0}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue"
                />
              </div>
            )}
          </div>

          {/* Precio (when office is shown) */}
          {newAptModality === 'PRESENCIAL' && profileOffices.length > 0 && (
            <div>
              <label className="block mb-1 text-[11px] text-slate-500 font-medium">Precio (€)</label>
              <input
                type="number"
                value={newAptPrice}
                onChange={e => setNewAptPrice(e.target.value ? Number(e.target.value) : '')}
                min={0}
                placeholder="0"
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-gantly-blue"
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 font-medium">Notas (opcional)</label>
            <textarea
              value={newAptNotes}
              onChange={e => setNewAptNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Notas sobre la cita..."
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none resize-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={() => setShowNewAppointment(false)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateAppointment}
            disabled={savingNewApt}
            className="px-4 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-60"
          >
            {savingNewApt ? 'Creando...' : 'Crear cita'}
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
            toast.error('No se pudo confirmar la cita. Inténtalo de nuevo.');
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
            toast.error('No se pudo cancelar la cita. Inténtalo de nuevo.');
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
            toast.error('No se pudo eliminar la ausencia. Inténtalo de nuevo.');
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
