<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>My Profile</h1>
      <p>Manage your account settings</p>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <form @submit.prevent="handleUpdate" class="profile-form">
          <div class="form-group">
            <label>Full Name</label>
            <input
              type="text"
              v-model="form.name"
              required
            />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input
              type="email"
              v-model="form.formEmail"
              required
            />
          </div>

          <div class="form-divider">
            <span>Change Password (Optional)</span>
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input
              type="password"
              v-model="form.password"
              placeholder="Leave blank to keep current"
              minlength="6"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <p v-if="message" :class="['message', messageType]">{{ message }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const message = ref('')
const messageType = ref('success')

const form = reactive({
  name: '',
  formEmail: '', // Avoid conflict with store email if any
  password: ''
})

onMounted(() => {
  if (authStore.user) {
    form.name = authStore.user.name
    form.formEmail = authStore.user.email
  }
})

const handleUpdate = async () => {
  loading.value = true
  message.value = ''
  
  try {
    await authStore.updateProfile({
      name: form.name,
      email: form.formEmail,
      password: form.password
    })
    message.value = 'Profile updated successfully!'
    messageType.value = 'success'
    form.password = '' // Clear password field
  } catch (err) {
    message.value = err.response?.data?.error || err.message || 'Update failed'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-header {
  margin-bottom: 30px;
}

.profile-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 10px;
}

.profile-content {
  display: flex;
  justify-content: center;
}

.profile-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.form-divider {
  margin: 30px 0 20px;
  border-bottom: 1px solid #eee;
  text-align: center;
  height: 10px;
}

.form-divider span {
  background: white;
  padding: 0 10px;
  color: #666;
  font-size: 0.9rem;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd1;
}

.btn-primary:disabled {
  opacity: 0.7;
}

.message {
  margin-top: 15px;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}
</style>
