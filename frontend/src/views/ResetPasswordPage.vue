<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const result = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// Forgot password mode (no token)
const email = ref('');
const mode = ref<'forgot' | 'reset'>('forgot');

onMounted(() => {
  const t = route.query.token as string;
  if (t) {
    token.value = t;
    mode.value = 'reset';
  }
});

async function requestReset() {
  if (!email.value) return;
  loading.value = true;
  result.value = null;
  try {
    await api.post('/auth/forgot-password', { email: email.value });
    result.value = { type: 'success', message: 'If the email exists, a reset link has been sent. Check your inbox.' };
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'Something went wrong' };
  } finally {
    loading.value = false;
  }
}

async function resetPassword() {
  if (!newPassword.value || !confirmPassword.value) return;
  if (newPassword.value !== confirmPassword.value) {
    result.value = { type: 'error', message: 'Passwords do not match' };
    return;
  }
  if (newPassword.value.length < 8) {
    result.value = { type: 'error', message: 'Password must be at least 8 characters' };
    return;
  }
  loading.value = true;
  result.value = null;
  try {
    await api.post('/auth/reset-password', { token: token.value, new_password: newPassword.value });
    result.value = { type: 'success', message: 'Password reset successfully! Redirecting to login...' };
    setTimeout(() => router.push('/login'), 2000);
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'Reset failed. Token may be expired.' };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-16">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      {{ mode === 'forgot' ? 'Forgot Password' : 'Reset Password' }}
    </h1>
    <p class="text-gray-600 dark:text-gray-400 mb-6">
      {{ mode === 'forgot' ? 'Enter your email to receive a reset link.' : 'Enter your new password.' }}
    </p>

    <div v-if="result" class="mb-4 p-3 rounded-lg text-sm"
      :class="result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
      {{ result.message }}
    </div>

    <!-- Forgot Password Form -->
    <form v-if="mode === 'forgot'" @submit.prevent="requestReset" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input v-model="email" type="email" required placeholder="you@example.com"
          class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2" />
      </div>
      <button type="submit" :disabled="loading"
        class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      <p class="text-sm text-center text-gray-500">
        <router-link to="/login" class="text-indigo-600 hover:text-indigo-800">Back to Login</router-link>
      </p>
    </form>

    <!-- Reset Password Form -->
    <form v-else @submit.prevent="resetPassword" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
        <input v-model="newPassword" type="password" required minlength="8" placeholder="Minimum 8 characters"
          class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
        <input v-model="confirmPassword" type="password" required minlength="8" placeholder="Repeat password"
          class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2" />
      </div>
      <button type="submit" :disabled="loading"
        class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>
    </form>
  </div>
</template>
