'use client';

import { useEffect, useState } from 'react';
import { activitiesApi, ordersApi, Activity, Order } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    orderId: '',
    number: '',
    title: '',
    description: '',
    status: 'PLANNED' as Activity['status'],
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [activitiesRes, ordersRes] = await Promise.all([
        activitiesApi.getAll(),
        ordersApi.getAll(),
      ]);
      setActivities(activitiesRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingActivity(null);
    setFormData({ orderId: '', number: '', title: '', description: '', status: 'PLANNED', startDate: '', endDate: '' });
    setShowModal(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      orderId: activity.orderId,
      number: activity.number,
      title: activity.title,
      description: activity.description || '',
      status: activity.status,
      startDate: activity.startDate.split('T')[0],
      endDate: activity.endDate ? activity.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId) return;
    try {
      if (editingActivity) {
        await activitiesApi.update(editingActivity.id, formData);
      } else {
        await activitiesApi.create({ ...formData, orderId: formData.orderId });
      }
      setShowModal(false);
      setFormData({ orderId: '', number: '', title: '', description: '', status: 'PLANNED', startDate: '', endDate: '' });
      setEditingActivity(null);
      loadData();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const deleteActivity = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
    try {
      await activitiesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANNED: 'Planificada',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getOrderNumber = (orderId: string) => {
    return orders.find(o => o.id === orderId)?.number || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Actividades</h2>
          <p className="text-gray-600">Gestión de actividades del proyecto</p>
        </div>
        <Button onClick={openCreate}>Nueva Actividad</Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividades</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva actividad.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">{activity.number}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Orden: {getOrderNumber(activity.orderId)}</p>
                    {activity.description && <p className="text-sm text-gray-600 mb-3">{activity.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Inicio: {new Date(activity.startDate).toLocaleDateString('es-ES')}</span>
                      {activity.endDate && <span>Fin: {new Date(activity.endDate).toLocaleDateString('es-ES')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                    <button onClick={() => openEdit(activity)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Editar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deleteActivity(activity.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Pedido</label>
                  <select required value={formData.orderId} onChange={(e) => setFormData({ ...formData, orderId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar orden...</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>{order.number} - {order.title}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Número</label><input type="text" required value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Título</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label><input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin (opcional)</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancelar</Button>
                  <Button type="submit">{editingActivity ? 'Guardar Cambios' : 'Crear Actividad'}</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
