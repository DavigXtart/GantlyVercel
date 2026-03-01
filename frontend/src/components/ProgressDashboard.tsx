import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { personalAgendaService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

interface DailyEntry {
  id: number;
  entryDate: string;
  moodRating: number;
  emotions: string;
  activities: string;
  companions: string;
  location: string;
  notes: string;
}

interface Statistics {
  averageMood: number;
  totalEntries: number;
  streak: number;
  mostCommonEmotions: Record<string, number>;
  mostCommonActivities: Record<string, number>;
}

interface MoodDataPoint {
  date: string;
  mood: number;
}

interface FrequencyDataPoint {
  name: string;
  count: number;
}

function getMoodColor(avg: number): string {
  if (avg >= 3.5) return '#48bb78';
  if (avg >= 2.5) return '#f59e0b';
  return '#ef4444';
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function parseTopItems(record: Record<string, number>, limit: number): FrequencyDataPoint[] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export default function ProgressDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statistics, entries] = await Promise.all([
        personalAgendaService.getStatistics(30),
        personalAgendaService.getUserEntries()
      ]);

      setStats(statistics);

      // Build mood data from entries, sorted by date, limited to last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

      const sorted = (entries as DailyEntry[])
        .filter((e) => e.entryDate >= cutoff)
        .sort((a, b) => a.entryDate.localeCompare(b.entryDate))
        .map((e) => ({
          date: formatDateLabel(e.entryDate),
          mood: e.moodRating
        }));

      setMoodData(sorted);
    } catch {
      // silently handle – empty state will show
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

  if (!stats || stats.totalEntries === 0) {
    return (
      <div style={cardStyle}>
        <EmptyState
          title="Sin datos disponibles"
          description="No hay datos suficientes para mostrar estadisticas. Comienza a registrar tu estado de animo diario."
        />
      </div>
    );
  }

  const topEmotions = stats.mostCommonEmotions
    ? parseTopItems(stats.mostCommonEmotions, 5)
    : [];
  const topActivities = stats.mostCommonActivities
    ? parseTopItems(stats.mostCommonActivities, 5)
    : [];

  const avgMoodColor = getMoodColor(stats.averageMood);

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>Progreso de Estado de Animo</h2>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '36px'
      }}>
        {/* Average mood */}
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Promedio</div>
          <div style={{ fontSize: '42px', fontWeight: 700, color: avgMoodColor, lineHeight: 1.1 }}>
            {stats.averageMood?.toFixed(1) ?? '0.0'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>de 5.0</div>
        </div>

        {/* Streak */}
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Racha Actual</div>
          <div style={{ fontSize: '42px', fontWeight: 700, color: '#5a9270', lineHeight: 1.1 }}>
            {stats.streak ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>dias consecutivos</div>
        </div>

        {/* Total entries */}
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total Entradas</div>
          <div style={{ fontSize: '42px', fontWeight: 700, color: '#5a9270', lineHeight: 1.1 }}>
            {stats.totalEntries ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>registros</div>
        </div>
      </div>

      {/* Mood line chart */}
      {moodData.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={sectionTitleStyle}>Estado de Animo - Ultimos 30 Dias</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  formatter={(value: any) => [value, 'Estado de animo']}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#5a9270"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#5a9270', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#5a9270', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top emotions bar chart */}
      {topEmotions.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={sectionTitleStyle}>Emociones Mas Frecuentes</h3>
          <div style={{ width: '100%', height: topEmotions.length * 48 + 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topEmotions}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 13, fill: '#3a5a4a' }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  formatter={(value: any) => [value, 'Veces']}
                />
                <Bar dataKey="count" fill="#5a9270" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top activities bar chart */}
      {topActivities.length > 0 && (
        <div>
          <h3 style={sectionTitleStyle}>Actividades Mas Frecuentes</h3>
          <div style={{ width: '100%', height: topActivities.length * 48 + 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topActivities}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 13, fill: '#3a5a4a' }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  formatter={(value: any) => [value, 'Veces']}
                />
                <Bar dataKey="count" fill="#667eea" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared styles ─── */

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '20px',
  boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
  padding: '40px',
  border: '1px solid rgba(90, 146, 112, 0.15)',
  fontFamily: "'Inter', sans-serif"
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#1a2e22',
  marginBottom: '32px',
  fontFamily: "'Inter', sans-serif"
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#3a5a4a',
  marginBottom: '16px',
  fontFamily: "'Inter', sans-serif"
};

const statCardStyle: React.CSSProperties = {
  padding: '24px',
  background: '#f8faf9',
  borderRadius: '16px',
  border: '1px solid rgba(90, 146, 112, 0.15)',
  textAlign: 'center'
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '8px',
  fontWeight: 500
};
