import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import { router } from './router/index.js';
import './assets/main.css';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      app: { name: 'Throwbox AI', tagline: 'AI-Powered Temporary Email & Privacy' },
      nav: { home: 'Home', inbox: 'Inbox', send: 'Send', privacy: 'Privacy', api: 'API', pricing: 'Pricing' },
      inbox: { create: 'Create Inbox', expires: 'Expires', emails: 'Emails', empty: 'No emails yet' },
      actions: { copy: 'Copy', delete: 'Delete', extend: 'Extend', refresh: 'Refresh' },
    },
    ro: {
      app: { name: 'Throwbox AI', tagline: 'Email Temporar cu AI si Confidentialitate' },
      nav: { home: 'Acasa', inbox: 'Inbox', send: 'Trimite', privacy: 'Confidentialitate', api: 'API', pricing: 'Preturi' },
      inbox: { create: 'Creeaza Inbox', expires: 'Expira', emails: 'Emailuri', empty: 'Niciun email inca' },
      actions: { copy: 'Copiaza', delete: 'Sterge', extend: 'Extinde', refresh: 'Reincarca' },
    },
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
