# Throwbox AI - System Architecture

## Domain: throwbox.net

## 1. High-Level Architecture

```
                        +------------------+
                        |   Cloudflare     |
                        |   CDN / WAF      |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
           +-------v-------+        +--------v--------+
           |  Web Frontend |        |   MX Records    |
           |  (Vue 3 SPA)  |        |  (Inbound SMTP) |
           +-------+-------+        +--------+--------+
                   |                          |
           +-------v-------+        +--------v--------+
           |  API Gateway  |        |  Postal/Haraka  |
           |  (Nginx/Kong) |        |  Mail Server    |
           +-------+-------+        +--------+--------+
                   |                          |
        +----------+----------+               |
        |                     |               |
+-------v------+  +---------v--------+  +---v-----------+
| REST API     |  | WebSocket Server |  | Mail Processor|
| (Node.js/    |  | (Real-time       |  | (Queue Worker)|
|  Express)    |  |  notifications)  |  |               |
+-------+------+  +---------+--------+  +---+-----------+
        |                    |               |
        +----------+---------+---------------+
                   |
        +----------v----------+
        |                     |
   +----v----+  +------v------+  +----------+
   |PostgreSQL|  |   Redis     |  | S3/Minio |
   |  (Main   |  | (Cache,    |  | (Attach- |
   |   DB)    |  |  Queue,    |  |  ments)  |
   |          |  |  Sessions) |  |          |
   +----------+  +------------+  +----------+
                   |
        +----------v----------+
        |   AI Services       |
        |  (OpenAI/Claude/    |
        |   Gemini API)       |
        +---------------------+
```

## 2. Component Breakdown

### 2.1 Frontend Layer
- **Framework**: Vue 3 + Vite + TypeScript
- **UI**: Tailwind CSS + Headless UI
- **State**: Pinia
- **Real-time**: Socket.io client
- **i18n**: vue-i18n (EN, RO, ES, DE, FR)

### 2.2 API Layer
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **Auth**: JWT + refresh tokens + API keys
- **Rate Limiting**: express-rate-limit + Redis sliding window
- **Validation**: Zod schemas
- **Documentation**: OpenAPI 3.1 (Swagger)

### 2.3 Mail Processing Layer
- **Inbound SMTP**: Haraka (Node.js SMTP server) or Postal
- **Outbound SMTP**: Postal + IP rotation
- **Queue**: BullMQ (Redis-backed)
- **Processing Pipeline**:
  1. Receive -> SPF/DKIM verify -> Store
  2. AI analysis (async) -> OTP extract, phishing detect, summarize
  3. Notify via WebSocket
  4. TTL enforcement via scheduled jobs

### 2.4 AI Services Layer
- **Primary**: Claude API (analysis, writing)
- **Fallback**: OpenAI GPT-4o, Gemini Pro
- **Tasks**:
  - Email summarization
  - OTP/code extraction
  - Phishing/scam detection (confidence score)
  - Writing assistant (compose, grammar, tone)
  - Privacy score calculation
  - Brand AI visibility analysis

### 2.5 Data Layer
- **PostgreSQL 16**: Primary data store (users, emails, domains, billing)
- **Redis 7**: Cache, sessions, queues, rate limiting, pub/sub
- **S3/MinIO**: Email attachments, encrypted at rest
- **Encryption**: AES-256-GCM for email bodies at rest

### 2.6 Security Layer
- **WAF**: Cloudflare (L7 protection)
- **TLS**: Let's Encrypt / Cloudflare certificates
- **Auth**: bcrypt + JWT RS256 + refresh token rotation
- **CAPTCHA**: hCaptcha (privacy-focused)
- **Abuse Detection**: IP reputation + behavioral analysis
- **SPF/DKIM/DMARC**: Full implementation on all sending domains
- **CSP**: Strict Content Security Policy headers

## 3. Data Flow: Receiving an Email

```
Sender -> MX (throwbox.net) -> Haraka SMTP
  -> SPF/DKIM/DMARC check
  -> BullMQ job: process_inbound_email
  -> Worker picks up job:
    1. Parse MIME (mailparser)
    2. Store body (encrypted) in PostgreSQL
    3. Store attachments in S3 (encrypted)
    4. Queue AI analysis job
    5. Emit WebSocket event to connected clients
    6. Schedule TTL deletion job
  -> AI Worker picks up analysis job:
    1. Summarize content
    2. Extract OTP codes (regex + AI)
    3. Phishing score (0-100)
    4. Priority label (high/medium/low/spam)
    5. Update email record with AI metadata
    6. Emit WebSocket update
```

## 4. Data Flow: Sending an Email

```
User -> API POST /api/v1/emails/send
  -> Auth check (JWT/API key)
  -> Rate limit check (plan-based)
  -> CAPTCHA verify (if required)
  -> Abuse detection scan
  -> AI spam risk analysis
  -> BullMQ job: process_outbound_email
  -> Worker:
    1. Select sending domain/IP
    2. Build MIME message
    3. Sign with DKIM
    4. Send via Postal/direct SMTP
    5. Log delivery status
    6. Update sent folder
```

## 5. Multi-Domain Architecture

```
Domains: throwbox.net, tmpmail.dev, privbox.io, etc.

Each domain:
  - MX records -> mail server cluster
  - SPF record: v=spf1 include:_spf.throwbox.net -all
  - DKIM: per-domain key pairs, rotated quarterly
  - DMARC: v=DMARC1; p=reject; rua=mailto:dmarc@throwbox.net
```

## 6. Scalability Architecture

### Horizontal Scaling Points
1. **API Servers**: Stateless, scale behind load balancer
2. **Mail Workers**: Independent queue consumers, scale by queue depth
3. **AI Workers**: Separate pool, scale by AI job queue depth
4. **WebSocket**: Sticky sessions via Redis adapter
5. **PostgreSQL**: Read replicas for queries, primary for writes
6. **Redis**: Redis Cluster for > 1M concurrent inboxes

### Capacity Planning
| Component | 10K users | 100K users | 1M users |
|-----------|-----------|------------|----------|
| API Nodes | 2 | 4-6 | 12-20 |
| Mail Workers | 2 | 4-8 | 16-32 |
| AI Workers | 1 | 2-4 | 8-16 |
| PostgreSQL | 1 primary | 1P + 2R | 1P + 4R + partitioning |
| Redis | 1 node | 3-node cluster | 6-node cluster |

## 7. Deployment

### MVP (Months 1-3)
- Single VPS: Hetzner CX41 (16GB, 4 vCPU) - ~$15/mo
- Docker Compose: all services on one machine
- Managed PostgreSQL optional (Supabase free tier for dev)

### Growth (Months 4-8)
- 2-3 VPS nodes behind Cloudflare LB
- Managed PostgreSQL (Supabase Pro or Neon)
- Managed Redis (Upstash or Redis Cloud)
- S3-compatible storage (Cloudflare R2)

### Scale (Months 9+)
- Kubernetes (Hetzner Cloud / DigitalOcean)
- Horizontal pod autoscaling
- Database sharding by domain
- Multi-region deployment
