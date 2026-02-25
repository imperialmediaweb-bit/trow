<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const emailId = route.params.id as string;

interface EmailDetail {
  id: string;
  inbox_id: string;
  direction: string;
  from_address: string;
  from_name: string;
  to_addresses: Array<{ address: string }>;
  cc_addresses: Array<{ address: string }>;
  subject: string;
  body_text: string;
  body_html: string;
  body_preview: string;
  has_attachments: boolean;
  is_read: boolean;
  is_starred: boolean;
  spam_score: number | null;
  spf_result: string | null;
  dkim_result: string | null;
  dmarc_result: string | null;
  delivery_status: string;
  created_at: string;
  // AI analysis
  summary: string | null;
  otp_codes: Array<{ code: string; type: string }> | null;
  phishing_score: number | null;
  priority: string | null;
  categories: string[] | null;
}

const email = ref<EmailDetail | null>(null);
const loading = ref(true);
const error = ref('');
const showHtml = ref(false);

// AI actions
const aiLoading = ref(false);
const aiSummary = ref<string | null>(null);
const otpCodes = ref<Array<{ code: string; type: string }>>([]);
const phishingResult = ref<{ phishing_score: number; indicators: Array<{ type: string; detail: string }>; recommendation: string } | null>(null);

async function fetchEmail() {
  loading.value = true;
  try {
    const { data } = await api.get(`/emails/${emailId}`);
    email.value = data.data;
    if (email.value?.summary) aiSummary.value = email.value.summary;
    if (email.value?.otp_codes?.length) otpCodes.value = email.value.otp_codes;
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to load email';
  } finally {
    loading.value = false;
  }
}

async function summarize() {
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/summarize', { email_id: emailId });
    aiSummary.value = data.data.summary;
    otpCodes.value = data.data.otp_codes || [];
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'AI analysis failed';
  } finally {
    aiLoading.value = false;
  }
}

async function extractOtp() {
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/extract-otp', { email_id: emailId });
    otpCodes.value = data.data.otp_codes || [];
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'OTP extraction failed';
  } finally {
    aiLoading.value = false;
  }
}

async function phishingCheck() {
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/phishing-check', { email_id: emailId });
    phishingResult.value = data.data;
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Phishing check failed';
  } finally {
    aiLoading.value = false;
  }
}

async function deleteEmail() {
  try {
    await api.delete(`/emails/${emailId}`);
    router.back();
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Failed to delete';
  }
}

function copyOtp(code: string) {
  navigator.clipboard.writeText(code);
}

const securityBadge = computed(() => {
  if (!email.value) return null;
  const spf = email.value.spf_result;
  const dkim = email.value.dkim_result;
  if (spf === 'pass' && dkim === 'pass') return { label: 'Verified', color: 'green' };
  if (spf === 'pass' || dkim === 'pass') return { label: 'Partial', color: 'yellow' };
  return { label: 'Unverified', color: 'red' };
});

onMounted(fetchEmail);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <button @click="router.back()" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">&larr; Back</button>

    <div v-if="loading" class="text-center py-12 text-gray-500">Loading email...</div>
    <div v-else-if="error" class="p-4 bg-red-50 text-red-700 rounded-lg">{{ error }}</div>

    <template v-else-if="email">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ email.subject || '(no subject)' }}</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              From: <span class="font-medium">{{ email.from_name || email.from_address }}</span>
              <span v-if="email.from_name" class="text-gray-400"> &lt;{{ email.from_address }}&gt;</span>
            </p>
            <p class="text-xs text-gray-500 mt-0.5">{{ new Date(email.created_at).toLocaleString() }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="securityBadge" class="text-xs px-2 py-1 rounded-full"
              :class="`bg-${securityBadge.color}-100 text-${securityBadge.color}-700`">
              {{ securityBadge.label }}
            </span>
            <span v-if="email.priority" class="text-xs px-2 py-1 rounded-full capitalize"
              :class="email.priority === 'high' ? 'bg-red-100 text-red-700' : email.priority === 'spam' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'">
              {{ email.priority }}
            </span>
          </div>
        </div>

        <!-- AI Actions -->
        <div class="flex flex-wrap gap-2 mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button @click="summarize" :disabled="aiLoading"
            class="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50">
            {{ aiLoading ? '...' : 'AI Summary' }}
          </button>
          <button @click="extractOtp" :disabled="aiLoading"
            class="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">
            Extract OTP
          </button>
          <button @click="phishingCheck" :disabled="aiLoading"
            class="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50">
            Phishing Check
          </button>
          <button @click="deleteEmail"
            class="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 ml-auto">
            Delete
          </button>
        </div>

        <!-- AI Results -->
        <div v-if="aiSummary" class="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p class="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">AI Summary</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ aiSummary }}</p>
        </div>

        <div v-if="otpCodes.length > 0" class="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p class="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">OTP Codes Found</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="otp in otpCodes" :key="otp.code" @click="copyOtp(otp.code)"
              class="font-mono text-lg font-bold bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-purple-200 hover:border-purple-400 cursor-pointer">
              {{ otp.code }}
              <span class="block text-xs text-gray-500 font-normal">Click to copy</span>
            </button>
          </div>
        </div>

        <div v-if="phishingResult" class="mb-4 p-3 rounded-lg"
          :class="phishingResult.phishing_score > 70 ? 'bg-red-50' : phishingResult.phishing_score > 40 ? 'bg-yellow-50' : 'bg-green-50'">
          <p class="text-xs font-semibold mb-1"
            :class="phishingResult.phishing_score > 70 ? 'text-red-700' : phishingResult.phishing_score > 40 ? 'text-yellow-700' : 'text-green-700'">
            Phishing Score: {{ phishingResult.phishing_score }}/100 ({{ phishingResult.recommendation.replace('_', ' ') }})
          </p>
          <ul v-if="phishingResult.indicators?.length" class="mt-1 space-y-1">
            <li v-for="ind in phishingResult.indicators" :key="ind.detail" class="text-xs text-gray-600">
              &bull; {{ ind.type }}: {{ ind.detail }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Email Body -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button @click="showHtml = false" :class="!showHtml ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'"
            class="px-4 py-2 text-sm font-medium">Text</button>
          <button @click="showHtml = true" :class="showHtml ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'"
            class="px-4 py-2 text-sm font-medium" v-if="email.body_html">HTML</button>
        </div>
        <div class="p-6">
          <div v-if="showHtml && email.body_html" v-html="email.body_html" class="prose dark:prose-invert max-w-none email-html"></div>
          <pre v-else class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{{ email.body_text || email.body_preview || '(empty)' }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.email-html :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
