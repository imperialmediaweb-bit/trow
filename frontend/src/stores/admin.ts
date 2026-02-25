import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api.js';

export const useAdminStore = defineStore('admin', () => {
  const stats = ref<any>(null);
  const analytics = ref<any>(null);
  const users = ref<any[]>([]);
  const usersPagination = ref<any>({});
  const settings = ref<any>(null);
  const pages = ref<any[]>([]);
  const loading = ref(false);

  async function fetchStats() {
    const { data } = await api.get('/admin/stats');
    stats.value = data.data;
  }

  async function fetchAnalytics(days = 30) {
    const { data } = await api.get(`/admin/analytics?days=${days}`);
    analytics.value = data.data;
  }

  async function fetchUsers(params: { page?: number; search?: string; role?: string; plan?: string } = {}) {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.search) query.set('search', params.search);
      if (params.role) query.set('role', params.role);
      if (params.plan) query.set('plan', params.plan);

      const { data } = await api.get(`/admin/users?${query}`);
      users.value = data.data.users;
      usersPagination.value = data.data.pagination;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(id: string, updates: Record<string, any>) {
    const { data } = await api.put(`/admin/users/${id}`, updates);
    const idx = users.value.findIndex((u) => u.id === id);
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...data.data };
    return data.data;
  }

  async function deleteUser(id: string) {
    await api.delete(`/admin/users/${id}`);
    users.value = users.value.filter((u) => u.id !== id);
  }

  async function fetchSettings() {
    const { data } = await api.get('/admin/settings');
    settings.value = data.data;
  }

  async function saveSettings(section: string, value: any) {
    await api.put(`/admin/settings/${section}`, value);
    if (settings.value) settings.value[section] = value;
  }

  async function testSmtp(config: any) {
    const { data } = await api.post('/admin/smtp/test', config);
    return data;
  }

  async function testLlm(config: any) {
    const { data } = await api.post('/admin/llm/test', config);
    return data;
  }

  async function fetchPages() {
    const { data } = await api.get('/admin/pages');
    pages.value = data.data;
  }

  async function createPage(page: any) {
    const { data } = await api.post('/admin/pages', page);
    pages.value.unshift(data.data);
    return data.data;
  }

  async function updatePage(id: string, updates: any) {
    const { data } = await api.put(`/admin/pages/${id}`, updates);
    const idx = pages.value.findIndex((p) => p.id === id);
    if (idx !== -1) pages.value[idx] = data.data;
    return data.data;
  }

  async function deletePage(id: string) {
    await api.delete(`/admin/pages/${id}`);
    pages.value = pages.value.filter((p) => p.id !== id);
  }

  async function sendNotification(payload: any) {
    const { data } = await api.post('/admin/notifications/send', payload);
    return data.data;
  }

  async function fetchSystemHealth() {
    const { data } = await api.get('/admin/system/health');
    return data.data;
  }

  return {
    stats, analytics, users, usersPagination, settings, pages, loading,
    fetchStats, fetchAnalytics, fetchUsers, updateUser, deleteUser,
    fetchSettings, saveSettings, testSmtp, testLlm,
    fetchPages, createPage, updatePage, deletePage,
    sendNotification, fetchSystemHealth,
  };
});
