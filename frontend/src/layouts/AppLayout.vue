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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <router-link to="/" class="flex items-center gap-2.5">
              <div class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.953 5.522a2.25 2.25 0 0 1-2.294 0L2.25 6.75" />
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-900 dark:text-white">Throwbox</span>
              <span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">AI</span>
            </router-link>

            <!-- Desktop nav -->
            <div class="hidden md:flex ml-10 space-x-1">
              <router-link
                v-for="item in navItems"
                :key="item.key"
                :to="item.path"
                class="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {{ t(`nav.${item.key}`) }}
              </router-link>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-3">
            <router-link v-if="isAdmin" to="/admin"
              class="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
              Admin
            </router-link>
            <template v-if="auth.isAuthenticated">
              <span class="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</span>
              <button @click="auth.logout()"
                class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                Log out
              </button>
            </template>
            <template v-else>
              <router-link to="/login"
                class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                Log in
              </router-link>
              <router-link to="/register"
                class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                Get Started
              </router-link>
            </template>

            <!-- Mobile menu button -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700 py-3">
          <router-link v-for="item in navItems" :key="item.key" :to="item.path"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
            {{ t(`nav.${item.key}`) }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- ═══ FOOTER ═══════════════════════════════════════════ -->
    <footer class="bg-gray-900 text-gray-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Top section -->
        <div class="py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <div class="flex items-center gap-2.5 mb-4">
              <div class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.953 5.522a2.25 2.25 0 0 1-2.294 0L2.25 6.75" />
                </svg>
              </div>
              <span class="text-lg font-bold text-white">Throwbox AI</span>
            </div>
            <p class="text-sm leading-relaxed text-gray-500 max-w-xs">
              AI-powered temporary email and privacy platform. Protect your inbox and identity with disposable addresses.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul class="space-y-3">
              <li><router-link to="/inbox" class="text-sm hover:text-white transition-colors">Temp Email</router-link></li>
              <li><router-link to="/send" class="text-sm hover:text-white transition-colors">Send Email</router-link></li>
              <li><router-link to="/privacy" class="text-sm hover:text-white transition-colors">Privacy Tools</router-link></li>
              <li><router-link to="/developer" class="text-sm hover:text-white transition-colors">API</router-link></li>
              <li><router-link to="/pricing" class="text-sm hover:text-white transition-colors">Pricing</router-link></li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul class="space-y-3">
              <li><a href="/about" class="text-sm hover:text-white transition-colors">About</a></li>
              <li><a href="/blog" class="text-sm hover:text-white transition-colors">Blog</a></li>
              <li><a href="/careers" class="text-sm hover:text-white transition-colors">Careers</a></li>
              <li><a href="mailto:press@throwbox.net" class="text-sm hover:text-white transition-colors">Press</a></li>
              <li><a href="mailto:enterprise@throwbox.net" class="text-sm hover:text-white transition-colors">Enterprise</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul class="space-y-3">
              <li><a href="/privacy-policy" class="text-sm hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" class="text-sm hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/gdpr" class="text-sm hover:text-white transition-colors">GDPR</a></li>
              <li><a href="/security" class="text-sm hover:text-white transition-colors">Security</a></li>
              <li><a href="/abuse" class="text-sm hover:text-white transition-colors">Report Abuse</a></li>
            </ul>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-gray-800 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-500">&copy; 2026 Throwbox AI. All rights reserved.</p>
          <div class="flex items-center gap-5">
            <!-- Twitter/X -->
            <a href="#" class="text-gray-500 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <!-- GitHub -->
            <a href="#" class="text-gray-500 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            </a>
            <!-- Discord -->
            <a href="#" class="text-gray-500 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
