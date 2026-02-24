<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api.js';

const to = ref('');
const subject = ref('');
const body = ref('');
const sending = ref(false);
const result = ref<string | null>(null);

async function sendEmail() {
  sending.value = true;
  result.value = null;
  try {
    await api.post('/emails/send', {
      to: [to.value],
      subject: subject.value,
      body: body.value,
      captcha_token: 'placeholder',
    });
    result.value = 'Email queued for sending.';
    to.value = '';
    subject.value = '';
    body.value = '';
  } catch (err: any) {
    result.value = err.response?.data?.error?.message || 'Failed to send';
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Email</h1>

    <div v-if="result" class="mb-4 p-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm">
      {{ result }}
    </div>

    <form @submit.prevent="sendEmail" class="space-y-4">
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

      <div class="flex justify-between items-center">
        <div class="flex space-x-2">
          <button type="button" class="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">
            AI Compose
          </button>
          <button type="button" class="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">
            Grammar Check
          </button>
          <button type="button" class="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">
            Tone Adjust
          </button>
        </div>
        <button type="submit" :disabled="sending"
          class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {{ sending ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </form>
  </div>
</template>
