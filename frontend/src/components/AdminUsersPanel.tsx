import { useEffect, useState } from 'react';
import { adminService } from '../services/api';

type User = { id: number; name: string; email: string; role: 'USER'|'ADMIN'|'PSYCHOLOGIST'; psychologistId?: number | null; psychologistName?: string | null };

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [psychs, setPsychs] = useState<User[]>([]);
  const [assign, setAssign] = useState<{ [userId: number]: number | undefined }>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    }
  };

  const onUnassign = async (userId: number) => {
    try {
      await adminService.unassignPsychologist(userId);
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
      alert(`No se pudo desvincular: ${msg}`);
    }
  };

  const onSelectChange = async (userId: number, value: string) => {
    const psychologistId = value ? Number(value) : undefined;
    setAssign({ ...assign, [userId]: psychologistId });

    // Si se deselecciona (value vacío) y había un psicólogo asignado, desvincular
    if (!value && users.find(u => u.id === userId)?.psychologistId) {
      await onUnassign(userId);
    }
  };

  // Filtrar usuarios por nombre o correo
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  return (
    <div className="max-w-[1200px] mx-auto">
      <h3 className="text-xl font-heading font-bold text-slate-800 mb-4">Gestión de usuarios</h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-[400px] px-4 py-2.5 text-[15px] border border-slate-200 rounded-lg outline-none transition-colors focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200"
        />
      </div>
      {loading && <div className="text-slate-500 py-4">Cargando...</div>}
      <div className="bg-white rounded-xl shadow-soft border border-slate-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left p-3 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="text-left p-3 text-sm font-semibold text-slate-600">Email</th>
              <th className="text-left p-3 text-sm font-semibold text-slate-600">Rol</th>
              <th className="text-left p-3 text-sm font-semibold text-slate-600">Asignar psicólogo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3 text-sm text-slate-700">{u.name}</td>
                <td className="p-3 text-sm text-slate-500">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => onRoleChange(u.id, e.target.value as any)}
                    className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-gantly-blue-500 outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="PSYCHOLOGIST">PSYCHOLOGIST</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex gap-2 items-center">
                    <select
                      value={assign[u.id] ?? ''}
                      onChange={(e) => onSelectChange(u.id, e.target.value)}
                      className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-gantly-blue-500 outline-none"
                    >
                      <option value="">-- Selecciona --</option>
                      {psychs.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                    <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => onAssign(u.id)}>Asignar</button>
                    {u.psychologistName && (
                      <span className="text-slate-500 text-xs">Asignado: {u.psychologistName}</span>
                    )}
                  </div>
                </td>
                <td className="p-3"></td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


