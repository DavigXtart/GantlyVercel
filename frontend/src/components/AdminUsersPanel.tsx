import { useEffect, useState } from 'react';
import { adminService } from '../services/api';

type User = { id: number; name: string; email: string; role: 'USER'|'ADMIN'|'PSYCHOLOGIST'; psychologistId?: number | null; psychologistName?: string | null };

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [psychs, setPsychs] = useState<User[]>([]);
  const [assign, setAssign] = useState<{ [userId: number]: number | undefined }>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, p] = await Promise.all([adminService.listUsers(), adminService.listPsychologists()]);
    setUsers(u as any);
    setPsychs(p as any);
    // Inicializar el estado de asignación con los psicólogos ya asignados
    const assignMap: { [userId: number]: number | undefined } = {};
    (u as any).forEach((user: User) => {
      if (user.psychologistId) {
        assignMap[user.id] = user.psychologistId;
      }
    });
    setAssign(assignMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRoleChange = async (userId: number, role: 'USER'|'ADMIN'|'PSYCHOLOGIST') => {
    await adminService.setUserRole(userId, role);
    await load();
  };

  const onAssign = async (userId: number) => {
    const psychologistId = assign[userId];
    if (!psychologistId) {
      alert('Selecciona un psicólogo antes de asignar');
      return;
    }
    try {
      await adminService.assignPsychologist(userId, psychologistId);
      await load();
    } catch (e: any) {
      let msg = 'Error desconocido';
      if (e?.response?.data) {
        const data = e.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.message) {
          msg = data.message;
        } else if (data.error) {
          msg = `${data.error}: ${data.message || 'Error desconocido'}`;
        } else {
          msg = JSON.stringify(data);
        }
      } else if (e?.message) {
        msg = e.message;
      }
      alert(`No se pudo asignar: ${msg}`);
      console.error('Error asignando:', e);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <h3>Gestión de usuarios</h3>
      {loading && <div>Cargando...</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Rol</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Asignar psicólogo</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{u.name}</td>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>
                <select value={u.role} onChange={(e) => onRoleChange(u.id, e.target.value as any)}>
                  <option value="USER">USER</option>
                  <option value="PSYCHOLOGIST">PSYCHOLOGIST</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td style={{ padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={assign[u.id] ?? ''} onChange={(e) => setAssign({ ...assign, [u.id]: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- Selecciona --</option>
                    {psychs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                  <button className="btn-secondary" onClick={() => onAssign(u.id)}>Asignar</button>
                  {u.psychologistName && (
                    <span style={{ color: '#666', fontSize: '0.9em' }}>Asignado: {u.psychologistName}</span>
                  )}
                </div>
              </td>
              <td style={{ padding: 8 }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


