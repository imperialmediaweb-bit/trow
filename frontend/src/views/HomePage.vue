<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';

const router = useRouter();
const inboxStore = useInboxStore();
const creating = ref(false);
const selectedTtl = ref('3600');

async function quickCreate() {
  creating.value = true;
  try {
    const inbox = await inboxStore.createInbox({ ttl: selectedTtl.value });
    router.push(`/inbox/${inbox.id}`);
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
      <div class="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
        <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Throwbox <span class="text-indigo-200">AI</span>
        </h1>
        <p class="mt-6 text-xl text-indigo-100 max-w-2xl mx-auto">
          AI-Powered Temporary Email & Privacy Platform.
          Receive, send, and analyze emails with built-in AI intelligence.
        </p>

        <!-- Quick Create -->
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <select
            v-model="selectedTtl"
            class="rounded-lg px-4 py-3 text-gray-900 bg-white shadow-lg focus:ring-2 focus:ring-indigo-300"
          >
            <option value="600">10 Minutes</option>
            <option value="3600">1 Hour</option>
            <option value="86400">24 Hours</option>
            <option value="604800">7 Days</option>
          </select>
          <button
            @click="quickCreate"
            :disabled="creating"
            class="bg-white text-indigo-700 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {{ creating ? 'Creating...' : 'Generate Temp Email' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Why Throwbox AI?
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">AI</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">AI Inbox Assistant</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Auto-summarize emails, extract OTP codes, detect phishing attempts, and get smart priority labels.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">S</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Send & Receive</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Full temporary email system. Receive AND send emails from disposable addresses with custom expiration.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">P</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Privacy Shield</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Email aliases, leak detection, tracking pixel blocking, and privacy scoring for complete protection.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">W</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">AI Writing Assistant</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Compose emails with AI help. Grammar correction, tone adjustment, and spam risk analysis before sending.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">{}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Developer API</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            REST API, webhooks, CI/CD testing inboxes. Build temp email into your apps and automated workflows.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">E</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Enterprise Ready</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            SPF/DKIM/DMARC, encryption at rest, GDPR compliance, white-label option, and dedicated support.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
