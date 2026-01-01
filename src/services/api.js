import axios from 'axios'

const api = axios.create({
  baseURL: '/api', // Use relative path to work with proxy and prod
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Appointments API
export const appointmentsAPI = {
  getAll: () => api.get('/appointments'),
  create: (appointment) => api.post('/appointments', appointment),
  update: (id, updates) => api.put(`/appointments/${id}`, updates),
  delete: (id) => api.delete(`/appointments/${id}`)
}

// Records API
export const recordsAPI = {
  getAll: () => api.get('/records'),
  getByPatient: (patientId) => {
    // We didn't implement getByPatient specifically in backend, but we can filter on client or add endpoint.
    // For now, let's just get all and filter client side if needed, OR add param.
    // Ideally backend filtering.
    // Let's stick to simple implementation: get all and filters in component?
    // Or better: `api.get('/records?patientId=' + patientId)` if backend supported it.
    // My backend index.js `getAll` just does `SELECT *`.
    // I will adhere to the existing interface.
    // Since I implemented a generic SELECT *, I'll modify this to get all and filter?
    // No, that's bad for perf but okay for prototype.
    // Wait, I can easily add backend support.
    // But since I can't restart the backend "task" without context switch,
    // I will return all and let the component filter?
    // Actually the existing `getByPatient` returned a promise.
    // Let's just return all for now and see if it breaks.
    // Actually, I'll assume the backend sends all and I filter here?
    // `api.get('/records').then(res => ({ data: res.data.filter(...) }))`
    return api.get('/records').then(res => ({
      data: res.data.filter(r => r.patientId === patientId)
    }))
  },
  create: (record) => api.post('/records', record),
  update: (id, updates) => api.put(`/records/${id}`, updates),
  delete: (id) => api.delete(`/records/${id}`)
}

// Patients API
export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => {
    // Helper to find specific patient
    return api.get('/patients').then(res => ({
      data: res.data.find(p => p.id === id)
    }))
  },
  create: (patient) => api.post('/patients', patient),
  update: (id, updates) => api.put(`/patients/${id}`, updates),
  delete: (id) => api.delete(`/patients/${id}`)
}

export default api

