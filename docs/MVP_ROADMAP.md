# Throwbox AI - MVP Roadmap (90 Days)

## Phase 1: Foundation (Days 1-30)

### Week 1-2: Core Infrastructure
- [ ] Set up Git repo, CI/CD (GitHub Actions)
- [ ] Docker Compose local development environment
- [ ] PostgreSQL schema + migrations
- [ ] Redis configuration
- [ ] Express.js API boilerplate with TypeScript
- [ ] JWT authentication (register, login, refresh, logout)
- [ ] Basic rate limiting
- [ ] Health check endpoints
- [ ] Logging (Winston)
- [ ] Deploy staging server (Hetzner CX41)

### Week 3-4: Temp Email Core (Receive)
- [ ] Inbox creation (random + custom address)
- [ ] Domain management (throwbox.net primary domain)
- [ ] MX record configuration
- [ ] Haraka SMTP server setup for inbound mail
- [ ] MIME parsing (mailparser)
- [ ] Email storage with encryption (AES-256-GCM)
- [ ] TTL system: 10min / 1h / 24h / 7d
- [ ] Auto-expiry cron job
- [ ] Inbox access via token (no auth required)
- [ ] Public inbox option
- [ ] WebSocket for real-time email notifications

**Milestone 1**: Users can create temp inboxes and receive emails in real-time.

---

## Phase 2: Intelligence (Days 31-60)

### Week 5-6: AI Integration
- [ ] Claude API integration (primary)
- [ ] OpenAI fallback
- [ ] AI email analysis pipeline:
  - Email summarization
  - OTP code extraction (regex + AI)
  - Phishing/scam detection with confidence score
  - Priority labeling (high/medium/low/spam)
  - Category tagging
- [ ] BullMQ worker for async AI processing
- [ ] AI analysis stored per email
- [ ] AI results pushed via WebSocket

### Week 7-8: Send + Privacy
- [ ] Outbound email sending via Postal
- [ ] SPF/DKIM signing
- [ ] Send rate limiting (plan-based)
- [ ] hCaptcha integration
- [ ] AI spam risk check before sending
- [ ] Basic email forwarding
- [ ] Email alias creation (Pro feature)
- [ ] Tracking pixel detection + stripping
- [ ] Privacy score calculation

**Milestone 2**: Full receive + send + AI analysis working. Privacy features live.

---

## Phase 3: Product (Days 61-90)

### Week 9-10: Frontend Polish
- [ ] Vue 3 SPA complete with all views
- [ ] Responsive design (mobile-first)
- [ ] Dark mode
- [ ] Real-time inbox updates
- [ ] Email detail view with AI insights panel
- [ ] Compose/send interface with AI writing assistant
- [ ] Privacy dashboard
- [ ] Settings page
- [ ] i18n (English + Romanian)

### Week 11-12: Monetization + Launch
- [ ] Stripe integration (subscriptions)
- [ ] Plan enforcement (Free/Pro/Business limits)
- [ ] Developer API key management
- [ ] Webhook system
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Landing page SEO optimization
- [ ] Legal pages (Privacy Policy, Terms, GDPR)
- [ ] Production deployment
- [ ] DNS configuration (throwbox.net)
- [ ] SSL certificates
- [ ] Monitoring (Uptime Robot + Sentry)
- [ ] Launch on ProductHunt / Hacker News

**Milestone 3**: Production-ready SaaS with monetization.

---

## Post-MVP (Months 4-6)

- Multi-domain support (tmpmail.dev, privbox.io)
- AI writing assistant improvements
- Leak detection API integration (HIBP)
- Browser extension
- Mobile app (React Native / Flutter)
- White-label offering
- Enterprise self-hosted option
- Advanced abuse detection (ML-based)
- AI visibility module (brand monitoring)
- Custom domain support for Business/Enterprise

---

## Development Priorities (Ranked)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Inbox creation + receive email | Core product value |
| P0 | Real-time WebSocket updates | Key differentiator from static temp mail |
| P0 | TTL/auto-expiry | Privacy promise |
| P1 | AI email analysis | Primary differentiator |
| P1 | OTP extraction | #1 use case for temp email |
| P1 | User auth + JWT | Required for personalization |
| P1 | Phishing detection | Safety feature |
| P2 | Send email | Revenue driver (Pro feature) |
| P2 | Stripe billing | Revenue |
| P2 | AI writing assistant | Pro feature, retention |
| P2 | API + webhooks | Developer market |
| P3 | Privacy aliases | Niche but valuable |
| P3 | Tracking detection | Differentiator |
| P3 | Multi-domain | Scale |
| P4 | AI visibility module | Future revenue stream |
| P4 | White-label | Enterprise revenue |
