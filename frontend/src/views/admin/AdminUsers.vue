<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin.js';

const admin = useAdminStore();
const search = ref('');
const filterRole = ref('');
const filterPlan = ref('');
const editingUser = ref<any>(null);

onMounted(() => admin.fetchUsers());

function doSearch() {
  admin.fetchUsers({ search: search.value, role: filterRole.value, plan: filterPlan.value });
}

function goToPage(page: number) {
  admin.fetchUsers({ page, search: search.value, role: filterRole.value, plan: filterPlan.value });
}

function editUser(user: any) {
  editingUser.value = { ...user };
}

async function saveUser() {
  if (!editingUser.value) return;
  await admin.updateUser(editingUser.value.id, {
    role: editingUser.value.role,
    plan: editingUser.value.plan,
    is_banned: editingUser.value.is_banned,
  });
  editingUser.value = null;
}

async function removeUser(id: string) {
  if (confirm('Are you sure you want to delete this user?')) {
    await admin.deleteUser(id);
  }
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div class="flex flex-wrap gap-3 items-center">
        <input
          v-model="search"
          @keyup.enter="doSearch"
          placeholder="Search by email or name..."
          class="flex-1 min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
        />
        <select v-model="filterRole" @change="doSearch"
          class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <select v-model="filterPlan" @change="doSearch"
          class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <button @click="doSearch"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          Search
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Plan</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Joined</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in admin.users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ user.email }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ user.display_name || '-' }}</td>
              <td class="px-4 py-3">
                <span :class="[
                  'px-2 py-0.5 text-xs rounded-full font-medium',
                  user.role === 'superadmin' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  user.role === 'admin' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                ]">{{ user.role }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="[
                  'px-2 py-0.5 text-xs rounded-full font-medium',
                  user.plan === 'business' ? 'bg-purple-100 text-purple-700' :
                  user.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-700'
                ]">{{ user.plan }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="user.is_banned" class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">Banned</span>
                <span v-else class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Active</span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </td>
              <td class="px-4 py-3 flex gap-2">
                <button @click="editUser(user)" class="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                <button @click="removeUser(user.id)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="admin.usersPagination.pages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p class="text-sm text-gray-500">
          Page {{ admin.usersPagination.page }} of {{ admin.usersPagination.pages }}
          ({{ admin.usersPagination.total }} total)
        </p>
        <div class="flex gap-1">
          <button
            v-for="p in admin.usersPagination.pages"
            :key="p"
            @click="goToPage(p)"
            :class="[
              'px-3 py-1 text-sm rounded',
              p === admin.usersPagination.page
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            ]"
          >{{ p }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingUser" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit User</h3>
        <p class="text-sm text-gray-500 mb-4">{{ editingUser.email }}</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select v-model="editingUser.role"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
            <select v-model="editingUser.plan"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="api_basic">API Basic</option>
              <option value="api_pro">API Pro</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="editingUser.is_banned" id="ban-user"
              class="rounded border-gray-300 text-indigo-600" />
            <label for="ban-user" class="text-sm text-gray-700 dark:text-gray-300">Ban this user</label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="saveUser"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save</button>
          <button @click="editingUser = null"
            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
