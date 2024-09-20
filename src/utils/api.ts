const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description?: string | null;
  timeEstimate?: number | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  assignedTo: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date | null;
  lastCompleted?: Date | null;
  templateId?: string | null;
}

export type CreateChoreData = Omit<Chore, 'id' | 'status' | 'lastCompleted'| 'priority'>;
export type UpdateChoreData = Partial<Omit<Chore, 'id' | 'householdId'>>;

interface HouseholdMemberData {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

interface UserProfileData {
  name: string;
}

export interface UserPreferences {
  notificationPreferences: {
    [key: string]: boolean;
  };
  chorePreferences: {
    [key: string]: string;
  };
  theme: 'light' | 'dark';
}

interface CalendarIntegrationData {
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface LoginRequest {
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
}

const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!IS_DEVELOPMENT) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Update the API calls with specific types and include credentials
export const api = {
  get: async <T>(url: string): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // ... (existing error handling)
      }

      const data = await response.json();
      return convertKeys(data, toCamelCase) as T;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  },
  post: async <T>(url: string, body: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(convertKeys(body, toSnakeCase)),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return convertKeys(data, toCamelCase) as T;
  },

  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(convertKeys(data, toSnakeCase)),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('API request failed');
    }
    return convertKeys(await response.json(), toCamelCase);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('API request failed');
    }
    return convertKeys(await response.json(), toCamelCase);
  },
};

// Authentication API
export const authApi = {
  login: (data: LoginRequest) => api.post('/api/auth/login', data),
  
  logout: () => api.post('/api/auth/logout', {}),
  
  getUser: () => api.get('/api/auth/user'),
};

// Household Management API
export const householdApi = {
  create: (name: string) => api.post('/api/households', { name }),
  
  getAll: (householdId: string) => api.get(`/api/households/${householdId}`),
  
  addMember: (householdId: string, data: HouseholdMemberData) => 
    api.post(`/api/households/${householdId}/members`, data),
  
  removeMember: (householdId: string, userId: string) => 
    api.delete(`/api/households/${householdId}/members/${userId}`),
};

// Chore Management API
export const choreApi = {
  create: (householdId: string, choreData: CreateChoreData) => 
    api.post<Chore>(`/api/households/${householdId}/chores`, choreData),
  
  getAll: (householdId: string) => 
    api.get<Chore[]>(`/api/households/${householdId}/chores`),
  
  getOne: (choreId: string) => 
    api.get<Chore>(`/api/chores/${choreId}`),
  
  update: (choreId: string, choreData: UpdateChoreData) => 
    api.put<Chore>(`/api/chores/${choreId}`, choreData),
  
  delete: (choreId: string) => 
    api.delete<void>(`/api/chores/${choreId}`),
  
  complete: (choreId: string) => 
    api.post<Chore>(`/api/chores/${choreId}/complete`, {}),
};

// Notifications API
export const notificationApi = {
  getAll: () => api.get('/api/notifications'),
  
  markAsRead: (notificationId: string) => 
    api.put(`/api/notifications/${notificationId}/read`, {}),
  
  delete: (notificationId: string) => 
    api.delete(`/api/notifications/${notificationId}`),
  
  updatePreferences: (preferences: UserPreferences) => 
    api.put('/api/notifications/preferences', preferences),
};

// Chore Templates API
export const choreTemplateApi = {
  create: (templateData: Chore) => api.post('/api/chore-templates', templateData),
  
  getAll: () => api.get('/api/chore-templates'),
  
  getOne: (templateId: string) => api.get(`/api/chore-templates/${templateId}`),
  
  update: (templateId: string, templateData: Chore) => 
    api.put(`/api/chore-templates/${templateId}`, templateData),
  
  delete: (templateId: string) => api.delete(`/api/chore-templates/${templateId}`),
};

// User Management API
export const userApi = {
  getProfile: () => api.get('/api/users/profile'),
  
  updateProfile: (profileData: UserProfileData) => 
    api.put('/api/users/profile', profileData),
  
  getPreferences: () => api.get('/api/users/preferences'),
  
  updatePreferences: (preferencesData: UserPreferences) => 
    api.put('/api/users/preferences', preferencesData),
  
  getBadges: () => api.get('/api/users/badges'),
};

// Calendar Integration API
export const calendarApi = {
  addIntegration: (integrationData: CalendarIntegrationData) => 
    api.post('/api/calendar-integration', integrationData),
  
  getIntegration: () => api.get('/api/calendar-integration'),
  
  removeIntegration: () => api.delete('/api/calendar-integration'),
  
  sync: () => api.post('/api/calendar-integration/sync', {}),
};

// Badges API
export const badgeApi = {
  getAll: () => api.get('/api/badges'),
  
  award: (userId: string, badgeId: string) => 
    api.post('/api/badges/award', { userId, badgeId }),
};

export const fetchPresetTemplates = async () => {
  const response = await fetch('/api/chore-templates/preset');
  if (!response.ok) {
    throw new Error('Failed to fetch preset templates');
  }
  return convertKeys(await response.json(), toCamelCase);
};

const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const convertKeys = (obj: any, converter: (str: string) => string): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => convertKeys(v, converter));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [converter(key)]: convertKeys(obj[key], converter),
      }),
      {},
    );
  }
  return obj;
};
