<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';

const router = useRouter();
const store = useInboxStore();

onMounted(() => {
  store.fetchInboxes();
});

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Your Inboxes</h1>
      <button
        @click="router.push('/')"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
      >
        + New Inbox
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">Loading...</div>

    <div v-else-if="store.inboxes.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">No inboxes yet. Create one to get started.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="inbox in store.inboxes"
        :key="inbox.id"
        @click="router.push(`/inbox/${inbox.id}`)"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300 transition-colors"
      >
        <div class="flex justify-between items-center">
          <div>
            <p class="font-mono text-lg font-medium text-gray-900 dark:text-white">
              {{ inbox.full_address || `${inbox.address}@${inbox.domain}` }}
            </p>
            <p class="text-sm text-gray-500 mt-1">
              {{ inbox.email_count }} emails
              <span :class="inbox.is_active ? 'text-green-500' : 'text-red-500'" class="ml-2">
                {{ inbox.is_active ? `Expires ${timeUntil(inbox.expires_at)}` : 'Expired' }}
              </span>
            </p>
          </div>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="inbox.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ inbox.visibility }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
