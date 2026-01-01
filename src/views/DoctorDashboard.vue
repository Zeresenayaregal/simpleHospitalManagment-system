<template>
  <div class="doctor-dashboard">
    <div class="header">
      <h1>🩺 Doctor Dashboard</h1>
      <p>Manage your appointments and patients</p>
    </div>

    <div class="metrics">
      <div class="metric-card">
        <h3>Today's Appointments</h3>
        <p class="value">{{ todayAppointments.length }}</p>
      </div>
      <div class="metric-card">
        <h3>Pending</h3>
        <p class="value">{{ pendingAppointments.length }}</p>
      </div>
      <div class="metric-card">
        <h3>Total Patients</h3>
        <p class="value">{{ uniquePatients.size }}</p>
      </div>
    </div>

    <div class="content-split">
      <div class="appointments-section">
        <h2>Your Appointments</h2>
        <div class="filter-controls">
          <button 
            v-for="filter in filters" 
            :key="filter"
            @click="currentFilter = filter"
            :class="{ active: currentFilter === filter }"
          >
            {{ filter }}
          </button>
        </div>

        <div class="appointments-list">
          <div v-if="filteredAppointments.length === 0" class="empty">
            No appointments found.
          </div>
          <div 
            v-for="appt in filteredAppointments" 
            :key="appt.id" 
            class="appointment-card"
          >
            <div class="appt-status" :class="appt.status">{{ appt.status }}</div>
            <div class="appt-info">
              <h4>{{ appt.patientName || 'Patient #' + appt.patientId }}</h4>
              <p class="time">{{ formatDate(appt.date) }}</p>
              <p class="reason">{{ appt.reason }}</p>
            </div>
            <div class="appt-actions">
              <button @click="updateStatus(appt.id, 'completed')" v-if="appt.status !== 'completed'">✓ Complete</button>
              <button @click="updateStatus(appt.id, 'cancelled')" class="btn-danger" v-if="appt.status !== 'cancelled'">✕ Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="patients-section">
        <h2>Your Patients</h2>
        <div class="patients-list">
           <div v-for="patient in myPatients" :key="patient.id" class="patient-card">
             <div class="avatar">{{ patient.name?.charAt(0) || 'P' }}</div>
             <div class="patient-info">
               <h4>{{ patient.name }}</h4>
               <p>{{ patient.email }}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { appointmentsAPI, patientsAPI } from '../services/api'

const authStore = useAuthStore()
const appointments = ref([])
const patients = ref([])
const currentFilter = ref('All')
const filters = ['All', 'Scheduled', 'Completed', 'Cancelled']

const props = defineProps({})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    const [apptRes, patRes] = await Promise.all([
      appointmentsAPI.getAll(),
      patientsAPI.getAll()
    ])
    
    // Filter purely for this doctor
    const doctorId = authStore.user?.id
    const allAppts = apptRes.data || []
    
    // Join patient names
    const allPatients = patRes.data || []
    patients.value = allPatients
    
    appointments.value = allAppts
      .filter(a => a.doctorId === doctorId)
      .map(a => ({
        ...a,
        patientName: allPatients.find(p => p.id === a.patientId)?.name
      }))
      
  } catch (err) {
    console.error(err)
  }
}

const todayAppointments = computed(() => {
  const today = new Date().toDateString()
  return appointments.value.filter(a => new Date(a.date).toDateString() === today)
})

const pendingAppointments = computed(() => {
  return appointments.value.filter(a => a.status === 'scheduled')
})

const filteredAppointments = computed(() => {
  if (currentFilter.value === 'All') return appointments.value
  return appointments.value.filter(a => a.status.toLowerCase() === currentFilter.value.toLowerCase())
})

const uniquePatients = computed(() => {
  const patientIds = new Set(appointments.value.map(a => a.patientId))
  return patientIds
})

const myPatients = computed(() => {
  return patients.value.filter(p => uniquePatients.value.has(p.id))
})


const formatDate = (date) => new Date(date).toLocaleString()

const updateStatus = async (id, status) => {
  try {
    await appointmentsAPI.update(id, { status })
    await loadData() // Refresh
  } catch (err) {
    alert('Failed to update status')
  }
}
</script>

<style scoped>
.doctor-dashboard {
  padding: 30px;
  background: #f8f9fa;
  min-height: 100vh;
}

.header {
  margin-bottom: 30px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.metric-card .value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.content-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.appointments-section, .patients-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.filter-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.filter-controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
}

.filter-controls button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.appointment-card {
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  position: relative;
}

.appt-status {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: bold;
}

.appt-status.scheduled { background: #e3f2fd; color: #1976d2; }
.appt-status.completed { background: #e8f5e9; color: #2e7d32; }
.appt-status.cancelled { background: #ffebee; color: #c62828; }

.appt-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.appt-actions button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #e8f5e9;
  color: #2e7d32;
  cursor: pointer;
  font-weight: 600;
}

.appt-actions button.btn-danger {
  background: #ffebee;
  color: #c62828;
}

.patient-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

@media (max-width: 900px) {
  .content-split {
    grid-template-columns: 1fr;
  }
}
</style>
