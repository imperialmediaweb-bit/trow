<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const days = ref(30);

onMounted(() => admin.fetchAnalytics(days.value));

function changeDays(d: number) {
  days.value = d;
  admin.fetchAnalytics(d);
}

const maxSignups = computed(() => {
  if (!admin.analytics?.signups_by_day?.length) return 1;
  return Math.max(...admin.analytics.signups_by_day.map((d: any) => parseInt(d.count)));
});

const maxEmails = computed(() => {
  if (!admin.analytics?.emails_by_day?.length) return 1;
  return Math.max(...admin.analytics.emails_by_day.map((d: any) => parseInt(d.count)));
});
</script>

<template>
  <div>
    <!-- Period selector -->
    <div class="flex gap-2 mb-6">
      <button v-for="d in [7, 14, 30, 60, 90]" :key="d" @click="changeDays(d)"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg transition-colors',
          days === d
            ? 'bg-indigo-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
        ]">
        {{ d }} days
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Signups Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Signups</h3>
        <div v-if="admin.analytics?.signups_by_day" class="space-y-1">
          <div v-for="row in admin.analytics.signups_by_day" :key="row.date" class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-20 flex-shrink-0">{{ new Date(row.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) }}</span>
            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div class="bg-indigo-500 h-full rounded-full transition-all"
                :style="{ width: `${(parseInt(row.count) / maxSignups) * 100}%` }"></div>
            </div>
            <span class="text-xs text-gray-600 dark:text-gray-400 w-8 text-right">{{ row.count }}</span>
          </div>
          <p v-if="!admin.analytics.signups_by_day.length" class="text-sm text-gray-400 text-center py-8">No data</p>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8">Loading...</p>
      </div>

      <!-- Emails Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Emails Received</h3>
        <div v-if="admin.analytics?.emails_by_day" class="space-y-1">
          <div v-for="row in admin.analytics.emails_by_day" :key="row.date" class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-20 flex-shrink-0">{{ new Date(row.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) }}</span>
            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div class="bg-purple-500 h-full rounded-full transition-all"
                :style="{ width: `${(parseInt(row.count) / maxEmails) * 100}%` }"></div>
            </div>
            <span class="text-xs text-gray-600 dark:text-gray-400 w-8 text-right">{{ row.count }}</span>
          </div>
          <p v-if="!admin.analytics.emails_by_day.length" class="text-sm text-gray-400 text-center py-8">No data</p>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8">Loading...</p>
      </div>

      <!-- Plan Distribution -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Plan Distribution</h3>
        <div v-if="admin.analytics?.plan_distribution" class="space-y-3">
          <div v-for="row in admin.analytics.plan_distribution" :key="row.plan"
            class="flex items-center justify-between">
            <span class="text-sm capitalize" :class="{
              'text-gray-600 dark:text-gray-400': row.plan === 'free',
              'text-indigo-600': row.plan === 'pro',
              'text-purple-600': row.plan === 'business',
              'text-green-600': row.plan?.startsWith('api'),
            }">{{ row.plan }}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ row.count }}</span>
          </div>
          <p v-if="!admin.analytics.plan_distribution.length" class="text-sm text-gray-400 text-center py-4">No data</p>
        </div>
      </div>

      <!-- Top Domains -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Domains</h3>
        <div v-if="admin.analytics?.top_domains" class="space-y-3">
          <div v-for="(row, i) in admin.analytics.top_domains" :key="row.domain"
            class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-4">{{ Number(i) + 1 }}.</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.domain }}</span>
            </div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ row.count }}</span>
          </div>
          <p v-if="!admin.analytics.top_domains.length" class="text-sm text-gray-400 text-center py-4">No data</p>
        </div>
      </div>
    </div>
  </div>
</template>
