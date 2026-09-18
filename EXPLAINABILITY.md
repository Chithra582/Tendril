# Tendril Explainability Manual (EXPLAINABILITY.md)

> **OpenGAP Checkpoint 02 Compliance:** This document details the decision-making architecture, data provenance and usage, safety guardrails, operational limitations, and auditability controls for the Tendril agent.

---

## 1. Executive Summary & Architecture Overview

**Tendril** is a privacy-first, local-first retrieval copilot that pairs an in-process dense vector and lexical search runtime (Moss, `@inferedge/moss`) on the user's workstation with a stateless Small Cloud edge inference worker (powered by Google Gemini 2.0 Flash).

The architecture is strictly divided into two security zones:
1. **Local-First Zone (User Workstation):** File watching, multi-format text extraction (Markdown, TXT, PDF, TypeScript, Python), semantic chunking, dense vector embedding, in-memory BM25 lexical indexing, and hybrid reciprocal rank fusion occur entirely inside the local device memory. **0 bytes of raw document data leave the local machine.**
2. **Small Cloud Zone (Stateless Edge Relay):** When the user triggers generative synthesis, client-side Enkrypt guardrails scan the prompt and retrieved snippets, redacting any sensitive PII or credentials and neutralizing adversarial prompt injections before sending only the top-k sanitized snippets to the edge LLM.

```
[User Query]
     │
     ▼
[Step 1: Intent & Vault Selection]
     │
     ▼
[Step 2: Moss In-Process Hybrid Search]
 ├── Dense Vector Semantic Search (65%)
 └── Lexical BM25 Keyword Search (35%)
     │
     ▼
[Step 3: Reciprocal Rank Fusion (RRF)]
     │
     ▼
[Step 4: Top-k Relevant Snippet Extraction]
     │
     ▼
[Step 5: Enkrypt Privacy Guardrails]
 ├── Regex PII Sanitization (SSN, Cards, Keys)
 └── Adversarial Prompt Injection Neutralizer
     │
     ▼
[Step 6: Edge LLM Generation (Gemini 2.0 Flash)]
     │
     ▼
[Grounded Answer with Vault Citations]
```

---

## 2. How the Agent Decides (Decision-Making Process)

### Step 1: Query Ingestion & Scope Classification
When a user submits a query or types in the live search bar:
- The agent determines the target vault context (e.g., *YC Fall 2026 RFS*, *Confidential Legal & NDAs*, *Financial Memos & Runway*, *Engineering Specs*, or *User Local Files*).
- If no specific vault is isolated, the active workspace indices are queried concurrently.

### Step 2: Dual-Stream In-Memory Retrieval
The agent queries the local in-process Moss database using two complementary retrieval strategies:
- **Dense Vector Semantic Retrieval:** Uses dense embeddings computed locally to identify conceptual relevance, synonyms, and high-level intent (e.g., matching "funding runway" to "64-month burn rate").
- **Lexical BM25 Retrieval:** Matches exact keywords, clause numbers, and entity names (e.g., `"Section 12.1"`, `"PIIPA"`, `"GDPR Article 28"`).

### Step 3: Hybrid Reciprocal Rank Fusion (RRF)
To reconcile semantic and lexical candidate sets into an unbiased rank list, Tendril executes Reciprocal Rank Fusion:
$$\text{Score}(d) = \frac{0.65}{k + \text{Rank}_{\text{dense}}(d)} + \frac{0.35}{k + \text{Rank}_{\text{lexical}}(d)}$$
where $k = 60$ is a smoothing constant. Documents ranked highly across both dense and lexical passes receive superior composite priority.

### Step 4: Dynamic Thresholding & Context Window Packing
- Snippets below a relevance threshold ($< 0.45$ normalized score) are discarded to minimize hallucination risk.
- The top-k candidates (typically $k=3$ to $5$) are selected based on diversity and relevance to form the contextual evidence block.

### Step 5: Guardrail Interception (Enkrypt Layer)
Before any network payload is assembled:
- The system checks whether the prompt attempts prompt injection, system prompt leakage, or instruction hijacking. If detected, the request is aborted with an audit alert.
- The retrieved snippets and user prompt undergo regex-based PII masking, replacing sensitive patterns with token placeholders (e.g., `[REDACTED_SSN]`, `[REDACTED_API_KEY]`).

### Step 6: Grounded Generation Relay
- The sanitized payload is transmitted over HTTPS to the stateless edge server.
- The model (Google Gemini 2.0 Flash) is instructed with strict grounding rules: answer solely using the provided snippets, cite exact vault documents, and explicitly state if information is missing.

---

## 3. The Data It Uses & Provenance

### Data Sources
- **Local Filesystem Directories:** User-selected local folders containing `.md`, `.txt`, `.pdf`, `.json`, `.ts`, `.py`, and `.csv`.
- **Pre-Configured Enterprise Vaults:**
  - *YC Fall 2026 RFS:* Emerging startup sectors, agent protocols, edge computing benchmarks.
  - *Confidential Legal & NDAs:* Master Service Agreements, limitation of liability clauses, IP assignments.
  - *Financial Audits & Unit Economics:* Q3 2026 audit, CAC/LTV breakdowns, runway calculations.
  - *Engineering Architecture:* Moss runtime specifications and memory layout documentation.

### Data Boundaries & 0-Byte Egress Guarantee
- **File Watching & Chunking:** All text parsing and chunking (500 tokens per chunk with 10% overlap) execute strictly in local process memory.
- **Index Persistence:** Embeddings and lexical indices are stored locally on the client filesystem / IndexedDB.
- **Zero Raw Document Transmission:** At no point in the lifecycle are raw files or full documents uploaded to external servers. Only the top-k extracted snippets (post-sanitization) are ever sent over the wire, and only when the user explicitly clicks "Ask Copilot".

---

## 4. Guardrails & Safety Architecture

Tendril implements client-side and server-side Enkrypt-style guardrails:

1. **PII Masking:**
   - **Social Security Numbers (SSN):** `\b\d{3}-\d{2}-\d{4}\b` $\rightarrow$ `[REDACTED_SSN]`
   - **Credit Card Numbers:** `\b(?:\d{4}[-\s]?){3}\d{4}\b` $\rightarrow$ `[REDACTED_CREDIT_CARD]`
   - **Email Addresses:** `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` $\rightarrow$ `[REDACTED_EMAIL]`
   - **API Keys & Secrets:** `\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z-_]{35})\b` $\rightarrow$ `[REDACTED_API_KEY]`
2. **Adversarial Injection Detection:**
   - Regular expression scanning for typical jailbreak and override patterns (`ignore previous instructions`, `system override`, `dan mode`, `reveal system prompt`).
   - If triggered, the request terminates immediately on the client with a `GUARDRAIL_BLOCKED` response.

---

## 5. System Limitations & Known Constraints

1. **In-Memory Scale:** In-process Moss indexing is optimized for sub-10ms performance on personal and team vaults (up to ~50,000 document chunks or ~250MB text). Extreme enterprise corpuses (>1M documents) require hierarchical partitioning across multiple vaults.
2. **Cold Boot Embedding Latency:** Initial document indexing performs vector embedding locally. While subsequent queries execute in $< 2$ms, initial ingestion requires computational throughput proportional to document count.
3. **Offline Mode Boundary:** In offline mode (simulated via the top bar or physical network disconnect), local search, keyword matching, and vault browsing remain 100% operational. However, generative LLM synthesis (Gemini 2.0 Flash) is disabled until connectivity is restored.
4. **Context Window Selection:** Top-k retrieval selects up to 5 snippets; highly dispersed answers requiring synthesis across $>20$ separate files may require multiple iterative queries.

---

## 6. Auditability, Verification & Human Oversight

- **Live Privacy Inspector:** The application UI includes an auditable Privacy Inspector drawer showing live egress counters (0 Bytes for local search) and packet payload inspectors.
- **Structured Audit Logging:** Every search query, guardrail redaction, and edge call produces an immutable JSON log conforming to GDPR Article 28 and CCPA requirements.
- **Human-in-the-Loop & Kill Switch:** Users retain continuous override capabilities:
  - Users can toggle between purely local search and generative AI.
  - The instant "Disconnect / Offline Mode" control acts as an immediate software kill switch, blocking all outbound network traffic instantaneously.
