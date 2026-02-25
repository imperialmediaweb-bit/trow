<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';
import { subscribeToInbox, unsubscribeFromInbox, onNewEmail } from '../services/websocket.js';
import { api } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const store = useInboxStore();
const inboxId = route.params.id as string;
const copied = ref(false);
const inboxInfo = ref<any>(null);

async function loadInbox() {
  try {
    const { data } = await api.get(`/inboxes/${inboxId}`);
    inboxInfo.value = data.data;
    store.currentInbox = {
      ...data.data,
      full_address: `${data.data.address}@${data.data.domain}`,
    };
  } catch { /* ignore */ }
}

onMounted(() => {
  loadInbox();
  store.fetchEmails(inboxId);
  subscribeToInbox(inboxId);
  onNewEmail(() => store.fetchEmails(inboxId));
});

onUnmounted(() => {
  unsubscribeFromInbox(inboxId);
});

function copyAddress() {
  const address = store.currentInbox?.full_address || inboxInfo.value?.address;
  if (address) {
    navigator.clipboard.writeText(address);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

function openEmail(emailId: string) {
  router.push(`/email/${emailId}`);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

const fullAddress = computed(() => {
  if (store.currentInbox?.full_address) return store.currentInbox.full_address;
  if (inboxInfo.value) return `${inboxInfo.value.address}@${inboxInfo.value.domain}`;
  return 'Loading...';
});

async function deleteInbox() {
  try {
    await store.deleteInbox(inboxId);
    router.push('/inbox');
  } catch { /* ignore */ }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Inbox Header -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <router-link to="/inbox" class="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">&larr; All Inboxes</router-link>
          <h1 class="text-xl font-mono font-bold text-gray-900 dark:text-white">
            {{ fullAddress }}
          </h1>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>{{ store.emails.length }} email(s)</span>
            <span v-if="inboxInfo?.expires_at">Expires: {{ new Date(inboxInfo.expires_at).toLocaleString() }}</span>
            <span v-if="inboxInfo?.visibility" class="px-2 py-0.5 rounded-full text-xs"
              :class="inboxInfo.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
              {{ inboxInfo.visibility }}
            </span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button @click="copyAddress" class="px-3 py-1.5 text-sm rounded-lg"
            :class="copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300'">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
          <button @click="store.fetchEmails(inboxId)" class="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
            Refresh
          </button>
          <button @click="deleteInbox" class="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
            Delete
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">Loading emails...</div>

    <div v-else-if="store.emails.length === 0" class="text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-8.953 5.522a2.25 2.25 0 01-2.294 0L2.25 6.75" />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-lg">Waiting for emails...</p>
      <p class="text-gray-400 text-sm mt-2">Send an email to <span class="font-mono font-medium text-indigo-600">{{ fullAddress }}</span></p>
      <p class="text-gray-400 text-xs mt-1">Emails appear in real-time via WebSocket</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="email in store.emails"
        :key="email.id"
        @click="openEmail(email.id)"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
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
          <div class="text-right text-xs text-gray-400 whitespace-nowrap ml-4 flex flex-col items-end gap-1">
            <span>{{ formatDate(email.created_at) }}</span>
            <span v-if="email.has_attachments" class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">att.</span>
            <span v-if="!email.is_read" class="w-2 h-2 bg-indigo-500 rounded-full"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
