<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';
import { subscribeToInbox, unsubscribeFromInbox, onNewEmail } from '../services/websocket.js';

const route = useRoute();
const store = useInboxStore();
const inboxId = route.params.id as string;

onMounted(() => {
  store.fetchEmails(inboxId);
  subscribeToInbox(inboxId);
  onNewEmail(() => store.fetchEmails(inboxId));
});

onUnmounted(() => {
  unsubscribeFromInbox(inboxId);
});

function copyAddress() {
  // Copy full address to clipboard
  const address = store.currentInbox?.full_address;
  if (address) navigator.clipboard.writeText(address);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-xl font-mono font-bold text-gray-900 dark:text-white">
            {{ store.currentInbox?.full_address || 'Loading...' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">Inbox ID: {{ inboxId }}</p>
        </div>
        <div class="flex space-x-2">
          <button @click="copyAddress" class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">
            Copy
          </button>
          <button @click="store.fetchEmails(inboxId)" class="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">Loading emails...</div>

    <div v-else-if="store.emails.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400 text-lg">Waiting for emails...</p>
      <p class="text-gray-400 text-sm mt-2">Emails will appear here in real-time</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="email in store.emails"
        :key="email.id"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300"
        :class="{ 'border-l-4 border-l-indigo-500': !email.is_read }"
      >
        <div class="flex justify-between">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ email.from_name || email.from_address }}
            </p>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {{ email.subject || '(no subject)' }}
            </p>
            <p class="text-sm text-gray-500 truncate mt-1">
              {{ email.body_preview }}
            </p>
          </div>
          <div class="text-right text-xs text-gray-400 whitespace-nowrap ml-4">
            {{ formatDate(email.created_at) }}
            <span v-if="email.has_attachments" class="block mt-1">att.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
