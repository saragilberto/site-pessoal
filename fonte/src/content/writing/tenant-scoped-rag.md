---
title: 'The database refuses: proving tenant isolation instead of asserting it'
description: 'A RAG server where the RLS policy carries the isolation, not the application query. 180 cross-tenant queries, zero leakage, and a canary test that deliberately breaks isolation to prove the suite would catch it if it ever happened for real.'
pubDate: 2026-08-26
tags: ['PostgreSQL', 'RLS', 'multi-tenant', 'RAG', 'MCP']
draft: true
---

There are thousands of repositories called `rag-example`. Ingest, embed,
top-k, answer. None of them prove anything, because anyone with a free
weekend can build the same thing. What almost nobody builds is retrieval
where the asker's permission is part of the query itself, instead of a
filter bolted on afterward.

I wanted to know whether I could build the second kind, and whether I could
prove it instead of just claiming it.

## The claim

[`tenant-scoped-rag`](https://github.com/saragilberto/tenant-scoped-rag) is a
lab for one decision. Two fictional SaaS knowledge bases — `meridian`, a CRM,
and `halcyon`, a billing platform — share one PostgreSQL database, one
vector index, one set of tables. Nothing in the application code decides who
sees what. The database does, via row-level security anchored on
`current_setting('app.tenant_id')`, enforced by a role that owns nothing and
can bypass nothing.

Sharing one schema between the two tenants is the point, not a shortcut.
A schema-per-tenant setup would have made isolation a fact about
provisioning — the two tenants simply can't reach each other's tables
because those tables live somewhere else. That's a real isolation strategy,
but it doesn't answer the question I actually cared about: what happens
when a retrieval query, a vector index, and a permission check all have to
agree on the same row, in the same table, at the same time? Putting both
tenants in one schema forces the barrier to be the database's enforcement,
not the topology.

The database role the MCP server connects as, `rag_app`, is `NOBYPASSRLS`
and holds no `INSERT`, `UPDATE` or `DELETE` grant on the corpus tables at
all — it cannot write a chunk under any tenant, correct or not, so the
retrieval path has nothing to leak by accident of a missing check. And the
tenant identity itself never travels as a tool argument. It's read once,
from an environment variable, when the MCP server process starts. None of
the four tools — `search`, `get_document`, `list_sources`,
`explain_retrieval` — accepts anything resembling a scope parameter. A
client has no argument to forge, because none exists. If a `tenant_id` did
show up as a tool argument, it would be exactly the value an attacker
controls, and the whole isolation claim would collapse into "trust the
client."

## Proving it, not asserting it

A green test suite doesn't mean isolation holds. It might just mean nobody
wrote the test that would catch a leak — a suite that can't detect a
failure is worse than no suite at all, because it looks like evidence.

So alongside the isolation tests, there's a canary: it disables the RLS
policy on a disposable database and asserts that the isolation suite goes
red. If the canary ever passed — if the suite stayed green with isolation
turned off — that would mean the tests weren't actually exercising the
barrier they claim to prove.

The isolation suite itself runs all 60 hand-written golden-set questions
(30 per tenant) under the *other* tenant's identity, across all three search
modes — semantic, lexical, hybrid. That's 180 cross-tenant queries, and the
expected result for every one of them is empty. Zero leakage across all 180
is the headline number, and it's reproducible from a clean clone with
`uv run pytest tests/isolation -q`. The suite is also an unconditional gate
in CI: if it fails, the workflow fails, no exceptions carved out for a
flaky run.

## What the ablation table says — including the part that didn't work

Isolation was the point, but a retrieval system that never returns anything
useful isn't worth isolating. The evaluation harness computes recall@k,
precision@k, MRR and nDCG@10 deterministically over the golden set — no
RAGAS, no LLM-judge, because `faithfulness` doesn't apply to a server that
never generates an answer, and an LLM judge would need an API key, which
breaks "clone and run."

| Mode | Chunk profile | Rerank | recall@5 | precision@5 | MRR | nDCG@10 |
| --- | --- | --- | --- | --- | --- | --- |
| semantic | 512 | off | 1.000 | 0.200 | 0.989 | 0.992 |
| semantic | 512 | on | 1.000 | 0.200 | 0.988 | 0.991 |
| semantic | 1024 | off | 1.000 | 0.200 | 0.989 | 0.992 |
| semantic | 1024 | on | 1.000 | 0.200 | 0.988 | 0.991 |
| lexical | 512 | off | 0.183 | 0.183 | 0.183 | 0.183 |
| lexical | 512 | on | 0.183 | 0.183 | 0.183 | 0.183 |
| lexical | 1024 | off | 0.183 | 0.183 | 0.183 | 0.183 |
| lexical | 1024 | on | 0.183 | 0.183 | 0.183 | 0.183 |
| hybrid | 512 | off | 1.000 | 0.200 | 0.989 | 0.992 |
| hybrid | 512 | on | 1.000 | 0.200 | 0.988 | 0.991 |
| hybrid | 1024 | off | 1.000 | 0.200 | 0.989 | 0.992 |
| hybrid | 1024 | on | 1.000 | 0.200 | 0.988 | 0.991 |

Two rows are worth reading past the average. Lexical search is a weak
baseline here on purpose: the golden-set questions are phrased the way a
user would actually ask them — "why would someone keep seeing a
workspace-not-found error" — not with the keywords the source article uses.
That gap between how people ask and how documents are written is exactly
what semantic search closes, and hybrid inherits semantic's strength
because Reciprocal Rank Fusion only needs one ranking to place a document
highly.

And reranking made things marginally worse, not better, on this corpus —
MRR drops from 0.989 to 0.988, nDCG@10 from 0.992 to 0.991 when
`bge-reranker-v2-m3` is turned on. That's real evidence, not a rounding
artifact: a general-purpose cross-encoder that isn't tuned for this domain
doesn't automatically help, and I'd rather the ablation table say so than
hide it. Reranking stays off by default. I don't think a repository should
ship a knob that measurably makes its own numbers worse just because the
knob is fashionable.

## Why the corpus is fictional but not naive

The two knowledge bases deliberately overlap. Both have an article on login
errors, on CSV import, on two-factor authentication, on API limits — same
subject, different content and procedure. Without that overlap, the
isolation test wouldn't prove much, because one tenant's search would never
come close to the other's by accident. Making the two corpora collide on
topic is what makes 180 cross-tenant queries returning nothing a meaningful
result instead of a foregone one.

No real data — not SH3's, not a customer's, not a real product's — appears
anywhere in this repository. That wasn't a legal formality; it's what let me
be honest about the numbers in public. Every figure in this post is
reproducible by anyone who clones the repo, because nothing behind it needs
a credential I'd have to keep private.

## What this deliberately isn't

There's no answer generation here. The MCP client generates; the server
only retrieves — RAG-16, if I'm being precise about it. There's no
RAGAS or LLM-judge metric, for the reason above. There's no multi-user
auth inside a single server process: each MCP server instance is bound to
exactly one tenant at boot, which is a real constraint, not an oversight —
it's the same design choice that makes the tenant identity impossible for a
client to forge. None of these are things I ran out of time for. Each one
is a boundary I chose on purpose, and the repository's spec says why for
every single one.

What I actually wanted to know, going in, was whether "the database
refuses" is a claim that survives a hostile reading of the code — not
"my `WHERE` clauses are correct," which is the same claim everyone already
makes and the one this project exists to be more honest than. The canary
test is the part I'd point a skeptical reader to first:
[`tests/isolation/test_canary.py`](https://github.com/saragilberto/tenant-scoped-rag/blob/main/tests/isolation/test_canary.py).
If you can break it — if you can find a way to make that test pass with
isolation actually off — that's a bug report I want.
