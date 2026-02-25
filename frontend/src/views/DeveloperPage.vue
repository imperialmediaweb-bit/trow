<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  failure_count: number;
  last_triggered: string | null;
  last_status: number | null;
  created_at: string;
}

interface Usage {
  plan: string;
  active_inboxes: number;
  emails_today: number;
  ai_calls_today: number;
}

const apiKeys = ref<ApiKey[]>([]);
const webhooks = ref<Webhook[]>([]);
const usage = ref<Usage | null>(null);
const error = ref('');
const newKeyRevealed = ref<string | null>(null);

// Create API key form
const showCreateKey = ref(false);
const keyName = ref('');
const keyScopes = ref<string[]>(['read']);
const creatingKey = ref(false);

// Create webhook form
const showCreateWebhook = ref(false);
const webhookUrl = ref('');
const webhookEvents = ref<string[]>(['email.received']);
const creatingWebhook = ref(false);

const availableEvents = [
  'email.received', 'email.sent', 'email.bounced',
  'inbox.created', 'inbox.expired',
  'ai.analysis_complete',
];

async function fetchApiKeys() {
  try {
    const { data } = await api.get('/developer/api-keys');
    apiKeys.value = data.data;
  } catch { /* ignore */ }
}

async function fetchWebhooks() {
  try {
    const { data } = await api.get('/developer/webhooks');
    webhooks.value = data.data;
  } catch { /* ignore */ }
}

async function fetchUsage() {
  try {
    const { data } = await api.get('/developer/usage');
    usage.value = data.data;
  } catch { /* ignore */ }
}

async function createApiKey() {
  if (!keyName.value) return;
  creatingKey.value = true;
  error.value = '';
  try {
    const { data } = await api.post('/developer/api-keys', {
      name: keyName.value,
      scopes: keyScopes.value,
    });
    newKeyRevealed.value = data.data.key;
    keyName.value = '';
    keyScopes.value = ['read'];
    showCreateKey.value = false;
    await fetchApiKeys();
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to create API key';
  } finally {
    creatingKey.value = false;
  }
}

async function revokeApiKey(id: string) {
  try {
    await api.delete(`/developer/api-keys/${id}`);
    apiKeys.value = apiKeys.value.filter(k => k.id !== id);
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to revoke key';
  }
}

async function createWebhook() {
  if (!webhookUrl.value) return;
  creatingWebhook.value = true;
  error.value = '';
  try {
    await api.post('/developer/webhooks', {
      url: webhookUrl.value,
      events: webhookEvents.value,
    });
    webhookUrl.value = '';
    webhookEvents.value = ['email.received'];
    showCreateWebhook.value = false;
    await fetchWebhooks();
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to create webhook';
  } finally {
    creatingWebhook.value = false;
  }
}

async function deleteWebhook(id: string) {
  try {
    await api.delete(`/developer/webhooks/${id}`);
    webhooks.value = webhooks.value.filter(w => w.id !== id);
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to delete webhook';
  }
}

function copyKey() {
  if (newKeyRevealed.value) {
    navigator.clipboard.writeText(newKeyRevealed.value);
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchApiKeys();
    fetchWebhooks();
    fetchUsage();
  }
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Developer API</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">Integrate Throwbox into your applications with our REST API.</p>

    <div v-if="error" class="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
      {{ error }}
      <button @click="error = ''" class="ml-2 font-bold">&times;</button>
    </div>

    <!-- New Key Alert -->
    <div v-if="newKeyRevealed" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-sm font-semibold text-yellow-800 mb-2">Save this API key now. It won't be shown again.</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-yellow-100 px-3 py-2 rounded text-sm font-mono text-yellow-900 break-all">{{ newKeyRevealed }}</code>
        <button @click="copyKey" class="bg-yellow-600 text-white px-3 py-2 rounded text-sm">Copy</button>
        <button @click="newKeyRevealed = null" class="text-yellow-700 px-2">&times;</button>
      </div>
    </div>

    <!-- Quick Start -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h2>
      <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto"><code># Create a temp inbox
curl -X POST /api/v1/inboxes \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ttl": "3600"}'

# List emails
curl /api/v1/inboxes/INBOX_ID/emails \
  -H "Authorization: Bearer YOUR_API_KEY"

# AI analysis
curl -X POST /api/v1/ai/summarize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"email_id": "EMAIL_ID"}'</code></pre>
    </div>

    <div v-if="!auth.isAuthenticated" class="text-center py-12">
      <p class="text-gray-500 text-lg mb-4">Log in to manage API keys and webhooks.</p>
      <router-link to="/login" class="bg-indigo-600 text-white px-6 py-2 rounded-lg">Log in</router-link>
    </div>

    <template v-else>
      <!-- Usage Stats -->
      <div v-if="usage" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ usage.active_inboxes }}</p>
          <p class="text-xs text-gray-500">Active Inboxes</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ usage.emails_today }}</p>
          <p class="text-xs text-gray-500">Emails Today</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ usage.ai_calls_today }}</p>
          <p class="text-xs text-gray-500">AI Calls Today</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p class="text-2xl font-bold text-indigo-600 capitalize">{{ usage.plan }}</p>
          <p class="text-xs text-gray-500">Current Plan</p>
        </div>
      </div>

      <!-- API Keys -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
          <button @click="showCreateKey = !showCreateKey"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            {{ showCreateKey ? 'Cancel' : 'Generate Key' }}
          </button>
        </div>

        <div v-if="showCreateKey" class="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Key Name</label>
              <input v-model="keyName" type="text" placeholder="e.g. Production API"
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Scopes</label>
              <div class="flex gap-3 mt-1">
                <label class="flex items-center gap-1 text-sm">
                  <input type="checkbox" value="read" v-model="keyScopes" /> Read
                </label>
                <label class="flex items-center gap-1 text-sm">
                  <input type="checkbox" value="write" v-model="keyScopes" /> Write
                </label>
                <label class="flex items-center gap-1 text-sm">
                  <input type="checkbox" value="admin" v-model="keyScopes" /> Admin
                </label>
              </div>
            </div>
          </div>
          <button @click="createApiKey" :disabled="creatingKey || !keyName"
            class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {{ creatingKey ? 'Creating...' : 'Create Key' }}
          </button>
        </div>

        <div v-if="apiKeys.length === 0" class="text-center py-6 text-gray-500 text-sm">No API keys yet.</div>
        <div v-else class="space-y-2">
          <div v-for="key in apiKeys" :key="key.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ key.name }}</p>
              <p class="text-xs text-gray-500 font-mono">{{ key.key_prefix }}... &bull; {{ key.scopes.join(', ') }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span :class="key.is_active ? 'text-green-600' : 'text-red-600'" class="text-xs">
                {{ key.is_active ? 'Active' : 'Revoked' }}
              </span>
              <button v-if="key.is_active" @click="revokeApiKey(key.id)" class="text-red-500 hover:text-red-700 text-xs">Revoke</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhooks -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h3>
          <button @click="showCreateWebhook = !showCreateWebhook"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            {{ showCreateWebhook ? 'Cancel' : 'Add Webhook' }}
          </button>
        </div>

        <div v-if="showCreateWebhook" class="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Endpoint URL</label>
              <input v-model="webhookUrl" type="url" placeholder="https://your-server.com/webhook"
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Events</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <label v-for="evt in availableEvents" :key="evt" class="flex items-center gap-1 text-xs">
                  <input type="checkbox" :value="evt" v-model="webhookEvents" /> {{ evt }}
                </label>
              </div>
            </div>
          </div>
          <button @click="createWebhook" :disabled="creatingWebhook || !webhookUrl"
            class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {{ creatingWebhook ? 'Creating...' : 'Create Webhook' }}
          </button>
        </div>

        <div v-if="webhooks.length === 0" class="text-center py-6 text-gray-500 text-sm">No webhooks configured.</div>
        <div v-else class="space-y-2">
          <div v-for="wh in webhooks" :key="wh.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-mono text-gray-900 dark:text-white truncate">{{ wh.url }}</p>
              <p class="text-xs text-gray-500">{{ wh.events.join(', ') }} &bull; Failures: {{ wh.failure_count }}</p>
            </div>
            <button @click="deleteWebhook(wh.id)" class="ml-3 text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
