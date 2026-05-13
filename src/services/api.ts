import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  },
  register: async (details: any) => {
    const { data } = await api.post('/auth/register', details);
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const deviceService = {
  getDevices: async () => {
    const { data } = await api.get('/devices');
    return data;
  },
  addDevice: async (deviceData: any) => {
    const { data } = await api.post('/devices', deviceData);
    return data;
  }
};

export default api;
