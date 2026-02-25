<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();

interface Alias {
  id: string;
  alias_address: string;
  domain: string;
  forward_to: string;
  label: string | null;
  is_active: boolean;
  emails_received: number;
  emails_blocked: number;
  created_at: string;
}

interface PrivacyScore {
  score: number;
  factors: Record<string, { score: number; detail: string }>;
  recommendations: string[];
}

const aliases = ref<Alias[]>([]);
const privacyScore = ref<PrivacyScore | null>(null);
const error = ref('');

// Create alias
const showCreateAlias = ref(false);
const aliasForwardTo = ref('');
const aliasLabel = ref('');
const creatingAlias = ref(false);

// Leak check
const leakEmail = ref('');
const leakChecking = ref(false);
const leakResult = ref<{ email: string; breaches_found: number; checked_at: string } | null>(null);

async function fetchAliases() {
  if (!auth.isAuthenticated) return;
  try {
    const { data } = await api.get('/privacy/aliases');
    aliases.value = data.data;
  } catch { /* ignore */ }
}

async function fetchScore() {
  if (!auth.isAuthenticated) return;
  try {
    const { data } = await api.get('/privacy/score');
    privacyScore.value = data.data;
  } catch { /* ignore */ }
}

async function createAlias() {
  if (!aliasForwardTo.value) return;
  creatingAlias.value = true;
  error.value = '';
  try {
    await api.post('/privacy/aliases', {
      forward_to: aliasForwardTo.value,
      label: aliasLabel.value || undefined,
    });
    aliasForwardTo.value = '';
    aliasLabel.value = '';
    showCreateAlias.value = false;
    await fetchAliases();
    await fetchScore();
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to create alias. Pro plan required.';
  } finally {
    creatingAlias.value = false;
  }
}

async function deleteAlias(id: string) {
  try {
    await api.delete(`/privacy/aliases/${id}`);
    aliases.value = aliases.value.filter(a => a.id !== id);
    await fetchScore();
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to delete alias';
  }
}

async function checkLeak() {
  if (!leakEmail.value) return;
  leakChecking.value = true;
  leakResult.value = null;
  try {
    const { data } = await api.post('/privacy/leak-check', { email: leakEmail.value });
    leakResult.value = data.data;
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Leak check failed';
  } finally {
    leakChecking.value = false;
  }
}

onMounted(() => {
  fetchAliases();
  fetchScore();
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Identity Shield</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">Protect your real email with aliases, leak detection, and tracking protection.</p>

    <div v-if="error" class="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
      {{ error }}
      <button @click="error = ''" class="ml-2 font-bold">&times;</button>
    </div>

    <div v-if="!auth.isAuthenticated" class="text-center py-16">
      <p class="text-gray-500 text-lg mb-4">Please log in to access privacy tools.</p>
      <router-link to="/login" class="bg-indigo-600 text-white px-6 py-2 rounded-lg">Log in</router-link>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Privacy Score -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Score</h3>
          <div class="text-center">
            <div class="text-5xl font-bold mb-2" :class="(privacyScore?.score || 0) >= 70 ? 'text-green-500' : (privacyScore?.score || 0) >= 40 ? 'text-yellow-500' : 'text-red-500'">
              {{ privacyScore?.score ?? '--' }}
            </div>
            <p class="text-sm text-gray-500">out of 100</p>
          </div>
          <div v-if="privacyScore?.factors" class="mt-4 space-y-2">
            <div v-for="(factor, key) in privacyScore.factors" :key="key" class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400 capitalize">{{ String(key).replace(/_/g, ' ') }}</span>
              <span class="font-medium" :class="factor.score >= 70 ? 'text-green-600' : factor.score >= 40 ? 'text-yellow-600' : 'text-red-600'">{{ factor.score }}</span>
            </div>
          </div>
          <div v-if="privacyScore?.recommendations?.length" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</p>
            <ul class="space-y-1">
              <li v-for="rec in privacyScore.recommendations" :key="rec" class="text-sm text-gray-600 dark:text-gray-400">
                &bull; {{ rec }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Leak Detection -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leak Detection</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Check if your email appeared in known data breaches.</p>
          <div class="space-y-3">
            <input v-model="leakEmail" type="email" placeholder="your@email.com"
              class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm focus:ring-indigo-500" />
            <button @click="checkLeak" :disabled="leakChecking || !leakEmail"
              class="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {{ leakChecking ? 'Checking...' : 'Check Email' }}
            </button>
          </div>
          <div v-if="leakResult" class="mt-4 p-3 rounded-lg text-sm"
            :class="leakResult.breaches_found > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">
            <p class="font-medium">{{ leakResult.breaches_found > 0 ? `Found in ${leakResult.breaches_found} breach(es)` : 'No breaches found' }}</p>
            <p class="text-xs mt-1">Checked: {{ new Date(leakResult.checked_at).toLocaleString() }}</p>
          </div>
        </div>

        <!-- Tracking Protection -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracking Protection</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">All inbound emails are automatically cleaned.</p>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Pixel stripping</span>
              <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Link tracking</span>
              <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">TLS encryption</span>
              <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Aliases -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Email Aliases</h3>
          <button @click="showCreateAlias = !showCreateAlias"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            {{ showCreateAlias ? 'Cancel' : 'Create Alias' }}
          </button>
        </div>

        <div v-if="showCreateAlias" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Forward to (your real email)</label>
              <input v-model="aliasForwardTo" type="email" placeholder="your@real-email.com" required
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Label (optional)</label>
              <input v-model="aliasLabel" type="text" placeholder="e.g. Netflix, Shopping"
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-sm" />
            </div>
          </div>
          <button @click="createAlias" :disabled="creatingAlias || !aliasForwardTo"
            class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {{ creatingAlias ? 'Creating...' : 'Create Alias' }}
          </button>
          <p class="mt-2 text-xs text-gray-500">A random alias address will be generated. Pro plan required.</p>
        </div>

        <div v-if="aliases.length === 0" class="text-center py-8 text-gray-500">
          <p>No aliases yet. Create one to protect your real email.</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="alias in aliases" :key="alias.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex-1 min-w-0">
              <p class="font-mono text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ alias.alias_address }}@{{ alias.domain }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                <span v-if="alias.label" class="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mr-2">{{ alias.label }}</span>
                Forwards to {{ alias.forward_to }} &bull; {{ alias.emails_received }} received
              </p>
            </div>
            <button @click="deleteAlias(alias.id)" class="ml-3 text-red-500 hover:text-red-700 text-sm">Delete</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
