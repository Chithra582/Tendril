---
name: local-semantic-search
description: Executes sub-10ms dense vector and BM25 hybrid semantic search directly in local process memory using Moss
---

# Local Semantic Search Skill

## Purpose
Execute fast, zero-egress semantic and lexical keyword retrieval over local indexed documents without relying on external cloud vector databases.

## Capabilities
- In-process dense vector embedding and cosine similarity computation.
- In-memory BM25 lexical search for exact contract terms, IDs, and section numbers.
- Reciprocal Rank Fusion (RRF) combining dense (65%) and lexical (35%) scoring.
- Sub-10ms retrieval latency (averaging 1.89ms).

## Execution Guidelines
1. Ingest query string and active vault identifier.
2. Run simultaneous dense vector search and BM25 lexical match against local Moss index.
3. Compute fused rank score using $k=60$ smoothing constant.
4. Filter out candidates scoring below 0.45 normalized relevance.
5. Return top-k relevant text snippets with document path and chunk index.
