<script setup lang="ts">
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Hero -->
    <section class="text-center py-12">
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">We're Hiring</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        Join our team and help build the future of private, AI-powered email.
      </p>
    </section>

    <!-- Culture -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Our Culture</h2>
      <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
        Throwbox AI is a remote-first company that values autonomy, transparency, and meaningful work. We believe
        the best products are built by small, focused teams that care deeply about the problems they are solving.
        Our team spans multiple time zones, and we communicate asynchronously by default so that everyone can do
        their best work on their own schedule.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Remote First</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Work from anywhere in the world. We care about what you deliver, not where you sit.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Ship Fast</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Small teams, fast iterations, real impact. We ship frequently and learn from users.
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Privacy Matters</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            We are passionate about building tools that protect people's privacy and digital identity.
          </p>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">What We Offer</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Competitive Compensation</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Salary benchmarked against industry standards with equity options</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Flexible Schedule</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Work the hours that make sense for you and your time zone</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Health & Wellness</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Health insurance, mental health support, and wellness stipend</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Learning Budget</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Annual stipend for courses, conferences, and professional development</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Equipment Stipend</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Budget to set up your ideal home office workspace</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span class="text-green-500 mt-0.5 font-bold">+</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Generous PTO</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Flexible time off policy plus company-wide recharge weeks</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Open Positions -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Open Positions</h2>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No open positions right now</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          We do not have any specific roles listed at the moment, but we are always interested in hearing from
          talented people who are passionate about privacy and AI.
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          Send your resume and a brief note about what excites you to
        </p>
        <a href="mailto:careers@throwbox.net" class="inline-block mt-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all">
          careers@throwbox.net
        </a>
      </div>
    </section>
  </div>
</template>
