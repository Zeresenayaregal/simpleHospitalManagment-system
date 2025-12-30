<template>
  <div class="appointments">
    <Navbar />
    
    <div class="appointments-container">
      <div class="page-header">
        <h1>Appointment Management</h1>
        <button @click="showModal = true" class="btn-primary">+ New Appointment</button>
      </div>
      
      <div class="appointments-grid">
        <div v-for="appointment in appointments" :key="appointment.id" class="appointment-card">
          <div class="appointment-header">
            <div class="appointment-date-time">
              <span class="date">{{ formatDate(appointment.date) }}</span>
              <span class="time">{{ appointment.time }}</span>
            </div>
            <span class="status-badge" :class="appointment.status">
              {{ appointment.status }}
            </span>
          </div>
          
          <div class="appointment-body">
            <div class="info-row">
              <span class="label">Patient:</span>
              <span class="value">{{ appointment.patientName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Doctor:</span>
              <span class="value">{{ appointment.doctorName || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Reason:</span>
              <span class="value">{{ appointment.reason || 'General consultation' }}</span>
            </div>
            <div v-if="appointment.notes" class="info-row">
              <span class="label">Notes:</span>
              <span class="value">{{ appointment.notes }}</span>
            </div>
          </div>
          
          <div class="appointment-actions">
            <button 
              v-if="appointment.status === 'scheduled'" 
              @click="cancelAppointment(appointment.id)"
              class="btn-cancel"
            >
              Cancel
            </button>
            <button 
              v-if="appointment.status === 'scheduled'"
              @click="completeAppointment(appointment.id)"
              class="btn-complete"
              :disabled="loading && completingId === appointment.id"
            >
              {{ loading && completingId === appointment.id ? 'Completing...' : 'Complete' }}
            </button>
            <div v-if="appointment.status === 'completed'" class="completed-indicator">
              ✓ Completed
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="appointments.length === 0" class="empty-state">
        <p>No appointments found. <a @click="showModal = true" class="link">Create one now</a></p>
      </div>
    </div>
    
    <!-- Appointment Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Schedule New Appointment</h2>
          <button @click="showModal = false" class="btn-close">×</button>
        </div>
        
        <form @submit.prevent="createAppointment" class="modal-form">
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="newAppointment.date" required :min="minDate" />
          </div>
          
          <div class="form-group">
            <label>Time</label>
            <input type="time" v-model="newAppointment.time" required />
          </div>
          
          <div class="form-group" v-if="isAdminOrDoctor">
            <label>Patient Name</label>
            <input type="text" v-model="newAppointment.patientName" placeholder="Enter patient name" required />
          </div>
          
          <div class="form-group" v-if="user?.role === 'patient' || user?.role === 'doctor'">
            <label>Doctor Name</label>
            <input type="text" v-model="newAppointment.doctorName" :placeholder="user?.role === 'doctor' ? 'Your name or another doctor' : 'Enter doctor name'" required />
          </div>
          
          <div class="form-group">
            <label>Reason for Visit</label>
            <input type="text" v-model="newAppointment.reason" placeholder="e.g., General checkup" required />
          </div>
          
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea v-model="newAppointment.notes" rows="3" placeholder="Additional notes..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Scheduling...' : 'Schedule Appointment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { appointmentsAPI } from '../services/api'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdminOrDoctor = computed(() => 
  user.value?.role === 'admin' || user.value?.role === 'doctor'
)

const appointments = ref([])
const showModal = ref(false)
const loading = ref(false)
const completingId = ref(null)

const newAppointment = ref({
  date: '',
  time: '',
  patientName: '',
  doctorName: '',
  reason: '',
  notes: ''
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

onMounted(async () => {
  await loadAppointments()
})

const loadAppointments = async () => {
  try {
    const response = await appointmentsAPI.getAll()
    let allAppointments = response.data || []
    
    // Filter by user role
    if (user.value?.role === 'patient') {
      // For patients, filter by patientId or patientName matching user's name
      allAppointments = allAppointments.filter(a => 
        a.patientId === user.value.id || 
        a.patientName?.toLowerCase() === user.value.name?.toLowerCase()
      )
    } else if (user.value?.role === 'doctor') {
      allAppointments = allAppointments.filter(a => 
        a.doctorId === user.value.id ||
        a.doctorName?.toLowerCase() === user.value.name?.toLowerCase()
      )
    }
    
    appointments.value = allAppointments.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('Error loading appointments:', error)
    appointments.value = []
  }
}

const createAppointment = async () => {
  loading.value = true
  try {
    const appointmentData = {
      ...newAppointment.value,
      patientId: user.value?.role === 'patient' ? user.value.id : null,
      patientName: user.value?.role === 'patient' ? user.value.name : newAppointment.value.patientName,
      doctorId: user.value?.role === 'doctor' ? user.value.id : null,
      doctorName: user.value?.role === 'doctor' ? user.value.name : newAppointment.value.doctorName
    }
    
    await appointmentsAPI.create(appointmentData)
    await loadAppointments()
    showModal.value = false
    newAppointment.value = {
      date: '',
      time: '',
      patientName: '',
      doctorName: '',
      reason: '',
      notes: ''
    }
  } catch (error) {
    console.error('Error creating appointment:', error)
    alert('Failed to create appointment. Please try again.')
  } finally {
    loading.value = false
  }
}

const cancelAppointment = async (id) => {
  if (!confirm('Are you sure you want to cancel this appointment?')) return
  
  try {
    await appointmentsAPI.update(id, { status: 'cancelled' })
    await loadAppointments()
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    alert('Failed to cancel appointment. Please try again.')
  }
}

const completeAppointment = async (id) => {
  if (!confirm('Mark this appointment as completed?')) return
  
  completingId.value = id
  loading.value = true
  
  try {
    const result = await appointmentsAPI.update(id, { status: 'completed' })
    if (result.data) {
      // Reload appointments to reflect the change
      await loadAppointments()
      // Show success message
      alert('Appointment marked as completed successfully!')
    } else {
      throw new Error('Update failed')
    }
  } catch (error) {
    console.error('Error completing appointment:', error)
    alert('Failed to complete appointment. Please try again.')
  } finally {
    loading.value = false
    completingId.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}
</script>

<style scoped>
.appointments {
  min-height: 100vh;
  background: #f5f7fa;
}

.appointments-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  font-size: 2rem;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-weight: 600;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.appointments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.appointment-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.appointment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.appointment-date-time {
  display: flex;
  flex-direction: column;
}

.appointment-date-time .date {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.appointment-date-time .time {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.scheduled {
  background: #3498db;
  color: white;
}

.status-badge.completed {
  background: #27ae60;
  color: white;
}

.status-badge.cancelled {
  background: #e74c3c;
  color: white;
}

.appointment-body {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  gap: 10px;
}

.info-row .label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.info-row .value {
  color: #333;
  flex: 1;
}

.appointment-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-complete {
  flex: 1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-cancel {
  background: #e74c3c;
  color: white;
}

.btn-cancel:hover {
  background: #c0392b;
}

.btn-complete {
  background: #27ae60;
  color: white;
}

.btn-complete:hover:not(:disabled) {
  background: #229954;
}

.btn-complete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completed-indicator {
  flex: 1;
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  color: #666;
}

.empty-state .link {
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  color: #333;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.btn-close:hover {
  color: #333;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary {
  flex: 1;
  padding: 12px;
  background: #e0e0e0;
  color: #333;
  border-radius: 8px;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.modal-actions .btn-primary {
  flex: 1;
}

.modal-actions .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

