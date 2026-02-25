<script setup lang="ts">
import { ref } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const sending = ref(false);
const message = ref('');
const savingPrefs = ref(false);

const notification = ref({
  subject: '',
  body: '',
  target: 'all',
  user_ids: '',
});

const prefs = ref({
  welcome_email: true,
  inbox_expiry_warning: true,
  weekly_digest: false,
  marketing_emails: false,
  admin_alerts: true,
  alert_email: '',
});

async function loadPrefs() {
  await admin.fetchSettings();
  if (admin.settings?.notifications) {
    prefs.value = { ...prefs.value, ...admin.settings.notifications };
  }
}
loadPrefs();

async function send() {
  if (!notification.value.subject || !notification.value.body) {
    message.value = 'Please fill in subject and body';
    return;
  }
  sending.value = true;
  message.value = '';
  try {
    const payload: any = {
      subject: notification.value.subject,
      body: notification.value.body,
      target: notification.value.target,
    };
    if (notification.value.target === 'specific') {
      payload.user_ids = notification.value.user_ids.split(',').map((s: string) => s.trim());
    }
    const result = await admin.sendNotification(payload);
    message.value = result.message;
    notification.value = { subject: '', body: '', target: 'all', user_ids: '' };
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    sending.value = false;
    setTimeout(() => message.value = '', 5000);
  }
}

async function savePrefs() {
  savingPrefs.value = true;
  try {
    await admin.saveSettings('notifications', prefs.value);
    message.value = 'Notification preferences saved!';
  } catch {
    message.value = 'Error saving preferences';
  } finally {
    savingPrefs.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      {{ message }}
    </div>

    <!-- Send Notification -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send Email Notification</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
          <select v-model="notification.target"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
            <option value="all">All Users</option>
            <option value="pro">Pro/Business Users</option>
            <option value="free">Free Users</option>
            <option value="specific">Specific Users (by ID)</option>
          </select>
        </div>

        <div v-if="notification.target === 'specific'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User IDs (comma-separated)</label>
          <input v-model="notification.user_ids" placeholder="uuid1, uuid2, ..."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <input v-model="notification.subject" placeholder="Important announcement..."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body (HTML supported)</label>
          <textarea v-model="notification.body" rows="6" placeholder="<h2>Hello!</h2><p>...</p>"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white"></textarea>
        </div>

        <button @click="send" :disabled="sending"
          class="px-6 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 disabled:opacity-50">
          {{ sending ? 'Sending...' : 'Send Notification' }}
        </button>
      </div>
    </div>

    <!-- Notification Preferences -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Automatic Notifications</h2>

      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="prefs.welcome_email" id="n-welcome" class="rounded border-gray-300 text-indigo-600" />
          <label for="n-welcome" class="text-sm text-gray-700 dark:text-gray-300">Welcome email on registration</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="prefs.inbox_expiry_warning" id="n-expiry" class="rounded border-gray-300 text-indigo-600" />
          <label for="n-expiry" class="text-sm text-gray-700 dark:text-gray-300">Inbox expiry warning (30 min before)</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="prefs.weekly_digest" id="n-digest" class="rounded border-gray-300 text-indigo-600" />
          <label for="n-digest" class="text-sm text-gray-700 dark:text-gray-300">Weekly digest for active users</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="prefs.marketing_emails" id="n-marketing" class="rounded border-gray-300 text-indigo-600" />
          <label for="n-marketing" class="text-sm text-gray-700 dark:text-gray-300">Marketing/promotional emails</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="prefs.admin_alerts" id="n-admin" class="rounded border-gray-300 text-indigo-600" />
          <label for="n-admin" class="text-sm text-gray-700 dark:text-gray-300">Admin alerts (errors, security events)</label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Alert Email</label>
          <input v-model="prefs.alert_email" placeholder="admin@throwbox.net"
            class="w-full max-w-sm rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <button @click="savePrefs" :disabled="savingPrefs"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 mt-2">
          {{ savingPrefs ? 'Saving...' : 'Save Preferences' }}
        </button>
      </div>
    </div>
  </div>
</template>
