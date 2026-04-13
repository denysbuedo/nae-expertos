'use client';

import { useEffect, useState } from 'react';
import { deliverablesApi, subactivitiesApi, expertPoolApi, deliverableAssignmentsApi, Deliverable, SubActivity, ExpertPoolEntry, DeliverableAssignment } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [subactivities, setSubactivities] = useState<SubActivity[]>([]);
  const [experts, setExperts] = useState<ExpertPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDel, setEditingDel] = useState<Deliverable | null>(null);
  const [formData, setFormData] = useState({
    subActivityId: '',
    title: '',
    description: '',
    status: 'PENDING' as Deliverable['status'],
    dueDate: '',
  });

  // Team management modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [activeDeliverable, setActiveDeliverable] = useState<Deliverable | null>(null);
  const [teamAssignments, setTeamAssignments] = useState<DeliverableAssignment[]>([]);
  const [newMember, setNewMember] = useState({ expertId: '', isResponsible: false, role: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [delRes, subRes, expRes] = await Promise.allSettled([
        deliverablesApi.getAll(),
        subactivitiesApi.getAll(),
        expertPoolApi.getAll(),
      ]);
      if (delRes.status === 'fulfilled') setDeliverables(delRes.value.data);
      if (subRes.status === 'fulfilled') setSubactivities(subRes.value.data);
      if (expRes.status === 'fulfilled') setExperts(expRes.value.data);
    } catch (error) { console.error('Error loading data:', error); } finally { setLoading(false); }
  };

  const openTeamModal = async (del: Deliverable) => {
    setActiveDeliverable(del);
    setShowTeamModal(true);
    try {
      const res = await deliverableAssignmentsApi.getAll(undefined, del.id);
      setTeamAssignments(res.data);
    } catch (error) { console.error('Error loading assignments:', error); setTeamAssignments([]); }
  };

  const addMember = async () => {
    if (!newMember.expertId || !activeDeliverable) return;
    try {
      await deliverableAssignmentsApi.create({
        expertId: newMember.expertId,
        deliverableId: activeDeliverable.id,
        isResponsible: newMember.isResponsible,
        role: newMember.role,
      });
      setNewMember({ expertId: '', isResponsible: false, role: '' });
      // Reload team
      const res = await deliverableAssignmentsApi.getAll(undefined, activeDeliverable.id);
      setTeamAssignments(res.data);
      // Reload deliverables to show updated team on cards
      const delRes = await deliverablesApi.getAll();
      setDeliverables(delRes.data);
    } catch (error: any) {
      console.error('Error adding member:', error);
    }
  };

  const removeMember = async (assignmentId: string) => {
    if (!confirm('¿Eliminar esta persona del entregable?')) return;
    try {
      await deliverableAssignmentsApi.delete(assignmentId);
      if (activeDeliverable) {
        const res = await deliverableAssignmentsApi.getAll(undefined, activeDeliverable.id);
        setTeamAssignments(res.data);
        const delRes = await deliverablesApi.getAll();
        setDeliverables(delRes.data);
      }
    } catch (error) { console.error('Error removing member:', error); }
  };

  const toggleResponsible = async (assignmentId: string) => {
    const assignment = teamAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    try {
      await deliverableAssignmentsApi.update(assignmentId, { isResponsible: !assignment.isResponsible });
      if (activeDeliverable) {
        const res = await deliverableAssignmentsApi.getAll(undefined, activeDeliverable.id);
        setTeamAssignments(res.data);
        const delRes = await deliverablesApi.getAll();
        setDeliverables(delRes.data);
      }
    } catch (error) { console.error('Error updating responsible:', error); }
  };

  const openCreate = () => { setEditingDel(null); setFormData({ subActivityId: '', title: '', description: '', status: 'PENDING', dueDate: '' }); setShowModal(true); };
  const openEdit = (del: Deliverable) => { setEditingDel(del); setFormData({ subActivityId: del.subActivityId, title: del.title, description: del.description || '', status: del.status, dueDate: del.dueDate ? del.dueDate.split('T')[0] : '' }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subActivityId) return;
    try {
      const data = { ...formData, dueDate: formData.dueDate || undefined };
      if (editingDel) { await deliverablesApi.update(editingDel.id, data); } else { await deliverablesApi.create(data); }
      setShowModal(false); setFormData({ subActivityId: '', title: '', description: '', status: 'PENDING', dueDate: '' }); setEditingDel(null); loadData();
    } catch (error) { console.error('Error saving deliverable:', error); }
  };

  const deleteDel = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este entregable?')) return;
    try { await deliverablesApi.delete(id); loadData(); } catch (error) { console.error('Error deleting deliverable:', error); }
  };

  const getStatusColor = (status: string) => { const c: Record<string, string> = { PENDING: 'bg-gray-100 text-gray-800', IN_PROGRESS: 'bg-blue-100 text-blue-800', SUBMITTED: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800' }; return c[status] || 'bg-gray-100 text-gray-800'; };
  const getStatusLabel = (status: string) => { const l: Record<string, string> = { PENDING: 'Pendiente', IN_PROGRESS: 'En curso', SUBMITTED: 'Entregado', APPROVED: 'Aprobado', REJECTED: 'Rechazado' }; return l[status] || status; };
  const getSubactivityTitle = (subActivityId: string) => subactivities.find(s => s.id === subActivityId)?.title || 'N/A';
  const getTeamMembers = (del: Deliverable) => del.assignments?.map(a => a.expert).filter(Boolean) || [];
  const getResponsible = (del: Deliverable) => del.assignments?.find(a => a.isResponsible)?.expert;
  const getAssignedExpertNames = (del: Deliverable) => del.assignments?.map(a => a.expert).filter(Boolean).map(e => `${e!.firstName} ${e!.lastName}`).join(', ') || 'Sin asignar';

  const availableExperts = experts.filter(exp => !teamAssignments.some(a => a.expertId === exp.id));

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Cargando...</p></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className="text-3xl font-bold text-gray-900 mb-2">Entregables</h2><p className="text-gray-600">Gestión de entregables del proyecto</p></div><Button onClick={openCreate}>Nuevo Entregable</Button></div>

      {deliverables.length === 0 ? (
        <Card><div className="p-12 text-center"><svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><h3 className="mt-2 text-sm font-medium text-gray-900">No hay entregables</h3><p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo entregable.</p></div></Card>
      ) : (
        <div className="grid gap-4">
          {deliverables.map((del) => {
            const responsible = getResponsible(del);
            const team = getTeamMembers(del);
            return (
            <Card key={del.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{del.title}</h3>
                    <p className="text-sm text-gray-500 mb-1">Subactividad: {getSubactivityTitle(del.subActivityId)}</p>
                    {team.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 mb-2">
                        {team.map(m => (
                          <span key={m!.id} className={`inline-block px-2 py-0.5 text-xs rounded-full ${m!.id === responsible?.id ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                            {m!.firstName} {m!.lastName}{m!.id === responsible?.id ? ' (R)' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {del.description && <p className="text-sm text-gray-600 mb-2">{del.description}</p>}
                    {del.dueDate && <p className="text-sm text-gray-500">Fecha límite: {new Date(del.dueDate).toLocaleDateString('es-ES')}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(del.status)}`}>{getStatusLabel(del.status)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openTeamModal(del)} className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200" title="Gestionar equipo">
                        👥 Equipo ({team.length})
                      </button>
                      <button onClick={() => openEdit(del)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Editar"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => deleteDel(del.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Modal de gestión de equipo */}
      {showTeamModal && activeDeliverable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Gestionar Equipo</h3>
                  <p className="text-sm text-gray-500">{activeDeliverable.title}</p>
                </div>
                <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Add member form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Añadir persona al equipo</h4>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={newMember.expertId}
                    onChange={(e) => setNewMember({ ...newMember, expertId: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar persona...</option>
                    {availableExperts.map(exp => (
                      <option key={exp.id} value={exp.id}>{exp.firstName} {exp.lastName} — {exp.institution}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Rol (opcional)"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={newMember.isResponsible}
                      onChange={(e) => setNewMember({ ...newMember, isResponsible: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Responsable
                  </label>
                  <Button onClick={addMember} disabled={!newMember.expertId} size="sm">Añadir</Button>
                </div>
              </div>

              {/* Team list */}
              {teamAssignments.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No hay personas asignadas a este entregable.</p>
              ) : (
                <div className="space-y-2">
                  {teamAssignments.map((a) => {
                    const exp = a.expert;
                    if (!exp) return null;
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-600">{exp.firstName[0]}{exp.lastName[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{exp.firstName} {exp.lastName}</p>
                            <p className="text-xs text-gray-500">{exp.institution}{a.role ? ` · ${a.role}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleResponsible(a.id)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${a.isResponsible ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {a.isResponsible ? '👑 Responsable' : 'Marcar como responsable'}
                          </button>
                          <button
                            onClick={() => removeMember(a.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Quitar del equipo"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal de crear/editar entregable */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-gray-900">{editingDel ? 'Editar Entregable' : 'Nuevo Entregable'}</h3><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subactividad</label><select required value={formData.subActivityId} onChange={(e) => setFormData({ ...formData, subActivityId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccionar subactividad...</option>{subactivities.map((s) => (<option key={s.id} value={s.id}>{s.number} - {s.title}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Título</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label><input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Deliverable['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="PENDING">Pendiente</option><option value="IN_PROGRESS">En curso</option><option value="SUBMITTED">Entregado</option><option value="APPROVED">Aprobado</option><option value="REJECTED">Rechazado</option></select></div></div>
                <div className="flex justify-end gap-3 pt-4"><Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancelar</Button><Button type="submit">{editingDel ? 'Guardar Cambios' : 'Crear Entregable'}</Button></div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
