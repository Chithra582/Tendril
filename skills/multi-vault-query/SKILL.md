---
name: multi-vault-query
description: Manages cross-vault and domain-isolated search across legal, financial, engineering, and startup knowledge bases
---

# Multi-Vault Query Skill

## Purpose
Manage retrieval routing across segregated knowledge domains, ensuring strict tenant/vault boundary isolation while allowing unified synthesis when appropriate.

## Capabilities
- Selection between specialized vaults:
  - `yc-rfs`: Y Combinator Fall 2026 Requests for Startups and market insights.
  - `confidential-legal`: Master Services Agreements, NDAs, liability clauses, and IP terms.
  - `financial-memos`: Q3 2026 financial audits, runway modeling, and unit economics.
  - `engineering-specs`: In-process Moss architecture, memory layouts, and API contracts.
  - `user-imported`: Local documents uploaded by the developer.
- Vault metadata inspection and document count telemetry.

## Execution Guidelines
1. Parse user prompt to identify targeted domain context.
2. Direct retrieval request to the corresponding isolated in-memory Moss collection.
3. Validate access permissions and isolation rules.
4. Return results tagged with vault provenance for source attribution.
