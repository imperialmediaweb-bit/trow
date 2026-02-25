<script setup lang="ts">
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Hero Section -->
    <section class="text-center py-12">
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.953 5.522a2.25 2.25 0 0 1-2.294 0L2.25 6.75" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">About Throwbox AI</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        We believe everyone deserves a private, spam-free inbox. Throwbox AI combines disposable email addresses
        with intelligent AI analysis to give you control over your digital identity.
      </p>
    </section>

    <!-- Mission -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
      <p class="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
        The average person receives over 120 emails per day, and a significant portion of those are unsolicited
        marketing, spam, or outright scams. Every time you share your real email address with a website, you risk
        exposing yourself to data breaches, phishing attacks, and relentless spam. Throwbox AI was built to solve
        this problem by providing temporary, disposable email addresses powered by artificial intelligence that
        can summarize, categorize, and protect your communications automatically.
      </p>
    </section>

    <!-- Values / Features -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">What We Stand For</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Privacy First -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Your privacy is not a feature -- it is the foundation of everything we build. We never sell your data,
            never track your browsing habits, and automatically delete temporary emails after their retention period expires.
          </p>
        </div>

        <!-- AI-Powered -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Our AI engine automatically summarizes incoming emails, detects phishing attempts, categorizes messages,
            and helps you compose replies -- saving you time while keeping you safe.
          </p>
        </div>

        <!-- Open -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.592L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Open & Transparent</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            We are committed to transparency in how we operate. Our API is publicly documented, our pricing is straightforward,
            and we publish regular updates about our security practices and infrastructure.
          </p>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Team</h2>
      <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        Throwbox AI is built by a small, distributed team of engineers, designers, and privacy advocates
        who are passionate about building tools that respect user autonomy. We come from backgrounds in
        cybersecurity, machine learning, and product design, united by a shared belief that privacy
        should be accessible to everyone -- not just the technically savvy.
      </p>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-gray-500 dark:text-gray-400 text-sm text-center italic">
          We are a growing team. Interested in joining us?
          <router-link to="/careers" class="text-indigo-600 dark:text-indigo-400 hover:underline">Check out our careers page.</router-link>
        </p>
      </div>
    </section>

    <!-- Contact -->
    <section class="py-12 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">General Inquiries</h3>
          <a href="mailto:contact@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">contact@throwbox.net</a>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Press & Media</h3>
          <a href="mailto:press@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">press@throwbox.net</a>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Enterprise Sales</h3>
          <a href="mailto:enterprise@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">enterprise@throwbox.net</a>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Security Issues</h3>
          <a href="mailto:security@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">security@throwbox.net</a>
        </div>
      </div>
    </section>
  </div>
</template>
