'use client';

import { useEffect, useState } from 'react';
import { expertPoolApi, deliverableAssignmentsApi, profilesApi, ExpertPoolEntry, DeliverableAssignment, Profile } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'workplan' | 'profiles'>('workplan');

  // Workplan state
  const [experts, setExperts] = useState<ExpertPoolEntry[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<ExpertPoolEntry | null>(null);
  const [workPlan, setWorkPlan] = useState<{ expert: ExpertPoolEntry; assignments: DeliverableAssignment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Profiles state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  useEffect(() => { 
    loadExperts(); 
    loadProfiles();
  }, []);

  const loadExperts = async () => {
    try {
      const res = await expertPoolApi.getAll();
      setExperts(res.data);
    } catch (error) { console.error('Error loading experts:', error); } finally { setLoading(false); }
  };

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await profilesApi.getAll();
      setProfiles(res.data);
    } catch (error) { console.error('Error loading profiles:', error); } finally { setLoadingProfiles(false); }
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

  const profilesWithExperts = profiles.filter(p => (p._count?.expertPoolProfiles || 0) > 0);
  const profilesWithoutExperts = profiles.filter(p => (p._count?.expertPoolProfiles || 0) === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h2>
        <p className="text-gray-600">Indicadores e informes del sistema</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('workplan')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'workplan'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Plan de Trabajo por Persona
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profiles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cobertura de Perfiles
          </button>
        </nav>
      </div>

      {activeTab === 'workplan' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
      )}

      {activeTab === 'profiles' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingProfiles ? (
             <Card><div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-3 text-gray-600">Cargando perfiles...</p></div></Card>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-red-500">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <h3 className="text-xl font-bold text-gray-900">Perfiles sin Expertos ({profilesWithoutExperts.length})</h3>
                    </div>
                    {profilesWithoutExperts.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">Todos los perfiles tienen al menos un experto asignado. ¡Excelente!</p>
                    ) : (
                      <ul className="space-y-3">
                        {profilesWithoutExperts.map(p => (
                          <li key={p.id} className="p-3 bg-red-50 rounded-md border border-red-100">
                            <p className="font-semibold text-red-900">{p.name}</p>
                            {p.description && <p className="text-xs text-red-700 mt-1">{p.description}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>

                <Card className="border-t-4 border-t-green-500">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <h3 className="text-xl font-bold text-gray-900">Perfiles Cubiertos ({profilesWithExperts.length})</h3>
                    </div>
                    {profilesWithExperts.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">Aún no se ha asignado ningún experto a los perfiles existentes.</p>
                    ) : (
                      <div className="space-y-4">
                        {profilesWithExperts.map(p => (
                          <div key={p.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-gray-900">{p.name}</p>
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                {p._count?.expertPoolProfiles} experto(s)
                              </span>
                            </div>
                            <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1">
                              {p.expertPoolProfiles?.map((ep) => (
                                <p key={ep.expert.id} className="text-sm text-gray-600">
                                  • {ep.expert.firstName} {ep.expert.lastName} <span className="text-xs text-gray-400">({ep.expert.institution})</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
