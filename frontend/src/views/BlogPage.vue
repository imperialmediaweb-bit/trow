<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  published_at: string;
  cover_image?: string;
}

const posts = ref<BlogPost[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/blog/posts');
    if (!res.ok) throw new Error('Failed to load blog posts');
    const data = await res.json();
    posts.value = data.posts ?? data ?? [];
  } catch (e: any) {
    error.value = e.message || 'Something went wrong';
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-10">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3">Blog</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        News, updates, and insights from the Throwbox AI team.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="posts.length === 0" class="text-center py-16">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h2>
      <p class="text-gray-500 dark:text-gray-400">We are working on some great content. Check back soon!</p>
    </div>

    <!-- Posts List -->
    <div v-else class="space-y-6">
      <router-link
        v-for="post in posts"
        :key="post.id"
        :to="{ name: 'blog-post', params: { slug: post.slug } }"
        class="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600">
          {{ post.title }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
          {{ post.excerpt }}
        </p>
        <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          <span>{{ post.author }}</span>
          <span>&middot;</span>
          <time :datetime="post.published_at">{{ formatDate(post.published_at) }}</time>
        </div>
      </router-link>
    </div>
  </div>
</template>
