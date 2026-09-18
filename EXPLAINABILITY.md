# EXPLAINABILITY

> **Tendril Explainability & Transparency Documentation**  
> This document details the decision-making mechanics, data usage and boundaries, and system limitations of Tendril, satisfying all requirements of the OpenGAP specification and GitAgent Passport Checkpoint 2.

---

## How the agent decides

Tendril operates as a local-first retrieval copilot with a deterministic, multi-stage decision pipeline designed to minimize latency and eliminate data leakage:

### 1. Intent Recognition and Route Selection
- When a user inputs a query or keystroke, Tendril first parses the query to determine the user's intent:
  - **Instant Search / Navigation Intent:** Evaluated purely on-device at keystroke time.
  - **Synthesis / Question Answering Intent:** Evaluated for generative completion ("Ask Copilot").
- The agent determines the target vault scope (`yc-rfs`, `confidential-legal`, `financial-memos`, `engineering-specs`, or user-imported files). If no specific vault is selected, it queries across all active local collections concurrently.

### 2. Dual-Engine Retrieval (Dense + Lexical)
- Rather than relying on an external cloud vector database, Tendril queries the in-process **Moss runtime** (`@inferedge/moss`) directly within local process memory.
- The retrieval engine runs two simultaneous scoring processes:
  - **Dense Vector Semantic Search (65% weight):** Computes cosine similarity between the query embedding and local document chunk vectors, capturing semantic intent, conceptual synonyms, and high-level relevance.
  - **BM25 Lexical Keyword Search (35% weight):** Matches exact keywords, clause numbers, acronyms, and contractual identifiers (e.g., `"Section 12.1"`, `"PIIPA"`, `"GDPR"`).

### 3. Reciprocal Rank Fusion (RRF) Decision Logic
- To resolve competing candidates from semantic and lexical searches without bias, Tendril applies Reciprocal Rank Fusion:
  $$\text{RRF Score}(d) = \frac{0.65}{60 + \text{Rank}_{\text{dense}}(d)} + \frac{0.35}{60 + \text{Rank}_{\text{lexical}}(d)}$$
- Candidates are ranked by composite score. Documents that perform well across both dense and lexical pipelines receive the highest priority.

### 4. Thresholding and Context Inclusion Decisions
- **Relevance Cutoff:** Any document chunk with a normalized composite score below **0.45** is discarded as irrelevant to avoid diluting context or inducing hallucinations.
- **Top-k Extraction:** The top 3 to 5 highest-ranking snippets above the cutoff are selected.
- **Missing Data Decision:** If no snippets meet the threshold, Tendril explicitly halts the synthesis pipeline and notifies the user that the local vault contains no relevant documents, rather than hallucinating or interpolating ungrounded facts.

### 5. Client-Side Guardrail Evaluation
Before any external generation request is dispatched:
- **Injection Interception:** The user prompt is evaluated against adversarial jailbreak, system prompt override, and instruction hijacking patterns. If detected, the agent immediately rejects the request with a `GUARDRAIL_BLOCKED` decision.
- **PII Redaction Decision:** Any sensitive entity (SSN, credit card, corporate email, API key) detected in the prompt or retrieved snippets is replaced with redacted tokens (e.g., `[REDACTED_SSN]`).

### 6. Edge Generation and Grounded Synthesis
- Only the sanitized prompt and redacted top-k snippets are transmitted to the stateless edge inference worker (Google Gemini 2.0 Flash).
- The edge model is strictly prompted to act as a grounded synthesizer: cite source files and section names directly, and refuse to answer questions outside the provided evidence.

---

## The data it uses

Tendril is architected around a strict data sovereignty model: **Local-First Retrieval, Small Cloud Generation**.

### 1. Ingested Data Types & Sources
- **Local Document Files:** Plain text (`.txt`), Markdown (`.md`), PDF documents (`.pdf`), configuration files (`.json`, `.yaml`), and source code (`.ts`, `.py`, `.js`).
- **Domain Vaults:**
  - *YC Fall 2026 Requests for Startups (RFS):* Startup trends, voice agent latency, local-first RAG.
  - *Confidential Legal & NDAs:* Enterprise MSAs, IP assignment agreements, limitation of liability clauses.
  - *Financial Memos & Audits:* Q3 2026 financial records, burn rate analysis, runway metrics.
  - *Engineering Specifications:* Moss runtime internals, memory layouts, and API schemas.
  - *User Imported Data:* Files dragged and dropped into the application by the user.

### 2. In-Memory Processing & Chunking
- When files are watched or loaded, text extraction and chunking (500 tokens per chunk with 50-token sliding overlap) occur exclusively in the client's local memory.
- Dense vector embeddings and BM25 token frequencies are generated locally and stored in local memory or local IndexedDB cache.

### 3. Strict 0-Byte Raw Egress Boundary
- **Zero Document Uploads:** Raw files, whole documents, and unchunked vaults are **never** transmitted over the network.
- **Local Search Egress:** Keystroke search, vector cosine similarity, and BM25 ranking produce **0 Bytes** of outbound network egress. A real-time Privacy Inspector verifies this telemetry live in the UI.

### 4. Transmitted Data (Small Cloud Relay)
When generative answering ("Ask Copilot") is explicitly triggered:
- **Sanitized Context Snippets:** Only the top-k extracted snippets (post-PII redaction) are sent.
- **Sanitized User Query:** The user's query with all PII patterns masked.
- **Data Redaction Details:**
  - US Social Security Numbers (`\b\d{3}-\d{2}-\d{4}\b`) masked as `[REDACTED_SSN]`
  - Credit Card Numbers (`\b(?:\d{4}[-\s]?){3}\d{4}\b`) masked as `[REDACTED_CREDIT_CARD]`
  - Email Addresses (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`) masked as `[REDACTED_EMAIL]`
  - API Keys and Access Tokens (`sk-...`, `ghp_...`, `AIza...`) masked as `[REDACTED_API_KEY]`

### 5. Data Retention & Statelessness
- The edge inference worker is completely stateless: it does not persist user queries, session transcripts, or snippets to any remote disk or database.
- Once the streaming response completes, the edge worker's memory is garbage-collected. All conversation history resides exclusively on the user's local device.

---

## Its limitations

While Tendril provides privacy-preserving, sub-10ms retrieval, users and auditors should understand its operational boundaries:

### 1. In-Memory Index Capacity
- The in-process Moss runtime is optimized for personal, workstation, and team vaults containing up to **50,000 document chunks** (~250 MB of raw text).
- Enterprise corpuses exceeding hundreds of thousands of files require partitioning across separate specialized vaults rather than a single monolithic in-memory index.

### 2. Cold-Start Embedding Compute
- Although subsequent searches complete in sub-10ms (averaging 1.89ms), initial indexing of large document collections requires local CPU/GPU compute to calculate dense embeddings.
- On low-powered mobile or embedded hardware, initial batch indexing may take several seconds to a minute depending on vault size.

### 3. Offline vs. Online Capabilities
- **Local Search (100% Offline):** Hybrid semantic search, BM25 keyword matching, vault navigation, and snippet inspection operate completely without an internet connection.
- **Copilot Synthesis (Requires Network):** Generative answer streaming relies on the stateless edge worker and Google Gemini 2.0 Flash; synthesis is unavailable in offline mode until network connectivity is restored.

### 4. Scope and Knowledge Freshness
- Tendril has zero access to the live public web or external search engines; its knowledge is strictly bounded by the documents loaded into local vaults.
- If a document is updated on disk, it is re-indexed via local file watching, but the agent cannot know facts that do not exist within the local filesystem.

### 5. File Formats and Media Limitations
- Tendril natively parses text-based formats (Markdown, Code, TXT, JSON, text-based PDF).
- Complex scanned bitmap PDFs, image-only documents, audio files, and video streams require external OCR or transcription before indexing into Tendril.

### 6. Guardrail Edge Cases
- Client-side regex guardrails detect known patterns of PII and standard prompt injection vectors.
- Highly obfuscated, non-standard, or zero-day adversarial jailbreak attempts may require secondary evaluation by edge model system prompt constraints.

---

## Limitations

For reference, the key operational constraints of Tendril are summarized below:
- **Retrieval Scale:** Optimized for up to 50,000 chunks per workstation vault.
- **Synthesis Dependency:** Requires outbound HTTPS connectivity to edge worker for generative streaming; search remains offline-capable.
- **Grounding Scope:** Bounded exclusively to local vault contents; no live internet browsing.
- **OCR Requirement:** Scanned image-based PDFs require pre-processing before ingestion.
- **Hardware Profile:** Embedding generation scales with available local CPU/GPU resources.
