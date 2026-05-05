import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';

export default function AdminStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStatistics();
      setStats(data);
    } catch (error: any) {
      toast.error('Error al cargar estadísticas: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500 text-base">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <div className="bg-white rounded-xl p-8 shadow-soft border border-slate-200 flex flex-col gap-3">
      <div className="text-4xl font-bold font-heading" style={{ color }}>
        {value.toLocaleString()}
      </div>
      <div className="text-base text-slate-500 font-medium font-body">
        {title}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
        <StatCard title="Total de Usuarios" value={stats.totalUsers} color="#2E93CC" />
        <StatCard title="Usuarios" value={stats.users} color="#2E93CC" />
        <StatCard title="Psicólogos" value={stats.psychologists} color="#059669" />
        <StatCard title="Administradores" value={stats.admins} color="#0A1628" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
        <StatCard title="Tests Totales" value={stats.totalTests} color="#2E93CC" />
        <StatCard title="Tests de Evaluación" value={stats.evaluationTests} color="#2E93CC" />
        <StatCard title="Citas Totales" value={stats.totalAppointments} color="#059669" />
        <StatCard title="Citas Reservadas" value={stats.bookedAppointments} color="#059669" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        <StatCard title="Respuestas de Usuarios" value={stats.totalUserAnswers} color="#2E93CC" />
        <StatCard title="Relaciones Asignadas" value={stats.assignedRelations} color="#059669" />
        <StatCard title="Usuarios Verificados" value={stats.verifiedUsers} color="#059669" />
      </div>
    </div>
  );
}
