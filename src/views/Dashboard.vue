<template>
  <div class="dashboard">
    <Navbar />
    
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome back, {{ user?.name }}!</h1>
        <p>Here's an overview of your hospital management system</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <h3>{{ stats.appointments }}</h3>
            <p>Appointments</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <h3>{{ stats.records }}</h3>
            <p>Medical Records</p>
          </div>
        </div>
        
        <div class="stat-card" v-if="isAdminOrDoctor">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ stats.patients }}</h3>
            <p>Patients</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ stats.completed }}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="content-section">
          <h2>Recent Appointments</h2>
          <div class="appointments-list">
            <div v-if="recentAppointments.length === 0" class="empty-state">
              <p>No appointments yet. <router-link to="/appointments">Schedule one now</router-link></p>
            </div>
            <div v-for="appointment in recentAppointments" :key="appointment.id" class="appointment-item">
              <div class="appointment-date">
                <span class="date">{{ formatDate(appointment.date) }}</span>
                <span class="time">{{ appointment.time }}</span>
              </div>
              <div class="appointment-details">
                <h4>{{ appointment.patientName || 'Patient' }}</h4>
                <p>{{ appointment.reason || 'General consultation' }}</p>
              </div>
              <div class="appointment-status" :class="appointment.status">
                {{ appointment.status }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="content-section">
          <h2>Quick Actions</h2>
          <div class="quick-actions">
            <router-link to="/appointments" class="action-card">
              <span class="action-icon">➕</span>
              <h3>New Appointment</h3>
              <p>Schedule a new appointment</p>
            </router-link>
            
            <router-link to="/records" class="action-card">
              <span class="action-icon">📝</span>
              <h3>View Records</h3>
              <p>Access medical records</p>
            </router-link>
            
            <router-link v-if="isAdminOrDoctor" to="/patients" class="action-card">
              <span class="action-icon">👤</span>
              <h3>Manage Patients</h3>
              <p>View and manage patients</p>
            </router-link>

            <router-link to="/profile" class="action-card">
              <span class="action-icon">⚙️</span>
              <h3>Profile</h3>
              <p>Update your account details</p>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { appointmentsAPI, recordsAPI, patientsAPI } from '../services/api'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdminOrDoctor = computed(() => 
  user.value?.role === 'admin' || user.value?.role === 'doctor'
)

const stats = ref({
  appointments: 0,
  records: 0,
  patients: 0,
  completed: 0
})

const recentAppointments = ref([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    const [appointmentsRes, recordsRes, patientsRes] = await Promise.all([
      appointmentsAPI.getAll(),
      recordsAPI.getAll(),
      isAdminOrDoctor.value ? patientsAPI.getAll() : Promise.resolve({ data: [] })
    ])
    
    const appointments = appointmentsRes.data || []
    const records = recordsRes.data || []
    const patients = patientsRes.data || []
    
    // Filter appointments by user role
    let userAppointments = appointments
    if (user.value?.role === 'patient') {
      userAppointments = appointments.filter(a => a.patientId === user.value.id)
    } else if (user.value?.role === 'doctor') {
      userAppointments = appointments.filter(a => a.doctorId === user.value.id)
    }
    
    stats.value = {
      appointments: userAppointments.length,
      records: records.length,
      patients: patients.length,
      completed: userAppointments.filter(a => a.status === 'completed').length
    }
    
    recentAppointments.value = userAppointments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 8px;
}

.dashboard-header p {
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 3rem;
}

.stat-info h3 {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-info p {
  color: #666;
  font-size: 0.95rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.content-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.content-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.appointments-list {
  max-height: 400px;
  overflow-y: auto;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.3s;
}

.appointment-item:hover {
  background: #f8f9fa;
}

.appointment-item:last-child {
  border-bottom: none;
}

.appointment-date {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.appointment-date .date {
  font-weight: 600;
  color: #333;
}

.appointment-date .time {
  font-size: 0.85rem;
  color: #666;
}

.appointment-details {
  flex: 1;
}

.appointment-details h4 {
  color: #333;
  margin-bottom: 5px;
}

.appointment-details p {
  color: #666;
  font-size: 0.9rem;
}

.appointment-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.appointment-status.scheduled {
  background: #3498db;
  color: white;
}

.appointment-status.completed {
  background: #27ae60;
  color: white;
}

.appointment-status.cancelled {
  background: #e74c3c;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state a {
  color: #667eea;
  text-decoration: none;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.action-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 15px;
  text-decoration: none;
  text-align: center;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.action-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 10px;
}

.action-card h3 {
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.action-card p {
  font-size: 0.85rem;
  opacity: 0.9;
}

@media (max-width: 968px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>

