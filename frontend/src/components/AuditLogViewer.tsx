import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import { Shield, ChevronLeft, ChevronRight, Filter, Calendar, User, FileText } from 'lucide-react';

interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  performedById: number;
  performedByRole: string | null;
  performedByName: string | null;
  targetUserId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_SLOT: 'Crear horario',
  EDIT_SLOT: 'Editar horario',
  DELETE_SLOT: 'Eliminar horario',
  BOOK_APPOINTMENT: 'Solicitar cita',
  CANCEL_APPOINTMENT: 'Cancelar cita',
  CONFIRM_APPOINTMENT: 'Confirmar cita',
  CREATE_ABSENCE: 'Crear ausencia',
  DELETE_ABSENCE: 'Eliminar ausencia',
  CREATE_APPOINTMENT: 'Crear cita',
  UPDATE_APPOINTMENT: 'Actualizar cita',
};

const ACTION_STYLES: Record<string, string> = {
  CREATE_SLOT: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  EDIT_SLOT: 'bg-amber-50 text-amber-700 border-amber-200/60',
  DELETE_SLOT: 'bg-red-50 text-red-700 border-red-200/60',
  BOOK_APPOINTMENT: 'bg-blue-50 text-blue-700 border-blue-200/60',
  CANCEL_APPOINTMENT: 'bg-red-50 text-red-700 border-red-200/60',
  CONFIRM_APPOINTMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  CREATE_ABSENCE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  DELETE_ABSENCE: 'bg-red-50 text-red-700 border-red-200/60',
  CREATE_APPOINTMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  UPDATE_APPOINTMENT: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseDetails(details: string | null): string {
  if (!details) return '';
  try {
    const obj = JSON.parse(details);
    const parts: string[] = [];
    if (obj.price && obj.price !== 'null') parts.push(`Precio: ${obj.price}`);
    if (obj.service) parts.push(`Servicio: ${obj.service}`);
    if (obj.source) parts.push(`Origen: ${obj.source}`);
    if (obj.reason) parts.push(`Motivo: ${obj.reason}`);
    if (obj.count && obj.count > 1) parts.push(`Cantidad: ${obj.count}`);
    return parts.join(' | ');
  } catch {
    return details;
  }
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Default: last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today.toISOString().slice(0, 10));

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const fromInstant = new Date(fromDate + 'T00:00:00Z').toISOString();
      const toInstant = new Date(toDate + 'T23:59:59Z').toISOString();
      const result = await clinicService.getAuditLogs(fromInstant, toInstant, p, 50);
      setLogs(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch {
      setLogs([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(0);
  };

  return (
    <div className="space-y-4">
      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Registro de actividad</h2>
            {totalElements > 0 && (
              <span className="text-[11px] text-slate-500 ml-1">{totalElements} registros</span>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
          <form onSubmit={handleFilter} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:border-gantly-blue/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-gantly-blue text-white rounded-md text-sm font-medium hover:bg-gantly-blue/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Filter size={13} />
              Filtrar
            </button>
          </form>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText size={28} strokeWidth={1.5} />
            <p className="text-sm mt-2">No hay registros de actividad</p>
            <p className="text-xs mt-0.5">Ajusta las fechas del filtro para ver resultados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Acción</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Entidad</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Realizado por</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${ACTION_STYLES[log.action] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      <span className="text-slate-500">{log.entityType}</span>
                      {log.entityId != null && (
                        <span className="text-slate-500 ml-1">#{log.entityId}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-700">
                          {log.performedByName || `ID ${log.performedById}`}
                        </span>
                        {log.performedByRole && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.performedByRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[250px] truncate">
                      {parseDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Pagina {page + 1} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page === 0}
                className="h-8 px-3 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-gantly-blue/20"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages - 1}
                className="h-8 px-3 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-gantly-blue/20"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
