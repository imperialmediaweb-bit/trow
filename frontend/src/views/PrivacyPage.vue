<script setup lang="ts">
// Privacy & Identity Shield page - placeholder
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Privacy & Identity Shield</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Email Aliases</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Create unique aliases for each service. Forward to your real email.</p>
        <button class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Create Alias</button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Leak Detection</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Check if your email appeared in known data breaches.</p>
        <button class="bg-red-600 text-white px-4 py-2 rounded text-sm">Check Email</button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Privacy Score</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Your overall privacy health score: 0-100.</p>
        <div class="text-4xl font-bold text-green-500">--</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2">Tracking Protection</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Tracking pixels and spy links are blocked automatically.</p>
        <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
      </div>
    </div>
  </div>
</template>
