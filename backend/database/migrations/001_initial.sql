-- Throwbox AI - Initial Database Schema
-- PostgreSQL 16

BEGIN;

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'user',
    plan            VARCHAR(20) DEFAULT 'free',
    email_verified  BOOLEAN DEFAULT false,
    two_factor      BOOLEAN DEFAULT false,
    totp_secret     VARCHAR(255),
    locale          VARCHAR(5) DEFAULT 'en',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    is_banned       BOOLEAN DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- ─── Domains ────────────────────────────────────────────────
CREATE TABLE domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain          VARCHAR(255) UNIQUE NOT NULL,
    mx_verified     BOOLEAN DEFAULT false,
    spf_record      TEXT,
    dkim_selector   VARCHAR(100),
    dkim_private    TEXT,
    dkim_public     TEXT,
    dmarc_policy    VARCHAR(20) DEFAULT 'reject',
    is_active       BOOLEAN DEFAULT true,
    is_premium      BOOLEAN DEFAULT false,
    max_inboxes     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Inboxes ────────────────────────────────────────────────
CREATE TABLE inboxes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    domain_id       UUID REFERENCES domains(id) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    access_token    VARCHAR(64) UNIQUE NOT NULL,
    visibility      VARCHAR(10) DEFAULT 'private',
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
CREATE INDEX idx_inboxes_address ON inboxes(address, domain_id);
CREATE INDEX idx_inboxes_expires ON inboxes(expires_at) WHERE is_active = true;
CREATE INDEX idx_inboxes_token ON inboxes(access_token);

-- ─── Emails ─────────────────────────────────────────────────
CREATE TABLE emails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbox_id        UUID REFERENCES inboxes(id) ON DELETE CASCADE NOT NULL,
    direction       VARCHAR(10) NOT NULL DEFAULT 'inbound',
    message_id      VARCHAR(512),
    from_address    VARCHAR(512) NOT NULL,
    from_name       VARCHAR(255),
    to_addresses    JSONB NOT NULL,
    cc_addresses    JSONB DEFAULT '[]',
    reply_to        VARCHAR(512),
    subject         VARCHAR(1000),
    body_text       TEXT,
    body_html       TEXT,
    body_preview    VARCHAR(500),
    headers         JSONB,
    size_bytes      INTEGER DEFAULT 0,
    has_attachments BOOLEAN DEFAULT false,
    is_read         BOOLEAN DEFAULT false,
    is_starred      BOOLEAN DEFAULT false,
    spam_score      REAL,
    spf_result      VARCHAR(20),
    dkim_result     VARCHAR(20),
    dmarc_result    VARCHAR(20),
    delivery_status VARCHAR(20) DEFAULT 'delivered',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,
    bounce_reason   TEXT
);

CREATE INDEX idx_emails_inbox ON emails(inbox_id, created_at DESC);
CREATE INDEX idx_emails_direction ON emails(direction);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_created ON emails(created_at);

-- ─── Email Attachments ──────────────────────────────────────
CREATE TABLE email_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
    filename        VARCHAR(512) NOT NULL,
    content_type    VARCHAR(255) NOT NULL,
    size_bytes      INTEGER NOT NULL,
    storage_key     VARCHAR(512) NOT NULL,
    checksum_sha256 VARCHAR(64),
    is_inline       BOOLEAN DEFAULT false,
    content_id      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_email ON email_attachments(email_id);

-- ─── AI Analysis ────────────────────────────────────────────
CREATE TABLE email_ai_analysis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE UNIQUE NOT NULL,
    summary         TEXT,
    otp_codes       JSONB DEFAULT '[]',
    phishing_score  REAL,
    phishing_indicators JSONB DEFAULT '[]',
    priority        VARCHAR(10) DEFAULT 'medium',
    categories      JSONB DEFAULT '[]',
    sentiment       VARCHAR(20),
    language        VARCHAR(5),
    ai_provider     VARCHAR(20),
    ai_model        VARCHAR(50),
    tokens_used     INTEGER,
    processing_ms   INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_email ON email_ai_analysis(email_id);

-- ─── Aliases ────────────────────────────────────────────────
CREATE TABLE aliases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    alias_address   VARCHAR(255) NOT NULL,
    domain_id       UUID REFERENCES domains(id) NOT NULL,
    forward_to      VARCHAR(255) NOT NULL,
    label           VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    emails_received INTEGER DEFAULT 0,
    emails_blocked  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(alias_address, domain_id)
);

CREATE INDEX idx_aliases_user ON aliases(user_id);
CREATE INDEX idx_aliases_address ON aliases(alias_address, domain_id);

-- ─── Leak Checks ────────────────────────────────────────────
CREATE TABLE leak_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    checked_email   VARCHAR(255) NOT NULL,
    breaches_found  INTEGER DEFAULT 0,
    breach_details  JSONB DEFAULT '[]',
    checked_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tracking Detections ────────────────────────────────────
CREATE TABLE tracking_detections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
    tracker_type    VARCHAR(50),
    tracker_domain  VARCHAR(255),
    tracker_company VARCHAR(255),
    was_blocked     BOOLEAN DEFAULT true,
    detected_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── API Keys ───────────────────────────────────────────────
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key_hash        VARCHAR(255) NOT NULL,
    key_prefix      VARCHAR(12) NOT NULL,
    scopes          JSONB DEFAULT '["read"]',
    rate_limit      INTEGER DEFAULT 60,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ─── Webhooks ───────────────────────────────────────────────
CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    url             VARCHAR(2048) NOT NULL,
    secret          VARCHAR(255) NOT NULL,
    events          JSONB NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    failure_count   INTEGER DEFAULT 0,
    last_triggered  TIMESTAMPTZ,
    last_status     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);

-- ─── Webhook Logs ───────────────────────────────────────────
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

CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);

-- ─── Subscriptions ──────────────────────────────────────────
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id  VARCHAR(255),
    stripe_sub_id       VARCHAR(255) UNIQUE,
    plan                VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON subscriptions(stripe_sub_id);

-- ─── Invoices ───────────────────────────────────────────────
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_cents    INTEGER NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) NOT NULL,
    pdf_url         VARCHAR(2048),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blacklists ─────────────────────────────────────────────
CREATE TABLE blacklists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20) NOT NULL,
    value           VARCHAR(512) NOT NULL,
    reason          TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(type, value)
);

CREATE INDEX idx_blacklist_lookup ON blacklists(type, value);

-- ─── Abuse Reports ──────────────────────────────────────────
CREATE TABLE abuse_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_email  VARCHAR(255),
    reported_inbox  UUID REFERENCES inboxes(id),
    reported_email  UUID REFERENCES emails(id),
    reason          TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'open',
    resolution_note TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

-- ─── Audit Logs ─────────────────────────────────────────────
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

-- ─── Site Settings (Admin Panel) ──────────────────────────────
CREATE TABLE site_settings (
    key             VARCHAR(255) PRIMARY KEY,
    value           JSONB NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Custom Pages (Admin Panel) ──────────────────────────────
CREATE TABLE pages (
    id              VARCHAR(100) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    content         TEXT DEFAULT '',
    is_published    BOOLEAN DEFAULT false,
    meta_title      VARCHAR(255) DEFAULT '',
    meta_description TEXT DEFAULT '',
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Emails received_at alias ─────────────────────────────────
-- (admin analytics queries use received_at; it maps to created_at)
CREATE INDEX idx_emails_received ON emails(created_at);

-- ─── Seed Default Domain ────────────────────────────────────
INSERT INTO domains (domain, mx_verified, spf_record, dmarc_policy, is_active, is_premium)
VALUES
  ('throwbox.net', true, 'v=spf1 include:_spf.throwbox.net -all', 'reject', true, false),
  ('tmpmail.dev', false, NULL, 'none', true, true);

-- ─── Create Admin User (password: admin123 — CHANGE IMMEDIATELY) ──
INSERT INTO users (email, password_hash, display_name, role, plan, email_verified)
VALUES (
  'admin@throwbox.net',
  '$2a$12$UDlzNzs/JWxIQha2y5Qcx.C95XzUToVbub1qeaGJJKQBlpCqqZjG6',
  'Admin',
  'superadmin',
  'enterprise',
  true
);

COMMIT;
