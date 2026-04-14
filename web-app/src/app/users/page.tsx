'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, SystemUser } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  USER: 'Editor',
  VIEWER: 'Solo lectura',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  USER: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'VIEWER' });
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (e) { console.error('Error loading users:', e); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditingUser(null); setFormData({ username: '', password: '', role: 'VIEWER' }); setError(''); setShowModal(true); };
  const openEdit = (user: SystemUser) => { setEditingUser(user); setFormData({ username: user.username, password: '', role: user.role }); setError(''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, { role: formData.role, password: formData.password || undefined });
      } else {
        await usersApi.create(formData);
      }
      setShowModal(false);
      setFormData({ username: '', password: '', role: 'VIEWER' });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await usersApi.delete(id); loadUsers(); } catch (err: any) { setError(err.response?.data?.error || 'Error al eliminar'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Cargando...</p></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Usuarios del Sistema</h2>
          <p className="text-gray-600">Gestión de acceso y permisos</p>
        </div>
        <Button onClick={openCreate}>Nuevo Usuario</Button>
      </div>

      {/* Roles info */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Roles disponibles</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="inline-block px-2 py-1 text-xs font-bold text-red-800 bg-red-200 rounded-full mb-2">Administrador</span>
              <p className="text-sm text-red-700">Acceso total: puede crear, editar, eliminar y gestionar usuarios.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="inline-block px-2 py-1 text-xs font-bold text-green-800 bg-green-200 rounded-full mb-2">Editor</span>
              <p className="text-sm text-green-700">Puede crear, editar y eliminar datos del sistema (órdenes, actividades, entregables, etc.).</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="inline-block px-2 py-1 text-xs font-bold text-gray-800 bg-gray-200 rounded-full mb-2">Solo lectura</span>
              <p className="text-sm text-gray-700">Solo puede ver la información. No puede crear, editar ni eliminar registros.</p>
            </div>
          </div>
        </div>
      </Card>

      {users.length === 0 ? (
        <Card><div className="p-12 text-center"><svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg><h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios registrados</h3><p className="mt-1 text-sm text-gray-500">Crea el primer usuario del sistema.</p></div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Creado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Editar">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                  <input type="text" required value={formData.username} disabled={!!editingUser} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {editingUser && <span className="text-gray-400">(dejar vacío para no cambiar)</span>}
                  </label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ADMIN">Administrador</option>
                    <option value="USER">Editor</option>
                    <option value="VIEWER">Solo lectura</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancelar</Button>
                  <Button type="submit">{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
