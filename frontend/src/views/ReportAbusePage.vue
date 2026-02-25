<script setup lang="ts">
import { ref } from 'vue';

const form = ref({
  email: '',
  abuseType: '',
  description: '',
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

const abuseTypes = [
  { value: 'spam', label: 'Spam' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'illegal_content', label: 'Illegal Content' },
];

async function submitReport() {
  if (!form.value.email || !form.value.abuseType || !form.value.description) {
    error.value = 'Please fill in all fields.';
    return;
  }

  submitting.value = true;
  error.value = '';

  try {
    const res = await fetch('/api/v1/admin/abuse-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.value.email,
        abuse_type: form.value.abuseType,
        description: form.value.description,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to submit report. Please try again or email us directly.');
    }

    submitted.value = true;
  } catch (e: any) {
    error.value = e.message || 'Something went wrong. Please try again or email abuse@throwbox.net directly.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3">Report Abuse</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Help us keep Throwbox AI safe. If you have encountered spam, phishing, harassment, or illegal content
        originating from our service, please let us know.
      </p>
    </div>

    <!-- Success State -->
    <div v-if="submitted" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
      <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report Submitted</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Thank you for your report. Our trust and safety team will review it and take appropriate action.
        If we need additional information, we will reach out to the email address you provided.
      </p>
    </div>

    <template v-else>
      <!-- Report Form -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Submit a Report</h2>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <form @submit.prevent="submitReport" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your Email Address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">We may contact you for additional details about your report.</p>
          </div>

          <!-- Abuse Type -->
          <div>
            <label for="abuseType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type of Abuse
            </label>
            <select
              id="abuseType"
              v-model="form.abuseType"
              required
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="" disabled>Select a category</option>
              <option v-for="type in abuseTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              required
              rows="5"
              placeholder="Please describe the abuse in detail. Include any relevant email addresses, dates, and content if possible."
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
            ></textarea>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit Report</span>
          </button>
        </form>
      </div>

      <!-- Alternative Contact -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Alternative Contact</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          If you prefer, you can report abuse directly by sending an email to
          <a href="mailto:abuse@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">abuse@throwbox.net</a>.
          Please include a detailed description of the abuse, any relevant email addresses or message content,
          and your contact information so we can follow up if needed.
        </p>
      </div>
    </template>
  </div>
</template>
