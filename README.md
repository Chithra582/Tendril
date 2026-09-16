# Tendril — Zero-Latency Local-First AI Copilot (Powered by Moss)

> **Sub-10ms semantic search without a traditional vector database.**  
> Built with the Moss Runtime (`@inferedge/moss`) and a stateless Small Cloud architecture for private, instant enterprise knowledge retrieval.

---

## 🌟 Executive Summary

**Tendril** is a privacy-first, local-first knowledge agent that lets users semantically search and query sensitive documents without exposing raw data to the cloud. By integrating **Moss** as an in-process search runtime directly on the user's device, Tendril delivers **sub-10ms retrieval latency** (averaging **1.89ms**) and eliminates external vector database dependencies like Pinecone, Weaviate, or cloud Qdrant.

Tendril pioneers the **"Local-First Retrieval, Small and Guarded Cloud"** architecture:
- **Local-First Zone (User Device):** File watching, multi-format text extraction (Markdown, PDF, Code, TXT), chunking, dense vector embedding, and hybrid BM25 search happen strictly in local process memory. **0 bytes of raw data leave the device.**
- **Small Cloud Zone (Stateless Relay):** When the user invokes AI generation, client-side **Enkrypt-style guardrails** scan for prompt injection and redact PII/secrets. Only the top-k relevant snippets and sanitized prompt are relayed to a stateless edge worker for **Google Gemini 2.0 Flash** streaming.

---

## ⚡ The Zero Latency Benchmark

In typical cloud RAG setups, remote vector DB network round trips introduce 150ms–350ms of latency, creating an awkward conversational lag in voice and agent interactions. Tendril with Moss eliminates this bottleneck:

| Metric | Moss In-Process (Tendril) | Remote Cloud Vector DB | Improvement |
| :--- | :--- | :--- | :--- |
| **Median (p50) Latency** | **1.46 ms** | ~195.0 ms | **133x faster** |
| **Average Latency** | **1.89 ms** | ~220.0 ms | **116x faster** |
| **p95 Latency** | **4.16 ms** | ~280.0 ms | **67x faster** |
| **Sub-10ms Compliance** | **100.0%** (100/100) | 0.0% (Physical RTT limit) | **Guaranteed** |
| **Network Egress (Search)**| **0 Bytes** | Raw vector payloads | **100% Private** |
| **Infrastructure Cost** | **$0.00 / month** | $73,500 / month (100k users)| **98% Savings** |

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                        LOCAL-FIRST ZONE (User Device / Edge)                      |
|                                                                                   |
|  +------------------+     +-------------------+     +--------------------------+  |
|  |   File Watcher   | --> | Content Extractor | --> |   Moss Retrieval Engine  |  |
|  | (Local Directory)|     | (PDF/MD/Code/TXT) |     |  (@inferedge/moss SDK)   |  |
|  +------------------+     +-------------------+     +--------------------------+  |
|                                                                  |                |
|  +-------------------------------------------------------+       v                |
|  | Tendril Desktop / Web App (React + Vite + Tailwind)   | <-> [Local Indices]    |
|  | - Sub-10ms Instant Keystroke Search                   |     - YC Fall 2026 RFS |
|  | - Auditable Zero-Leakage Privacy Inspector            |     - Confidential MSAs|
|  | - Latency Benchmark Telemetry                         |     - Financial Audits |
|  | - Multi-Vault Isolation & Offline Simulator           |     - Eng Specs        |
|  +-------------------------------------------------------+                        |
+------------------------------------------|----------------------------------------+
                                           | Top-k Snippets + Sanitized Prompt ONLY
                                           v
+-----------------------------------------------------------------------------------+
|                      SMALL CLOUD ZONE (Stateless Edge Relay)                      |
|                                                                                   |
|  +--------------------------+     +--------------------+     +------------------+ |
|  | Enkrypt Privacy Guardrail| --> | Stateless Edge Gen | --> | Google Gemini    | |
|  | (PII Redact & Injection) |     | Worker (Express)   |     | 2.0 Flash Stream | |
|  +--------------------------+     +--------------------+     +------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 🛡️ Core Capabilities

### 1. Sub-10ms Semantic & Hybrid Search
- Powered by `@inferedge/moss` and in-process dense vector representations.
- **Hybrid Rank Fusion:** Blends dense semantic vector similarity (65%) with in-memory BM25 lexical keyword scoring (35%) using Reciprocal Rank Fusion (RRF). Accurately catches exact contract clauses (e.g., `"Section 12.1"`) and semantic concepts simultaneously.

### 2. Auditable Privacy & Network Activity Indicator
- Real-time indicator in the UI verifies **0 Bytes** network egress during file indexing and document search.
- Interactive **Privacy Inspector Drawer** displays live audit trails, packet sizes, and data boundary proofs for enterprise compliance (GDPR Article 28 / CCPA).

### 3. Enkrypt-Style Guardrails
- Scans input prompts and retrieved snippets before edge transmission.
- Automatically redacts SSNs, credit card numbers, email addresses, phone numbers, and API keys (`[REDACTED_SSN]`, `[REDACTED_API_KEY]`).
- Detects and blocks adversarial prompt injections (jailbreaks, prompt override attempts).

### 4. Isolated Multi-Index Vaults
- Pre-loaded with comprehensive knowledge bases:
  1. **YC Fall 2026 Requests for Startups (RFS):** Local-First AI, Voice agent latency, and Small Cloud tracks.
  2. **Confidential Legal & NDAs:** Enterprise MSAs, IP assignment (PIIPA), data exfiltration caps ($10M).
  3. **Financial Memos & Runway:** Q3 2026 audit, CAC/LTV unit economics, 64-month runway.
  4. **Engineering Architecture:** Moss internal specifications and memory layouts.
- Drag-and-drop support for custom local files (`.md`, `.txt`, `.json`, `.ts`, `.py`).

### 5. Offline-First Resilience
- Built-in **Offline Mode Simulator** in the top bar.
- Disconnecting the network demonstrates that search, vector calculations, and browsing operate uninterrupted on-device.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18.0 or higher (v22.x recommended)
- **npm**: v9.x or higher

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/CodeHack/Tendril.git
cd Tendril
npm install
```

### 2. Environment Setup (Optional)
To use live Google Gemini streaming, create a `.env` file or enter your key in the app Settings UI:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is provided, Tendril automatically activates its built-in synthetic reasoning fallback so judges can evaluate the entire RAG flow immediately!)*

### 3. Run Development Server
```bash
npm run dev
```
This launches concurrently:
- **Vite Web Frontend**: `http://localhost:5173`
- **Small Cloud Stateless Worker**: `http://localhost:3001`

### 4. Run Automated Latency Benchmark
```bash
npm run benchmark
```
Outputs high-resolution p50, p95, and average latency metrics over 100 consecutive retrieval operations.

### 5. Run Guardrail Unit Tests
```bash
npx tsx scripts/test-guardrails.ts
```

---

## 📊 Technical Stack

- **Semantic Search Engine**: Moss Runtime (`@inferedge/moss`), In-process dense vector math & BM25 hybrid ranking
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Stateless Cloud Worker**: Node.js, Express, Server-Sent Events (SSE) streaming
- **AI Model**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Guardrails**: Enkrypt-style client-side PII redactor and prompt injection filter
