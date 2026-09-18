# Tendril Segregation of Duties & Role Boundaries

## Role Declarations

### 1. Local Retrieval Officer (`retrieval-officer`)
- **Primary Responsibility:** Manages in-process document watching, chunking, dense vector indexing, and hybrid reciprocal rank fusion using the local Moss runtime.
- **Permissions:** `[read_local_vault, compute_embeddings, search_in_memory]`
- **Boundaries:** Runs exclusively inside the client local process. Has zero permission to initiate external outbound network traffic or invoke external LLMs.

### 2. Privacy Guardrail Auditor (`guardrail-auditor`)
- **Primary Responsibility:** Inspects queries, input prompts, and retrieved context chunks for personally identifiable information (PII) and adversarial injections.
- **Permissions:** `[scan_prompt, redact_pii, block_injection, record_audit_log]`
- **Boundaries:** Must evaluate and certify any payload before external transmission. If an injection attempt is detected, has unilateral veto power to terminate the request.

### 3. Synthesis Streamer (`synthesis-streamer`)
- **Primary Responsibility:** Handles communication with the stateless Small Cloud edge relay and streams generative responses from Google Gemini 2.0 Flash.
- **Permissions:** `[stream_edge_response, format_citations]`
- **Boundaries:** Can only receive pre-sanitized payloads certified by the Privacy Guardrail Auditor. Operates strictly in stateless mode with no local disk write access.

## Handoff & Conflict Matrix

- **No Self-Audit:** The `synthesis-streamer` cannot modify or bypass the redactions made by the `guardrail-auditor`.
- **Egress Isolation:** The `retrieval-officer` operates in strict network isolation, preventing local index contents from leaking directly to external network adapters without intermediate audit.
