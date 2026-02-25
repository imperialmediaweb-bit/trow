<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const activeTab = ref('homepage');
const saving = ref(false);
const message = ref('');

const homepage = ref({
  title: 'Throwbox AI',
  subtitle: 'AI-Powered Temporary Email & Privacy Platform',
  description: 'Receive, send, and analyze emails with built-in AI intelligence.',
  cta_text: 'Generate Temp Email',
  show_features: true,
});

const branding = ref({
  logo_url: '',
  favicon_url: '',
  primary_color: '#4f46e5',
  app_name: 'Throwbox AI',
  footer_text: 'throwbox.net - AI-Powered Temporary Email',
});

const general = ref({
  maintenance_mode: false,
  registration_enabled: true,
  max_free_inboxes: 3,
  max_free_emails_per_day: 20,
  default_inbox_ttl: 3600,
  allowed_domains: 'throwbox.net',
});

onMounted(async () => {
  await admin.fetchSettings();
  if (admin.settings) {
    homepage.value = { ...homepage.value, ...admin.settings.homepage };
    branding.value = { ...branding.value, ...admin.settings.branding };
    general.value = { ...general.value, ...admin.settings.general };
  }
});

async function save(section: string) {
  saving.value = true;
  message.value = '';
  try {
    const data = section === 'homepage' ? homepage.value
      : section === 'branding' ? branding.value
      : general.value;
    await admin.saveSettings(section, data);
    message.value = `${section} settings saved successfully!`;
  } catch {
    message.value = 'Error saving settings';
  } finally {
    saving.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}
</script>

<template>
  <div>
    <!-- Success message -->
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      {{ message }}
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
      <button v-for="tab in ['homepage', 'branding', 'general']" :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
          activeTab === tab
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        ]">
        {{ tab }}
      </button>
    </div>

    <!-- Homepage Settings -->
    <div v-if="activeTab === 'homepage'"
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Homepage Settings</h2>
      <div class="space-y-4 max-w-xl">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input v-model="homepage.title" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle</label>
          <input v-model="homepage.subtitle" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea v-model="homepage.description" rows="3" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Button Text</label>
          <input v-model="homepage.cta_text" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="homepage.show_features" id="show-features" class="rounded border-gray-300 text-indigo-600" />
          <label for="show-features" class="text-sm text-gray-700 dark:text-gray-300">Show features section</label>
        </div>
        <button @click="save('homepage')" :disabled="saving"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Save Homepage' }}
        </button>
      </div>
    </div>

    <!-- Branding Settings -->
    <div v-if="activeTab === 'branding'"
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branding</h2>
      <div class="space-y-4 max-w-xl">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label>
          <input v-model="branding.app_name" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
          <input v-model="branding.logo_url" placeholder="https://..." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favicon URL</label>
          <input v-model="branding.favicon_url" placeholder="https://..." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="branding.primary_color" class="h-10 w-16 rounded cursor-pointer" />
            <input v-model="branding.primary_color" class="w-28 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Footer Text</label>
          <input v-model="branding.footer_text" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <button @click="save('branding')" :disabled="saving"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Save Branding' }}
        </button>
      </div>
    </div>

    <!-- General Settings -->
    <div v-if="activeTab === 'general'"
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h2>
      <div class="space-y-4 max-w-xl">
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="general.maintenance_mode" id="maint" class="rounded border-gray-300 text-red-600" />
          <label for="maint" class="text-sm text-gray-700 dark:text-gray-300">Maintenance Mode</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="general.registration_enabled" id="reg" class="rounded border-gray-300 text-indigo-600" />
          <label for="reg" class="text-sm text-gray-700 dark:text-gray-300">Registration Enabled</label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Free Inboxes</label>
          <input v-model.number="general.max_free_inboxes" type="number" class="w-32 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Free Emails/Day</label>
          <input v-model.number="general.max_free_emails_per_day" type="number" class="w-32 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Inbox TTL (seconds)</label>
          <input v-model.number="general.default_inbox_ttl" type="number" class="w-32 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed Mail Domains</label>
          <input v-model="general.allowed_domains" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          <p class="text-xs text-gray-400 mt-1">Comma-separated list of domains</p>
        </div>
        <button @click="save('general')" :disabled="saving"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Save General' }}
        </button>
      </div>
    </div>
  </div>
</template>
