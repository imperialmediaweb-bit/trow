<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const store = useInboxStore();
const auth = useAuthStore();
const creating = ref(false);
const showCreate = ref(false);
const selectedTtl = ref('3600');
const selectedVisibility = ref('private');

const ttlOptions = [
  { value: '600', label: '10 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '24 hours' },
  { value: '604800', label: '7 days' },
];

onMounted(() => {
  if (auth.isAuthenticated) {
    store.fetchInboxes();
  }
});

async function createInbox() {
  creating.value = true;
  try {
    const inbox = await store.createInbox({
      ttl: selectedTtl.value,
      visibility: selectedVisibility.value,
    });
    showCreate.value = false;
    if (inbox?.id) {
      router.push(`/inbox/${inbox.id}`);
    }
  } catch {
    // Store handles errors
  } finally {
    creating.value = false;
  }
}

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
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Your Inboxes</h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Temporary email inboxes for privacy and testing.</p>
      </div>
      <button
        @click="showCreate = !showCreate"
        class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        {{ showCreate ? 'Cancel' : '+ New Inbox' }}
      </button>
    </div>

    <div v-if="!auth.isAuthenticated" class="text-center py-16">
      <p class="text-gray-500 text-lg mb-4">Log in to manage your inboxes.</p>
      <router-link to="/login" class="bg-indigo-600 text-white px-6 py-2 rounded-lg">Log in</router-link>
    </div>

    <template v-else>
      <!-- Create Inbox Form -->
      <div v-if="showCreate" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Inbox</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <select v-model="selectedTtl" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm">
              <option v-for="opt in ttlOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
            <select v-model="selectedVisibility" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
        <button @click="createInbox" :disabled="creating"
          class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {{ creating ? 'Creating...' : 'Create Inbox' }}
        </button>
      </div>

      <div v-if="store.loading" class="text-center py-12 text-gray-500">Loading...</div>

      <div v-else-if="store.inboxes.length === 0 && !showCreate" class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-8.953 5.522a2.25 2.25 0 01-2.294 0L2.25 6.75" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-lg">No inboxes yet.</p>
        <button @click="showCreate = true" class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Create your first inbox
        </button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="inbox in store.inboxes"
          :key="inbox.id"
          @click="router.push(`/inbox/${inbox.id}`)"
          class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-mono text-lg font-medium text-gray-900 dark:text-white">
                {{ inbox.full_address || `${inbox.address}@${inbox.domain}` }}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                {{ inbox.email_count }} email{{ inbox.email_count !== 1 ? 's' : '' }}
                <span class="mx-1">&bull;</span>
                <span :class="inbox.is_active ? 'text-green-600' : 'text-red-500'">
                  {{ inbox.is_active ? `Expires in ${timeUntil(inbox.expires_at)}` : 'Expired' }}
                </span>
              </p>
            </div>
            <span
              class="px-2.5 py-1 text-xs rounded-full font-medium"
              :class="inbox.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ inbox.visibility }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
