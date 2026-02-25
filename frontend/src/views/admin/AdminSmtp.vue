<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const saving = ref(false);
const testing = ref(false);
const message = ref('');
const testEmail = ref('');

const smtp = ref({
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  from_name: 'Throwbox AI',
  from_email: 'noreply@throwbox.net',
  enabled: false,
});

onMounted(async () => {
  await admin.fetchSettings();
  if (admin.settings?.smtp) {
    smtp.value = { ...smtp.value, ...admin.settings.smtp };
  }
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    await admin.saveSettings('smtp', smtp.value);
    message.value = 'SMTP settings saved!';
  } catch {
    message.value = 'Error saving SMTP settings';
  } finally {
    saving.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}

async function testConnection() {
  if (!testEmail.value) {
    message.value = 'Please enter a test email address';
    return;
  }
  testing.value = true;
  message.value = '';
  try {
    const result = await admin.testSmtp({ ...smtp.value, test_to: testEmail.value });
    message.value = result.success ? 'Test email sent successfully!' : `Error: ${result.error?.message}`;
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    testing.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      {{ message }}
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">SMTP Configuration</h2>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="smtp.enabled" id="smtp-enabled" class="rounded border-gray-300 text-green-600" />
          <label for="smtp-enabled" class="text-sm font-medium" :class="smtp.enabled ? 'text-green-600' : 'text-gray-500'">
            {{ smtp.enabled ? 'Enabled' : 'Disabled' }}
          </label>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
            <input v-model="smtp.host" placeholder="smtp.gmail.com"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
            <input v-model.number="smtp.port" type="number"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="smtp.secure" id="smtp-secure" class="rounded border-gray-300 text-indigo-600" />
          <label for="smtp-secure" class="text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS</label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input v-model="smtp.username" autocomplete="off"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input v-model="smtp.password" type="password" autocomplete="off"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
            <input v-model="smtp.from_name"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Email</label>
            <input v-model="smtp.from_email"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button @click="save" :disabled="saving"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save SMTP Settings' }}
          </button>
        </div>

        <!-- Test Section -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Test SMTP Connection</h3>
          <div class="flex gap-2">
            <input v-model="testEmail" placeholder="test@example.com"
              class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
            <button @click="testConnection" :disabled="testing"
              class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {{ testing ? 'Sending...' : 'Send Test Email' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
