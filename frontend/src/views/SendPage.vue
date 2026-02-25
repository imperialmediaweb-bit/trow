<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useInboxStore } from '../stores/inbox.js';

const auth = useAuthStore();
const inboxStore = useInboxStore();

const selectedInbox = ref('');
const to = ref('');
const subject = ref('');
const body = ref('');
const sending = ref(false);
const result = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// AI states
const aiLoading = ref(false);
const aiPrompt = ref('');
const showAiCompose = ref(false);
const toneOptions = ['formal', 'casual', 'business', 'friendly'];
const selectedTone = ref('business');

async function sendEmail() {
  if (!selectedInbox.value) {
    result.value = { type: 'error', message: 'Please select an inbox to send from.' };
    return;
  }
  sending.value = true;
  result.value = null;
  try {
    const { data } = await api.post('/emails/send', {
      from_inbox_id: selectedInbox.value,
      to: [to.value],
      subject: subject.value,
      body: body.value,
      captcha_token: 'verified',
    });
    result.value = { type: 'success', message: `Email sent from ${data.data.from} to ${data.data.to.join(', ')}` };
    to.value = '';
    subject.value = '';
    body.value = '';
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'Failed to send email' };
  } finally {
    sending.value = false;
  }
}

async function aiCompose() {
  if (!aiPrompt.value) return;
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/compose', {
      prompt: aiPrompt.value,
      tone: selectedTone.value,
      language: 'en',
      max_length: 1000,
    });
    body.value = data.data.text;
    if (!subject.value) {
      subject.value = aiPrompt.value.slice(0, 80);
    }
    showAiCompose.value = false;
    aiPrompt.value = '';
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'AI compose failed. Pro plan required.' };
  } finally {
    aiLoading.value = false;
  }
}

async function grammarCheck() {
  if (!body.value) return;
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/grammar', { text: body.value });
    body.value = data.data.corrected;
    result.value = { type: 'success', message: 'Grammar corrected.' };
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'Grammar check failed. Pro plan required.' };
  } finally {
    aiLoading.value = false;
  }
}

async function toneAdjust() {
  if (!body.value) return;
  aiLoading.value = true;
  try {
    const { data } = await api.post('/ai/tone-adjust', { text: body.value, tone: selectedTone.value });
    body.value = data.data.adjusted;
    result.value = { type: 'success', message: `Tone adjusted to ${selectedTone.value}.` };
  } catch (err: any) {
    result.value = { type: 'error', message: err.response?.data?.error?.message || 'Tone adjust failed. Pro plan required.' };
  } finally {
    aiLoading.value = false;
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    inboxStore.fetchInboxes();
  }
});
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Send Email</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-6">Send emails from your temporary inbox. Pro plan required.</p>

    <div v-if="!auth.isAuthenticated" class="text-center py-16">
      <p class="text-gray-500 text-lg mb-4">Please log in to send emails.</p>
      <router-link to="/login" class="bg-indigo-600 text-white px-6 py-2 rounded-lg">Log in</router-link>
    </div>

    <template v-else>
      <div v-if="result" class="mb-4 p-3 rounded-lg text-sm"
        :class="result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
        {{ result.message }}
      </div>

      <form @submit.prevent="sendEmail" class="space-y-4">
        <!-- From inbox selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Inbox</label>
          <select v-model="selectedInbox" required
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 focus:ring-indigo-500">
            <option value="" disabled>Select an inbox...</option>
            <option v-for="inbox in inboxStore.inboxes" :key="inbox.id" :value="inbox.id">
              {{ inbox.full_address || `${inbox.address}@${inbox.domain}` }}
            </option>
          </select>
          <p v-if="inboxStore.inboxes.length === 0" class="text-xs text-gray-500 mt-1">
            No inboxes found. <router-link to="/inbox" class="text-indigo-600">Create one first</router-link>.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
          <input v-model="to" type="email" required placeholder="recipient@example.com"
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <input v-model="subject" required placeholder="Email subject"
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea v-model="body" rows="8" required placeholder="Write your message..."
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 focus:ring-indigo-500"></textarea>
        </div>

        <!-- AI Compose Panel -->
        <div v-if="showAiCompose" class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p class="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">AI Email Composer</p>
          <textarea v-model="aiPrompt" rows="3" placeholder="Describe what you want to write, e.g. 'Write a professional follow-up email about the meeting yesterday'"
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm"></textarea>
          <div class="flex items-center gap-3 mt-2">
            <select v-model="selectedTone" class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-1 text-sm">
              <option v-for="t in toneOptions" :key="t" :value="t">{{ t }}</option>
            </select>
            <button @click="aiCompose" :disabled="aiLoading || !aiPrompt" type="button"
              class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {{ aiLoading ? 'Generating...' : 'Generate' }}
            </button>
            <button @click="showAiCompose = false" type="button" class="text-sm text-gray-500">Cancel</button>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex space-x-2">
            <button type="button" @click="showAiCompose = !showAiCompose" :disabled="aiLoading"
              class="text-sm px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 disabled:opacity-50">
              AI Compose
            </button>
            <button type="button" @click="grammarCheck" :disabled="aiLoading || !body"
              class="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-gray-700 dark:text-gray-300">
              {{ aiLoading ? '...' : 'Grammar' }}
            </button>
            <button type="button" @click="toneAdjust" :disabled="aiLoading || !body"
              class="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-gray-700 dark:text-gray-300">
              {{ aiLoading ? '...' : 'Tone' }}
            </button>
            <select v-model="selectedTone" class="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-2 py-1">
              <option v-for="t in toneOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <button type="submit" :disabled="sending || aiLoading"
            class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {{ sending ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
