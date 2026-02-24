<script setup lang="ts">
// Developer / API page - placeholder
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Developer API</h1>

    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <h2 class="text-lg font-semibold mb-4">Quick Start</h2>
      <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto"><code># Create a temp inbox
curl -X POST https://api.throwbox.net/v1/inboxes \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ttl": "3600"}'

# List emails
curl https://api.throwbox.net/v1/inboxes/INBOX_ID/emails \
  -H "Authorization: Bearer YOUR_API_KEY"</code></pre>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">API Keys</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Manage your API keys and access tokens.</p>
        <button class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Generate Key</button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Webhooks</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Get notified when emails arrive or events occur.</p>
        <button class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Add Webhook</button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Usage</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">API calls today: 0 / 600</p>
        <p class="text-gray-600 dark:text-gray-400 text-sm">Active inboxes: 0 / 50</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Logs</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">View API request logs and debug issues.</p>
        <button class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded text-sm">View Logs</button>
      </div>
    </div>
  </div>
</template>
