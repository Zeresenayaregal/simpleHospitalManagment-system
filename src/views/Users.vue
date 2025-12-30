<template>
  <div class="users">
    <Navbar />
    
    <div class="users-container">
      <div class="page-header">
        <h1>System Users</h1>
        <p class="subtitle">Manage all registered users in the system</p>
      </div>
      
      <div class="users-stats">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ users.length }}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <h3>{{ patients.length }}</h3>
            <p>Patients</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👨‍⚕️</div>
          <div class="stat-info">
            <h3>{{ doctors.length }}</h3>
            <p>Doctors</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👑</div>
          <div class="stat-info">
            <h3>{{ admins.length }}</h3>
            <p>Administrators</p>
          </div>
        </div>
      </div>
      
      <div class="filter-section">
        <div class="filter-controls">
          <label>Filter by Role:</label>
          <select v-model="selectedRole" @change="filterUsers">
            <option value="">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Administrators</option>
          </select>
          
          <input
            type="text"
            v-model="searchQuery"
            @input="filterUsers"
            placeholder="Search by name or email..."
            class="search-input"
          />
        </div>
      </div>
      
      <div class="users-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div class="user-header">
            <div class="user-avatar" :class="user.role">
              <span>{{ getInitials(user.name) }}</span>
            </div>
            <div class="user-info">
              <h3>{{ user.name }}</h3>
              <p class="user-email">{{ user.email }}</p>
            </div>
            <span class="role-badge" :class="user.role">
              {{ user.role }}
            </span>
          </div>
          
          <div class="user-details">
            <div class="detail-item">
              <span class="label">User ID:</span>
              <span class="value">{{ user.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Role:</span>
              <span class="value">{{ user.role }}</span>
            </div>
          </div>
          
          <div class="user-actions">
            <button 
              v-if="user.id !== currentUser?.id"
              @click="deleteUser(user.id)"
              class="btn-delete"
              :disabled="deletingId === user.id"
            >
              {{ deletingId === user.id ? 'Deleting...' : 'Delete User' }}
            </button>
            <span v-else class="cannot-delete">Cannot delete yourself</span>
          </div>
        </div>
      </div>
      
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <p>No users found matching your criteria.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()
const users = ref([])
const selectedRole = ref('')
const searchQuery = ref('')
const deletingId = ref(null)
const currentUser = computed(() => authStore.user)

const patients = computed(() => users.value.filter(u => u.role === 'patient'))
const doctors = computed(() => users.value.filter(u => u.role === 'doctor'))
const admins = computed(() => users.value.filter(u => u.role === 'admin'))

const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by role
  if (selectedRole.value) {
    filtered = filtered.filter(u => u.role === selectedRole.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => {
    // Sort by role first, then by name
    if (a.role !== b.role) {
      const roleOrder = { admin: 0, doctor: 1, patient: 2 }
      return roleOrder[a.role] - roleOrder[b.role]
    }
    return a.name.localeCompare(b.name)
  })
})

onMounted(() => {
  loadUsers()
})

const loadUsers = () => {
  users.value = authStore.getAllUsers()
}

const filterUsers = () => {
  // Filtering is handled by computed property
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const deleteUser = async (userId) => {
  const userToDelete = users.value.find(u => u.id === userId)
  if (!userToDelete) return
  
  const confirmMessage = `Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})?\n\nThis action cannot be undone.`
  
  if (!confirm(confirmMessage)) return
  
  deletingId.value = userId
  
  try {
    const success = authStore.deleteUser(userId)
    if (success) {
      // Reload users list
      loadUsers()
      alert(`User "${userToDelete.name}" has been deleted successfully.`)
    } else {
      alert('Failed to delete user. User not found.')
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('An error occurred while deleting the user.')
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.users {
  min-height: 100vh;
  background: #f5f7fa;
}

.users-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.users-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  font-size: 1.8rem;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-info p {
  color: #666;
  font-size: 0.9rem;
}

.filter-section {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-controls label {
  font-weight: 600;
  color: #333;
}

.filter-controls select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.filter-controls select:focus {
  border-color: #667eea;
  outline: none;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
}

.user-avatar.patient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-avatar.doctor {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}

.user-avatar.admin {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.user-info {
  flex: 1;
}

.user-info h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.user-email {
  color: #666;
  font-size: 0.9rem;
}

.role-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.role-badge.patient {
  background: #667eea;
  color: white;
}

.role-badge.doctor {
  background: #27ae60;
  color: white;
}

.role-badge.admin {
  background: #f39c12;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.detail-item .label {
  font-weight: 600;
  color: #666;
}

.detail-item .value {
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  color: #666;
}

.user-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-delete {
  padding: 8px 20px;
  background: #e74c3c;
  color: white;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s;
  cursor: pointer;
}

.btn-delete:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cannot-delete {
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
}
</style>

