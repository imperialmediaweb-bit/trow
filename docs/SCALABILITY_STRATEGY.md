# Throwbox AI - Scalability Strategy

## Architecture Principles

1. **Stateless API servers**: No local state. Sessions in Redis. Scale horizontally.
2. **Queue-driven processing**: All heavy work (mail parsing, AI, webhooks) through BullMQ.
3. **Read/write separation**: Read replicas for queries, primary for writes.
4. **Cache everything**: Redis cache with TTL matching inbox TTL.
5. **Auto-cleanup**: TTL-based deletion keeps data volume manageable.

---

## Scaling Stages

### Stage 1: Single Server (0-5K users)
```
[Nginx] -> [Node.js API + Workers] -> [PostgreSQL] + [Redis]
                                            |
                                       [MinIO/S3]
```
- Docker Compose on Hetzner CX41
- All services on one machine
- PostgreSQL + Redis local
- ~$22/mo

### Stage 2: Separated Services (5K-25K users)
```
[Cloudflare LB]
    |
[API Server 1] [API Server 2]
    |               |
[Redis Cluster] [PostgreSQL Primary + Replica]
    |
[Mail Worker 1] [Mail Worker 2] [AI Worker]
    |
[Cloudflare R2]
```
- Separate VPS for API, workers, DB
- PostgreSQL with 1 read replica
- Redis with persistence
- 3-5 VPS nodes
- ~$150-300/mo

### Stage 3: Kubernetes (25K-200K users)
```
[Cloudflare] -> [Ingress Controller]
                      |
    [API Pods (HPA)] [WebSocket Pods]
          |
    [BullMQ Workers (scaled by queue depth)]
    - mail-worker (5-20 pods)
    - ai-worker (3-10 pods)
    - cleanup-worker (1-2 pods)
          |
    [PostgreSQL Primary + 2-4 Replicas]
    [Redis Cluster (6 nodes)]
    [Cloudflare R2]
```
- Hetzner Cloud Kubernetes or k3s
- Horizontal Pod Autoscaler based on CPU + queue depth
- Database sharding considered at 1M+ inboxes
- ~$800-2500/mo

### Stage 4: Multi-Region (200K+ users)
- Primary region: EU (Hetzner Falkenstein)
- Secondary region: US (Hetzner Ashburn)
- PostgreSQL with cross-region replication
- Redis Cluster per region
- SMTP servers per region (IP reputation per region)
- Cloudflare for global load balancing
- ~$3000-8000/mo

---

## Bottleneck Analysis

| Component | Bottleneck | Solution |
|-----------|-----------|----------|
| API | CPU-bound JSON parsing | Horizontal scaling (add nodes) |
| PostgreSQL | Write throughput | Connection pooling (PgBouncer), partitioning |
| PostgreSQL | Read throughput | Read replicas, Redis caching |
| Redis | Memory | Redis Cluster, eviction policies |
| SMTP Inbound | Connection limits | Multiple MX records, Haraka clustering |
| SMTP Outbound | IP reputation | IP rotation, warm-up, multiple domains |
| AI Processing | API rate limits + latency | Concurrency limiting, provider fallback, caching |
| WebSocket | Memory per connection | Sticky sessions, Redis adapter, Socket.io clustering |
| S3 Storage | Growth | Auto-cleanup TTL, Cloudflare R2 (cheap storage) |

---

## Database Scaling Strategy

### Phase 1: Indexing + Query Optimization
- Composite indexes on hot queries
- EXPLAIN ANALYZE on all endpoints
- Connection pooling (20 connections)

### Phase 2: Read Replicas
- Route all SELECT queries to replicas
- Primary for INSERT/UPDATE/DELETE
- Streaming replication (< 1s lag)

### Phase 3: Partitioning
```sql
-- Partition inboxes by month
CREATE TABLE inboxes (
    ...
) PARTITION BY RANGE (created_at);

-- Partition emails by inbox creation month
CREATE TABLE emails (
    ...
) PARTITION BY RANGE (created_at);

-- Partition audit_logs by month
CREATE TABLE audit_logs (
    ...
) PARTITION BY RANGE (created_at);
```

### Phase 4: Sharding (if needed at 10M+ rows)
- Shard by domain (each domain's data on separate shard)
- Application-level routing
- Consider Citus for distributed PostgreSQL

---

## Caching Strategy

```
Request Flow:
1. Check Redis cache (hit? return immediately)
2. Cache miss -> Query PostgreSQL
3. Store result in Redis with TTL
4. Return to client

Cache Invalidation:
- Inbox data: TTL matches inbox expiry
- Email list: Invalidate on new email arrival
- User data: 5-minute TTL
- Plans/pricing: 1-hour TTL
- AI analysis: Never expires (immutable per email)
```

### Cache Hit Rate Targets
- Inbox lookups: > 95%
- Email lists: > 80%
- User profiles: > 90%
- Static data (plans, domains): > 99%

---

## Queue Scaling

```
BullMQ Queues:
├── inbound-email    (concurrency: 10-50)
├── outbound-email   (concurrency: 5-20)
├── ai-analysis      (concurrency: 5-15, rate limited)
├── webhooks         (concurrency: 10-30)
└── cleanup          (concurrency: 1-3)

Auto-scaling triggers:
- Queue depth > 100 for 5 min -> add worker
- Queue depth < 10 for 15 min -> remove worker
- Processing time > 30s avg -> investigate + add workers
```

---

## Monitoring & Alerting

### Key Metrics
- **API**: p50/p95/p99 latency, error rate, req/sec
- **Queue**: depth, processing time, failure rate
- **Database**: query time, connection count, replication lag
- **Redis**: memory usage, hit rate, evictions
- **SMTP**: delivery rate, bounce rate, queue depth
- **AI**: call latency, failure rate, tokens/day
- **Business**: active inboxes, emails/day, signups, MRR

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| API p95 latency | > 500ms | > 2000ms |
| API error rate | > 1% | > 5% |
| Queue depth | > 500 | > 5000 |
| DB connections | > 15 | > 19 |
| DB replication lag | > 5s | > 30s |
| Redis memory | > 80% | > 95% |
| Disk usage | > 70% | > 90% |
| SMTP bounce rate | > 3% | > 10% |
