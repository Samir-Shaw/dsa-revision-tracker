const BASE = '/api';

async function request(path, { method = 'GET', body, ...rest } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // send the HTTP-only auth cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Problems
export const problemsApi = {
  list: (params = {}) => api.get(`/problems?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/problems/${id}`),
  create: (data) => api.post('/problems', data),
  update: (id, data) => api.put(`/problems/${id}`, data),
  delete: (id) => api.delete(`/problems/${id}`),
  stats: () => api.get('/problems/stats'),
};

// AI
export const aiApi = {
  classify: (data) => api.post('/ai/classify', data),
};

// Import
export const importApi = {
  parse: (sourceType, raw) => api.post('/import/parse', { sourceType, raw }),
  classify: (rows) => api.post('/import/classify', { rows }),
  save: (payload) => api.post('/import/save', payload),
};

// Revisions
export const revisionsApi = {
  due: (bucket = 'due') => api.get(`/revisions/due?bucket=${bucket}`),
  history: () => api.get('/revisions'),
  record: (data) => api.post('/revisions', data),
};

// Practice
export const practiceApi = {
  random: (params = {}) => api.get(`/practice/random?${new URLSearchParams(params)}`),
  record: (data) => api.post('/practice', data),
  history: () => api.get('/practice/history'),
};

// Analytics
export const analyticsApi = {
  get: () => api.get('/analytics'),
};

// Profile
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updateSettings: (data) => api.put('/profile/settings', data),
};

// Lists
export const listsApi = {
  list: () => api.get('/lists'),
  create: (data) => api.post('/lists', data),
  update: (id, data) => api.put(`/lists/${id}`, data),
  delete: (id) => api.delete(`/lists/${id}`),
  addProblem: (listId, problemId) => api.post(`/lists/${listId}/problems`, { problemId }),
  removeProblem: (listId, problemId) => api.delete(`/lists/${listId}/problems/${problemId}`),
};
