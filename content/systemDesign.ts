import { Lesson, BuildingBlock, CaseStudy } from './types';

export const SYSTEM_DESIGN_LESSONS: Lesson[] = [
  {
    id: 'sd-001-scalability',
    track: 'system-design',
    module: 'Foundations',
    order: 1,
    title: 'Scalability: Vertical vs Horizontal',
    estMinutes: 15,
    tags: ['scalability', 'horizontal-scaling', 'throughput'],
    keyPoints: [
      'Vertical scaling (scaling up) upgrades CPU/RAM; bounded by single-machine physical limits and cost.',
      'Horizontal scaling (scaling out) adds commodity nodes; requires stateless app tiers and distributed storage.',
      'Throughput measures operations per second; latency measures elapsed time per operation.',
    ],
    body: `### Summary
Designing scalable systems means ensuring performance remains stable as workloads grow orders of magnitude by avoiding single points of failure and bottlenecks.

### Core Trade-offs
- **Vertical:** Zero architecture change, but high hardware cost and downtime risk.
- **Horizontal:** Fault-tolerant and linearly scalable, but requires network RPC, data partitioning, and consistency handling.
- **Stateless Services:** Session state should live in a distributed cache (e.g. Redis), enabling web servers to be created and destroyed dynamically behind a load balancer.

### Common Mistakes
- Storing user session state in server memory on horizontally scaled nodes without sticky sessions or distributed session stores.`,
  },
  {
    id: 'sd-002-caching',
    track: 'system-design',
    module: 'Performance & Latency',
    order: 2,
    title: 'Caching Strategies & Eviction Policies',
    estMinutes: 18,
    tags: ['caching', 'redis', 'cache-aside', 'lru'],
    keyPoints: [
      'Cache-aside (lazy loading) reads from cache; on miss, queries DB and populates cache.',
      'Write-through updates cache and database synchronously; write-back buffers writes asynchronously.',
      'Eviction policies (LRU, LFU, TTL) prevent cache memory exhaustion.',
    ],
    body: `### Summary
In-memory caches (Redis, Memcached) reduce database read loads and serve requests with sub-millisecond latency.

### Common Caching Patterns
1. **Cache-Aside:** Application manages cache reads and writes. Ideal for read-heavy workloads.
2. **Write-Through:** High write latency, but guarantees strong cache-DB consistency.
3. **Write-Back (Write-Behind):** Extremely fast writes, risk of data loss if cache crashes before flushing to disk.

### Mitigating Pitfalls
- **Cache Stampede (Thundering Herd):** Use mutex locks or probabilistic early expiration to prevent thousands of simultaneous queries when a key expires.
- **Cache Penetration:** Cache empty/null results with short TTLs or use a Bloom filter for missing keys.`,
  },
  {
    id: 'sd-003-load-balancing',
    track: 'system-design',
    module: 'High Availability',
    order: 3,
    title: 'Load Balancing & Consistent Hashing',
    estMinutes: 15,
    tags: ['load-balancing', 'consistent-hashing', 'availability'],
    keyPoints: [
      'Layer 4 (transport/TCP) vs Layer 7 (application/HTTP) routing.',
      'Consistent hashing distributes keys across a hash ring with virtual nodes.',
      'Adding or removing a cache node only remaps K/N keys rather than all keys.',
    ],
    body: `### Summary
Load balancers distribute incoming network traffic across multiple servers to maximize throughput, minimize latency, and ensure fault tolerance.

### Consistent Hashing Ring
Traditional \`hash(key) % N\` invalidates nearly 100% of cached keys when node count N changes. Consistent hashing places both nodes and keys on a 360° ring:
- Keys are assigned to the first node encountered clockwise.
- Adding a server only reassigns keys between the new server and its predecessor.
- **Virtual Nodes:** Multiple virtual replicas per physical machine ensure uniform key distribution.`,
  },
  {
    id: 'sd-004-databases',
    track: 'system-design',
    module: 'Data Storage',
    order: 4,
    title: 'SQL vs NoSQL, Indexing & Sharding',
    estMinutes: 20,
    tags: ['databases', 'sql', 'nosql', 'sharding', 'indexes'],
    keyPoints: [
      'B-Tree indexes optimize range queries and point lookups (O(log N)); LSM-trees optimize high-throughput writes.',
      'Vertical partitioning splits tables by columns; horizontal sharding partitions rows across multiple databases by shard key.',
      'Choose shard keys with high cardinality and even access distribution to prevent hot shards.',
    ],
    body: `### Summary
Relational databases provide ACID compliance and structured queries; NoSQL (document, key-value, column-family) databases provide flexible schemas and horizontal write scaling.

### Sharding Techniques
- **Range-Based:** Shard by alphabetical or date ranges (can cause hot spotting on recent timestamps).
- **Hash-Based:** \`hash(shard_key) % num_shards\` distributes writes evenly.
- **Directory-Based:** Lookup service maps shard keys to specific database endpoints.`,
  },
  {
    id: 'sd-005-message-queues',
    track: 'system-design',
    module: 'Asynchronous Architecture',
    order: 5,
    title: 'Message Queues & Event Streaming',
    estMinutes: 16,
    tags: ['queues', 'kafka', 'rabbitmq', 'decoupling'],
    keyPoints: [
      'Queues decouple producers from consumers, buffering traffic spikes (backpressure).',
      'Point-to-point queues (RabbitMQ/SQS) delete messages once acknowledged.',
      'Distributed log streams (Apache Kafka) maintain append-only partitioned logs for replayable events.',
    ],
    body: `### Summary
Asynchronous messaging isolates services, prevents cascading timeouts, and smooths peak traffic loads.

### Delivery Guarantees
- **At-most-once:** Fast, messages may be lost.
- **At-least-once:** Retries on failure; consumers must implement idempotent processing.
- **Exactly-once:** Requires end-to-end distributed transactions or deduplication tokens.`,
  },
  {
    id: 'sd-006-cap-theorem',
    track: 'system-design',
    module: 'Distributed Consensus',
    order: 6,
    title: 'CAP Theorem & PACELC Trade-offs',
    estMinutes: 15,
    tags: ['cap-theorem', 'pacelc', 'consistency'],
    keyPoints: [
      'In any distributed network with network partition (P), pick between Consistency (CP) or Availability (AP).',
      'PACELC extends CAP: If Partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C).',
      'Eventual consistency converges replica state over time via gossip protocols or CRDTs.',
    ],
    body: `### Summary
The CAP theorem states that a distributed data store can guarantee at most two of: Consistency, Availability, and Partition Tolerance. Since network partitions are inevitable in real networks, the architectural choice is always between CP and AP.

### PACELC Framework
- When the network is running normally without partitions, systems must still trade off latency for strict read/write consistency.
- Example: MongoDB is PC/EC; DynamoDB and Cassandra are PA/EL by default.`,
  },
];

export const BUILDING_BLOCKS: BuildingBlock[] = [
  {
    id: 'load-balancer',
    title: 'Load Balancer',
    summary: 'Distributes traffic across backend worker pools to eliminate single points of failure.',
    keyConcepts: ['Round Robin', 'Least Connections', 'L4 vs L7 Routing', 'Health Checks'],
    tradeoffs: 'Adds a network hop; requires session synchronization or sticky cookies.',
  },
  {
    id: 'cache',
    title: 'Distributed Cache (Redis / Memcached)',
    summary: 'Sub-millisecond in-memory data store for frequently read hot data.',
    keyConcepts: ['Cache-aside', 'TTL Expiry', 'LRU Eviction', 'Cache Stampede Prevention'],
    tradeoffs: 'Eventual consistency; stale data risk; memory is expensive compared to SSDs.',
  },
  {
    id: 'cdn',
    title: 'Content Delivery Network (CDN)',
    summary: 'Globally distributed edge servers caching static media and assets close to users.',
    keyConcepts: ['Edge Locations', 'Anycast Routing', 'Cache Headers (Cache-Control)'],
    tradeoffs: 'Cache invalidation delays; extra bandwidth cost for non-cacheable dynamic requests.',
  },
  {
    id: 'message-queue',
    title: 'Message Queue / PubSub',
    summary: 'Buffers tasks asynchronously and decouples independent microservices.',
    keyConcepts: ['At-least-once Delivery', 'Idempotency', 'Dead Letter Queues (DLQ)', 'Backpressure'],
    tradeoffs: 'Introduces asynchronous latency; requires monitoring consumer lag.',
  },
  {
    id: 'database-sql-nosql',
    title: 'Database (SQL vs NoSQL)',
    summary: 'Primary persistence layer supporting relational ACID transactions or NoSQL scale.',
    keyConcepts: ['B-Tree Indexing', 'ACID vs BASE', 'Document vs Key-Value vs Wide-Column'],
    tradeoffs: 'SQL limits horizontal scaling; NoSQL sacrifices complex cross-table joins.',
  },
  {
    id: 'sharding',
    title: 'Database Sharding',
    summary: 'Horizontally partitioning database rows across distinct database clusters.',
    keyConcepts: ['Shard Key Cardinality', 'Consistent Hashing', 'Cross-shard Joins', 'Hot Spots'],
    tradeoffs: 'High operational complexity; schema migrations and resharding are difficult.',
  },
  {
    id: 'replication',
    title: 'Data Replication',
    summary: 'Copying data across multiple database instances for read scaling and failover.',
    keyConcepts: ['Leader-Follower (Primary-Replica)', 'Sync vs Async Replication', 'Replication Lag'],
    tradeoffs: 'Asynchronous replication leads to temporary read inconsistencies.',
  },
  {
    id: 'consistent-hashing',
    title: 'Consistent Hashing',
    summary: 'Distributes cache keys across servers while minimizing remapping when nodes churn.',
    keyConcepts: ['Virtual Nodes', 'Hash Ring', 'O(1) Routing', 'Failover Redistribution'],
    tradeoffs: 'More complex to implement than simple modulo hashing.',
  },
  {
    id: 'rate-limiter',
    title: 'Rate Limiter',
    summary: 'Protects backend infrastructure from denial-of-service, abuse, and quota breaches.',
    keyConcepts: ['Token Bucket', 'Leaky Bucket', 'Sliding Window Log', 'HTTP 429 Too Many Requests'],
    tradeoffs: 'Can reject legitimate bursty traffic if thresholds are tuned too strictly.',
  },
  {
    id: 'api-gateway',
    title: 'API Gateway',
    summary: 'Single entry point for client requests handling auth, SSL termination, and routing.',
    keyConcepts: ['Reverse Proxy', 'JWT Validation', 'Request Throttling', 'Telemetry & Logging'],
    tradeoffs: 'Can become a central single point of failure if not scaled redundantly.',
  },
  {
    id: 'blob-store',
    title: 'Object / Blob Storage (S3 / GCS)',
    summary: 'Highly durable, cost-effective storage for unstructured objects and media files.',
    keyConcepts: ['Chunked Multipart Upload', 'Signed URLs', 'Immutability', 'Lifecycle Rules'],
    tradeoffs: 'High latency compared to local disk; not suitable for transactional updates.',
  },
  {
    id: 'search-index',
    title: 'Search Index (Elasticsearch)',
    summary: 'Inverted index allowing full-text fuzzy search and real-time aggregations.',
    keyConcepts: ['Inverted Index', 'Tokenization & Stemming', 'TF-IDF / BM25', 'Sharded Clusters'],
    tradeoffs: 'Heavy memory footprint; secondary pipeline needed to sync data from primary DB.',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'url-shortener',
    title: 'Design a URL Shortener (TinyURL)',
    description: 'Create short aliases for long URLs, handling billions of redirects with low latency.',
  },
  {
    id: 'rate-limiter',
    title: 'Design an API Rate Limiter',
    description: 'Throttle client requests per second using distributed token bucket algorithms.',
  },
  {
    id: 'news-feed',
    title: 'Design a Social Media News Feed',
    description: 'Fan-out-on-write vs fan-out-on-read for real-time post timelines and celebrity accounts.',
  },
  {
    id: 'chat-system',
    title: 'Design a Real-Time Chat System (WhatsApp)',
    description: 'WebSocket connections, message ordering, online presence, and offline push alerts.',
  },
  {
    id: 'notification-service',
    title: 'Design a Distributed Notification Service',
    description: 'Deliver SMS, email, and mobile push notifications with deduplication and priority queues.',
  },
  {
    id: 'file-storage',
    title: 'Design Cloud File Storage (Google Drive / Dropbox)',
    description: 'Chunked block deduplication, metadata synchronization, and chunked upload/download.',
  },
  {
    id: 'ride-sharing',
    title: 'Design a Ride Sharing Service (Uber / Lyft)',
    description: 'Geospatial indexing (Quadtree / H3 / S2), driver location tracking, and ride matching.',
  },
  {
    id: 'web-crawler',
    title: 'Design a Web Crawler',
    description: 'Distributed URL frontier, politeness delays, deduplication, and parsing at scale.',
  },
];
