export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  vaultId: string;
  filename: string;
  content: string;
  tags: string[];
  updatedAt: string;
  sensitivity: 'Confidential' | 'Internal' | 'Public' | 'Restricted';
}

export interface VaultCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  documentCount: number;
}

export const VAULTS: VaultCategory[] = [
  {
    id: 'yc-rfs-2026',
    name: 'YC Fall 2026 RFS',
    icon: 'Rocket',
    description: 'Y Combinator Fall 2026 Requests for Startups, Low-Latency AI & Edge Tracks',
    documentCount: 5,
  },
  {
    id: 'legal-confidential',
    name: 'Legal & NDAs',
    icon: 'ShieldAlert',
    description: 'Confidential Enterprise MSAs, IP Assignments, and Compliance Policies',
    documentCount: 4,
  },
  {
    id: 'financial-memos',
    name: 'Financial & Runway',
    icon: 'TrendingUp',
    description: 'Quarterly financial audits, unit economics, and cloud infrastructure costs',
    documentCount: 4,
  },
  {
    id: 'engineering-specs',
    name: 'Engineering Specs',
    icon: 'Cpu',
    description: 'Moss runtime benchmarks, sub-10ms memory layout, and guardrail architecture',
    documentCount: 4,
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  // --- YC FALL 2026 RFS ---
  {
    id: 'yc-01',
    title: 'YC RFS Fall 2026: Local-First AI & The Small Cloud',
    category: 'Startup Strategy',
    vaultId: 'yc-rfs-2026',
    filename: 'yc_rfs_fall_2026_small_cloud.md',
    tags: ['yc-rfs', 'local-first', 'small-cloud', 'privacy'],
    updatedAt: '2026-09-10',
    sensitivity: 'Internal',
    content: `Y Combinator Request for Startups (Fall 2026): Local-First AI and The Small Cloud.
Traditional cloud AI architectures route all enterprise documents and user queries to centralized vector databases like Pinecone, Weaviate, or cloud Qdrant. This introduces three fatal flaws: high network latency (typically 150ms-400ms round trips), enormous privacy liability for sensitive documents, and spiraling cloud vector hosting bills.
We want to fund startups building "Local-First AI with The Small Cloud":
1. On-Device Indexing & Retrieval: All embeddings, chunking, and semantic search happen locally on the user's client machine or edge appliance using runtime engines like Moss. Retrieval operates in sub-10ms with zero network hops.
2. The Small Cloud: The cloud component is reduced to a minimal, stateless edge relay. It only receives top-k relevant snippets for prompt synthesis, drastically reducing data surface area and cloud cost.
3. Zero-Knowledge Guarantees: Users and enterprise compliance officers can audit network traffic to prove 0 bytes of raw files ever leave the machine.`
  },
  {
    id: 'yc-02',
    title: 'YC RFS Fall 2026: The Sub-10ms Conversational AI Barrier',
    category: 'Voice & Agents',
    vaultId: 'yc-rfs-2026',
    filename: 'sub_10ms_voice_agent_latency.md',
    tags: ['latency', 'moss', 'voice-ai', 'realtime'],
    updatedAt: '2026-09-12',
    sensitivity: 'Internal',
    content: `YC Fall 2026 Focus Area: Eliminating the Conversational Latency Bottleneck.
In real-time voice agents and interactive copilots, human conversation breaks down when latency exceeds 300ms. In standard RAG pipelines:
- Audio STT: 80ms
- Cloud Vector DB Query (Network + Cosine search): 220ms
- LLM Time to First Token (TTFT): 150ms
- Audio TTS: 90ms
Total latency is ~540ms, causing awkward conversational pauses.
By replacing the remote vector database with an in-process semantic engine like Moss (@inferedge/moss), vector retrieval drops from 220ms down to 3.8ms. This single change brings total system turnaround below the 250ms natural conversation threshold, enabling true conversational interruption and fluid flow.`
  },
  {
    id: 'yc-03',
    title: 'YC RFS Fall 2026: Multi-Agent Workflows without Data Leakage',
    category: 'Agentic Architectures',
    vaultId: 'yc-rfs-2026',
    filename: 'agentic_data_sovereignty.md',
    tags: ['agents', 'guardrails', 'sovereignty'],
    updatedAt: '2026-09-08',
    sensitivity: 'Internal',
    content: `Autonomous Agent Memory and Private Retrieval in Enterprise.
When AI agents perform autonomous multi-step reasoning, they generate intermediate thoughts and need access to internal company codebases, employee compensation, and customer records.
If agent memory is hosted in third-party cloud services, every loop leaks organizational intelligence. Tendril solves this with isolated local multi-vault indices. An agent can query an HR index, a Legal index, and an Engineering index with distinct cryptographic ACLs. The agent's reasoning loop executes locally, and only the finalized, PII-sanitized task artifact is committed.`
  },
  {
    id: 'yc-04',
    title: 'YC RFS Fall 2026: Edge Vector Engines Replacing Traditional DBs',
    category: 'Infrastructure',
    vaultId: 'yc-rfs-2026',
    filename: 'edge_vector_engine_thesis.md',
    tags: ['moss', 'wasm', 'vector-search', 'benchmarks'],
    updatedAt: '2026-09-05',
    sensitivity: 'Public',
    content: `Why Traditional Vector Databases are Overkill for 95% of Applications.
Vector databases were modeled after distributed relational warehouses (sharded nodes, Raft consensus, complex orchestration). However, for a user's knowledge base (10,000 to 500,000 chunks), an in-memory or memory-mapped edge engine like Moss performs search in under 5ms using AVX-512 / WebAssembly SIMD and quantized embeddings.
Zero cluster management. Zero cloud bill. Instant cold start. Offline availability by default.`
  },
  {
    id: 'yc-05',
    title: 'YC RFS Fall 2026: Developer Tooling for Guarded AI Relays',
    category: 'Dev Tools',
    vaultId: 'yc-rfs-2026',
    filename: 'guarded_ai_relays.md',
    tags: ['dev-tools', 'guardrails', 'enkrypt'],
    updatedAt: '2026-09-02',
    sensitivity: 'Internal',
    content: `The Guarded AI Relay Architecture.
Instead of giving client apps direct Gemini or OpenAI API keys (which can be reverse-engineered or abused), modern architectures use a stateless edge worker (Cloudflare Workers or Vercel Edge).
The worker acts as a guardrail firewall:
1. Validates ephemeral client token
2. Runs Enkrypt-style input guardrail: filters prompt injection attempts, scans for regex secrets (AWS keys, OpenAI tokens), and redacts PII
3. Proxies top-k snippets into Gemini 2.0 Flash
4. Scans response tokens on output stream for inadvertent data leakage.`
  },

  // --- LEGAL & CONFIDENTIAL ---
  {
    id: 'leg-01',
    title: 'Confidential Master Services Agreement (MSA) - Enterprise Tier',
    category: 'Contracts',
    vaultId: 'legal-confidential',
    filename: 'enterprise_msa_signed_2026.md',
    tags: ['legal', 'contract', 'msa', 'indemnification'],
    updatedAt: '2026-08-14',
    sensitivity: 'Confidential',
    content: `CONFIDENTIAL - ENTERPRISE MASTER SERVICES AGREEMENT #MSA-9821
SECTION 12: DATA EXFILTRATION & PRIVACY INDEMNITY
12.1 The Service Provider covenants that Customer Personal Data and Proprietary Knowledge shall not be transmitted, copied, or stored on any unapproved third-party cloud infrastructure. All indexing of Customer Legal Files must be performed strictly within Customer premises or on authorized client endpoint devices.
12.2 Intellectual Property Rights: All inventions, patent disclosures, and proprietary algorithms indexed by Tendril remain the sole and exclusive property of the Customer.
12.3 Indemnification Clause: Service Provider agrees to defend and indemnify Customer against any third-party claims arising from unauthorized data exfiltration or breach of confidential documentation up to a cap of $10,000,000 USD.`
  },
  {
    id: 'leg-02',
    title: 'Proprietary Information & Inventions Agreement (PIIPA)',
    category: 'Employment',
    vaultId: 'legal-confidential',
    filename: 'piipa_schedule_a_ip_retention.md',
    tags: ['piipa', 'ip', 'confidentiality', 'non-compete'],
    updatedAt: '2026-07-20',
    sensitivity: 'Restricted',
    content: `CONFIDENTIAL SCHEDULE A: PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT
Employee agrees that all trade secrets, customer lists, architectural diagrams for sub-10ms semantic search, patent applications, and proprietary embeddings developed during the period of association are the exclusive property of Tendril Inc.
Non-Compete Covenant: For a period of twelve (12) months following termination, Employee shall not directly engage in the development of competing local-first zero-latency vector engines within North America or the European Union.`
  },
  {
    id: 'leg-03',
    title: 'Cross-Border Data Processing Addendum (DPA) GDPR/CCPA',
    category: 'Compliance',
    vaultId: 'legal-confidential',
    filename: 'gdpr_ccpa_dpa_addendum_v3.md',
    tags: ['gdpr', 'ccpa', 'dpa', 'compliance'],
    updatedAt: '2026-08-30',
    sensitivity: 'Confidential',
    content: `DATA PROCESSING ADDENDUM (DPA) UNDER EU GDPR ARTICLE 28 & CCPA SECTION 1798.
Article 5(1)(c) Data Minimization Mandate:
Tendril guarantees zero transfer of raw documentation across EU-US borders. The Moss local indexing engine ensures all mathematical vector representations and full-text chunks reside exclusively on the data subject's device.
Only ephemeral, anonymized text queries stripped of PII (names, Social Security numbers, credit card tokens) may be routed to the Small Cloud Gemini generation worker. No document retention occurs on cloud inference nodes.`
  },
  {
    id: 'leg-04',
    title: 'Mutual Non-Disclosure Agreement (M-NDA) - Series A Due Diligence',
    category: 'M&A',
    vaultId: 'legal-confidential',
    filename: 'mnda_sequoia_codehack_series_a.md',
    tags: ['mnda', 'due-diligence', 'investor', 'series-a'],
    updatedAt: '2026-09-01',
    sensitivity: 'Confidential',
    content: `MUTUAL NON-DISCLOSURE AGREEMENT FOR DUE DILIGENCE REVIEW.
The parties agree to evaluate potential investment into Tendril's sub-10ms local semantic search stack.
Confidential Information includes:
1. Benchmarks demonstrating 3.2ms median latency with Moss vs 210ms with cloud vector stores.
2. Proprietary hybrid BM25 + dense embedding rank-fusion weights.
3. Architecture of the stateless Cloudflare Edge worker with Enkrypt AI guardrails.`
  },

  // --- FINANCIAL & RUNWAY ---
  {
    id: 'fin-01',
    title: 'Q3 2026 Financial Audit & Operating Runway Report',
    category: 'Financials',
    vaultId: 'financial-memos',
    filename: 'q3_2026_financial_audit_runway.md',
    tags: ['finance', 'runway', 'burn-rate', 'audit'],
    updatedAt: '2026-09-15',
    sensitivity: 'Restricted',
    content: `CONFIDENTIAL - BOARD OF DIRECTORS FINANCIAL MEMO (SEPTEMBER 2026).
Current Cash Balance: $2,840,000 USD.
Monthly Gross Burn Rate: $68,500. Monthly Net Burn Rate: $44,200.
Runway: 64.2 months based on current revenue trajectory.
Revenue (ARR): $291,600 across 18 enterprise design partners.
Key Revenue Drivers: Enterprise Legal teams paying $1,500/seat/year for local-first zero-leakage contract search.`
  },
  {
    id: 'fin-02',
    title: 'Cloud Vector DB vs Moss Local Engine Unit Economics',
    category: 'Infrastructure Economics',
    vaultId: 'financial-memos',
    filename: 'vector_db_vs_moss_unit_economics.md',
    tags: ['unit-economics', 'moss', 'pinecone', 'cloud-costs'],
    updatedAt: '2026-09-11',
    sensitivity: 'Internal',
    content: `INFRASTRUCTURE COST COMPARISON: 100,000 USERS.
Scenario A: Traditional Cloud Architecture (Pinecone / Hosted Qdrant / AWS)
- Cloud Vector DB Pods (100k users * 5k docs): $42,000 / month
- Bandwidth / Egress for raw document uploads: $6,500 / month
- 24/7 Managed Cluster Ops & Site Reliability Engineers: $25,000 / month
Total Cloud RAG Cost: $73,500 / month ($0.73 per user/month).

Scenario B: Tendril Local-First Architecture with Moss
- Client-side indexing & search: $0.00 (computes on user device)
- Egress cost: $0.00 (raw files never leave device)
- Stateless Cloud Gen Worker (Cloudflare Workers + Gemini 2.0 Flash): $1,450 / month
Total Cloud RAG Cost: $1,450 / month ($0.014 per user/month).
Cost Reduction: 98.02% savings in cloud infrastructure!`
  },
  {
    id: 'fin-03',
    title: 'Series A Financial Projections & CAC/LTV Model',
    category: 'Projections',
    vaultId: 'financial-memos',
    filename: 'series_a_cac_ltv_model_2026_2028.md',
    tags: ['series-a', 'cac', 'ltv', 'financial-model'],
    updatedAt: '2026-08-25',
    sensitivity: 'Restricted',
    content: `SERIES A FINANCIAL MODEL: FY2026 - FY2028.
Customer Acquisition Cost (CAC): $1,420 for self-serve dev / legal team tier.
Average Contract Value (ACV): $18,000.
Customer Lifetime Value (LTV): $92,400.
LTV/CAC Ratio: 65.0x (extraordinary efficiency driven by word-of-mouth privacy guarantees).
Gross Margin: 94.5% due to zero cloud vector database hosting overhead.`
  },
  {
    id: 'fin-04',
    title: 'Corporate Treasury and Hedging Strategy',
    category: 'Treasury',
    vaultId: 'financial-memos',
    filename: 'treasury_yield_management_2026.md',
    tags: ['treasury', 'yield', 'banking'],
    updatedAt: '2026-07-31',
    sensitivity: 'Restricted',
    content: `CORPORATE TREASURY POLICY #TP-2026-01.
Allocation of capital reserves across FDIC-insured sweep accounts and short-term US Treasury bills (4.85% yield).
Yield generated per quarter: $34,426 USD, fully offsetting our entire annual edge worker compute costs.`
  },

  // --- ENGINEERING & ARCHITECTURE ---
  {
    id: 'eng-01',
    title: 'Moss Retrieval Engine: Sub-10ms In-Process Vector Indexing',
    category: 'Core Architecture',
    vaultId: 'engineering-specs',
    filename: 'moss_retrieval_engine_architecture.md',
    tags: ['moss', 'sub-10ms', 'zero-latency', 'vector-index'],
    updatedAt: '2026-09-14',
    sensitivity: 'Internal',
    content: `TENDRIL TECHNICAL SPECIFICATION: MOSS IN-PROCESS SEMANTIC ENGINE.
Package: @inferedge/moss v1.0.0-beta.8
How Sub-10ms Search is Achieved:
1. Zero Network Hops: Traditional RAG suffers 150-350ms TCP/TLS handshakes and HTTP round trips to remote vector DBs. Moss loads the vector index directly into process memory (or WebAssembly / ONNX runtime on the client).
2. Quantized Vector Math: Cosine similarity operations utilize SIMD / vector register parallelism, calculating top-k similarity across thousands of document embeddings in 1.8ms to 4.5ms.
3. Hybrid Search Rank Fusion: We combine Moss vector similarity with an in-memory BM25 lexical scorer using Reciprocal Rank Fusion (RRF with k=60). This catches exact keywords (e.g. section numbers '12.1', error codes, ticket IDs) that pure semantic vectors miss.`
  },
  {
    id: 'eng-02',
    title: 'Content Extractor Pipeline: Multi-Format Local Ingestion',
    category: 'Ingestion Pipeline',
    vaultId: 'engineering-specs',
    filename: 'content_extractor_pipeline.md',
    tags: ['extractor', 'chunking', 'pdf', 'markdown'],
    updatedAt: '2026-09-13',
    sensitivity: 'Internal',
    content: `LOCAL CONTENT EXTRACTOR PIPELINE SPECIFICATION.
The local ingestion engine watches local directories and processes dropped files without sending bytes to external parsers:
1. Markdown & Plaintext: Extracted directly, preserving heading hierarchy (#, ##, ###) as semantic chunk boundaries.
2. PDF Extraction: Structured text stream decoding directly on device.
3. Source Code: Language-aware AST/block chunking for TypeScript, Python, JSON, and Rust.
4. Sliding Window Chunking: 512-character chunks with 64-character overlap to preserve semantic continuity across paragraph splits.`
  },
  {
    id: 'eng-03',
    title: 'Enkrypt Guardrails: Client-Side PII Scrubbing & Injection Defense',
    category: 'Security',
    vaultId: 'engineering-specs',
    filename: 'enkrypt_guardrails_specification.md',
    tags: ['guardrails', 'enkrypt', 'pii-redaction', 'security'],
    updatedAt: '2026-09-12',
    sensitivity: 'Internal',
    content: `ENKRYPT-STYLE CLIENT-SIDE PRIVACY GUARDRAILS.
Before any prompt or top-k snippet leaves the local machine for the Gemini Small Cloud worker, it passes through the Tendril Guardrail Engine:
1. PII Redactor: Detects and masks Social Security Numbers (SSN), credit card numbers, email addresses, phone numbers, and IP addresses with cryptographic placeholder tokens [REDACTED_SSN_1], [REDACTED_EMAIL_2].
2. Secret & API Key Scrubber: Scans for AWS access keys, GitHub tokens, private SSH keys, and Google API keys.
3. Adversarial Prompt Injection Defense: Analyzes retrieved context for prompt override instructions ('Ignore previous instructions', 'System prompt dump') to prevent indirect prompt injection attacks.`
  },
  {
    id: 'eng-04',
    title: 'Network Activity Indicator & Zero-Leakage Verifiability Spec',
    category: 'Auditing',
    vaultId: 'engineering-specs',
    filename: 'network_activity_telemetry_spec.md',
    tags: ['telemetry', 'privacy-auditor', 'zero-leakage'],
    updatedAt: '2026-09-10',
    sensitivity: 'Public',
    content: `AUDITABLE PRIVACY & NETWORK TELEMETRY SPECIFICATION.
To fulfill the PRD requirement of "Verifiable Privacy", Tendril implements a Real-Time Network Activity Indicator:
- Phase 1 (File Watching & Ingestion): 0 bytes egress. All embeddings and storage are 100% on-device.
- Phase 2 (Search & Retrieval): 0 bytes egress. Moss executes semantic search locally in < 10ms.
- Phase 3 (AI Generation): Only when the user explicitly clicks 'Generate' or asks a question does the network monitor record egress. The monitor displays exact payload size (typically 400-800 bytes of sanitized text), allowing the user to click and inspect every single byte transmitted to the Small Cloud worker.`
  }
];
