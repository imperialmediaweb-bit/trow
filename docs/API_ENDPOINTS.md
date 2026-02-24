# Throwbox AI - API Endpoints

Base URL: `https://api.throwbox.net/v1`

## Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new account | Public |
| POST | `/auth/login` | Login, get JWT | Public |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/auth/logout` | Invalidate tokens | JWT |
| POST | `/auth/forgot-password` | Send reset email | Public |
| POST | `/auth/reset-password` | Reset with token | Public |
| GET | `/auth/me` | Get current user | JWT |

## Inboxes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/inboxes` | Create temp inbox | Optional |
| GET | `/inboxes` | List user's inboxes | JWT |
| GET | `/inboxes/:id` | Get inbox details | JWT/Token |
| DELETE | `/inboxes/:id` | Delete inbox | JWT/Token |
| PATCH | `/inboxes/:id` | Update settings (TTL, forwarding) | JWT/Token |
| POST | `/inboxes/:id/extend` | Extend expiration | JWT/Token |
| GET | `/inboxes/:id/emails` | List emails in inbox | JWT/Token |
| GET | `/inboxes/public/:address` | Access public inbox | Public |

### Create Inbox Request
```json
{
  "domain": "throwbox.net",
  "prefix": "custom-name",       // optional, random if omitted
  "ttl": 3600,                   // seconds: 600, 3600, 86400, 604800
  "visibility": "private",       // "public" | "private"
  "forwarding": {                // optional
    "enabled": true,
    "target": "real@email.com"
  },
  "auto_reply": {                // optional, Pro+
    "enabled": true,
    "message": "Auto reply text"
  }
}
```

### Create Inbox Response
```json
{
  "id": "inbox_a1b2c3d4",
  "address": "custom-name@throwbox.net",
  "token": "tok_xxx",           // for unauthenticated access
  "expires_at": "2025-01-15T12:00:00Z",
  "visibility": "private",
  "created_at": "2025-01-15T11:00:00Z"
}
```

## Emails (Received)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/emails/:id` | Get full email | JWT/Token |
| GET | `/emails/:id/raw` | Get raw MIME source | JWT/Token |
| GET | `/emails/:id/attachments` | List attachments | JWT/Token |
| GET | `/emails/:id/attachments/:aid` | Download attachment | JWT/Token |
| DELETE | `/emails/:id` | Delete email | JWT/Token |
| POST | `/emails/:id/forward` | Forward to address | JWT |

## Emails (Sending)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/emails/send` | Send from temp address | JWT + CAPTCHA |
| POST | `/emails/send/preview` | Preview without sending | JWT |
| GET | `/emails/sent` | List sent emails | JWT |

### Send Email Request
```json
{
  "from_inbox_id": "inbox_a1b2c3d4",
  "to": ["recipient@example.com"],
  "cc": [],
  "subject": "Subject line",
  "body": "Email body text",
  "body_html": "<p>HTML body</p>",
  "attachments": ["upload_id_1"],
  "captcha_token": "hcaptcha_xxx"
}
```

## AI Services

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai/summarize` | Summarize an email | JWT |
| POST | `/ai/extract-otp` | Extract OTP/codes | JWT |
| POST | `/ai/phishing-check` | Analyze for phishing | JWT |
| POST | `/ai/compose` | AI writing assistant | JWT (Pro+) |
| POST | `/ai/grammar` | Grammar correction | JWT (Pro+) |
| POST | `/ai/tone-adjust` | Adjust email tone | JWT (Pro+) |
| POST | `/ai/privacy-score` | Calculate privacy score | JWT |

### AI Compose Request
```json
{
  "prompt": "Write a professional reply declining a meeting",
  "tone": "formal",            // "formal" | "casual" | "business" | "friendly"
  "language": "en",
  "context": {                 // optional: original email for replies
    "email_id": "email_xxx"
  },
  "max_length": 500
}
```

### AI Phishing Check Response
```json
{
  "email_id": "email_xxx",
  "phishing_score": 85,
  "confidence": 0.92,
  "indicators": [
    {"type": "suspicious_url", "detail": "Mismatched display URL and href"},
    {"type": "urgency_language", "detail": "Contains urgency triggers"},
    {"type": "sender_mismatch", "detail": "Reply-to differs from From"}
  ],
  "recommendation": "high_risk",
  "safe_links": false
}
```

## Privacy & Identity Shield

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/privacy/aliases` | List email aliases | JWT |
| POST | `/privacy/aliases` | Create new alias | JWT (Pro+) |
| DELETE | `/privacy/aliases/:id` | Remove alias | JWT |
| POST | `/privacy/leak-check` | Check email in breaches | JWT |
| POST | `/privacy/tracking-detect` | Detect tracking pixels | JWT |
| GET | `/privacy/score` | Get privacy score | JWT |
| POST | `/privacy/domain-reputation` | Check domain reputation | JWT |

### Privacy Score Response
```json
{
  "score": 72,
  "factors": {
    "email_exposure": {"score": 60, "detail": "Found in 2 breaches"},
    "tracking_blocked": {"score": 90, "detail": "Tracking pixels stripped"},
    "alias_usage": {"score": 80, "detail": "3 active aliases"},
    "encryption": {"score": 85, "detail": "TLS enforced"},
    "domain_reputation": {"score": 45, "detail": "Domain has mixed reputation"}
  },
  "recommendations": [
    "Enable forwarding through alias to reduce exposure",
    "Consider using unique alias per service"
  ]
}
```

## Developer API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/developer/api-keys` | List API keys | JWT |
| POST | `/developer/api-keys` | Create API key | JWT |
| DELETE | `/developer/api-keys/:id` | Revoke API key | JWT |
| GET | `/developer/webhooks` | List webhooks | JWT |
| POST | `/developer/webhooks` | Register webhook | JWT |
| DELETE | `/developer/webhooks/:id` | Remove webhook | JWT |
| GET | `/developer/logs` | Query API logs | JWT |
| GET | `/developer/usage` | Usage statistics | JWT |

### Webhook Events
```
inbox.created
inbox.expired
email.received
email.sent
email.bounced
ai.analysis_complete
alias.matched
```

### Webhook Payload
```json
{
  "event": "email.received",
  "timestamp": "2025-01-15T12:00:00Z",
  "data": {
    "inbox_id": "inbox_a1b2c3d4",
    "email_id": "email_xxx",
    "from": "sender@example.com",
    "subject": "Verification Code",
    "has_attachments": false
  },
  "signature": "sha256=xxx"
}
```

## Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Platform statistics | Admin JWT |
| GET | `/admin/users` | List/search users | Admin JWT |
| GET | `/admin/domains` | Manage domains | Admin JWT |
| POST | `/admin/domains` | Add sending domain | Admin JWT |
| GET | `/admin/abuse-reports` | View abuse reports | Admin JWT |
| POST | `/admin/blacklist` | Add to blacklist | Admin JWT |
| GET | `/admin/system/health` | System health check | Admin JWT |

## Billing

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/billing/plans` | List available plans | Public |
| GET | `/billing/subscription` | Current subscription | JWT |
| POST | `/billing/subscribe` | Subscribe to plan | JWT |
| POST | `/billing/cancel` | Cancel subscription | JWT |
| GET | `/billing/invoices` | List invoices | JWT |
| POST | `/billing/webhook` | Stripe webhook | Stripe Sig |

## Rate Limits

| Plan | Requests/min | Inboxes | Emails/day | AI calls/day |
|------|-------------|---------|------------|--------------|
| Free | 30 | 3 | 20 received | 10 |
| Pro ($9/mo) | 120 | 25 | 500 received, 50 sent | 100 |
| Business ($29/mo) | 300 | 100 | 2000 received, 200 sent | 500 |
| Enterprise | Custom | Unlimited | Custom | Custom |
| API Basic ($19/mo) | 600 | 50 | 1000 | 200 |
| API Pro ($49/mo) | 1500 | 500 | 10000 | 1000 |

## Common Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 150,
    "total_pages": 6
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INBOX_NOT_FOUND",
    "message": "The requested inbox does not exist or has expired",
    "status": 404
  }
}
```

## WebSocket Events (Socket.io)

Connect: `wss://ws.throwbox.net`

### Client -> Server
```
subscribe_inbox { inbox_id, token }
unsubscribe_inbox { inbox_id }
```

### Server -> Client
```
email:new { inbox_id, email_id, from, subject, preview }
email:ai_update { email_id, summary, otp_codes, phishing_score }
inbox:expiring { inbox_id, expires_in_seconds }
inbox:expired { inbox_id }
```
