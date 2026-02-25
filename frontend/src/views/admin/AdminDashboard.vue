<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();

onMounted(() => {
  admin.fetchStats();
});

const statCards = [
  { key: 'total_users', label: 'Total Users', color: 'bg-indigo-500' },
  { key: 'pro_users', label: 'Pro Users', color: 'bg-green-500' },
  { key: 'total_inboxes', label: 'Total Inboxes', color: 'bg-blue-500' },
  { key: 'active_inboxes', label: 'Active Inboxes', color: 'bg-yellow-500' },
  { key: 'total_emails', label: 'Total Emails', color: 'bg-purple-500' },
  { key: 'today_signups', label: 'Today Signups', color: 'bg-pink-500' },
  { key: 'today_emails', label: 'Today Emails', color: 'bg-red-500' },
];
</script>

<template>
  <div>
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ admin.stats?.[card.key] ?? '...' }}
            </p>
          </div>
          <div :class="[card.color, 'w-10 h-10 rounded-lg flex items-center justify-center']">
            <span class="text-white text-lg font-bold">{{ card.label[0] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-3">
        <router-link to="/admin/users"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          Manage Users
        </router-link>
        <router-link to="/admin/settings"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
          Site Settings
        </router-link>
        <router-link to="/admin/smtp"
          class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          Configure SMTP
        </router-link>
        <router-link to="/admin/llm"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
          AI Services
        </router-link>
        <router-link to="/admin/notifications"
          class="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors">
          Send Notification
        </router-link>
      </div>
    </div>
  </div>
</template>
