<template>
  <div class="records">
    <Navbar />
    
    <div class="records-container">
      <div class="page-header">
        <h1>Medical Records</h1>
        <button v-if="isAdminOrDoctor" @click="showModal = true" class="btn-primary">+ New Record</button>
      </div>
      
      <div class="records-list">
        <div v-for="record in records" :key="record.id" class="record-card">
          <div class="record-header">
            <div>
              <h3>{{ record.patientName || 'Patient' }}</h3>
              <p class="record-date">{{ formatDate(record.date) }}</p>
            </div>
            <span class="record-type">{{ record.type || 'General' }}</span>
          </div>
          
          <div class="record-body">
            <div class="info-section">
              <h4>Diagnosis</h4>
              <p>{{ record.diagnosis || 'N/A' }}</p>
            </div>
            
            <div class="info-section">
              <h4>Treatment</h4>
              <p>{{ record.treatment || 'N/A' }}</p>
            </div>
            
            <div class="info-section" v-if="record.medications">
              <h4>Medications</h4>
              <p>{{ record.medications }}</p>
            </div>
            
            <div class="info-section" v-if="record.notes">
              <h4>Notes</h4>
              <p>{{ record.notes }}</p>
            </div>
            
            <div class="info-section" v-if="record.doctorName">
              <h4>Doctor</h4>
              <p>{{ record.doctorName }}</p>
            </div>
          </div>
          
          <div class="record-actions" v-if="isAdminOrDoctor">
            <button @click="editRecord(record)" class="btn-edit">Edit</button>
            <button @click="deleteRecord(record.id)" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>
      
      <div v-if="records.length === 0" class="empty-state">
        <p>No medical records found.</p>
        <p v-if="isAdminOrDoctor"><a @click="showModal = true" class="link">Create one now</a></p>
      </div>
    </div>
    
    <!-- Record Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingRecord ? 'Edit Record' : 'New Medical Record' }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        
        <form @submit.prevent="saveRecord" class="modal-form">
          <div class="form-group">
            <label>Patient Name</label>
            <input type="text" v-model="newRecord.patientName" placeholder="Enter patient name" required />
          </div>
          
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="newRecord.date" required :max="maxDate" />
          </div>
          
          <div class="form-group">
            <label>Record Type</label>
            <select v-model="newRecord.type" required>
              <option value="General">General</option>
              <option value="Consultation">Consultation</option>
              <option value="Surgery">Surgery</option>
              <option value="Emergency">Emergency</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Diagnosis</label>
            <textarea v-model="newRecord.diagnosis" rows="3" placeholder="Enter diagnosis" required></textarea>
          </div>
          
          <div class="form-group">
            <label>Treatment</label>
            <textarea v-model="newRecord.treatment" rows="3" placeholder="Enter treatment details" required></textarea>
          </div>
          
          <div class="form-group">
            <label>Medications (Optional)</label>
            <input type="text" v-model="newRecord.medications" placeholder="e.g., Aspirin 100mg, twice daily" />
          </div>
          
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea v-model="newRecord.notes" rows="3" placeholder="Additional notes..."></textarea>
          </div>
          
          <div class="form-group" v-if="user?.role === 'doctor'">
            <label>Doctor Name</label>
            <input type="text" v-model="newRecord.doctorName" required />
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Saving...' : (editingRecord ? 'Update Record' : 'Create Record') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { recordsAPI } from '../services/api'
import Navbar from '../components/Navbar.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdminOrDoctor = computed(() => 
  user.value?.role === 'admin' || user.value?.role === 'doctor'
)

const records = ref([])
const showModal = ref(false)
const loading = ref(false)
const editingRecord = ref(null)

const newRecord = ref({
  patientName: '',
  date: '',
  type: 'General',
  diagnosis: '',
  treatment: '',
  medications: '',
  notes: '',
  doctorName: ''
})

// Watch user changes to set doctor name
watch(() => user.value, (newUser) => {
  if (newUser?.role === 'doctor' && !newRecord.value.doctorName) {
    newRecord.value.doctorName = newUser.name || ''
  }
}, { immediate: true })

const maxDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

onMounted(async () => {
  await loadRecords()
})

const loadRecords = async () => {
  try {
    let response
    if (user.value?.role === 'patient') {
      // For patients, get records by patientId or by patientName matching user's name
      const allRecords = await recordsAPI.getAll()
      response = {
        data: allRecords.data.filter(r => 
          r.patientId === user.value.id || 
          r.patientName?.toLowerCase() === user.value.name?.toLowerCase()
        )
      }
    } else {
      response = await recordsAPI.getAll()
    }
    
    records.value = (response.data || []).sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('Error loading records:', error)
    records.value = []
  }
}

const saveRecord = async () => {
  loading.value = true
  try {
    if (editingRecord.value) {
      await recordsAPI.update(editingRecord.value.id, newRecord.value)
    } else {
      const recordData = {
        ...newRecord.value,
        patientId: user.value?.role === 'patient' ? user.value.id : null,
        patientName: user.value?.role === 'patient' ? user.value.name : newRecord.value.patientName,
        doctorName: user.value?.role === 'doctor' ? user.value.name : newRecord.value.doctorName
      }
      await recordsAPI.create(recordData)
    }
    
    await loadRecords()
    closeModal()
  } catch (error) {
    console.error('Error saving record:', error)
    alert('Failed to save record. Please try again.')
  } finally {
    loading.value = false
  }
}

const editRecord = (record) => {
  editingRecord.value = record
  newRecord.value = { ...record }
  showModal.value = true
}

const deleteRecord = async (id) => {
  if (!confirm('Are you sure you want to delete this record?')) return
  
  try {
    await recordsAPI.delete(id)
    await loadRecords()
  } catch (error) {
    console.error('Error deleting record:', error)
    alert('Failed to delete record. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingRecord.value = null
  newRecord.value = {
    patientName: '',
    date: '',
    type: 'General',
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    doctorName: user.value?.role === 'doctor' ? (user.value?.name || '') : ''
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
.records {
  min-height: 100vh;
  background: #f5f7fa;
}

.records-container {
  max-width: 1200px;
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

.records-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.record-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.record-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.record-header h3 {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 5px;
}

.record-date {
  color: #666;
  font-size: 0.9rem;
}

.record-type {
  background: #667eea;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.record-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-section {
  margin-bottom: 15px;
}

.info-section h4 {
  color: #667eea;
  font-size: 0.9rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-section p {
  color: #333;
  line-height: 1.6;
}

.record-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-edit:hover {
  background: #2980b9;
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

