<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/dashboard">🏥 Bete Sahl General Hospital</router-link>
      </div>
      
      <div class="nav-links">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/appointments" class="nav-link">Appointments</router-link>
        <router-link to="/records" class="nav-link">Records</router-link>
        <router-link v-if="isAdminOrDoctor" to="/patients" class="nav-link">Patients</router-link>
        <router-link v-if="user?.role === 'admin'" to="/users" class="nav-link">Users</router-link>
      </div>
      
      <div class="nav-user">
        <span class="user-role">{{ user?.role }}</span>
        <button @click="handleLogout" class="btn-logout">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdminOrDoctor = computed(() => 
  user.value?.role === 'admin' || user.value?.role === 'doctor'
)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
}

.nav-brand a {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #667eea;
  color: white;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.btn-logout {
  padding: 8px 20px;
  background: #e74c3c;
  color: white;
  border-radius: 8px;
  font-weight: 500;
}

.btn-logout:hover {
  background: #c0392b;
  transform: translateY(-1px);
}
</style>

