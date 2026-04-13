'use client';

import { useEffect, useState } from 'react';
import { expertPoolApi, profilesApi, ExpertPoolEntry, Profile } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ExpertPoolPage() {
  const [entries, setEntries] = useState<ExpertPoolEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpertPoolEntry | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    profileIds: [] as string[],
    notes: '',
    active: true,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [entriesRes, profilesRes] = await Promise.all([
        expertPoolApi.getAll(),
        profilesApi.getAll(),
      ]);
      setEntries(entriesRes.data);
      setProfiles(profilesRes.data);
    } catch (error) {
      console.warn('Backend no disponible.');
      setEntries([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingEntry(null);
    setFormData({ firstName: '', lastName: '', email: '', institution: '', profileIds: [], notes: '', active: true });
    setShowModal(true);
  };

  const openEdit = (entry: ExpertPoolEntry) => {
    const profileIds = entry.profiles?.map(p => p.profileId) || [];
    setEditingEntry(entry);
    setFormData({
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      institution: entry.institution,
      profileIds,
      notes: entry.notes || '',
      active: entry.active,
    });
    setShowModal(true);
  };

  const toggleProfile = (profileId: string) => {
    setFormData(prev => ({
      ...prev,
      profileIds: prev.profileIds.includes(profileId)
        ? prev.profileIds.filter(id => id !== profileId)
        : [...prev.profileIds, profileId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.profileIds.length === 0) return;

    try {
      if (editingEntry) {
        await expertPoolApi.update(editingEntry.id, formData);
      } else {
        await expertPoolApi.create(formData);
      }
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', institution: '', profileIds: [], notes: '', active: true });
      setEditingEntry(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving:', error);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await expertPoolApi.update(id, { active: !currentActive });
      loadData();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta entrada de la bolsa de expertos?')) return;
    try {
      await expertPoolApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getProfileNames = (entry: ExpertPoolEntry) => {
    return entry.profiles?.map(p => p.profile.name).join(', ') || 'Sin perfiles';
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bolsa de Expertos</h2>
          <p className="text-gray-600">Personas disponibles con perfiles de experto</p>
        </div>
        <Button onClick={openCreate}>Nuevo Experto</Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay expertos</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza añadiendo una persona a la bolsa de expertos.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-600">
                      {entry.firstName[0]}{entry.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">
                      {entry.firstName} {entry.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">{entry.institution}</p>
                    <p className="text-xs text-gray-400 truncate">{entry.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.profiles?.map((p) => (
                        <span key={p.profileId} className="inline-block px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          {p.profile.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleActive(entry.id, entry.active)}
                    className={`px-2 py-1 text-xs font-medium rounded ${entry.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {entry.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Editar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingEntry ? 'Editar Experto' : 'Nuevo Experto en la Bolsa'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                  <input type="text" required value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Multi-select de Perfiles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perfiles de Experto <span className="text-gray-400">(selecciona uno o más)</span>
                  </label>
                  {profiles.length === 0 ? (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                      No hay perfiles creados. <a href="/profiles" className="underline text-blue-600">Crear perfiles primero</a>
                    </p>
                  ) : (
                    <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                      {profiles.map((profile) => {
                        const isSelected = formData.profileIds.includes(profile.id);
                        return (
                          <label
                            key={profile.id}
                            onClick={() => toggleProfile(profile.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProfile(profile.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{profile.name}</span>
                              {profile.description && (
                                <p className="text-xs text-gray-500 truncate">{profile.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {formData.profileIds.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.profileIds.length} perfil(es) seleccionado(s)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="active" className="text-sm text-gray-700">Disponible en la bolsa</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancelar</Button>
                  <Button type="submit" disabled={formData.profileIds.length === 0}>
                    {editingEntry ? 'Guardar Cambios' : 'Añadir a la Bolsa'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
