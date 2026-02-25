import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/inbox',
    name: 'inbox',
    component: () => import('../views/InboxPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/inbox/:id',
    name: 'inbox-detail',
    component: () => import('../views/InboxDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/email/:id',
    name: 'email-detail',
    component: () => import('../views/EmailDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/send',
    name: 'send',
    component: () => import('../views/SendPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/developer',
    name: 'developer',
    component: () => import('../views/DeveloperPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('../views/PricingPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterPage.vue'),
  },

  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordPage.vue'),
  },

  // ─── Admin Routes ──────────────────────────────────────────
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('../views/admin/AdminSettings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/smtp',
    name: 'admin-smtp',
    component: () => import('../views/admin/AdminSmtp.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/llm',
    name: 'admin-llm',
    component: () => import('../views/admin/AdminLlm.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: () => import('../views/admin/AdminAnalytics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/pages',
    name: 'admin-pages',
    component: () => import('../views/admin/AdminPages.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/notifications',
    name: 'admin-notifications',
    component: () => import('../views/admin/AdminNotifications.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/system',
    name: 'admin-system',
    component: () => import('../views/admin/AdminSystem.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundPage.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token');

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  if (to.meta.requiresAdmin) {
    if (!token) return next('/login');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin' && payload.role !== 'superadmin') {
        return next('/');
      }
    } catch {
      return next('/login');
    }
  }
  next();
});
