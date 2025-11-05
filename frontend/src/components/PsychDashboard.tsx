import { useEffect, useState } from 'react';
import { profileService, psychService, calendarService, tasksService } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';

type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat';

export default function PsychDashboard() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const loadData = async () => {
    const m = await profileService.me();
    setMe(m);
    const p = await psychService.patients();
    setPatients(p);
    const t = await tasksService.list();
    setTasks(t);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadMySlots = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const list = await calendarService.mySlots(from.toISOString(), to.toISOString());
    setSlots(list);
  };

  const createSlot = async () => {
    if (!newSlot.start || !newSlot.end) return;
    await calendarService.createSlot(newSlot.start, newSlot.end);
    setNewSlot({ start: '', end: '' });
    await loadMySlots();
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button className={`btn-secondary ${tab==='perfil'?'active':''}`} onClick={() => setTab('perfil')}>Mi perfil</button>
        <button className={`btn-secondary ${tab==='pacientes'?'active':''}`} onClick={() => setTab('pacientes')}>Pacientes</button>
        <button className={`btn-secondary ${tab==='tareas'?'active':''}`} onClick={() => setTab('tareas')}>Tareas</button>
        <button className={`btn-secondary ${tab==='calendario'?'active':''}`} onClick={() => setTab('calendario')}>Calendario</button>
        <button className={`btn-secondary ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>Chat</button>
      </div>

      {tab === 'perfil' && (
        <div>
          <h3>Mi Perfil</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={me?.avatarUrl || 'https://via.placeholder.com/80'} alt="avatar" width={80} height={80} style={{ borderRadius: 8, objectFit: 'cover' }} />
            <div>
              <div><strong>{me?.name}</strong></div>
              <div>{me?.email}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'pacientes' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Mis pacientes</h3>
            <button className="btn-secondary" onClick={loadData}>Refrescar</button>
          </div>
          {patients.length === 0 && <div>No tienes pacientes asignados. Pide al administrador que asigne usuarios.</div>}
          <ul>
            {patients.map(p => (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <img src={p.avatarUrl || 'https://via.placeholder.com/40'} width={40} height={40} style={{ borderRadius: 8 }} />
                <div>
                  <div><strong>{p.name}</strong></div>
                  <div style={{ color: '#666' }}>{p.email}</div>
                </div>
                <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setSelectedPatient(p.id)}>Chatear</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'tareas' && (
        <div>
          <h3>Tareas</h3>
          {tasks.length === 0 && <div>No hay tareas.</div>}
          <ul>
            {tasks.map(t => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                {t.description && <div style={{ color: '#666' }}>{t.description}</div>}
                <div style={{ fontSize: 12, color: '#888' }}>Paciente: {t.user?.name} | Creada por: {t.createdBy}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'calendario' && (
        <div>
          <h3>Calendario</h3>
          <div style={{ marginBottom: 12 }}>Click en una celda para crear un slot de 1h. Usa los botones de semana para navegar.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn-secondary" onClick={loadMySlots}>Refrescar</button>
          </div>
          <CalendarWeek
            mode="PSYCHO"
            slots={slots}
            onCreateSlot={async (start, end) => { await calendarService.createSlot(start, end); await loadMySlots(); }}
          />
        </div>
      )}

      {tab === 'chat' && (
        <div>
          <h3>Chat</h3>
          <div style={{ marginBottom: 8 }}>Selecciona un paciente en la lista para abrir el chat.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 260 }}>
              <ul>
                {patients.map(p => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }} onClick={() => setTab('chat') || setPatients(patients) /* noop to force rerender */}>
                    <img src={p.avatarUrl || 'https://via.placeholder.com/28'} width={28} height={28} style={{ borderRadius: 6 }} />
                    <span>{p.name}</span>
                    <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); setSelectedPatient(p.id); }}>Abrir</button>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <ChatWidget mode="PSYCHOLOGIST" otherId={selectedPatient || undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


