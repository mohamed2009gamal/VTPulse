// src/services/api.js - Centralized API client
export const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
export const API_BASE = `${BACKEND_BASE}/api`;

export class ApiError extends Error {
  constructor(status, data, message) {
    super(message || `API Error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.method !== 'GET' && options.method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error || `API Error: ${response.status}`;
    throw new ApiError(response.status, data, message);
  }

  return data;
};

export const blogApi = {
  getAll: () => apiCall('/blogs'),
  getById: (id) => apiCall(`/blogs/${id}`),
  delete: (id) => apiCall(`/blogs/${id}`, { method: 'DELETE' }),
  // Add more
};

export default apiCall;

