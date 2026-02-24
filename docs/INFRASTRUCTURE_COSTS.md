# Throwbox AI - Infrastructure Cost Estimates

## MVP Phase (Months 1-3): Minimal Viable Infrastructure

| Service | Provider | Spec | Monthly Cost |
|---------|----------|------|-------------|
| VPS (API + Workers) | Hetzner CX41 | 4 vCPU, 16GB RAM, 160GB SSD | $15.90 |
| VPS (SMTP) | Hetzner CX21 | 2 vCPU, 4GB RAM | $5.90 |
| Domain (throwbox.net) | Existing | Already owned | $0 |
| DNS + CDN + WAF | Cloudflare Free | Free tier | $0 |
| SSL | Cloudflare / Let's Encrypt | Free | $0 |
| S3 Storage | Cloudflare R2 | 10GB free, then $0.015/GB | $0-5 |
| Transactional Email | Postal (self-hosted) | On SMTP VPS | $0 |
| AI - Claude API | Anthropic | ~$3/1M input tokens (Haiku) | $20-50 |
| AI - OpenAI fallback | OpenAI | GPT-4o-mini ~$0.15/1M | $5-10 |
| Monitoring | Uptime Robot Free | 50 monitors | $0 |
| Error Tracking | Sentry Free | 5K events/mo | $0 |
| **TOTAL MVP** | | | **$47-87/mo** |

---

## Growth Phase (Months 4-8): 1K-10K Users

| Service | Provider | Spec | Monthly Cost |
|---------|----------|------|-------------|
| VPS (API) x2 | Hetzner CX41 | Load balanced | $31.80 |
| VPS (Workers) x2 | Hetzner CX31 | Mail + AI workers | $23.80 |
| VPS (SMTP) | Hetzner CX31 | Dedicated mail server | $11.90 |
| Managed PostgreSQL | Supabase Pro | 8GB RAM, 100GB | $25 |
| Managed Redis | Upstash Pro | 10GB, 10K cmd/sec | $10 |
| CDN + WAF | Cloudflare Pro | $20/mo | $20 |
| S3 Storage | Cloudflare R2 | ~50GB | $5-10 |
| AI - Claude API | Anthropic | Higher volume | $100-300 |
| AI - OpenAI | OpenAI | Fallback | $20-50 |
| Monitoring | Better Uptime | Starter | $20 |
| Error Tracking | Sentry Team | 50K events | $26 |
| DNS (extra domains) | Cloudflare | tmpmail.dev etc. | $10-20 |
| **TOTAL GROWTH** | | | **$305-538/mo** |

---

## Scale Phase (Months 9+): 10K-100K Users

| Service | Provider | Spec | Monthly Cost |
|---------|----------|------|-------------|
| Kubernetes Cluster | Hetzner Cloud | 6-12 nodes, auto-scaling | $200-500 |
| Managed PostgreSQL | Neon / Supabase | Read replicas, 500GB | $100-200 |
| Managed Redis | Redis Cloud | Cluster, 50GB | $50-100 |
| CDN + WAF | Cloudflare Business | $200/mo | $200 |
| S3 Storage | Cloudflare R2 | ~500GB + bandwidth | $20-50 |
| AI APIs | Claude + OpenAI | High volume | $500-2000 |
| SMTP Infrastructure | Dedicated IPs x4 | IP reputation management | $40-80 |
| Monitoring | Datadog / Grafana Cloud | Full observability | $50-200 |
| Error Tracking | Sentry Business | 500K events | $80 |
| Backup | Hetzner Storage Box | 1TB | $10 |
| **TOTAL SCALE** | | | **$1,250-3,410/mo** |

---

## Revenue vs Cost Analysis

### Break-Even Scenarios

| Scenario | Users | Paid Conversion | MRR | Infra Cost | Profit |
|----------|-------|-----------------|-----|------------|--------|
| MVP | 1,000 | 3% (30 Pro) | $270 | $87 | $183 |
| Growth | 10,000 | 5% (500 paid) | $6,500 | $538 | $5,962 |
| Scale | 50,000 | 5% (2,500 paid) | $32,500 | $2,500 | $30,000 |
| Target | 100,000 | 7% (7,000 paid) | $91,000 | $3,500 | $87,500 |

### Revenue Mix Assumption
- 60% Pro ($9/mo)
- 25% Business ($29/mo)
- 10% API plans ($19-49/mo)
- 5% Enterprise (custom)

### Average Revenue Per Paying User: ~$13/mo

### Key Metric Targets
- **Month 3**: 500 users, 15 paying = $135 MRR
- **Month 6**: 5,000 users, 150 paying = $1,950 MRR
- **Month 12**: 25,000 users, 1,000 paying = $13,000 MRR
- **Month 18**: 75,000 users, 3,500 paying = $45,500 MRR
- **Month 24**: 150,000 users, 8,000 paying = $104,000 MRR

---

## Cost Optimization Strategies

1. **AI Costs**: Use Claude Haiku for analysis, Sonnet only for writing assistant. Cache common patterns (OTP regex first, AI fallback).
2. **Hetzner vs AWS**: Hetzner is 5-10x cheaper than AWS/GCP for comparable compute. Use for everything except S3 (Cloudflare R2).
3. **Cloudflare R2**: $0 egress vs S3's $0.09/GB. Massive savings at scale.
4. **Self-hosted Postal**: Free SMTP vs Mailgun/SendGrid ($0.80/1000 emails).
5. **Redis caching**: Cache inbox lookups, reduce DB queries by 80%.
6. **Email TTL**: Auto-delete reduces storage growth naturally.
