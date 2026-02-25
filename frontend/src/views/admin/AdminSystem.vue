<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const health = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    health.value = await admin.fetchSystemHealth();
  } finally {
    loading.value = false;
  }
});

async function refresh() {
  loading.value = true;
  try {
    health.value = await admin.fetchSystemHealth();
  } finally {
    loading.value = false;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex justify-between items-center mb-6">
      <p class="text-sm text-gray-500">System health and service status</p>
      <button @click="refresh" :disabled="loading"
        class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
        {{ loading ? 'Checking...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="health" class="space-y-4">
      <!-- Overall Status -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div :class="[
            'w-4 h-4 rounded-full',
            health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
          ]"></div>
          <h2 class="text-lg font-semibold" :class="health.status === 'healthy' ? 'text-green-600' : 'text-red-600'">
            {{ health.status === 'healthy' ? 'All Systems Operational' : 'System Degraded' }}
          </h2>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Uptime:</span>
            <span class="ml-2 text-gray-900 dark:text-white font-medium">{{ formatUptime(health.uptime) }}</span>
          </div>
        </div>
      </div>

      <!-- Service Checks -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Services</h3>
        <div class="space-y-3">
          <div v-for="(check, name) in health.checks" :key="name"
            class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div class="flex items-center gap-2">
              <div :class="[
                'w-2.5 h-2.5 rounded-full',
                check.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              ]"></div>
              <span class="text-sm text-gray-700 dark:text-gray-300 capitalize">{{ name }}</span>
            </div>
            <span v-if="check.status === 'ok'" class="text-xs text-gray-500">{{ check.latency_ms }}ms</span>
            <span v-else class="text-xs text-red-500">{{ check.error }}</span>
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Memory Usage</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div v-for="(val, key) in health.memory" :key="key" class="flex justify-between">
            <span class="text-gray-500 capitalize">{{ String(key).replace(/_/g, ' ') }}</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ formatBytes(val as number) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="text-center py-12 text-gray-400">Loading system health...</div>
  </div>
</template>
