import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Services
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data)
};

export const surveyAPI = {
  create: (data) => axiosInstance.post('/surveys/', data),
  getMySurveys: () => axiosInstance.get('/surveys/'),
  getResults: (surveyId) => axiosInstance.get(`/surveys/${surveyId}/results`),
  deleteSurvey: (id) => axiosInstance.delete(`/surveys/${id}`),
  toggleStatus: (id) => axiosInstance.patch(`/surveys/${id}/status`),
};

export const publicAPI = {
  getSurvey: (surveyId) => axios.get(`${API_BASE_URL}/public/surveys/${surveyId}`),
  submitResponse: (id, data, config) => axiosInstance.post(`/public/surveys/${id}/respond`, data, config),
};

export default axiosInstance;