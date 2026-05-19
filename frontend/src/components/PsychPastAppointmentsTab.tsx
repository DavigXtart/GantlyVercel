import { useState } from 'react';
import { History, ChevronUp, ChevronDown } from 'lucide-react';
import { calendarNotesService } from '../services/api';
import EmptyState from './ui/EmptyState';
import { SkeletonList } from './ui/SkeletonLoader';
import { toast } from './ui/Toast';

function SessionNotesSection({ appointmentId, existingNotes }: { appointmentId: number; existingNotes?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(existingNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await calendarNotesService.updateNotes(appointmentId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Error al guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="bg-transparent border-none cursor-pointer text-sm text-gantly-blue font-medium flex items-center gap-1 p-0 transition-colors duration-200 hover:text-gantly-blue/80"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Notas de sesion {existingNotes ? '(editadas)' : ''}
      </button>
      {expanded && (
        <div className="mt-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Escribe notas sobre esta sesion..."
            className="w-full min-h-[80px] p-3 border border-slate-200 rounded-md text-sm resize-y outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition-all duration-200"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-slate-500">{notes.length}/500</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-gantly-blue hover:bg-gantly-blue/90 text-white border-none rounded-md text-sm font-medium cursor-pointer disabled:opacity-60 transition-colors duration-200"
            >
              {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar notas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PsychPastAppointmentsTabProps {
  pastAppointments: any[];
  loading: boolean;
  myRating: { averageRating: number | null; totalRatings: number } | null;
  onShowRatingsModal: () => void;
}

export default function PsychPastAppointmentsTab({
  pastAppointments,
  loading,
  myRating,
  onShowRatingsModal,
}: PsychPastAppointmentsTabProps) {
  return (
    <div>
      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200/80">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <History size={16} className="text-gantly-blue" />
          <h3 className="text-sm font-heading font-semibold text-slate-800 m-0">Mis Citas Pasadas</h3>
        </div>
        <div className="px-5 py-3">
          {myRating && myRating.averageRating !== null && (
            <button
              type="button"
              onClick={onShowRatingsModal}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 rounded"
              title={myRating.totalRatings > 0 ? 'Click para ver todas las resenas' : undefined}
            >
              <span className="text-gantly-gold">
                {'★'.repeat(Math.round(myRating.averageRating))}{'☆'.repeat(5 - Math.round(myRating.averageRating))}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {myRating.averageRating.toFixed(1)} de 5.0 ({myRating.totalRatings} valoraciones)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Appointments list */}
      <div className="mt-4">
        {loading ? (
          <SkeletonList rows={4} className="py-4" />
        ) : pastAppointments.length === 0 ? (
          <EmptyState
            icon={<History className="w-12 h-12 text-slate-300" />}
            title="Sin historial"
            description="Las citas completadas apareceran aqui."
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Paciente / Fecha</span>
              <span className="text-[11px] font-medium text-slate-500 w-24 text-right">Precio</span>
              <span className="text-[11px] font-medium text-slate-500 w-24 text-center">Pago</span>
              <span className="text-[11px] font-medium text-slate-500 w-28 text-right">Valoracion</span>
            </div>

            {pastAppointments.map((apt: any) => (
              <div
                key={apt.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-200"
              >
                <div className="px-5 py-4 md:grid md:grid-cols-[1fr_auto_auto_auto] md:gap-4 md:items-center">
                  {/* Patient info */}
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Cita con {apt.user?.name || 'Paciente'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(apt.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}
                      {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="w-24 text-right mt-2 md:mt-0">
                    {apt.price ? (
                      <span className="text-sm font-medium text-slate-700">
                        {parseFloat(apt.price).toFixed(2)} EUR
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">--</span>
                    )}
                  </div>

                  {/* Payment status */}
                  <div className="w-24 text-center mt-2 md:mt-0">
                    {apt.price && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        apt.paymentStatus === 'PAID' ? 'bg-gantly-emerald/10 text-gantly-emerald' : 'bg-gantly-gold/10 text-gantly-gold'
                      }`}>
                        {apt.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="w-28 text-right mt-2 md:mt-0">
                    {apt.rating ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={star <= apt.rating.rating ? 'text-gantly-gold text-xs' : 'text-slate-200 text-xs'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {apt.rating.comment && (
                          <p className="m-0 text-[11px] text-slate-500 italic max-w-[200px] text-right truncate">
                            &ldquo;{apt.rating.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Sin valorar</span>
                    )}
                  </div>
                </div>

                {/* Session notes */}
                <div className="px-5 pb-3">
                  <SessionNotesSection appointmentId={apt.id} existingNotes={apt.notes} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
