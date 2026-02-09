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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(90, 146, 112, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        fontSize: '36px',
        fontWeight: 700,
        color: color,
        fontFamily: "'Inter', sans-serif"
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{
        fontSize: '16px',
        color: '#6b7280',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif"
      }}>
        {title}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard title="Total de Usuarios" value={stats.totalUsers} color="#5a9270" />
        <StatCard title="Usuarios" value={stats.users} color="#5a9270" />
        <StatCard title="Psicólogos" value={stats.psychologists} color="#5a9270" />
        <StatCard title="Administradores" value={stats.admins} color="#5a9270" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard title="Tests Totales" value={stats.totalTests} color="#5a9270" />
        <StatCard title="Tests de Evaluación" value={stats.evaluationTests} color="#5a9270" />
        <StatCard title="Citas Totales" value={stats.totalAppointments} color="#5a9270" />
        <StatCard title="Citas Reservadas" value={stats.bookedAppointments} color="#5a9270" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px'
      }}>
        <StatCard title="Respuestas de Usuarios" value={stats.totalUserAnswers} color="#5a9270" />
        <StatCard title="Relaciones Asignadas" value={stats.assignedRelations} color="#5a9270" />
        <StatCard title="Usuarios Verificados" value={stats.verifiedUsers} color="#5a9270" />
      </div>
    </div>
  );
}

