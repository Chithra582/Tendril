# AGENTS.md — Tendril Universal Agent Instructions

## Overview
Tendril is a privacy-first, local-first retrieval copilot powered by the in-process Moss runtime (`@inferedge/moss`). It enables sub-10ms semantic and lexical search over local document vaults with zero cloud data leakage.

## Operational Workflow

When interacting with Tendril in any agent runtime:
1. **Target Vault Selection:** Route queries to the appropriate local vault (`yc-rfs`, `confidential-legal`, `financial-memos`, `engineering-specs`, or user-imported files).
2. **Perform Hybrid Local Search:** Query the local Moss engine to retrieve top-k snippets using dense semantic search blended with BM25 lexical keyword matching.
3. **Audit & Sanitize:** Verify that 0 raw document bytes have exited the device and that all sensitive PII patterns (SSN, credit card, API keys) are redacted.
4. **Answer Grounding:** Formulate answers strictly based on retrieved vault snippets, providing precise document citations and section references.
5. **Acknowledge Data Boundaries:** If information is missing from the local vault, explicitly notify the user rather than guessing or interpolating facts.
