# EXPLAINABILITY.md

This document explains the internal mechanisms, data lineage, and operational boundaries of **Tendril** in accordance with the OpenGAP specification.

---

## How the Agent Decides

Tendril makes decisions through a deterministic, local-first retrieval and synthesis pipeline combining in-process hybrid search (dense vector embeddings and BM25 lexical keyword matching) with client-side privacy guardrails and edge-based generative answering.

### 1. Decision Architecture
The decision process flows through sequential stages:

```
User Query / Keystroke
    │
    ▼
[Stage 1: Intent & Vault Selection]
    │  - Classifies user intent: Instant Search vs. Generative Copilot Synthesis
    │  - Identifies target vault scope (yc-rfs, legal, financial, engineering, user files)
    ▼
[Stage 2: In-Process Dual-Stream Retrieval (Moss Engine)]
    │  - Stream A: Dense Vector Semantic Search (65% weight)
    │  - Stream B: BM25 Lexical Keyword Search (35% weight)
    ▼
[Stage 3: Reciprocal Rank Fusion (RRF)]
    │  - Calculates composite relevance score across dense and lexical ranks
    │  - RRF Score = 0.65 / (60 + Dense Rank) + 0.35 / (60 + Lexical Rank)
    ▼
[Stage 4: Thresholding & Context Selection]
    │  - Enforces relevance threshold cutoff (score >= 0.45)
    │  - Selects Top-k candidate snippets (k = 3 to 5)
    ▼
(Branching Decision: Are relevant snippets found?)
    ├── False ──► Halts synthesis; notifies user that local vaults lack relevant data
    └── True  ──► [Stage 5: Client-Side Enkrypt Guardrail Interception]
                      │  - Scans prompt for adversarial jailbreaks & system overrides
                      │  - Redacts sensitive PII (SSN, credit cards, emails, API keys)
                      ▼
                  [Stage 6: Edge Generation Relay (Gemini 2.0 Flash)]
                      │  - Transmits sanitized prompt and redacted snippets over HTTPS
                      │  - Generates strictly grounded response with document citations
                      ▼
                  User Answer with Document & Section Citations
```

### 2. Retrieval Criteria & Hybrid Fusion Rubric
Tendril combines two complementary search methodologies to determine document relevance:
- **Dense Vector Semantic Search (65% Weight)**: Encodes queries and document chunks into dense vector representations. This captures conceptual intent, synonyms, and high-level relevance (e.g., connecting *"runway"* with *"cash burn and monthly operating expenses"*).
- **BM25 Lexical Keyword Search (35% Weight)**: Evaluates exact term frequencies and inverse document frequencies. This guarantees high precision for specific clauses, section identifiers, acronyms, and alphanumeric codes (e.g., `"Section 12.1"`, `"PIIPA"`, `"GDPR Article 28"`).

### 3. Thresholding & Refusal Decision Criteria
- **Normalized Cutoff Score (0.45)**: Document chunks scoring below 0.45 normalized composite relevance are discarded to prevent out-of-domain context from polluting the LLM window.
- **Explicit Missing Data Handling**: If no vault chunks meet the threshold, Tendril decides **not to synthesize an answer**. It informs the user: *"No relevant documents were found in the local vault to answer this query."* This deterministic refusal prevents model hallucination.

### 4. Client-Side Guardrail Decision Gates
Before any external HTTP payload is constructed:
- **Adversarial Injection Check**: Evaluates the prompt against known jailbreak strings, prompt leakage requests, and role-override commands. If detected, the agent triggers a hard block (`GUARDRAIL_BLOCKED`) and logs a security event.
- **PII Redaction Gate**: Every entity matching configured regex patterns for Social Security numbers, credit card numbers, email addresses, or API keys is replaced with a token placeholder (`[REDACTED_SSN]`, `[REDACTED_CREDIT_CARD]`, `[REDACTED_EMAIL]`, `[REDACTED_API_KEY]`).

### 5. Fallback & Offline Decision Mechanism
If network connectivity is lost or the user enables **Offline Mode**:
- The agent falls back to **100% on-device local search**.
- Search queries, vector calculations, BM25 matching, and vault browsing continue without interruption.
- The generative edge copilot is cleanly disabled with a user-facing advisory indicating that synthesis requires network restoration.

### 6. Human-in-the-Loop Governance
Tendril is designed as an auditable assistant:
- **Zero Background Sync**: Tendril never indexes or modifies external repositories without local user action.
- **Privacy Inspector Drawer**: Users can inspect live telemetry verifying that 0 bytes of raw data egressed the device during search operations.
- **Instant Kill Switch**: Users can instantly disconnect the application or switch vaults, terminating any pending edge streaming requests immediately.

---

## The Data It Uses

Tendril operates strictly under a local-first data sovereignty architecture with zero raw data exfiltration.

### 1. Ingested Input Data
The agent consumes data directly from the user's local filesystem:
- **Document Files**: Markdown (`.md`), plain text (`.txt`), Adobe PDF documents (`.pdf`), source code (`.ts`, `.py`, `.js`), and configuration files (`.json`, `.yaml`).
- **Domain Vaults**:
  - *YC Fall 2026 Requests for Startups (RFS)*: Industry trends, small cloud architecture, local-first RAG.
  - *Confidential Legal & NDAs*: Master Services Agreements, IP assignment terms, liability limitation clauses.
  - *Financial Memos & Audits*: Q3 2026 balance sheets, burn rates, CAC/LTV unit economics.
  - *Engineering Specifications*: Moss runtime internals, memory layout specs, API schemas.
  - *User Imported Workspace Files*: Local folders and documents dropped into the application by the user.

### 2. In-Memory Chunking & Storage Architecture
- **In-Process Chunking**: Documents are split into 500-token chunks with a 50-token sliding overlap. All tokenization and text processing execute strictly in local process memory.
- **In-Process Moss Index**: Embeddings and lexical indices are held in local memory and cached in local IndexedDB or client disk storage.
- **0-Byte Raw Egress Guarantee**: Raw documents, unredacted files, and complete vaults are **never** uploaded to external servers.

### 3. External Relay Data (Small Cloud Zone)
When generative answer synthesis ("Ask Copilot") is explicitly requested:
- **Sanitized Prompt**: The user's prompt after PII redaction and injection screening.
- **Sanitized Top-k Snippets**: The top 3 to 5 extracted chunks, with all PII patterns masked.
- **Masked PII Patterns**:
  - Social Security Numbers: `\b\d{3}-\d{2}-\d{4}\b` $\rightarrow$ `[REDACTED_SSN]`
  - Credit Card Numbers: `\b(?:\d{4}[-\s]?){3}\d{4}\b` $\rightarrow$ `[REDACTED_CREDIT_CARD]`
  - Email Addresses: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` $\rightarrow$ `[REDACTED_EMAIL]`
  - API Keys & Secrets: `sk-...`, `ghp_...`, `AIza...` $\rightarrow$ `[REDACTED_API_KEY]`

### 4. Data Privacy, Storage, and Retention
- **Stateless Edge Worker**: The edge generation service (Google Gemini 2.0 Flash) is completely stateless. It does not store user prompts, snippets, or session logs in remote databases.
- **Session Memory**: All chat history and search indices reside in local client memory and can be cleared by the user at any time.
- **Audit Logging**: Structured JSON audit logs recording timestamps, latency, redactions, and 0-byte egress proofs are stored locally for compliance auditing (GDPR Article 28).

---

## Limitations

Understanding the operational boundaries and constraints of Tendril is critical for safe deployment.

### 1. In-Memory Scale and Capacity Constraints
- **Workstation Vault Limits**: The in-process Moss runtime is optimized for workstations handling up to **50,000 document chunks** (~250 MB of raw text) at sub-10ms latency.
- **Partitioning Requirement**: Very large enterprise corpuses (>500,000 documents) must be partitioned across domain-specific vaults rather than indexed into a single flat in-memory collection.

### 2. Compute and Cold-Start Profile
- **Initial Embedding Latency**: While retrieval takes under 2ms, initial embedding computation for thousands of documents requires local CPU/GPU compute during startup.
- **Hardware Variation**: Performance depends on the host machine's processing capabilities. Low-spec hardware will exhibit longer initial indexing times.

### 3. Connectivity and Synthesis Boundaries
- **Offline Search Independence**: Keystroke search, BM25 filtering, and vault navigation work 100% offline.
- **LLM Synthesis Dependency**: Copilot generative answering requires outbound HTTPS access to the stateless edge generation worker; synthesis is unavailable in fully offline environments.

### 4. Scope and Grounding Boundaries
- **No Live Internet Access**: Tendril does not have a web crawler or search engine integration; its knowledge is strictly limited to documents present in local vaults.
- **Static Vault Snapshots**: The agent reflects local documents at the time of file observation. Deletion or external modification of files requires file-watcher re-indexing.

### 5. Media and Formatting Constraints
- **Text-Focused Extraction**: Tendril natively parses text-based formats (Markdown, Code, TXT, JSON, text-layer PDFs).
- **OCR Pre-Processing Requirement**: Image-only PDFs, scanned document bitmaps, and multimedia files require external OCR preprocessing before ingestion.

### 6. Security and Guardrail Edge Cases
- **Regex Coverage**: PII redaction relies on standard regex heuristics. Non-standard formatting or deliberate obfuscation of sensitive entities may escape client-side filters.
- **Prompt Injection Evolution**: Client-side guardrails neutralize known injection and jailbreak patterns, while secondary defense relies on system prompt constraints enforced by the foundation model.

---

## Summary & Compliance Checklist

| Checkpoint 2 Requirement | Corresponding Section | Status |
| :--- | :--- | :---: |
| **How the agent decides** | [How the Agent Decides](#how-the-agent-decides) | **Covered** |
| - Decision architecture & 6-stage pipeline | Section 1 | Verified |
| - Dual-engine retrieval & RRF scoring formula | Section 2 | Verified |
| - Thresholding, refusal & missing data logic | Section 3 | Verified |
| - Guardrail interception & offline fallback | Section 4 & 5 | Verified |
| - Human-in-the-loop & privacy inspector | Section 6 | Verified |
| **The data it uses** | [The Data It Uses](#the-data-it-uses) | **Covered** |
| - Ingested local files & multi-vault sources | Section 1 | Verified |
| - In-memory chunking & 0-byte egress guarantee | Section 2 | Verified |
| - External relay data & PII redaction patterns | Section 3 | Verified |
| - Stateless edge worker & local audit logging | Section 4 | Verified |
| **Its limitations** | [Limitations](#limitations) | **Covered** |
| - In-memory capacity & hardware compute profile | Section 1 & 2 | Verified |
| - Connectivity boundaries (offline vs synthesis) | Section 3 | Verified |
| - Grounding scope & no live web browsing | Section 4 | Verified |
| - Media/OCR constraints & guardrail edge cases | Section 5 & 6 | Verified |
