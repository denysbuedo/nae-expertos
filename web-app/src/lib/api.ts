import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface SystemUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  orderId: string;
  number: string;
  title: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubActivity {
  id: string;
  activityId: string;
  number: string;
  title: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  subActivityId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  dueDate?: string;
  deliveryDate?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  assignments?: DeliverableAssignment[];
  subActivity?: SubActivity;
}

export interface DeliverableAssignment {
  id: string;
  expertId: string;
  deliverableId: string;
  isResponsible: boolean;
  role?: string;
  assignedAt: string;
  expert?: ExpertPoolEntry;
  deliverable?: Deliverable;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  type: 'nacional' | 'internacional';
  createdAt: string;
  updatedAt: string;
  expertPoolProfiles?: Array<{ expert: ExpertPoolEntry }>;
  _count?: { expertPoolProfiles: number };
}

export interface Assignment {
  id: string;
  profileId: string;
  subActivityId: string;
  role?: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertPoolEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  institution: string;
  profileIds?: string[];
  profiles?: Array<{ id: string; profileId: string; profile: Profile }>;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Functions
export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data),
  update: (id: string, data: Partial<Order>) => api.put<Order>(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

export const activitiesApi = {
  getAll: (orderId?: string) => api.get<Activity[]>('/activities', { params: { orderId } }),
  getById: (id: string) => api.get<Activity>(`/activities/${id}`),
  create: (data: Partial<Activity>) => api.post<Activity>('/activities', data),
  update: (id: string, data: Partial<Activity>) => api.put<Activity>(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
};

export const subactivitiesApi = {
  getAll: (activityId?: string) => api.get<SubActivity[]>('/subactivities', { params: { activityId } }),
  getById: (id: string) => api.get<SubActivity>(`/subactivities/${id}`),
  create: (data: Partial<SubActivity>) => api.post<SubActivity>('/subactivities', data),
  update: (id: string, data: Partial<SubActivity>) => api.put<SubActivity>(`/subactivities/${id}`, data),
  delete: (id: string) => api.delete(`/subactivities/${id}`),
};

export const deliverablesApi = {
  getAll: (subActivityId?: string) =>
    api.get<Deliverable[]>('/deliverables', { params: { subActivityId } }),
  getById: (id: string) => api.get<Deliverable>(`/deliverables/${id}`),
  create: (data: Partial<Deliverable>) => api.post<Deliverable>('/deliverables', data),
  update: (id: string, data: Partial<Deliverable>) => api.put<Deliverable>(`/deliverables/${id}`, data),
  delete: (id: string) => api.delete(`/deliverables/${id}`),
};

export const deliverableAssignmentsApi = {
  getAll: (expertId?: string, deliverableId?: string) =>
    api.get<DeliverableAssignment[]>('/deliverable-assignments', { params: { expertId, deliverableId } }),
  getByExpert: (expertId: string) => api.get<{ expert: ExpertPoolEntry; assignments: DeliverableAssignment[] }>(`/deliverable-assignments/expert/${expertId}`),
  create: (data: Partial<DeliverableAssignment>) => api.post<DeliverableAssignment>('/deliverable-assignments', data),
  update: (id: string, data: Partial<DeliverableAssignment>) => api.put<DeliverableAssignment>(`/deliverable-assignments/${id}`, data),
  delete: (id: string) => api.delete(`/deliverable-assignments/${id}`),
};

export const profilesApi = {
  getAll: () => api.get<Profile[]>('/profiles'),
  getById: (id: string) => api.get<Profile>(`/profiles/${id}`),
  create: (data: Partial<Profile>) => api.post<Profile>('/profiles', data),
  update: (id: string, data: Partial<Profile>) => api.put<Profile>(`/profiles/${id}`, data),
  delete: (id: string) => api.delete(`/profiles/${id}`),
};

export const assignmentsApi = {
  getAll: (profileId?: string, subActivityId?: string) =>
    api.get<Assignment[]>('/assignments', { params: { profileId, subActivityId } }),
  getById: (id: string) => api.get<Assignment>(`/assignments/${id}`),
  create: (data: Partial<Assignment>) => api.post<Assignment>('/assignments', data),
  update: (id: string, data: Partial<Assignment>) => api.put<Assignment>(`/assignments/${id}`, data),
  delete: (id: string) => api.delete(`/assignments/${id}`),
};

export const expertPoolApi = {
  getAll: (profileId?: string, active?: boolean) =>
    api.get<ExpertPoolEntry[]>('/expert-pool', { params: { profileId, active } }),
  getById: (id: string) => api.get<ExpertPoolEntry>(`/expert-pool/${id}`),
  create: (data: Partial<ExpertPoolEntry>) => api.post<ExpertPoolEntry>('/expert-pool', data),
  update: (id: string, data: Partial<ExpertPoolEntry>) => api.put<ExpertPoolEntry>(`/expert-pool/${id}`, data),
  delete: (id: string) => api.delete(`/expert-pool/${id}`),
};

export const usersApi = {
  getAll: () => api.get<SystemUser[]>('/users'),
  create: (data: { username: string; password: string; role: string }) => api.post<SystemUser>('/users', data),
  update: (id: string, data: { password?: string; role?: string }) => api.put<SystemUser>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;
