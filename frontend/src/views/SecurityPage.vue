<script setup lang="ts">
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-10">
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3">Security</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        How we protect your data and keep the Throwbox AI platform secure.
      </p>
    </div>

    <div class="space-y-10 text-gray-600 dark:text-gray-400 leading-relaxed">
      <!-- Infrastructure Security -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Infrastructure Security</h2>
        <p class="mb-4">
          Our infrastructure is built with security as a foundational requirement, not an afterthought. We deploy
          the Service on reputable cloud providers that maintain SOC 2 Type II, ISO 27001, and other
          industry-recognized certifications.
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li>All servers run in isolated virtual private cloud (VPC) environments with strict network segmentation</li>
          <li>Firewalls and security groups restrict inbound and outbound traffic to only what is necessary for operation</li>
          <li>Operating systems and dependencies are regularly patched and updated through automated pipelines</li>
          <li>Intrusion detection and monitoring systems are deployed to detect and alert on suspicious activity</li>
          <li>Automated backups are encrypted and stored in geographically separate locations</li>
          <li>Infrastructure is provisioned using infrastructure-as-code practices, ensuring consistency and auditability</li>
        </ul>
      </section>

      <!-- Data Encryption -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Encryption</h2>
        <p class="mb-4">
          Encryption is applied at every layer of the stack to ensure that your data is protected both in
          transit and at rest:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">In Transit</h3>
            <p class="text-sm">
              All connections to Throwbox AI are encrypted using TLS 1.2 or higher. We enforce HTTPS across
              all endpoints and use HSTS (HTTP Strict Transport Security) headers to prevent downgrade attacks.
              Email delivery between mail servers uses opportunistic TLS encryption wherever supported by the
              receiving server.
            </p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">At Rest</h3>
            <p class="text-sm">
              All stored data, including email content, attachments, and database records, is encrypted at rest
              using AES-256 encryption. Encryption keys are managed through a dedicated key management service
              with strict access controls and automatic key rotation policies.
            </p>
          </div>
        </div>
      </section>

      <!-- Authentication -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication</h2>
        <p class="mb-4">
          We implement robust authentication mechanisms to protect access to user accounts and administrative systems:
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li>Passwords are hashed using bcrypt with a high cost factor; plain-text passwords are never stored</li>
          <li>Session tokens are cryptographically generated, time-limited, and invalidated on logout</li>
          <li>API keys use secure random generation with scoped permissions and configurable rate limits</li>
          <li>Brute-force protection with progressive rate limiting and account lockout after repeated failed attempts</li>
          <li>Administrative access requires additional authentication controls and is logged for audit purposes</li>
          <li>Password reset tokens are single-use and expire after a short time window</li>
        </ul>
      </section>

      <!-- Vulnerability Disclosure -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Vulnerability Disclosure</h2>
        <p class="mb-4">
          We believe in responsible disclosure and welcome security researchers who help us keep the Service
          safe. If you discover a vulnerability, we ask that you follow our responsible disclosure guidelines:
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li>Report the vulnerability to us privately before making it public</li>
          <li>Provide sufficient detail for us to reproduce and understand the issue</li>
          <li>Allow us a reasonable amount of time (typically 90 days) to address the vulnerability before disclosure</li>
          <li>Do not access, modify, or delete data belonging to other users during your research</li>
          <li>Do not perform denial-of-service attacks or use automated scanning tools that could disrupt the Service</li>
        </ul>
        <p class="mt-4">
          We commit to acknowledging receipt of your report within 48 hours, providing regular updates on our
          progress, and crediting researchers who follow responsible disclosure (with their permission).
        </p>
      </section>

      <!-- Security Practices -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Security Practices</h2>
        <p class="mb-4">
          Our development and operational teams follow established security best practices throughout the
          software development lifecycle:
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li>Secure coding guidelines are enforced through code review and automated static analysis tools</li>
          <li>Dependencies are continuously monitored for known vulnerabilities and updated promptly</li>
          <li>Production access is granted on a least-privilege basis and reviewed regularly</li>
          <li>Security-relevant events (authentication, authorization, data access) are logged and monitored</li>
          <li>Regular internal security assessments and periodic third-party penetration testing are conducted</li>
          <li>An incident response plan is maintained and tested to ensure rapid and effective response to security events</li>
          <li>Employee security awareness training is conducted regularly</li>
        </ul>
      </section>

      <!-- Report a Vulnerability -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Report a Vulnerability</h2>
        <p class="mb-4">
          If you have discovered a security vulnerability in Throwbox AI, please report it to us immediately.
          We take all reports seriously and will investigate promptly.
        </p>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p class="mb-3"><strong class="text-gray-900 dark:text-white">Security Team</strong></p>
          <p class="mb-2">
            Email: <a href="mailto:security@throwbox.net" class="text-indigo-600 dark:text-indigo-400 hover:underline">security@throwbox.net</a>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            For sensitive reports, please encrypt your message using our PGP public key, which is available upon
            request at the email above. Include as much detail as possible: description of the vulnerability,
            steps to reproduce, potential impact, and any proof-of-concept code or screenshots.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
