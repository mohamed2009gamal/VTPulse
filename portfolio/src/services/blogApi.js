// src/services/blogApi.js - Feature-specific API
import apiCall from './api.js';

export const blogApi = {
  getAll: () => apiCall('/blogs'),
  getById: (id) => apiCall(`/blogs/${id}`),
  vote: (id) => apiCall(`/blogs/${id}/vote`),
  like: (id) => apiCall(`/blogs/${id}/like`, { method: 'POST' }),
  view: (id) => apiCall(`/blogs/${id}/view`, { method: 'POST' }),
  delete: (id) => apiCall(`/blogs/${id}`, { method: 'DELETE' }),
};

export default blogApi;
