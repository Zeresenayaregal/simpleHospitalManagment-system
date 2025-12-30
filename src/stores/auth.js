import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Users storage helper functions
const USERS_STORAGE_KEY = 'hospital_users'

const loadUsers = () => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

const addOrUpdateUser = (userData) => {
  const users = loadUsers()
  const existingIndex = users.findIndex(u => u.email === userData.email || u.id === userData.id)
  
  if (existingIndex !== -1) {
    // Update existing user
    users[existingIndex] = { ...users[existingIndex], ...userData }
  } else {
    // Add new user
    users.push(userData)
  }
  
  saveUsers(users)
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function login(credentials) {
    // Simulate API call - in production, this would be an actual API request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock authentication
        if (credentials.email && credentials.password) {
          // Determine role based on email (for demo purposes)
          let role = 'patient'
          if (credentials.email.includes('doctor')) role = 'doctor'
          if (credentials.email.includes('admin')) role = 'admin'

          const mockUser = {
            id: 1,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            role: role
          }

          user.value = mockUser
          token.value = 'mock-token-' + Date.now()
          localStorage.setItem('token', token.value)
          localStorage.setItem('user', JSON.stringify(mockUser))
          
          // Store user in users list
          addOrUpdateUser(mockUser)
          
          resolve(mockUser)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 500)
    })
  }

  function register(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const newUser = {
          id: Date.now(),
          email: userData.email,
          name: userData.name,
          role: userData.role || 'patient'
        }

        user.value = newUser
        token.value = 'mock-token-' + Date.now()
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(newUser))
        
        // Store user in users list
        addOrUpdateUser(newUser)
        
        resolve(newUser)
      }, 500)
    })
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function loadUser() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
  }

  // Get all users in the system
  function getAllUsers() {
    return loadUsers()
  }

  // Get users by role
  function getUsersByRole(role) {
    const users = loadUsers()
    return users.filter(u => u.role === role)
  }

  // Get all patients
  function getAllPatients() {
    return getUsersByRole('patient')
  }

  // Get all doctors
  function getAllDoctors() {
    return getUsersByRole('doctor')
  }

  // Get all admins
  function getAllAdmins() {
    return getUsersByRole('admin')
  }

  // Delete a user (admin only)
  function deleteUser(userId) {
    const users = loadUsers()
    const index = users.findIndex(u => u.id === userId)
    
    if (index !== -1) {
      users.splice(index, 1)
      saveUsers(users)
      return true
    }
    return false
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    loadUser,
    getAllUsers,
    getUsersByRole,
    getAllPatients,
    getAllDoctors,
    getAllAdmins,
    deleteUser
  }
})

