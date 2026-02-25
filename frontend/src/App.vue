<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppLayout from './layouts/AppLayout.vue';
import AdminLayout from './layouts/AdminLayout.vue';

const route = useRoute();
const isAdmin = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <AdminLayout v-if="isAdmin">
    <RouterView />
  </AdminLayout>
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>
