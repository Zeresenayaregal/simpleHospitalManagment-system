import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Mock API endpoint
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

// Helper functions for localStorage persistence
const STORAGE_KEYS = {
  appointments: 'hospital_appointments',
  records: 'hospital_records',
  patients: 'hospital_patients'
}

// Load data from localStorage or return empty array
const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error)
    return []
  }
}

// Save data to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Mock data storage (in production, this would be actual API calls)
// Initialize from localStorage or empty arrays
const mockAppointments = loadFromStorage(STORAGE_KEYS.appointments)
const mockRecords = loadFromStorage(STORAGE_KEYS.records)
const mockPatients = loadFromStorage(STORAGE_KEYS.patients)

// Appointments API
export const appointmentsAPI = {
  getAll: () => {
    return Promise.resolve({ data: mockAppointments })
  },
  create: (appointment) => {
    const newAppointment = {
      id: Date.now(),
      ...appointment,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    mockAppointments.push(newAppointment)
    saveToStorage(STORAGE_KEYS.appointments, mockAppointments)
    return Promise.resolve({ data: newAppointment })
  },
  update: (id, updates) => {
    const index = mockAppointments.findIndex(a => a.id === id)
    if (index !== -1) {
      // Properly merge updates with existing appointment data
      Object.assign(mockAppointments[index], updates)
      saveToStorage(STORAGE_KEYS.appointments, mockAppointments)
      return Promise.resolve({ data: mockAppointments[index] })
    }
    return Promise.reject(new Error('Appointment not found'))
  },
  delete: (id) => {
    const index = mockAppointments.findIndex(a => a.id === id)
    if (index !== -1) {
      mockAppointments.splice(index, 1)
      saveToStorage(STORAGE_KEYS.appointments, mockAppointments)
      return Promise.resolve({ data: { id } })
    }
    return Promise.reject(new Error('Appointment not found'))
  }
}

// Records API
export const recordsAPI = {
  getAll: () => {
    return Promise.resolve({ data: mockRecords })
  },
  getByPatient: (patientId) => {
    return Promise.resolve({ 
      data: mockRecords.filter(r => r.patientId === patientId) 
    })
  },
  create: (record) => {
    const newRecord = {
      id: Date.now(),
      ...record,
      createdAt: new Date().toISOString()
    }
    mockRecords.push(newRecord)
    saveToStorage(STORAGE_KEYS.records, mockRecords)
    return Promise.resolve({ data: newRecord })
  },
  update: (id, updates) => {
    const index = mockRecords.findIndex(r => r.id === id)
    if (index !== -1) {
      mockRecords[index] = { ...mockRecords[index], ...updates }
      saveToStorage(STORAGE_KEYS.records, mockRecords)
      return Promise.resolve({ data: mockRecords[index] })
    }
    return Promise.reject(new Error('Record not found'))
  },
  delete: (id) => {
    const index = mockRecords.findIndex(r => r.id === id)
    if (index !== -1) {
      mockRecords.splice(index, 1)
      saveToStorage(STORAGE_KEYS.records, mockRecords)
      return Promise.resolve({ data: { id } })
    }
    return Promise.reject(new Error('Record not found'))
  }
}

// Patients API
export const patientsAPI = {
  getAll: () => {
    return Promise.resolve({ data: mockPatients })
  },
  getById: (id) => {
    return Promise.resolve({ 
      data: mockPatients.find(p => p.id === id) 
    })
  },
  create: (patient) => {
    const newPatient = {
      id: Date.now(),
      ...patient,
      createdAt: new Date().toISOString()
    }
    mockPatients.push(newPatient)
    saveToStorage(STORAGE_KEYS.patients, mockPatients)
    return Promise.resolve({ data: newPatient })
  },
  update: (id, updates) => {
    const index = mockPatients.findIndex(p => p.id === id)
    if (index !== -1) {
      mockPatients[index] = { ...mockPatients[index], ...updates }
      saveToStorage(STORAGE_KEYS.patients, mockPatients)
      return Promise.resolve({ data: mockPatients[index] })
    }
    return Promise.reject(new Error('Patient not found'))
  },
  delete: (id) => {
    const index = mockPatients.findIndex(p => p.id === id)
    if (index !== -1) {
      mockPatients.splice(index, 1)
      saveToStorage(STORAGE_KEYS.patients, mockPatients)
      return Promise.resolve({ data: { id } })
    }
    return Promise.reject(new Error('Patient not found'))
  }
}

export default api

