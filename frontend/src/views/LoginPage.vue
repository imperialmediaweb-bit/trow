<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/inbox');
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">Log in to Throwbox</h1>

      <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input v-model="email" type="email" required autofocus
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-3" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input v-model="password" type="password" required
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-3" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Don't have an account?
        <router-link to="/register" class="text-indigo-600 hover:text-indigo-500 font-medium">Sign up</router-link>
      </p>
    </div>
  </div>
</template>
