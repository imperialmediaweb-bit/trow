import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api.js';

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  plan: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));

  const isAuthenticated = computed(() => !!accessToken.value);
  const isPro = computed(() => user.value?.plan !== 'free');

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setTokens(data.data.access_token, data.data.refresh_token);
    user.value = data.data.user;
  }

  async function register(email: string, password: string, displayName?: string) {
    const { data } = await api.post('/auth/register', { email, password, display_name: displayName });
    setTokens(data.data.access_token, data.data.refresh_token);
    user.value = data.data.user;
  }

  async function fetchUser() {
    if (!accessToken.value) return;
    try {
      const { data } = await api.get('/auth/me');
      user.value = data.data;
    } catch {
      logout();
    }
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  // Auto-load user on init if token exists
  if (accessToken.value) {
    fetchUser();
  }

  return { user, accessToken, isAuthenticated, isPro, login, register, fetchUser, logout };
});
