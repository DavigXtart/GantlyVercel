import { useEffect, useMemo, useState } from 'react';

type Slot = { id: number; startTime: string; endTime: string; status: 'FREE'|'BOOKED'|'CANCELLED'; user?: { name: string } };

type Props = {
  mode: 'PSYCHO' | 'USER';
  slots: Slot[];
  onCreateSlot?: (startIso: string, endIso: string) => void;
  onBook?: (appointmentId: number) => void;
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function CalendarWeek({ mode, slots, onCreateSlot, onBook }: Props) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const hours = Array.from({ length: 12 }).map((_, i) => 8 + i); // 8:00 - 20:00
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const slotByDayHour = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const start = new Date(s.startTime);
      const key = `${start.toDateString()}-${start.getHours()}`;
      (map[key] ||= []).push(s);
    }
    return map;
  }, [slots]);

  const createAt = (day: Date, hour: number) => {
    if (!onCreateSlot) return;
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    onCreateSlot(start.toISOString(), end.toISOString());
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>◀ Semana previa</button>
        <div style={{ fontWeight: 600 }}>{days[0].toLocaleDateString()} - {days[6].toLocaleDateString()}</div>
        <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Semana siguiente ▶</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: '#fafafa', padding: 8 }}></div>
        {days.map((d, i) => (
          <div key={i} style={{ background: '#fafafa', padding: 8, borderLeft: i===0 ? 'none' : '1px solid #eee' }}>
            <div style={{ fontWeight: 600 }}>{d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
          </div>
        ))}
        {hours.map((h, ri) => (
          <>
            <div key={`h-${h}`} style={{ padding: 8, borderTop: '1px solid #eee', background: '#fafafa' }}>{String(h).padStart(2,'0')}:00</div>
            {days.map((d, ci) => {
              const key = `${d.toDateString()}-${h}`;
              const list = slotByDayHour[key] || [];
              const has = list.length > 0;
              return (
                <div key={`c-${ri}-${ci}`} style={{ borderTop: '1px solid #eee', borderLeft: '1px solid #eee', padding: 6, minHeight: 52, cursor: onCreateSlot && mode==='PSYCHO' ? 'pointer' : 'default' }}
                  onClick={() => mode==='PSYCHO' && onCreateSlot && createAt(d, h)}>
                  {has ? list.map(s => (
                    <div key={s.id} style={{ background: s.status==='FREE' ? '#e6f7ff' : s.status==='BOOKED' ? '#eaffea' : '#f0f0f0', border: '1px solid #ddd', borderRadius: 6, padding: '4px 6px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12 }}>
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {s.user?.name ? ` · ${s.user.name}` : ''}
                      </span>
                      {mode==='USER' && s.status==='FREE' && onBook && (
                        <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); onBook(s.id); }}>Reservar</button>
                      )}
                    </div>
                  )) : (
                    mode==='PSYCHO' ? <div style={{ color: '#bbb', fontSize: 12 }}>Click para crear</div> : null
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}


