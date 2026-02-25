<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  author: string;
  published_at: string;
  cover_image?: string;
}

const route = useRoute();
const post = ref<BlogPost | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const slug = route.params.slug as string;
    const res = await fetch(`/api/v1/blog/posts/${slug}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Post not found');
      throw new Error('Failed to load blog post');
    }
    const data = await res.json();
    post.value = data.post ?? data;
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
    <!-- Back link -->
    <router-link to="/blog" class="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-8">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Back to Blog
    </router-link>

    <!-- Loading -->
    <div v-if="loading" class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <router-link to="/blog" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        Return to blog
      </router-link>
    </div>

    <!-- Post Content -->
    <article v-else-if="post">
      <header class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {{ post.title }}
        </h1>
        <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ post.author }}</span>
          <span>&middot;</span>
          <time :datetime="post.published_at">{{ formatDate(post.published_at) }}</time>
        </div>
      </header>

      <div
        class="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-xl"
        v-html="post.content"
      ></div>

      <!-- Footer -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <router-link to="/blog" class="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Blog
        </router-link>
      </div>
    </article>
  </div>
</template>
