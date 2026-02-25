<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const editingPage = ref<any>(null);
const isNew = ref(false);
const message = ref('');

onMounted(() => admin.fetchPages());

function newPage() {
  isNew.value = true;
  editingPage.value = {
    title: '',
    slug: '',
    content: '',
    is_published: false,
    meta_title: '',
    meta_description: '',
  };
}

function editPage(page: any) {
  isNew.value = false;
  editingPage.value = { ...page };
}

async function savePage() {
  if (!editingPage.value) return;
  message.value = '';
  try {
    if (isNew.value) {
      await admin.createPage(editingPage.value);
      message.value = 'Page created!';
    } else {
      await admin.updatePage(editingPage.value.id, editingPage.value);
      message.value = 'Page updated!';
    }
    editingPage.value = null;
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  }
  setTimeout(() => message.value = '', 3000);
}

async function removePage(id: string) {
  if (confirm('Delete this page?')) {
    await admin.deletePage(id);
  }
}
</script>

<template>
  <div>
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      {{ message }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <p class="text-sm text-gray-500">Manage custom pages (Privacy Policy, Terms, etc.)</p>
      <button @click="newPage"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
        New Page
      </button>
    </div>

    <!-- Pages List -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Slug</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Updated</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="page in admin.pages" :key="page.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
            <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ page.title }}</td>
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">/{{ page.slug }}</td>
            <td class="px-4 py-3">
              <span :class="[
                'px-2 py-0.5 text-xs rounded-full font-medium',
                page.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              ]">{{ page.is_published ? 'Published' : 'Draft' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ new Date(page.updated_at).toLocaleDateString() }}</td>
            <td class="px-4 py-3 flex gap-2">
              <button @click="editPage(page)" class="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
              <button @click="removePage(page.id)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
            </td>
          </tr>
          <tr v-if="!admin.pages.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">No pages yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingPage" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ isNew ? 'New Page' : 'Edit Page' }}
        </h3>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input v-model="editingPage.title"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
              <input v-model="editingPage.slug" :disabled="!isNew" placeholder="privacy-policy"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (HTML)</label>
            <textarea v-model="editingPage.content" rows="12"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white font-mono"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title</label>
              <input v-model="editingPage.meta_title"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
              <input v-model="editingPage.meta_description"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="editingPage.is_published" id="page-pub" class="rounded border-gray-300 text-indigo-600" />
            <label for="page-pub" class="text-sm text-gray-700 dark:text-gray-300">Published</label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="savePage"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save</button>
          <button @click="editingPage = null"
            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
