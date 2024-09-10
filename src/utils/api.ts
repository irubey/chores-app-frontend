const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define types for request and response data
interface LoginRequest {
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
}

interface ChoreData {
  title: string;
  description?: string | null;
  timeEstimate?: number | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  assignedTo?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date | null;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  templateId?: string | null;
  householdId: string;
}

interface HouseholdMemberData {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

interface UserProfileData {
  name: string;
}

interface UserPreferences {
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
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  post: async (url: string, body: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('API request failed');
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
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
    return response.json();
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
  
  getAll: () => api.get('/api/households'),
  
  addMember: (householdId: string, data: HouseholdMemberData) => 
    api.post(`/api/households/${householdId}/members`, data),
  
  removeMember: (householdId: string, userId: string) => 
    api.delete(`/api/households/${householdId}/members/${userId}`),
};

// Chore Management API
export const choreApi = {
  create: (householdId: string, choreData: Omit<ChoreData, 'householdId' | 'status'>) => 
    api.post(`/api/households/${householdId}/chores`, { ...choreData, householdId }),
  
  getAll: (householdId: string) => 
    api.get(`/api/households/${householdId}/chores`),
  
  getOne: (choreId: string) => api.get(`/api/chores/${choreId}`),
  
  update: (choreId: string, choreData: Partial<ChoreData>) => 
    api.put(`/api/chores/${choreId}`, choreData),
  
  delete: (choreId: string) => api.delete(`/api/chores/${choreId}`),
  
  complete: (choreId: string) => api.post(`/api/chores/${choreId}/complete`, {}),
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
  create: (templateData: ChoreData) => api.post('/api/chore-templates', templateData),
  
  getAll: () => api.get('/api/chore-templates'),
  
  getOne: (templateId: string) => api.get(`/api/chore-templates/${templateId}`),
  
  update: (templateId: string, templateData: ChoreData) => 
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
    api.post('/api/badges/award', { user_id: userId, badge_id: badgeId }),
};
