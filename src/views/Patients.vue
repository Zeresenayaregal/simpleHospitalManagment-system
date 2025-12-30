<template>
  <div class="patients">
    <Navbar />
    
    <div class="patients-container">
      <div class="page-header">
        <h1>Patient Management</h1>
        <button @click="showModal = true" class="btn-primary">+ Add Patient</button>
      </div>
      
      <div class="patients-grid">
        <div v-for="patient in patients" :key="patient.id" class="patient-card">
          <div class="patient-header">
            <div class="patient-avatar">
              <span>{{ getInitials(patient.name) }}</span>
            </div>
            <div class="patient-info">
              <h3>{{ patient.name }}</h3>
              <p class="patient-id">ID: {{ patient.id }}</p>
            </div>
          </div>
          
          <div class="patient-details">
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">{{ patient.email || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Phone:</span>
              <span class="value">{{ patient.phone || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date of Birth:</span>
              <span class="value">{{ formatDate(patient.dateOfBirth) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Gender:</span>
              <span class="value">{{ patient.gender || 'N/A' }}</span>
            </div>
            <div class="detail-row" v-if="patient.address">
              <span class="label">Address:</span>
              <span class="value">{{ patient.address }}</span>
            </div>
          </div>
          
          <div class="patient-stats">
            <div class="stat">
              <span class="stat-number">{{ getPatientAppointments(patient.id) }}</span>
              <span class="stat-label">Appointments</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ getPatientRecords(patient.id) }}</span>
              <span class="stat-label">Records</span>
            </div>
          </div>
          
          <div class="patient-actions">
            <button @click="viewPatient(patient)" class="btn-view">View Details</button>
            <button @click="editPatient(patient)" class="btn-edit">Edit</button>
            <button @click="deletePatient(patient.id)" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>
      
      <div v-if="patients.length === 0" class="empty-state">
        <p>No patients found. <a @click="showModal = true" class="link">Add one now</a></p>
      </div>
    </div>
    
    <!-- Patient Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingPatient ? 'Edit Patient' : 'Add New Patient' }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        
        <form @submit.prevent="savePatient" class="modal-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="newPatient.name" placeholder="Enter patient name" required />
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="newPatient.email" placeholder="Enter email address" required />
          </div>
          
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" v-model="newPatient.phone" placeholder="Enter phone number" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" v-model="newPatient.dateOfBirth" :max="maxDate" />
            </div>
            
            <div class="form-group">
              <label>Gender</label>
              <select v-model="newPatient.gender">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Address</label>
            <textarea v-model="newPatient.address" rows="2" placeholder="Enter address"></textarea>
          </div>
          
          <div class="form-group">
            <label>Medical History (Optional)</label>
            <textarea v-model="newPatient.medicalHistory" rows="3" placeholder="Enter medical history..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Saving...' : (editingPatient ? 'Update Patient' : 'Add Patient') }}
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
import { patientsAPI, appointmentsAPI, recordsAPI } from '../services/api'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()

const patients = ref([])
const appointments = ref([])
const records = ref([])
const showModal = ref(false)
const loading = ref(false)
const editingPatient = ref(null)

const newPatient = ref({
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  medicalHistory: ''
})

const maxDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

onMounted(async () => {
  await Promise.all([loadPatients(), loadAppointments(), loadRecords()])
})

const loadPatients = async () => {
  try {
    const response = await patientsAPI.getAll()
    patients.value = (response.data || []).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  } catch (error) {
    console.error('Error loading patients:', error)
  }
}

const loadAppointments = async () => {
  try {
    const response = await appointmentsAPI.getAll()
    appointments.value = response.data || []
  } catch (error) {
    console.error('Error loading appointments:', error)
  }
}

const loadRecords = async () => {
  try {
    const response = await recordsAPI.getAll()
    records.value = response.data || []
  } catch (error) {
    console.error('Error loading records:', error)
  }
}

const savePatient = async () => {
  loading.value = true
  try {
    if (editingPatient.value) {
      await patientsAPI.update(editingPatient.value.id, newPatient.value)
    } else {
      await patientsAPI.create(newPatient.value)
    }
    
    await loadPatients()
    closeModal()
  } catch (error) {
    console.error('Error saving patient:', error)
    alert('Failed to save patient. Please try again.')
  } finally {
    loading.value = false
  }
}

const editPatient = (patient) => {
  editingPatient.value = patient
  newPatient.value = { ...patient }
  showModal.value = true
}

const deletePatient = async (id) => {
  if (!confirm('Are you sure you want to delete this patient?')) return
  
  try {
    await patientsAPI.delete(id)
    await loadPatients()
  } catch (error) {
    console.error('Error deleting patient:', error)
    alert('Failed to delete patient. Please try again.')
  }
}

const viewPatient = (patient) => {
  // In a real app, this would navigate to a detailed patient view
  alert(`Viewing details for ${patient.name}`)
}

const getPatientAppointments = (patientId) => {
  return appointments.value.filter(a => a.patientId === patientId).length
}

const getPatientRecords = (patientId) => {
  return records.value.filter(r => r.patientId === patientId).length
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const closeModal = () => {
  showModal.value = false
  editingPatient.value = null
  newPatient.value = {
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    medicalHistory: ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric', 
    year: 'numeric' 
  })
}
</script>

<style scoped>
.patients {
  min-height: 100vh;
  background: #f5f7fa;
}

.patients-container {
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

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.patient-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.patient-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.patient-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
}

.patient-info h3 {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 5px;
}

.patient-id {
  color: #666;
  font-size: 0.85rem;
}

.patient-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
  gap: 10px;
}

.detail-row .label {
  font-weight: 600;
  color: #666;
  min-width: 100px;
}

.detail-row .value {
  color: #333;
  flex: 1;
}

.patient-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 5px;
}

.patient-actions {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-view,
.btn-edit,
.btn-delete {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover {
  background: #2980b9;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
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
  max-width: 600px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
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

