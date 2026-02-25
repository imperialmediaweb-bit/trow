<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const saving = ref(false);
const testing = ref('');
const message = ref('');

const llm = ref({
  primary_provider: 'claude',
  providers: {
    claude: { enabled: true, api_key: '', model: 'claude-sonnet-4-20250514' },
    openai: { enabled: false, api_key: '', model: 'gpt-4o-mini' },
    google: { enabled: false, api_key: '', model: 'gemini-pro' },
  },
  fallback_provider: 'openai',
  max_tokens: 1024,
  rate_limit_per_user: 100,
});

const providerMeta: Record<string, { name: string; models: string[]; color: string }> = {
  claude: {
    name: 'Anthropic Claude',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514'],
    color: 'bg-orange-500',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    color: 'bg-green-500',
  },
  google: {
    name: 'Google AI',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
    color: 'bg-blue-500',
  },
};

onMounted(async () => {
  await admin.fetchSettings();
  if (admin.settings?.llm) {
    llm.value = { ...llm.value, ...admin.settings.llm };
  }
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    await admin.saveSettings('llm', llm.value);
    message.value = 'LLM settings saved!';
  } catch {
    message.value = 'Error saving LLM settings';
  } finally {
    saving.value = false;
    setTimeout(() => message.value = '', 3000);
  }
}

async function testProvider(provider: string) {
  const cfg = llm.value.providers[provider as keyof typeof llm.value.providers];
  if (!cfg.api_key) {
    message.value = `Please enter an API key for ${providerMeta[provider].name}`;
    return;
  }
  testing.value = provider;
  message.value = '';
  try {
    const result = await admin.testLlm({ provider, api_key: cfg.api_key, model: cfg.model });
    message.value = result.success
      ? `${providerMeta[provider].name}: ${result.data.response}`
      : `Error: ${result.error?.message}`;
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    testing.value = '';
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      {{ message }}
    </div>

    <!-- Global LLM settings -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI / LLM Configuration</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Provider</label>
          <select v-model="llm.primary_provider"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
            <option value="claude">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google AI</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fallback Provider</label>
          <select v-model="llm.fallback_provider"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
            <option value="claude">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google AI</option>
            <option value="">None</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Tokens</label>
          <input v-model.number="llm.max_tokens" type="number"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate Limit / User (per day)</label>
          <input v-model.number="llm.rate_limit_per_user" type="number"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
      </div>
    </div>

    <!-- Provider Cards -->
    <div class="space-y-4">
      <div v-for="(meta, key) in providerMeta" :key="key"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="[meta.color, 'w-10 h-10 rounded-lg flex items-center justify-center']">
              <span class="text-white text-sm font-bold">{{ meta.name[0] }}</span>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ meta.name }}</h3>
              <p class="text-xs text-gray-500">
                {{ key === llm.primary_provider ? 'Primary' : key === llm.fallback_provider ? 'Fallback' : 'Inactive' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="llm.providers[key as keyof typeof llm.providers].enabled"
              :id="`enable-${key}`" class="rounded border-gray-300 text-indigo-600" />
            <label :for="`enable-${key}`" class="text-sm text-gray-700 dark:text-gray-300">Enabled</label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
            <input v-model="llm.providers[key as keyof typeof llm.providers].api_key"
              type="password" autocomplete="off" placeholder="sk-..."
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
            <select v-model="llm.providers[key as keyof typeof llm.providers].model"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
              <option v-for="m in meta.models" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <button @click="testProvider(key)" :disabled="testing === key"
            class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50">
            {{ testing === key ? 'Testing...' : 'Test Connection' }}
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <button @click="save" :disabled="saving"
        class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
        {{ saving ? 'Saving...' : 'Save All LLM Settings' }}
      </button>
    </div>
  </div>
</template>
