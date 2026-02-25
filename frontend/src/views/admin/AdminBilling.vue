<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api.js';

const loading = ref(false);
const message = ref('');
const billingStats = ref<any>(null);
const subscriptions = ref<any[]>([]);
const invoices = ref<any[]>([]);
const editingSub = ref<any>(null);

onMounted(async () => {
  await Promise.all([
    fetchBillingStats(),
    fetchSubscriptions(),
  ]);
});

async function fetchBillingStats() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/billing/stats');
    billingStats.value = data.data;
    if (data.data?.invoices) {
      invoices.value = data.data.invoices;
    }
  } catch (err: any) {
    message.value = `Error loading stats: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    loading.value = false;
  }
}

async function fetchSubscriptions() {
  try {
    const { data } = await api.get('/admin/billing/subscriptions');
    subscriptions.value = data.data || [];
  } catch (err: any) {
    // Billing endpoints may not exist yet; fail silently for subscriptions
    subscriptions.value = [];
  }
}

function editSubscription(sub: any) {
  editingSub.value = { ...sub };
}

async function saveSubscription() {
  if (!editingSub.value) return;
  message.value = '';
  try {
    await api.put(`/admin/billing/subscriptions/${editingSub.value.id}`, {
      plan: editingSub.value.plan,
      status: editingSub.value.status,
    });
    const idx = subscriptions.value.findIndex((s) => s.id === editingSub.value.id);
    if (idx !== -1) {
      subscriptions.value[idx] = { ...subscriptions.value[idx], ...editingSub.value };
    }
    editingSub.value = null;
    message.value = 'Subscription updated!';
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  }
  setTimeout(() => (message.value = ''), 3000);
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const totalRevenue = computed(() => billingStats.value?.total_revenue ?? 0);
const activeSubs = computed(() => billingStats.value?.active_subscriptions ?? 0);
const mrr = computed(() => billingStats.value?.mrr ?? 0);
const churnRate = computed(() => billingStats.value?.churn_rate ?? 0);
</script>

<template>
  <div>
    <!-- Message Banner -->
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'">
      {{ message }}
    </div>

    <!-- Header -->
    <div class="mb-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">Monitor revenue, subscriptions, and billing activity.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !billingStats" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading billing data...</p>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Total Revenue -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Revenue</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalRevenue) }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <span class="text-green-600 dark:text-green-400 text-lg font-bold">$</span>
            </div>
          </div>
        </div>

        <!-- Active Subscriptions -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active Subs</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ activeSubs }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <span class="text-indigo-600 dark:text-indigo-400 text-lg font-bold">#</span>
            </div>
          </div>
        </div>

        <!-- MRR -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">MRR</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(mrr) }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <span class="text-blue-600 dark:text-blue-400 text-lg font-bold">~</span>
            </div>
          </div>
        </div>

        <!-- Churn Rate -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Churn Rate</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ churnRate.toFixed(1) }}%</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <span class="text-red-600 dark:text-red-400 text-lg font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscriptions Table -->
      <div class="mb-6">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Recent Subscriptions</h2>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Plan</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Started</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expires</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="sub in subscriptions" :key="sub.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td class="px-4 py-3 text-gray-900 dark:text-white">
                    {{ sub.user_email || sub.email || '-' }}
                  </td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'px-2 py-0.5 text-xs rounded-full font-medium',
                      sub.plan === 'business' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                      sub.plan === 'pro' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                      sub.plan === 'api_pro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                      sub.plan === 'api_basic' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    ]">{{ sub.plan }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'px-2 py-0.5 text-xs rounded-full font-medium',
                      sub.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      sub.status === 'canceled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      sub.status === 'past_due' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    ]">{{ sub.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {{ formatDate(sub.started_at || sub.created_at) }}
                  </td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {{ formatDate(sub.expires_at || sub.current_period_end) }}
                  </td>
                  <td class="px-4 py-3">
                    <button @click="editSubscription(sub)" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium">
                      Change Plan
                    </button>
                  </td>
                </tr>
                <tr v-if="!subscriptions.length">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No subscriptions found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Recent Invoices</h2>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Invoice ID</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td class="px-4 py-3 text-gray-900 dark:text-white font-mono text-xs">
                    {{ inv.id || inv.invoice_id || '-' }}
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                    {{ inv.user_email || inv.email || '-' }}
                  </td>
                  <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    {{ formatCurrency(inv.amount || inv.total) }}
                  </td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'px-2 py-0.5 text-xs rounded-full font-medium',
                      inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      inv.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    ]">{{ inv.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {{ formatDate(inv.created_at || inv.date) }}
                  </td>
                </tr>
                <tr v-if="!invoices.length">
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No invoices found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Subscription Modal -->
    <div v-if="editingSub" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Subscription</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ editingSub.user_email || editingSub.email }}</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
            <select v-model="editingSub.plan"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="api_basic">API Basic</option>
              <option value="api_pro">API Pro</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select v-model="editingSub.status"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
              <option value="trialing">Trialing</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="saveSubscription"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            Save
          </button>
          <button @click="editingSub = null"
            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
