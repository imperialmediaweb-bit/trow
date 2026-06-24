<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();
const loadingPlan = ref('');
const error = ref('');

const plans = [
  {
    name: 'Free',
    id: 'free',
    price: '$0',
    period: 'forever',
    features: ['3 temporary inboxes', '20 emails/day', '10 AI analyses/day', 'Public inboxes', 'Auto-expire'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    price: '$9',
    period: '/month',
    features: ['25 inboxes', '500 emails/day', 'Send 50 emails/day', '100 AI analyses', 'Writing assistant', '10 aliases', 'Forwarding', 'Priority support'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Business',
    id: 'business',
    price: '$29',
    period: '/month',
    features: ['100 inboxes', '2000 emails/day', 'Send 200 emails/day', '500 AI analyses', 'API access', '50 aliases', 'Custom domains', 'Webhooks', 'Priority support'],
    cta: 'Start Business',
    highlighted: false,
  },
];

const apiPlans = [
  { name: 'API Basic', id: 'api_basic', price: '$19/mo', features: ['600 req/min', '50 inboxes', '1000 emails/day', 'Webhooks'] },
  { name: 'API Pro', id: 'api_pro', price: '$49/mo', features: ['1500 req/min', '500 inboxes', '10000 emails/day', 'Priority support'] },
];

async function selectPlan(planId: string) {
  error.value = '';

  // Must be signed in to subscribe.
  if (!auth.isAuthenticated) {
    router.push(`/register?plan=${planId}`);
    return;
  }

  if (planId === 'free') {
    router.push('/inbox');
    return;
  }

  loadingPlan.value = planId;
  try {
    const { data } = await api.post('/billing/subscribe', { plan: planId });
    const payload = data.data;
    // Stripe configured → redirect the user to the hosted checkout page.
    if (payload?.requires_payment && payload?.checkout_url) {
      window.location.href = payload.checkout_url;
      return;
    }
    // No payment provider configured → plan was activated immediately.
    router.push('/inbox');
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || 'Could not start checkout. Please try again.';
  } finally {
    loadingPlan.value = '';
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Simple, Transparent Pricing</h1>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Start free, scale as you grow</p>
    </div>

    <div v-if="error" class="max-w-md mx-auto mb-8 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">{{ error }}</div>

    <!-- Consumer Plans -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border-2 transition-shadow hover:shadow-lg"
        :class="plan.highlighted ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 dark:border-gray-700'"
      >
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
        <div class="mt-4">
          <span class="text-4xl font-extrabold text-gray-900 dark:text-white">{{ plan.price }}</span>
          <span class="text-gray-500">{{ plan.period }}</span>
        </div>
        <ul class="mt-6 space-y-3">
          <li v-for="feature in plan.features" :key="feature" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span class="text-green-500 mr-2">+</span> {{ feature }}
          </li>
        </ul>
        <button
          @click="selectPlan(plan.id)"
          :disabled="loadingPlan === plan.id"
          class="mt-8 w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          :class="plan.highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200'"
        >
          {{ loadingPlan === plan.id ? 'Redirecting...' : plan.cta }}
        </button>
      </div>
    </div>

    <!-- API Plans -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Developer API Plans</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
      <div v-for="plan in apiPlans" :key="plan.name"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
        <p class="text-2xl font-bold text-indigo-600 mt-2">{{ plan.price }}</p>
        <ul class="mt-4 space-y-2">
          <li v-for="f in plan.features" :key="f" class="text-sm text-gray-600 dark:text-gray-400">
            <span class="text-green-500 mr-1">+</span> {{ f }}
          </li>
        </ul>
        <button
          @click="selectPlan(plan.id)"
          :disabled="loadingPlan === plan.id"
          class="mt-6 w-full py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {{ loadingPlan === plan.id ? 'Redirecting...' : 'Choose ' + plan.name }}
        </button>
      </div>
    </div>

    <!-- Enterprise -->
    <div class="mt-16 text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Enterprise</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Unlimited everything. White-label. Custom SLA. Dedicated support.</p>
      <a href="mailto:enterprise@throwbox.net"
        class="mt-4 inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700">
        Contact Sales
      </a>
    </div>
  </div>
</template>
