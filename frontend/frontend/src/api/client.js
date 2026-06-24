import axios from 'axios';


const api = axios.create({
  baseURL: '/api',
});

// Attach the JWT to every request when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Normalize API error messages.
export function apiError(err, fallback = 'Something went wrong.') {
  return err?.response?.data?.error || err?.message || fallback;
}

export default api;
