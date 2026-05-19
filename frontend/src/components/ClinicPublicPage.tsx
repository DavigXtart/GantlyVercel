import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicClinicService } from '../services/api';
import {
  Building2, User, Clock, MapPin, Phone, Globe, ChevronLeft, ChevronRight,
  Calendar, ArrowRight, Send, Users, Stethoscope, CheckCircle2, Loader2,
} from 'lucide-react';
import LogoSvg from '../assets/logo-gantly.svg';
import Modal from './ui/Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ClinicData {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  services: Array<{ id: number; name: string; defaultPrice: number | null; durationMinutes: number | null }>;
  psychologists: Array<{ id: number; name: string; avatarUrl?: string; bio?: string; specializations?: string }>;
}

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  psychologistId: number;
  psychologistName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekRange(base: Date): { from: string; to: string; days: Date[] } {
  const monday = new Date(base);
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  const to = new Date(days[6]);
  to.setDate(to.getDate() + 1);
  return { from: fmtDate(days[0]), to: fmtDate(to), days };
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xl font-heading font-bold text-slate-900 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Data
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar navigation
  const [weekBase, setWeekBase] = useState(() => new Date());
  const week = useMemo(() => weekRange(weekBase), [weekBase]);

  // Filters
  const [filterPsychId, setFilterPsychId] = useState<number | undefined>(undefined);

  // Booking modal
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingForm, setBookingForm] = useState({ patientName: '', email: '', phone: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Refs for scrolling
  const availabilityRef = useRef<HTMLDivElement>(null);

  // Load clinic info
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    publicClinicService.getClinicInfo(slug)
      .then(data => { setClinic(data); setError(''); })
      .catch(() => setError('No se encontro la clinica'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Load available slots
  useEffect(() => {
    if (!slug) return;
    publicClinicService.getAvailableSlots(slug, week.from, week.to, filterPsychId)
      .then(data => setSlots(data))
      .catch(() => setSlots([]));
  }, [slug, week.from, week.to, filterPsychId]);

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) d.setTime(today.getTime());
    setWeekBase(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    week.days.forEach(d => map.set(fmtDate(d), []));
    slots.forEach(s => {
      const dayKey = s.startTime.slice(0, 10);
      const existing = map.get(dayKey);
      if (existing) existing.push(s);
    });
    return map;
  }, [slots, week.days]);

  // Booking handler
  const handleBooking = async () => {
    if (!slug || !selectedSlot) return;
    setBookingSubmitting(true);
    setBookingError('');
    try {
      await publicClinicService.requestBooking(slug, {
        slotId: selectedSlot.id,
        patientName: bookingForm.patientName,
        email: bookingForm.email,
        phone: bookingForm.phone || undefined,
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Error al solicitar la cita');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedSlot(null);
    setBookingForm({ patientName: '', email: '', phone: '' });
    setBookingSuccess(false);
    setBookingError('');
  };

  const scrollToAvailability = () => {
    availabilityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Building2 size={40} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-heading font-bold text-slate-800 mb-2">Clinica no encontrada</h2>
          <p className="text-sm text-slate-500 mb-6">El enlace podria estar incorrecto o la clinica ya no esta disponible.</p>
          <button
            onClick={() => navigate('/')}
            className="h-9 px-5 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none"
          >
            Volver a Gantly
          </button>
        </div>
      </div>
    );
  }

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clinic.logoUrl ? (
              <img src={clinic.logoUrl} alt={clinic.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                <Building2 size={16} className="text-gantly-blue" />
              </div>
            )}
            <span className="text-sm font-semibold text-slate-900">{clinic.name}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-gantly-blue transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1.5"
          >
            <img src={LogoSvg} alt="Gantly" className="h-4 opacity-60" />
            Volver a Gantly
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Hero */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex-shrink-0">
              {clinic.logoUrl ? (
                <img src={clinic.logoUrl} alt={clinic.name} className="h-16 w-16 rounded-xl object-cover border border-slate-100" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                  <Building2 size={28} className="text-gantly-blue" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">{clinic.name}</h1>
              {clinic.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{clinic.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                {clinic.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    {clinic.address}
                  </span>
                )}
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="flex items-center gap-1.5 hover:text-gantly-blue transition-colors no-underline text-slate-500">
                    <Phone size={13} className="text-slate-400" />
                    {clinic.phone}
                  </a>
                )}
                {clinic.website && (
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-gantly-blue transition-colors no-underline text-slate-500">
                    <Globe size={13} className="text-slate-400" />
                    Sitio web
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={scrollToAvailability}
              className="h-9 px-5 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none inline-flex items-center gap-2 flex-shrink-0 self-start"
            >
              Reservar cita
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* Services */}
        {clinic.services.length > 0 && (
          <section>
            <SectionTitle id="servicios">
              <span className="flex items-center gap-2">
                <Stethoscope size={18} className="text-gantly-blue" />
                Servicios
              </span>
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinic.services.map(svc => (
                <div key={svc.id} className="bg-white rounded-2xl border border-slate-200/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{svc.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {svc.durationMinutes != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {svc.durationMinutes} min
                      </span>
                    )}
                    {svc.defaultPrice != null && (
                      <span className="text-sm font-semibold text-emerald-600">
                        {svc.defaultPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {clinic.psychologists.length > 0 && (
          <section>
            <SectionTitle id="equipo">
              <span className="flex items-center gap-2">
                <Users size={18} className="text-gantly-blue" />
                Nuestro equipo
              </span>
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinic.psychologists.map(p => {
                let specs: string[] = [];
                if (p.specializations) {
                  try { specs = JSON.parse(p.specializations); } catch { specs = [p.specializations]; }
                }
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setFilterPsychId(prev => prev === p.id ? undefined : p.id); scrollToAvailability(); }}
                    className={`bg-white rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                      filterPsychId === p.id
                        ? 'border-gantly-blue ring-1 ring-gantly-blue/20'
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gantly-blue/10 flex items-center justify-center">
                          <User size={18} className="text-gantly-blue" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                        {filterPsychId === p.id && (
                          <span className="text-[10px] text-gantly-blue font-medium">Mostrando disponibilidad</span>
                        )}
                      </div>
                    </div>
                    {p.bio && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.bio}</p>
                    )}
                    {specs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {specs.slice(0, 3).map((s, i) => (
                          <span key={i} className="rounded-full text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600">{s}</span>
                        ))}
                        {specs.length > 3 && (
                          <span className="rounded-full text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500">+{specs.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Availability calendar */}
        <section ref={availabilityRef}>
          <SectionTitle id="disponibilidad">
            <span className="flex items-center gap-2">
              <Calendar size={18} className="text-gantly-blue" />
              Disponibilidad
            </span>
          </SectionTitle>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            {/* Calendar header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button onClick={prevWeek} className="h-8 w-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">
                  {new Date(week.from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  {' - '}
                  {new Date(week.days[6]).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextWeek} className="h-8 w-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Psychologist filter */}
              {clinic.psychologists.length > 1 && (
                <select
                  value={filterPsychId ?? ''}
                  onChange={e => setFilterPsychId(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-8 px-3 rounded-md border border-slate-200 text-xs text-slate-700 bg-white cursor-pointer outline-none focus:border-gantly-blue/50"
                >
                  <option value="">Todos los profesionales</option>
                  {clinic.psychologists.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Day grid — desktop (md+) */}
            <div className="hidden md:grid grid-cols-7 divide-x divide-slate-100">
              {week.days.map(day => {
                const dayKey = fmtDate(day);
                const daySlots = slotsByDay.get(dayKey) || [];
                const today = isToday(day);
                const isPast = day < new Date(new Date().toDateString());

                return (
                  <div key={dayKey} className={`min-h-[200px] ${isPast ? 'opacity-40' : ''}`}>
                    {/* Day header */}
                    <div className={`px-2 py-2 text-center border-b border-slate-100 ${today ? 'bg-gantly-blue/5' : ''}`}>
                      <p className="text-[10px] text-slate-400 uppercase">{DAY_NAMES[day.getDay()]}</p>
                      <p className={`text-sm font-semibold ${today ? 'text-gantly-blue' : 'text-slate-700'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                    {/* Slots */}
                    <div className="p-1.5 space-y-1">
                      {daySlots.length === 0 ? (
                        <p className="text-[10px] text-slate-300 text-center py-4">Sin huecos</p>
                      ) : (
                        daySlots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(slot => {
                            const start = new Date(slot.startTime);
                            const end = new Date(slot.endTime);
                            return (
                              <button
                                key={slot.id}
                                onClick={() => { if (!isPast) setSelectedSlot(slot); }}
                                disabled={isPast}
                                className="w-full text-left min-h-[44px] px-4 py-2 rounded-md bg-gantly-blue/5 border border-gantly-blue/10 hover:bg-gantly-blue/10 hover:border-gantly-blue/20 transition-colors cursor-pointer text-[11px] disabled:cursor-not-allowed disabled:hover:bg-gantly-blue/5"
                              >
                                <p className="font-medium text-gantly-blue tabular-nums">
                                  {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">{slot.psychologistName}</p>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day list — mobile (<md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {week.days.map(day => {
                const dayKey = fmtDate(day);
                const daySlots = slotsByDay.get(dayKey) || [];
                const today = isToday(day);
                const isPast = day < new Date(new Date().toDateString());

                return (
                  <div key={dayKey} className={`px-4 py-3 ${isPast ? 'opacity-40' : ''}`}>
                    <div className={`flex items-center gap-2 mb-2 ${today ? 'text-gantly-blue' : 'text-slate-700'}`}>
                      <span className="text-xs text-slate-400 uppercase w-8">{DAY_NAMES[day.getDay()]}</span>
                      <span className={`text-sm font-semibold ${today ? 'text-gantly-blue' : 'text-slate-700'}`}>
                        {day.getDate()}
                      </span>
                      {today && <span className="text-[10px] bg-gantly-blue/10 text-gantly-blue px-1.5 py-0.5 rounded-full font-medium">Hoy</span>}
                    </div>
                    {daySlots.length === 0 ? (
                      <p className="text-xs text-slate-300 pl-10">Sin huecos</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pl-10">
                        {daySlots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(slot => {
                            const start = new Date(slot.startTime);
                            const end = new Date(slot.endTime);
                            return (
                              <button
                                key={slot.id}
                                onClick={() => { if (!isPast) setSelectedSlot(slot); }}
                                disabled={isPast}
                                className="min-h-[44px] px-4 py-2 rounded-md bg-gantly-blue/5 border border-gantly-blue/10 hover:bg-gantly-blue/10 hover:border-gantly-blue/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-gantly-blue/5"
                              >
                                <p className="text-xs font-medium text-gantly-blue tabular-nums">
                                  {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">{slot.psychologistName}</p>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              {clinic.logoUrl ? (
                <img src={clinic.logoUrl} alt={clinic.name} className="h-6 w-6 rounded-lg object-cover opacity-60" />
              ) : (
                <Building2 size={16} className="text-slate-300" />
              )}
              <span>{clinic.name}</span>
            </div>
            <div className="flex items-center gap-4">
              {clinic.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {clinic.address}
                </span>
              )}
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 no-underline text-slate-400 hover:text-slate-600 transition-colors">
                  <Phone size={11} />
                  {clinic.phone}
                </a>
              )}
              {clinic.website && (
                <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 no-underline text-slate-400 hover:text-slate-600 transition-colors">
                  <Globe size={11} />
                  Web
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>Reservas con</span>
              <img src={LogoSvg} alt="Gantly" className="h-3.5 opacity-50" />
            </div>
          </div>
        </footer>
      </div>

      {/* Booking modal */}
      <Modal open={!!selectedSlot} onClose={closeBookingModal} title="Solicitar cita" maxWidth="max-w-md">
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-2">Solicitud enviada</h4>
            <p className="text-sm text-slate-500 mb-6">
              La clinica se pondra en contacto contigo para confirmar la cita.
            </p>
            <button
              onClick={closeBookingModal}
              className="h-9 px-5 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none"
            >
              Cerrar
            </button>
          </div>
        ) : selectedSlot && (
          <div className="space-y-4">
            {/* Slot info */}
            <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-gantly-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(selectedSlot.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(selectedSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(selectedSlot.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' con '}{selectedSlot.psychologistName}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Nombre completo *</label>
                <input
                  type="text"
                  value={bookingForm.patientName}
                  onChange={e => setBookingForm(p => ({ ...p, patientName: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Email *</label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Telefono</label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition"
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            {bookingError && (
              <p className="text-xs text-red-500">{bookingError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleBooking}
                disabled={bookingSubmitting || !bookingForm.patientName.trim() || !bookingForm.email.trim()}
                className="flex-1 h-9 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none inline-flex items-center justify-center gap-2"
              >
                {bookingSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {bookingSubmitting ? 'Enviando...' : 'Solicitar cita'}
              </button>
              <button
                onClick={closeBookingModal}
                className="h-9 px-4 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
