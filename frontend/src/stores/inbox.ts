import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api.js';

interface Inbox {
  id: string;
  address: string;
  full_address: string;
  domain: string;
  visibility: string;
  email_count: number;
  expires_at: string;
  is_active: boolean;
  token?: string;
}

interface Email {
  id: string;
  from_address: string;
  from_name?: string;
  subject: string;
  body_preview: string;
  has_attachments: boolean;
  is_read: boolean;
  created_at: string;
}

export const useInboxStore = defineStore('inbox', () => {
  const inboxes = ref<Inbox[]>([]);
  const currentInbox = ref<Inbox | null>(null);
  const emails = ref<Email[]>([]);
  const loading = ref(false);

  async function createInbox(options: {
    domain?: string;
    prefix?: string;
    ttl?: string;
    visibility?: string;
  }) {
    loading.value = true;
    try {
      const { data } = await api.post('/inboxes', options);
      const inbox = data.data;
      inboxes.value.unshift(inbox);
      return inbox;
    } finally {
      loading.value = false;
    }
  }

  async function fetchInboxes() {
    loading.value = true;
    try {
      const { data } = await api.get('/inboxes');
      inboxes.value = data.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEmails(inboxId: string) {
    loading.value = true;
    try {
      const { data } = await api.get(`/inboxes/${inboxId}/emails`);
      emails.value = data.data;
    } finally {
      loading.value = false;
    }
  }

  async function deleteInbox(id: string) {
    await api.delete(`/inboxes/${id}`);
    inboxes.value = inboxes.value.filter((i) => i.id !== id);
  }

  return { inboxes, currentInbox, emails, loading, createInbox, fetchInboxes, fetchEmails, deleteInbox };
});
