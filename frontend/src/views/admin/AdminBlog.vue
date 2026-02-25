<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../services/api.js';

const posts = ref<any[]>([]);
const loading = ref(false);
const editingPost = ref<any>(null);
const isNew = ref(false);
const message = ref('');

onMounted(() => fetchPosts());

async function fetchPosts() {
  loading.value = true;
  try {
    const { data } = await api.get('/blog/admin/posts');
    posts.value = data.data || [];
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
    setTimeout(() => message.value = '', 5000);
  } finally {
    loading.value = false;
  }
}

function newPost() {
  isNew.value = true;
  editingPost.value = {
    title: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    author_name: '',
    tags: '',
    is_published: false,
    meta_title: '',
    meta_description: '',
  };
}

function editPost(post: any) {
  isNew.value = false;
  editingPost.value = {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
  };
}

async function savePost() {
  if (!editingPost.value) return;
  message.value = '';
  loading.value = true;

  const payload = {
    ...editingPost.value,
    tags: editingPost.value.tags
      ? editingPost.value.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
  };

  try {
    if (isNew.value) {
      const { data } = await api.post('/blog/admin/posts', payload);
      posts.value.unshift(data.data);
      message.value = 'Post created successfully!';
    } else {
      const { data } = await api.put(`/blog/admin/posts/${editingPost.value.id}`, payload);
      const idx = posts.value.findIndex((p) => p.id === editingPost.value.id);
      if (idx !== -1) posts.value[idx] = data.data;
      message.value = 'Post updated successfully!';
    }
    editingPost.value = null;
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    loading.value = false;
  }
  setTimeout(() => message.value = '', 3000);
}

async function deletePost(id: string) {
  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
  loading.value = true;
  try {
    await api.delete(`/blog/admin/posts/${id}`);
    posts.value = posts.value.filter((p) => p.id !== id);
    message.value = 'Post deleted.';
  } catch (err: any) {
    message.value = `Error: ${err.response?.data?.error?.message || err.message}`;
  } finally {
    loading.value = false;
  }
  setTimeout(() => message.value = '', 3000);
}

function formatDate(date: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
</script>

<template>
  <div>
    <!-- Message Banner -->
    <div v-if="message" class="mb-4 px-4 py-2 rounded-lg text-sm"
      :class="message.includes('Error') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'">
      {{ message }}
    </div>

    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage blog posts, drafts, and published content.</p>
      <button @click="newPost"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
        New Post
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !posts.length" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading posts...</p>
    </div>

    <!-- Posts Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Author</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tags</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Views</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td class="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[250px] truncate">
                {{ post.title || 'Untitled' }}
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                {{ post.author_name || '-' }}
              </td>
              <td class="px-4 py-3">
                <span :class="[
                  'px-2 py-0.5 text-xs rounded-full font-medium',
                  post.is_published
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                ]">{{ post.is_published ? 'Published' : 'Draft' }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[150px] truncate">
                {{ Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || '-') }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {{ post.views ?? 0 }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {{ formatDate(post.published_at || post.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button @click="editPost(post)" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium">Edit</button>
                  <button @click="deletePost(post.id)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!posts.length && !loading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">No blog posts yet. Click "New Post" to create one.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="editingPost" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ isNew ? 'New Blog Post' : 'Edit Blog Post' }}
        </h3>

        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="editingPost.title" placeholder="Enter post title..."
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <!-- Author & Cover Image -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author Name</label>
              <input v-model="editingPost.author_name" placeholder="Author name"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
              <input v-model="editingPost.cover_image_url" placeholder="https://example.com/image.jpg"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          <!-- Excerpt -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt</label>
            <textarea v-model="editingPost.excerpt" rows="2" placeholder="Short description for listings and SEO..."
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>

          <!-- Content -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (HTML)</label>
            <textarea v-model="editingPost.content" rows="14" placeholder="Write your blog post content in HTML..."
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
            <input v-model="editingPost.tags" placeholder="e.g. announcements, product, tutorial"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <!-- Meta SEO -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title</label>
              <input v-model="editingPost.meta_title" placeholder="SEO title (optional)"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
              <input v-model="editingPost.meta_description" placeholder="SEO description (optional)"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          <!-- Published Toggle -->
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="editingPost.is_published" id="post-published"
              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label for="post-published" class="text-sm text-gray-700 dark:text-gray-300">Published</label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6">
          <button @click="savePost" :disabled="loading"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
          <button @click="editingPost = null"
            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
