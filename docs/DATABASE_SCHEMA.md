# Throwbox AI - Database Schema

## PostgreSQL 16

### Entity Relationship Overview

```
users 1---* inboxes 1---* emails
  |                         |
  |                     email_attachments
  |                         |
  +---* api_keys        email_ai_analysis
  |
  +---* aliases
  |
  +---* subscriptions ---* invoices
  |
  +---* webhooks
  |
  +---* audit_logs

domains (system-level)
blacklists (system-level)
abuse_reports
```

---

## Core Tables

### users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,          -- nullable for anonymous
    password_hash   VARCHAR(255),
    display_name    VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'user',   -- user, admin, superadmin
    plan            VARCHAR(20) DEFAULT 'free',   -- free, pro, business, enterprise
    email_verified  BOOLEAN DEFAULT false,
    two_factor      BOOLEAN DEFAULT false,
    totp_secret     VARCHAR(255),
    locale          VARCHAR(5) DEFAULT 'en',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
```

### domains
```sql
CREATE TABLE domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain          VARCHAR(255) UNIQUE NOT NULL,  -- throwbox.net, tmpmail.dev
    mx_verified     BOOLEAN DEFAULT false,
    spf_record      TEXT,
    dkim_selector   VARCHAR(100),
    dkim_private    TEXT,                           -- encrypted
    dkim_public     TEXT,
    dmarc_policy    VARCHAR(20) DEFAULT 'reject',
    is_active       BOOLEAN DEFAULT true,
    is_premium      BOOLEAN DEFAULT false,          -- premium domains for paid plans
    max_inboxes     INTEGER DEFAULT 0,              -- 0 = unlimited
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### inboxes
```sql
CREATE TABLE inboxes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    domain_id       UUID REFERENCES domains(id) NOT NULL,
    address         VARCHAR(255) NOT NULL,          -- local part
    full_address    VARCHAR(512) GENERATED ALWAYS AS (address || '@' || (SELECT domain FROM domains WHERE id = domain_id)) STORED,
    access_token    VARCHAR(64) UNIQUE NOT NULL,    -- for unauthenticated access
    visibility      VARCHAR(10) DEFAULT 'private',  -- public, private
    ttl_seconds     INTEGER NOT NULL DEFAULT 3600,
    forwarding_to   VARCHAR(255),
    auto_reply_msg  TEXT,
    email_count     INTEGER DEFAULT 0,
    max_emails      INTEGER DEFAULT 100,
    is_active       BOOLEAN DEFAULT true,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_email_at   TIMESTAMPTZ,

    UNIQUE(address, domain_id)
);

CREATE INDEX idx_inboxes_user ON inboxes(user_id);
CREATE INDEX idx_inboxes_full_address ON inboxes(address, domain_id);
CREATE INDEX idx_inboxes_expires ON inboxes(expires_at) WHERE is_active = true;
CREATE INDEX idx_inboxes_token ON inboxes(access_token);

-- Partitioning by month for scale
-- CREATE TABLE inboxes_2025_01 PARTITION OF inboxes FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### emails
```sql
CREATE TABLE emails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbox_id        UUID REFERENCES inboxes(id) ON DELETE CASCADE NOT NULL,
    direction       VARCHAR(10) NOT NULL DEFAULT 'inbound',  -- inbound, outbound
    message_id      VARCHAR(512),                   -- SMTP Message-ID
    from_address    VARCHAR(512) NOT NULL,
    from_name       VARCHAR(255),
    to_addresses    JSONB NOT NULL,                  -- [{address, name}]
    cc_addresses    JSONB DEFAULT '[]',
    reply_to        VARCHAR(512),
    subject         VARCHAR(1000),
    body_text       TEXT,                             -- encrypted at app level
    body_html       TEXT,                             -- encrypted at app level
    body_preview    VARCHAR(500),                     -- first 500 chars, plaintext
    headers         JSONB,                            -- selected headers
    size_bytes      INTEGER DEFAULT 0,
    has_attachments BOOLEAN DEFAULT false,
    is_read         BOOLEAN DEFAULT false,
    is_starred      BOOLEAN DEFAULT false,
    spam_score      REAL,                             -- SpamAssassin score
    spf_result      VARCHAR(20),                      -- pass, fail, softfail, none
    dkim_result     VARCHAR(20),
    dmarc_result    VARCHAR(20),
    delivery_status VARCHAR(20) DEFAULT 'delivered',  -- delivered, bounced, deferred
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Outbound-specific
    sent_at         TIMESTAMPTZ,
    bounce_reason   TEXT
);

CREATE INDEX idx_emails_inbox ON emails(inbox_id, created_at DESC);
CREATE INDEX idx_emails_direction ON emails(direction);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_created ON emails(created_at);
```

### email_attachments
```sql
CREATE TABLE email_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
    filename        VARCHAR(512) NOT NULL,
    content_type    VARCHAR(255) NOT NULL,
    size_bytes      INTEGER NOT NULL,
    storage_key     VARCHAR(512) NOT NULL,            -- S3 key, encrypted ref
    checksum_sha256 VARCHAR(64),
    is_inline       BOOLEAN DEFAULT false,
    content_id      VARCHAR(255),                     -- for inline images
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_email ON email_attachments(email_id);
```

### email_ai_analysis
```sql
CREATE TABLE email_ai_analysis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE UNIQUE NOT NULL,
    summary         TEXT,
    otp_codes       JSONB DEFAULT '[]',               -- [{code, type, expires_hint}]
    phishing_score  REAL,                              -- 0-100
    phishing_indicators JSONB DEFAULT '[]',
    priority        VARCHAR(10) DEFAULT 'medium',      -- high, medium, low, spam
    categories      JSONB DEFAULT '[]',                -- [verification, newsletter, personal, ...]
    sentiment       VARCHAR(20),                        -- positive, neutral, negative
    language        VARCHAR(5),
    ai_provider     VARCHAR(20),                        -- claude, openai, gemini
    ai_model        VARCHAR(50),
    tokens_used     INTEGER,
    processing_ms   INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_email ON email_ai_analysis(email_id);
```

---

## Identity & Privacy Tables

### aliases
```sql
CREATE TABLE aliases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    alias_address   VARCHAR(255) NOT NULL,
    domain_id       UUID REFERENCES domains(id) NOT NULL,
    forward_to      VARCHAR(255) NOT NULL,
    label           VARCHAR(100),                      -- "Shopping", "Social", etc.
    is_active       BOOLEAN DEFAULT true,
    emails_received INTEGER DEFAULT 0,
    emails_blocked  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(alias_address, domain_id)
);

CREATE INDEX idx_aliases_user ON aliases(user_id);
CREATE INDEX idx_aliases_address ON aliases(alias_address, domain_id);
```

### leak_checks
```sql
CREATE TABLE leak_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    checked_email   VARCHAR(255) NOT NULL,
    breaches_found  INTEGER DEFAULT 0,
    breach_details  JSONB DEFAULT '[]',
    checked_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### tracking_detections
```sql
CREATE TABLE tracking_detections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
    tracker_type    VARCHAR(50),                       -- pixel, link, fingerprint
    tracker_domain  VARCHAR(255),
    tracker_company VARCHAR(255),
    was_blocked     BOOLEAN DEFAULT true,
    detected_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Developer Tables

### api_keys
```sql
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key_hash        VARCHAR(255) NOT NULL,             -- SHA-256 of the key
    key_prefix      VARCHAR(12) NOT NULL,              -- "tb_live_xxxx" for display
    scopes          JSONB DEFAULT '["read"]',          -- [read, write, admin]
    rate_limit      INTEGER DEFAULT 60,                -- per minute
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### webhooks
```sql
CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    url             VARCHAR(2048) NOT NULL,
    secret          VARCHAR(255) NOT NULL,             -- for HMAC signing
    events          JSONB NOT NULL,                    -- ["email.received", ...]
    is_active       BOOLEAN DEFAULT true,
    failure_count   INTEGER DEFAULT 0,
    last_triggered  TIMESTAMPTZ,
    last_status     INTEGER,                           -- HTTP status code
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
```

### webhook_logs
```sql
CREATE TABLE webhook_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id      UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
    event           VARCHAR(50) NOT NULL,
    payload         JSONB NOT NULL,
    response_status INTEGER,
    response_body   TEXT,
    duration_ms     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-delete logs older than 30 days
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);
```

---

## Billing Tables

### subscriptions
```sql
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id  VARCHAR(255),
    stripe_sub_id       VARCHAR(255) UNIQUE,
    plan                VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL,          -- active, canceled, past_due, trialing
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON subscriptions(stripe_sub_id);
```

### invoices
```sql
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_cents    INTEGER NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) NOT NULL,              -- paid, open, void, uncollectible
    pdf_url         VARCHAR(2048),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## System Tables

### blacklists
```sql
CREATE TABLE blacklists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20) NOT NULL,              -- email, domain, ip
    value           VARCHAR(512) NOT NULL,
    reason          TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(type, value)
);

CREATE INDEX idx_blacklist_lookup ON blacklists(type, value);
```

### abuse_reports
```sql
CREATE TABLE abuse_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_email  VARCHAR(255),
    reported_inbox  UUID REFERENCES inboxes(id),
    reported_email  UUID REFERENCES emails(id),
    reason          TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'open',        -- open, investigating, resolved, dismissed
    resolution_note TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     UUID,
    ip_address      INET,
    user_agent      VARCHAR(512),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- Partition by month
-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## Redis Key Patterns

```
# Sessions
session:{session_id}                    -> JSON user data (TTL: 24h)

# Rate Limiting
rate:{plan}:{user_id}:{window}          -> counter (TTL: 60s)
rate:ip:{ip}:{window}                   -> counter (TTL: 60s)

# Inbox Cache
inbox:{inbox_id}                        -> JSON inbox data (TTL: matches inbox TTL)
inbox:addr:{full_address}               -> inbox_id (TTL: matches inbox TTL)

# Email Count
inbox:{inbox_id}:count                  -> integer (TTL: matches inbox TTL)

# Real-time
ws:user:{user_id}:sockets              -> SET of socket IDs
ws:inbox:{inbox_id}:subscribers         -> SET of socket IDs

# Queue Names (BullMQ)
queue:inbound-email                     -> inbound mail processing
queue:outbound-email                    -> outbound mail sending
queue:ai-analysis                       -> AI processing jobs
queue:cleanup                           -> TTL enforcement, deletion
queue:webhooks                          -> webhook delivery

# CAPTCHA
captcha:{token}                         -> validated (TTL: 5min)

# Abuse Detection
abuse:ip:{ip}                           -> JSON behavior profile (TTL: 1h)
abuse:user:{user_id}                    -> JSON behavior profile (TTL: 1h)
```

## Maintenance Jobs (Cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| `cleanup:expired_inboxes` | Every 1 min | Delete expired inboxes and emails |
| `cleanup:old_attachments` | Every 1 hour | Remove S3 objects for deleted emails |
| `cleanup:webhook_logs` | Daily 3 AM | Delete logs older than 30 days |
| `cleanup:audit_logs` | Daily 3 AM | Archive/delete logs older than 90 days |
| `health:domain_check` | Every 6 hours | Verify MX/SPF/DKIM for all domains |
| `health:ip_reputation` | Daily | Check sending IPs against blacklists |
| `stats:daily_aggregate` | Daily midnight | Aggregate usage stats |
