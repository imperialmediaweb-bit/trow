<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useInboxStore } from '../stores/inbox.js';

const router = useRouter();
const inboxStore = useInboxStore();
const creating = ref(false);
const selectedTtl = ref('3600');

async function quickCreate() {
  creating.value = true;
  try {
    const inbox = await inboxStore.createInbox({ ttl: selectedTtl.value });
    router.push(`/inbox/${inbox.id}`);
  } finally {
    creating.value = false;
  }
}

const features = [
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>`,
    title: 'AI Inbox Assistant',
    description: 'Automatic email summaries, OTP extraction, phishing detection, and smart priority labels powered by AI.',
    color: 'from-indigo-500 to-purple-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>`,
    title: 'Send & Receive',
    description: 'Full two-way temporary email. Receive AND send emails from disposable addresses with custom expiration times.',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>`,
    title: 'Privacy Shield',
    description: 'Email aliases, data leak detection, tracking pixel blocking, and privacy scoring for total protection.',
    color: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>`,
    title: 'AI Writing Assistant',
    description: 'Compose emails with AI help. Grammar correction, tone adjustment, translations, and spam risk analysis.',
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"/></svg>`,
    title: 'Developer API',
    description: 'REST API, webhooks, CI/CD testing inboxes. Integrate temporary email into your apps and workflows.',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    icon: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21"/></svg>`,
    title: 'Enterprise Ready',
    description: 'SPF/DKIM/DMARC authentication, encryption at rest, GDPR compliance, white-label, and dedicated support.',
    color: 'from-sky-500 to-blue-600',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
];

const stats = [
  { value: '2M+', label: 'Emails Processed' },
  { value: '150K+', label: 'Users Worldwide' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'Avg Response Time' },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Full-Stack Developer at Vercel',
    avatar: 'SC',
    text: 'Throwbox AI completely changed how we handle email testing in CI/CD. The API is clean, the AI analysis catches edge cases we missed, and setup took 5 minutes.',
    rating: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Security Researcher',
    avatar: 'MR',
    text: 'The phishing detection is incredibly accurate. I use Throwbox for security audits and the AI catches sophisticated attacks that other tools miss entirely.',
    rating: 5,
  },
  {
    name: 'Elena Popescu',
    role: 'Product Manager at Stripe',
    avatar: 'EP',
    text: 'We switched from 3 different tools to just Throwbox. Temp email, AI analysis, privacy shields, and developer API all in one platform. Brilliant.',
    rating: 5,
  },
  {
    name: 'James Okonkwo',
    role: 'Indie Maker',
    avatar: 'JO',
    text: 'The free tier is genuinely useful. I protect my email on every signup now. The OTP auto-extraction saves me so much time during testing.',
    rating: 5,
  },
  {
    name: 'Yuki Tanaka',
    role: 'DevOps Lead at Shopify',
    avatar: 'YT',
    text: 'Webhooks + API + AI summarization = perfect for our automated QA pipeline. We get instant alerts when transactional emails fail our checks.',
    rating: 5,
  },
  {
    name: 'Anna Kowalski',
    role: 'Privacy Consultant',
    avatar: 'AK',
    text: 'I recommend Throwbox to all my clients. The tracking pixel blocking and leak detection give real peace of mind. GDPR compliance is a huge plus.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for personal use',
    features: ['3 temporary inboxes', '20 emails/day', '10 AI analyses', 'Auto-expire inboxes', 'Basic privacy tools'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For power users & freelancers',
    features: ['25 inboxes', '500 emails/day', 'Send 50 emails/day', '100 AI analyses', 'Writing assistant', '10 email aliases', 'Forwarding rules', 'Priority support'],
    cta: 'Start Pro Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: '$29',
    period: '/month',
    description: 'For teams & companies',
    features: ['100 inboxes', '2,000 emails/day', 'Send 200 emails/day', '500 AI analyses', 'Full API access', '50 aliases + custom domains', 'Webhooks + integrations', 'Dedicated support'],
    cta: 'Start Business Trial',
    highlighted: false,
  },
];

const blogPosts = [
  {
    title: 'Why Temporary Email is Essential for Online Privacy in 2026',
    excerpt: 'Data breaches exposed 4.1 billion records last year. Here\'s how disposable email addresses protect your digital identity.',
    category: 'Privacy',
    date: 'Feb 20, 2026',
    readTime: '5 min read',
    color: 'bg-red-100 text-red-700',
  },
  {
    title: 'How AI is Revolutionizing Email Security',
    excerpt: 'From phishing detection to smart categorization, AI is transforming how we interact with email. See how Throwbox uses Claude and GPT.',
    category: 'AI',
    date: 'Feb 15, 2026',
    readTime: '7 min read',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    title: 'Automated Email Testing with Throwbox API: A Complete Guide',
    excerpt: 'Set up end-to-end email testing in your CI/CD pipeline in under 10 minutes. Works with GitHub Actions, GitLab CI, and Jenkins.',
    category: 'Developer',
    date: 'Feb 10, 2026',
    readTime: '10 min read',
    color: 'bg-violet-100 text-violet-700',
  },
];

const howItWorks = [
  { step: '01', title: 'Generate', description: 'Create a temporary email address instantly. Choose your expiration time from 10 minutes to 7 days.' },
  { step: '02', title: 'Receive & Send', description: 'Use your temp address anywhere. Receive emails in real-time and send replies if needed.' },
  { step: '03', title: 'AI Analysis', description: 'Every email is automatically analyzed by AI for summaries, OTP codes, phishing threats, and priority.' },
  { step: '04', title: 'Auto-Expire', description: 'Your inbox and all data is permanently deleted after expiration. Zero traces left behind.' },
];
</script>

<template>
  <div>
    <!-- ═══ HERO ═══════════════════════════════════════════════ -->
    <section class="relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      <!-- Glow effects -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div class="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Logo mark -->
          <div class="inline-flex items-center gap-3 mb-8">
            <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.953 5.522a2.25 2.25 0 0 1-2.294 0L2.25 6.75" />
              </svg>
            </div>
            <span class="text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Powered by AI
            </span>
          </div>

          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Temporary Email,
            <br />
            <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Permanent Privacy
            </span>
          </h1>

          <p class="mt-8 text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            AI-powered disposable email with phishing detection, OTP extraction, and smart analysis. Protect your identity in seconds.
          </p>

          <!-- Quick Create -->
          <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <select v-model="selectedTtl"
              class="h-14 rounded-xl px-5 text-gray-900 bg-white shadow-xl border-0 focus:ring-2 focus:ring-indigo-400 text-base font-medium cursor-pointer min-w-[160px]">
              <option value="600">10 Minutes</option>
              <option value="3600">1 Hour</option>
              <option value="86400">24 Hours</option>
              <option value="604800">7 Days</option>
            </select>
            <button @click="quickCreate" :disabled="creating"
              class="h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-10 rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 text-base">
              {{ creating ? 'Creating...' : 'Generate Temp Email' }}
            </button>
          </div>

          <p class="mt-4 text-sm text-gray-500">No registration required. Free forever.</p>
        </div>
      </div>
    </section>

    <!-- ═══ STATS BAR ══════════════════════════════════════════ -->
    <section class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <p class="text-3xl font-extrabold text-gray-900 dark:text-white">{{ stat.value }}</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HOW IT WORKS ═══════════════════════════════════════ -->
    <section class="bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Simple & Fast</p>
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Get a private email address in seconds. No signup, no hassle.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="item in howItWorks" :key="item.step" class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 mb-5">
              <span class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{{ item.step }}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ item.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ FEATURES ═══════════════════════════════════════════ -->
    <section class="bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Everything You Need</p>
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white">Powerful Features</h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">More than just temporary email. A complete AI-powered privacy platform.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="feature in features" :key="feature.title"
            class="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300">
            <div :class="[feature.bgLight, 'dark:bg-opacity-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6']">
              <div :class="feature.textColor" v-html="feature.icon"></div>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">{{ feature.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ TESTIMONIALS ═══════════════════════════════════════ -->
    <section class="bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Trusted by Thousands</p>
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white">What Our Users Say</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="t in testimonials" :key="t.name"
            class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <!-- Stars -->
            <div class="flex gap-1 mb-4">
              <svg v-for="i in t.rating" :key="i" class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">"{{ t.text }}"</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ t.avatar }}</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ PRICING ════════════════════════════════════════════ -->
    <section class="bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Pricing</p>
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white">Simple, Transparent Plans</h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Start free. Upgrade when you need more.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div v-for="plan in plans" :key="plan.name"
            class="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 transition-all hover:shadow-xl"
            :class="plan.highlighted
              ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-105'
              : 'border-gray-200 dark:border-gray-700'">
            <!-- Badge -->
            <div v-if="(plan as any).badge"
              class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
              {{ (plan as any).badge }}
            </div>

            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ plan.description }}</p>

            <div class="mt-6 mb-8">
              <span class="text-5xl font-extrabold text-gray-900 dark:text-white">{{ plan.price }}</span>
              <span class="text-gray-500 ml-1">{{ plan.period }}</span>
            </div>

            <ul class="space-y-3 mb-8">
              <li v-for="f in plan.features" :key="f" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {{ f }}
              </li>
            </ul>

            <router-link to="/register"
              class="block w-full text-center py-3.5 rounded-xl font-semibold transition-all"
              :class="plan.highlighted
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'">
              {{ plan.cta }}
            </router-link>
          </div>
        </div>

        <!-- Enterprise CTA -->
        <div class="mt-16 text-center">
          <p class="text-gray-500 dark:text-gray-400 mb-2">Need more? We offer enterprise plans with unlimited everything.</p>
          <a href="mailto:enterprise@throwbox.net" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Contact Sales &rarr;</a>
        </div>
      </div>
    </section>

    <!-- ═══ BLOG ═══════════════════════════════════════════════ -->
    <section class="bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-12">
          <div>
            <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">From The Blog</p>
            <h2 class="text-4xl font-bold text-gray-900 dark:text-white">Latest Posts</h2>
          </div>
          <a href="/blog" class="hidden sm:block text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View all posts &rarr;</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article v-for="post in blogPosts" :key="post.title"
            class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow group cursor-pointer">
            <!-- Colored header area -->
            <div class="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center p-6">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white text-center leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ post.title }}
              </h3>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-3">
                <span :class="[post.color, 'text-xs font-semibold px-2.5 py-0.5 rounded-full']">{{ post.category }}</span>
                <span class="text-xs text-gray-400">{{ post.date }}</span>
                <span class="text-xs text-gray-400">{{ post.readTime }}</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ post.excerpt }}</p>
              <p class="mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">Read more &rarr;</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══ FINAL CTA ══════════════════════════════════════════ -->
    <section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0); background-size: 32px 32px;"></div>
      </div>
      <div class="relative max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl sm:text-5xl font-extrabold text-white mb-6">
          Ready to Protect Your Inbox?
        </h2>
        <p class="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
          Join 150,000+ users who trust Throwbox AI for private, AI-powered temporary email. Get started in seconds.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <router-link to="/register"
            class="h-14 inline-flex items-center bg-white text-indigo-700 font-bold px-10 rounded-xl shadow-xl hover:bg-indigo-50 hover:scale-[1.02] transition-all text-lg">
            Get Started Free
          </router-link>
          <router-link to="/developer"
            class="h-14 inline-flex items-center border-2 border-white/30 text-white font-semibold px-10 rounded-xl hover:bg-white/10 transition-all text-lg">
            View API Docs
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
