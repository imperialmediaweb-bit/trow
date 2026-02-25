<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';

const { t } = useI18n();
const auth = useAuthStore();
const mobileMenuOpen = ref(false);

const isAdmin = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'superadmin');

const navItems = [
  { key: 'home', path: '/' },
  { key: 'inbox', path: '/inbox' },
  { key: 'send', path: '/send' },
  { key: 'privacy', path: '/privacy' },
  { key: 'api', path: '/developer' },
  { key: 'pricing', path: '/pricing' },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center space-x-2">
              <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Throwbox</span>
              <span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">AI</span>
            </router-link>

            <!-- Desktop nav -->
            <div class="hidden md:flex ml-10 space-x-4">
              <router-link
                v-for="item in navItems"
                :key="item.key"
                :to="item.path"
                class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {{ t(`nav.${item.key}`) }}
              </router-link>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <router-link v-if="isAdmin" to="/admin"
              class="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700">
              Admin
            </router-link>
            <template v-if="auth.isAuthenticated">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</span>
              <button @click="auth.logout()"
                class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                Log out
              </button>
            </template>
            <template v-else>
              <router-link to="/login"
                class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                Log in
              </router-link>
              <router-link to="/register"
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Get Started
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">throwbox.net - AI-Powered Temporary Email</p>
          <div class="flex space-x-6">
            <a href="/privacy-policy" class="text-sm text-gray-500 hover:text-gray-700">Privacy Policy</a>
            <a href="/terms" class="text-sm text-gray-500 hover:text-gray-700">Terms</a>
            <a href="/api-docs" class="text-sm text-gray-500 hover:text-gray-700">API Docs</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
