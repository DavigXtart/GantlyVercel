import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import {
  ListOrdered, Bell, Pencil, Trash2, Plus,
  Mail, Phone, AlertTriangle, Loader2, Clock, Check,
} from 'lucide-react';
import { toast } from './ui/Toast';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WaitingListEntry {
  id: number;
  patientName: string;
  email: string;
  phone?: string;
  service?: string;
  psychologistPreference?: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'WAITING' | 'CONTACTED' | 'SCHEDULED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

type StatusFilter = '' | 'WAITING' | 'CONTACTED' | 'SCHEDULED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------
function PriorityBadge({ priority }: { priority: WaitingListEntry['priority'] }) {
  if (priority === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-1 bg-red-50 text-red-700 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Urgente
      </span>
    );
  }
  if (priority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-medium">
        <AlertTriangle size={11} />
        Alta
      </span>
    );
  }
  return (
    <span className="rounded-full text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-medium">
      Normal
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: WaitingListEntry['status'] }) {
  const map: Record<WaitingListEntry['status'], { bg: string; text: string; label: string }> = {
    WAITING: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'En espera' },
    CONTACTED: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Contactado' },
    SCHEDULED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Programado' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelado' },
  };
  const s = map[status] || map.WAITING;
  return (
    <span className={`rounded-full text-xs px-2.5 py-1 font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicWaitingList() {
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    patientName: '',
    email: '',
    phone: '',
    service: '',
    psychologistPreference: '',
    priority: 'NORMAL' as 'NORMAL' | 'HIGH' | 'URGENT',
    notes: '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit modal
  const [editEntry, setEditEntry] = useState<WaitingListEntry | null>(null);
  const [editForm, setEditForm] = useState({ status: '' as string, priority: '' as string, notes: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Actions
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Delete confirmation
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clinicService.getWaitingList(statusFilter || undefined);
      setEntries(data);
    } catch {
      setEntries([]);
      toast.error('Error al cargar la lista de espera');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // --- Add handler ---
  const handleAdd = async () => {
    if (!addForm.patientName.trim() || !addForm.email.trim()) return;
    setAddSubmitting(true);
    setAddError('');
    try {
      await clinicService.addToWaitingList({
        patientName: addForm.patientName.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || undefined,
        service: addForm.service.trim() || undefined,
        psychologistPreference: addForm.psychologistPreference.trim() || undefined,
        priority: addForm.priority,
        notes: addForm.notes.trim() || undefined,
      });
      setShowAddModal(false);
      setAddForm({ patientName: '', email: '', phone: '', service: '', psychologistPreference: '', priority: 'NORMAL', notes: '' });
      loadEntries();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Error al añadir paciente');
    } finally {
      setAddSubmitting(false);
    }
  };

  // --- Edit handler ---
  const openEdit = (entry: WaitingListEntry) => {
    setEditEntry(entry);
    setEditForm({ status: entry.status, priority: entry.priority, notes: entry.notes || '' });
  };

  const handleEdit = async () => {
    if (!editEntry) return;
    setEditSubmitting(true);
    try {
      await clinicService.updateWaitingListEntry(editEntry.id, {
        status: editForm.status || undefined,
        priority: editForm.priority || undefined,
        notes: editForm.notes || undefined,
      });
      setEditEntry(null);
      loadEntries();
    } catch {
      toast.error('Error al actualizar la entrada');
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- Notify handler ---
  const handleNotify = async (id: number) => {
    setActionLoading(id);
    try {
      await clinicService.notifyWaitingListPatient(id);
      loadEntries();
    } catch {
      toast.error('Error al notificar al paciente');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Delete handler ---
  const confirmDelete = async () => {
    if (deleteEntryId === null) return;
    setActionLoading(deleteEntryId);
    try {
      await clinicService.removeWaitingListEntry(deleteEntryId);
      setEntries(prev => prev.filter(e => e.id !== deleteEntryId));
    } catch {
      toast.error('Error al eliminar la entrada');
    } finally {
      setActionLoading(null);
      setDeleteEntryId(null);
    }
  };

  const inputCls = 'w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition';

  return (
    <div className="space-y-4">
      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ListOrdered size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Lista de espera</h2>
            <span className="text-[11px] text-slate-500">{entries.length} pacientes</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 px-3 rounded-md border border-slate-200 text-xs text-slate-700 bg-white cursor-pointer outline-none focus:border-gantly-blue/50"
            >
              <option value="">Todos</option>
              <option value="WAITING">En espera</option>
              <option value="CONTACTED">Contactados</option>
              <option value="SCHEDULED">Programados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-8 px-3.5 bg-gantly-blue text-white rounded-md text-xs font-medium hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none inline-flex items-center gap-1.5"
            >
              <Plus size={13} />
              Añadir paciente
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ListOrdered size={32} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm font-medium">No hay pacientes en lista de espera</p>
            <p className="text-xs mt-1">Añade un paciente para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Paciente</th>
                  <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Servicio</th>
                  <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Prioridad</th>
                  <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Estado</th>
                  <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Fecha</th>
                  <th className="text-right text-[11px] font-medium text-slate-500 px-4 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{entry.patientName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail size={10} />
                            {entry.email}
                          </span>
                          {entry.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {entry.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Service */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{entry.service || '-'}</span>
                      {entry.psychologistPreference && (
                        <p className="text-[10px] text-slate-500 mt-0.5">Pref: {entry.psychologistPreference}</p>
                      )}
                    </td>
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <PriorityBadge priority={entry.priority} />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(entry.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => handleNotify(entry.id)}
                            disabled={actionLoading === entry.id}
                            className="h-7 px-2 rounded-md border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors cursor-pointer bg-white text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                            title="Notificar"
                          >
                            {actionLoading === entry.id ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                            Notificar
                          </button>
                        )}
                        {(entry.status === 'WAITING' || entry.status === 'CONTACTED') && (
                          <button
                            onClick={() => openEdit(entry)}
                            className="h-7 px-2 rounded-md border border-slate-200 text-slate-500 hover:text-gantly-blue hover:border-gantly-blue/30 hover:bg-gantly-blue/5 transition-colors cursor-pointer bg-white text-[11px] inline-flex items-center gap-1"
                            title="Editar"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteEntryId(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="h-7 px-2 rounded-md border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer bg-white text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Añadir a lista de espera" maxWidth="max-w-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Nombre *</label>
            <input type="text" value={addForm.patientName} onChange={e => setAddForm(p => ({ ...p, patientName: e.target.value }))} className={inputCls} placeholder="Nombre del paciente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Email *</label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Teléfono</label>
              <input type="tel" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+34 600 000 000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Servicio solicitado</label>
              <input type="text" value={addForm.service} onChange={e => setAddForm(p => ({ ...p, service: e.target.value }))} className={inputCls} placeholder="Psicoterapia individual" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Preferencia profesional</label>
              <input type="text" value={addForm.psychologistPreference} onChange={e => setAddForm(p => ({ ...p, psychologistPreference: e.target.value }))} className={inputCls} placeholder="Nombre del psicólogo" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Prioridad</label>
            <div className="flex gap-2">
              {(['NORMAL', 'HIGH', 'URGENT'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAddForm(prev => ({ ...prev, priority: p }))}
                  className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    addForm.priority === p
                      ? p === 'URGENT'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : p === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p === 'NORMAL' ? 'Normal' : p === 'HIGH' ? 'Alta' : 'Urgente'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Notas</label>
            <textarea
              value={addForm.notes}
              onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition resize-none"
              rows={3}
              placeholder="Notas adicionales sobre el paciente..."
            />
          </div>

          {addError && <p className="text-xs text-red-500">{addError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={addSubmitting || !addForm.patientName.trim() || !addForm.email.trim()}
              className="flex-1 h-9 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none inline-flex items-center justify-center gap-2"
            >
              {addSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {addSubmitting ? 'Añadiendo...' : 'Añadir a la lista'}
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="h-9 px-4 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editEntry !== null} onClose={() => setEditEntry(null)} title="Editar entrada" maxWidth="max-w-sm">
        {editEntry && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 mb-2">
              <p className="text-sm font-medium text-slate-900">{editEntry.patientName}</p>
              <p className="text-[11px] text-slate-500">{editEntry.email}</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Estado</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white cursor-pointer outline-none focus:border-gantly-blue/50"
              >
                <option value="WAITING">En espera</option>
                <option value="CONTACTED">Contactado</option>
                <option value="SCHEDULED">Programado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Prioridad</label>
              <div className="flex gap-2">
                {(['NORMAL', 'HIGH', 'URGENT'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, priority: p }))}
                    className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      editForm.priority === p
                        ? p === 'URGENT'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : p === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p === 'NORMAL' ? 'Normal' : p === 'HIGH' ? 'Alta' : 'Urgente'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Notas</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-gantly-blue/50 focus:ring-1 focus:ring-gantly-blue/20 transition resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEdit}
                disabled={editSubmitting}
                className="flex-1 h-9 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none inline-flex items-center justify-center gap-2"
              >
                {editSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setEditEntry(null)}
                className="h-9 px-4 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteEntryId !== null}
        onClose={() => setDeleteEntryId(null)}
        onConfirm={confirmDelete}
        title="Eliminar entrada"
        message="¿Estas seguro de que quieres eliminar esta entrada de la lista de espera?"
        variant="danger"
        confirmLabel="Eliminar"
      />
    </div>
  );
}
