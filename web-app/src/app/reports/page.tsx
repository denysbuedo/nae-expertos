'use client';

import { useEffect, useState } from 'react';
import { expertPoolApi, deliverableAssignmentsApi, ExpertPoolEntry, DeliverableAssignment } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReportsPage() {
  const [experts, setExperts] = useState<ExpertPoolEntry[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<ExpertPoolEntry | null>(null);
  const [workPlan, setWorkPlan] = useState<{ expert: ExpertPoolEntry; assignments: DeliverableAssignment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => { loadExperts(); }, []);

  const loadExperts = async () => {
    try {
      const res = await expertPoolApi.getAll();
      setExperts(res.data);
    } catch (error) { console.error('Error loading experts:', error); } finally { setLoading(false); }
  };

  const loadWorkPlan = async (expert: ExpertPoolEntry) => {
    setSelectedExpert(expert);
    setLoadingPlan(true);
    try {
      const res = await deliverableAssignmentsApi.getByExpert(expert.id);
      setWorkPlan(res.data);
    } catch (error) { console.error('Error loading work plan:', error); } finally { setLoadingPlan(false); }
  };

  const getStatusColor = (status: string) => {
    const c: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800', IN_PROGRESS: 'bg-blue-100 text-blue-800',
      SUBMITTED: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800',
    };
    return c[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const l: Record<string, string> = {
      PENDING: 'Pendiente', IN_PROGRESS: 'En curso', SUBMITTED: 'Entregado', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
    };
    return l[status] || status;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Cargando...</p></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h2>
        <p className="text-gray-600">Plan de trabajo por persona</p>
      </div>

      {/* Selector de persona */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Persona</h3>
          {experts.length === 0 ? (
            <p className="text-gray-500">No hay expertos registrados en la bolsa.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {experts.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => loadWorkPlan(expert)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedExpert?.id === expert.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600">{expert.firstName[0]}{expert.lastName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{expert.firstName} {expert.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{expert.institution}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Plan de Trabajo */}
      {loadingPlan && (
        <Card><div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-3 text-gray-600">Cargando plan de trabajo...</p></div></Card>
      )}

      {workPlan && !loadingPlan && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Plan de Trabajo: {workPlan.expert.firstName} {workPlan.expert.lastName}
                </h3>
                <p className="text-sm text-gray-500">{workPlan.expert.institution}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {workPlan.expert.profiles?.map(p => (
                    <span key={p.profileId} className="inline-block px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">{p.profile.name}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{workPlan.assignments.length}</p>
                <p className="text-sm text-gray-500">entregable(s)</p>
              </div>
            </div>

            {workPlan.assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Esta persona no tiene entregables asignados aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Entregable</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Subactividad</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Estado</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Fecha Límite</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workPlan.assignments.map((a, i) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-500">{i + 1}</td>
                        <td className="py-3 px-2 font-medium text-gray-900">{a.deliverable?.title}</td>
                        <td className="py-3 px-2 text-gray-600">{a.deliverable?.subActivity?.title || 'N/A'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(a.deliverable?.status || 'PENDING')}`}>
                            {getStatusLabel(a.deliverable?.status || 'PENDING')}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {a.deliverable?.dueDate ? new Date(a.deliverable.dueDate).toLocaleDateString('es-ES') : '—'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {a.isResponsible ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">Responsable</span>
                          ) : (
                            <span className="text-gray-400">Colaborador</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
