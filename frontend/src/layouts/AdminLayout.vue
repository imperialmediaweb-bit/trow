<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: 'D' },
  { label: 'Users', path: '/admin/users', icon: 'U' },
  { label: 'Settings', path: '/admin/settings', icon: 'S' },
  { label: 'SMTP', path: '/admin/smtp', icon: 'M' },
  { label: 'LLM / AI', path: '/admin/llm', icon: 'A' },
  { label: 'Analytics', path: '/admin/analytics', icon: 'C' },
  { label: 'Pages', path: '/admin/pages', icon: 'P' },
  { label: 'Notifications', path: '/admin/notifications', icon: 'N' },
  { label: 'Blog', path: '/admin/blog', icon: 'B' },
  { label: 'Billing', path: '/admin/billing', icon: '$' },
  { label: 'System', path: '/admin/system', icon: 'H' },
];

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin';
  return route.path.startsWith(path);
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col flex-shrink-0">
      <div class="p-4 border-b border-gray-700">
        <router-link to="/" class="text-xl font-bold text-indigo-400">Throwbox</router-link>
        <span class="ml-1 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
        <p class="text-xs text-gray-400 mt-1">{{ auth.user?.email }}</p>
      </div>

      <nav class="flex-1 py-4 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center px-4 py-2.5 text-sm transition-colors',
            isActive(item.path)
              ? 'bg-indigo-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          ]"
        >
          <span class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mr-3"
            :class="isActive(item.path) ? 'bg-indigo-500' : 'bg-gray-700'">
            {{ item.icon }}
          </span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <router-link to="/" class="text-sm text-gray-400 hover:text-white transition-colors">
          Back to Site
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ navItems.find(n => isActive(n.path))?.label || 'Admin' }}
        </h1>
      </header>

      <main class="flex-1 p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
