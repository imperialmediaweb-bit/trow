# Throwbox AI - Security Risk Analysis & Mitigation

## 1. Critical Risks

### 1.1 Abuse for Spam/Phishing
**Risk Level**: CRITICAL
**Description**: Attackers use throwbox.net addresses to send spam or phishing emails, getting the domain blacklisted.

**Mitigations**:
- Send functionality only for authenticated + paid users (Pro+)
- hCaptcha on all send operations
- AI spam risk analysis before sending (score > 80 = blocked)
- Rate limiting: 50 sends/day (Pro), 200/day (Business)
- IP reputation monitoring (MXToolbox, blacklist checks)
- Abuse reporting system
- Manual review queue for flagged accounts
- DKIM signing + strict DMARC (p=reject)
- Dedicated sending IPs with warm-up process
- Immediate suspension for abuse reports

### 1.2 Domain Reputation Damage
**Risk Level**: CRITICAL
**Description**: throwbox.net gets blacklisted on major email providers (Gmail, Outlook).

**Mitigations**:
- Separate sending IPs from receiving infrastructure
- Multiple sending domains (rotate if one gets flagged)
- IP warm-up protocol before production sending
- Daily blacklist monitoring (Spamhaus, Barracuda, etc.)
- Feedback loop registration with major ISPs
- Low bounce rate enforcement (suspend accounts with > 5% bounce)
- Postmaster tools monitoring (Google, Microsoft)

### 1.3 Data Breach / Email Content Exposure
**Risk Level**: HIGH
**Description**: Unauthorized access to stored email content.

**Mitigations**:
- AES-256-GCM encryption for all email bodies at rest
- Encryption keys managed separately from database
- Attachments encrypted in S3
- TLS 1.3 enforced for all connections
- Database access restricted to API servers only
- No plaintext logging of email content
- Short TTL = less data at risk at any time
- Auto-delete after expiry (no long-term storage)
- Regular security audits

---

## 2. High Risks

### 2.1 Authentication Attacks
**Risk Level**: HIGH
**Description**: Brute force, credential stuffing, token theft.

**Mitigations**:
- bcrypt with cost factor 12
- JWT with RS256 (asymmetric)
- 15-minute access token TTL
- Refresh token rotation (single-use)
- Rate limiting on auth endpoints (5 attempts/min)
- Account lockout after 10 failed attempts
- IP-based throttling
- Optional 2FA (TOTP)

### 2.2 API Abuse
**Risk Level**: HIGH
**Description**: Automated creation of thousands of inboxes, scraping, resource exhaustion.

**Mitigations**:
- Tiered rate limiting (30-1500 req/min based on plan)
- Redis sliding window rate limiter
- hCaptcha for anonymous inbox creation (after first 3)
- API key scoping (read/write/admin)
- Request size limits (10MB max body)
- Concurrent connection limits
- Behavioral analysis (flag patterns: rapid creation, never reading emails)
- IP reputation scoring
- Cloudflare Bot Management

### 2.3 Cross-Site Scripting (XSS) via Email Content
**Risk Level**: HIGH
**Description**: Malicious HTML in email bodies executes in user's browser.

**Mitigations**:
- Sanitize all HTML email content before rendering (DOMPurify)
- Email HTML rendered in sandboxed iframe
- Strict CSP headers
- Strip dangerous tags: `<script>`, `<iframe>`, `<object>`, `<embed>`
- Neutralize event handlers (onclick, onerror, etc.)
- Rewrite all links to pass through warning interstitial
- Block external image loading by default (tracking protection)

### 2.4 SMTP Injection / Header Injection
**Risk Level**: HIGH
**Description**: Attackers inject SMTP headers or commands through user input.

**Mitigations**:
- Strict input validation on all email fields (Zod schemas)
- Reject addresses with newlines, null bytes
- Use nodemailer (handles escaping) instead of raw SMTP
- Validate email addresses server-side
- Subject line length limit (500 chars)
- Body size limit (50KB text, 100KB HTML)

---

## 3. Medium Risks

### 3.1 Denial of Service
**Risk Level**: MEDIUM
**Description**: Application-level DoS via expensive operations.

**Mitigations**:
- Cloudflare WAF + DDoS protection
- Rate limiting at every layer
- Queue-based processing (BullMQ) with concurrency limits
- AI worker with rate limiter (10 calls/sec max)
- Connection pooling (PostgreSQL max 20)
- Timeouts on all external calls (10s AI, 5s DB)
- Health check + auto-restart

### 3.2 Webhook SSRF
**Risk Level**: MEDIUM
**Description**: User-registered webhooks used to probe internal network.

**Mitigations**:
- Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x)
- Block localhost and link-local addresses
- DNS resolution validation before HTTP call
- Timeout on webhook delivery (5s)
- Follow max 2 redirects
- Webhook URL must be HTTPS
- Log all webhook attempts

### 3.3 IDOR (Insecure Direct Object Reference)
**Risk Level**: MEDIUM
**Description**: User accesses another user's inbox/email by guessing UUIDs.

**Mitigations**:
- UUIDv4 (122 bits of entropy, impractical to guess)
- Ownership check on every resource access
- Access token required for non-authenticated inbox access
- No sequential IDs anywhere
- Audit logging on all access

### 3.4 AI Prompt Injection
**Risk Level**: MEDIUM
**Description**: Email content manipulates AI analysis results.

**Mitigations**:
- AI prompts use structured format, content in separate section
- Validate AI output format (JSON schema)
- AI results are advisory only (never trigger automated actions)
- Log all AI interactions for audit
- Fallback to regex-based analysis if AI returns anomalous results
- Content truncated to 4000 chars for AI analysis

---

## 4. GDPR Compliance

### Data Processing
- Email content encrypted at rest
- Auto-deletion based on TTL (no indefinite storage)
- User can delete account and all data immediately
- No email content shared with third parties (except AI providers for analysis)
- Data Processing Agreement with AI providers
- Clear privacy policy explaining data flow

### User Rights
- Right to access: Export all data via API
- Right to erasure: Delete account endpoint
- Right to portability: JSON export
- Right to object: Opt-out of AI analysis

### Technical Controls
- Audit log of all data access
- Encryption at rest and in transit
- Minimal data collection
- No analytics tracking without consent
- Cookie consent banner (only essential cookies by default)

---

## 5. Security Checklist for Launch

- [ ] All secrets in environment variables (never in code)
- [ ] HTTPS everywhere (HSTS header)
- [ ] CSP headers configured
- [ ] CORS restricted to throwbox.net origins
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints (Zod)
- [ ] SQL injection prevention (parameterized queries via pg)
- [ ] XSS prevention (HTML sanitization)
- [ ] CSRF tokens for state-changing operations
- [ ] Secure session management
- [ ] Password hashing (bcrypt, cost 12)
- [ ] JWT RS256 with short TTL
- [ ] File upload restrictions (type, size)
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] Security headers (Helmet.js)
- [ ] Error messages don't leak internals
- [ ] Logging without sensitive data
- [ ] Regular dependency updates
- [ ] Penetration testing before launch
