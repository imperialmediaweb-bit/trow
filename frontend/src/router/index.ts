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
  },
  {
    path: '/inbox/:id',
    name: 'inbox-detail',
    component: () => import('../views/InboxDetailPage.vue'),
  },
  {
    path: '/send',
    name: 'send',
    component: () => import('../views/SendPage.vue'),
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyPage.vue'),
  },
  {
    path: '/developer',
    name: 'developer',
    component: () => import('../views/DeveloperPage.vue'),
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
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
