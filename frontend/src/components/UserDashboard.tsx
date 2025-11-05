import { useEffect, useState } from 'react';
import { profileService, tasksService, calendarService } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';

type Tab = 'perfil' | 'mi-psicologo' | 'tareas' | 'calendario' | 'chat';

export default function UserDashboard() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [psych, setPsych] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const loadData = async () => {
    const m = await profileService.me();
    setMe(m);
    const p = await profileService.myPsychologist();
    setPsych(p);
    const t = await tasksService.list();
    setTasks(t);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const res = await profileService.uploadAvatar(e.target.files[0]);
    setMe({ ...me, avatarUrl: res.avatarUrl });
  };

  const toggleDarkMode = async () => {
    await profileService.update({ darkMode: !me?.darkMode });
    setMe({ ...me, darkMode: !me?.darkMode });
  };

  const loadMySlots = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const list = await calendarService.mySlots(from.toISOString(), to.toISOString());
    setSlots(list);
  };

  const loadAvailability = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const list = await calendarService.availability(from.toISOString(), to.toISOString());
    setSlots(list);
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button className={`btn-secondary ${tab==='perfil'?'active':''}`} onClick={() => setTab('perfil')}>Perfil</button>
        <button className={`btn-secondary ${tab==='mi-psicologo'?'active':''}`} onClick={() => setTab('mi-psicologo')}>Mi psicólogo</button>
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
              <label className="btn-secondary" style={{ marginTop: 8 }}>
                Cambiar avatar
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!me?.darkMode} onChange={toggleDarkMode} />
              Modo oscuro
            </label>
          </div>
        </div>
      )}

      {tab === 'mi-psicologo' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Mi psicólogo</h3>
            <button className="btn-secondary" onClick={loadData}>Refrescar</button>
          </div>
          {psych?.status === 'ASSIGNED' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={psych.psychologist.avatarUrl || 'https://via.placeholder.com/48'} width={48} height={48} style={{ borderRadius: 8 }} />
              <div>
                <div><strong>{psych.psychologist.name}</strong></div>
                <div style={{ color: '#666' }}>{psych.psychologist.email}</div>
              </div>
            </div>
          ) : (
            <div>Estás a la espera de asignación de psicólogo.</div>
          )}
        </div>
      )}

      {tab === 'tareas' && (
        <div>
          <h3>Tareas</h3>
          {tasks.length === 0 && <div>No hay tareas disponibles.</div>}
          <ul>
            {tasks.map(t => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                {t.description && <div style={{ color: '#666' }}>{t.description}</div>}
                <div style={{ fontSize: 12, color: '#888' }}>Creada por: {t.createdBy}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'calendario' && (
        <div>
          <h3>Calendario</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn-secondary" onClick={loadAvailability}>Refrescar</button>
          </div>
          <CalendarWeek
            mode="USER"
            slots={slots}
            onBook={async (id) => { await calendarService.book(id); await loadAvailability(); }}
          />
        </div>
      )}

      {tab === 'chat' && (
        <div>
          <h3>Chat</h3>
          <ChatWidget mode="USER" />
        </div>
      )}
    </div>
  );
}


