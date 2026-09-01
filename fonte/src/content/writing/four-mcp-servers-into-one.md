---
title: 'Four MCP servers became one, and the reason was a bug that shipped three times'
description: 'We had one MCP server per product. They were copies of the same scaffold, so a single bad SQL guard shipped as three separate bugs. Here is what we replaced them with, and how we proved it before switching anything off.'
pubDate: 2026-09-01
tags: ['MCP', 'multi-tenant', 'architecture']
draft: false
---

We ran four MCP servers. One per product, plus the unified one that replaced
them. This is the story of why the fourth exists.

## The setup

Each product had its own MCP server so that agents could read the product's
data through the same kind of scoped access the product's own interface
already enforced. Reasonable on day one: each product runs its own Postgres,
in its own network, with its own idea of where application tables live. The
server exposed close to fifty read tools — schema introspection, read-only
queries, performance and diagnostic helpers, saved queries, and a handful of
higher-risk administrative actions behind a separate scope.

## The problem was not the servers, it was that they were copies

Each new server started as a copy of the previous one's scaffold. Same
connection handling, same authorization layer, same close to fifty tools,
duplicated verbatim into a new repository.

The SQL guard that blocked non-read-only queries checked for session-control
statements by testing whether the query contained the raw substring `SET `.
`OFFSET 10` contains that substring — `off`**`set `**`10` — so a plain,
legitimate paginated query got rejected as if it were trying to change a
session variable.

It did not ship as one bug. It shipped as three, once per server, because the
scaffold had been copied three times and the guard was copied with it. Fixing
it in one server did nothing for the other two — there was no shared code for
the fix to land in. The failure mode wasn't the bug itself, which is a
one-line mistake anyone could make; it was that the codebase had no single
place where fixing it once meant it was fixed everywhere.

## What replaced them

One server that resolves which product's database to hit per tool call,
instead of a process compiled around a single product's connection.

The constraint that shaped this was how MCP clients actually connect: a
client registers a connection once, with fixed headers, for the life of a
session — there's no way to vary a per-call header without reconnecting. A
design that read the target product from a request header would have forced
one MCP connection per product, which is the exact fragmentation this project
existed to undo. So `produto`/`instancia` became arguments passed to each
tool call instead, resolved and authorized inside the tool's own handler. One
session now serves every configured product without reconnecting.

Authorization stayed strict rather than getting simpler along with the
architecture: each access token is scoped to specific products and instances,
not valid against any database the way a single static token worked in the
three original servers. Read tools are available by default; the small set of
higher-risk actions — terminating a database session, for instance — require
a separate elevated scope, issued only to specific operators. Two guardrails
were also strengthened rather than just carried over: the SQL sanitizer now
matches whole words instead of raw substrings, so the `OFFSET` mistake can't
recur by construction, and a saved-query feature that let any caller
self-declare ownership of any saved record now derives ownership from the
authenticated token instead.

## Proving it before switching anything off

The three original servers kept running. Nothing about the unified server
existing was reason enough to trust it — it had to demonstrate, against real
data, that it covered the same ground before anyone would rely on it instead
of the servers already in use.

Two checks did that work. The first compared tool names: does every tool an
existing internal caller already invokes exist, under the exact same name, in
the new server? A diff between what the caller calls and what the new server
exposes came back empty — nothing to translate, nothing to rename.

The second was a test that opens a single MCP session and alternates queries
across every configured product's real database — not fixtures, the actual
Postgres instances — and asserts that no product's row ever comes back for
another product's query. Two of those databases happen to keep their
application tables under the same schema name, which is exactly the
condition that would expose a resolver bug if the per-call scoping were
wrong instead of merely appearing to work.

The three original servers are still running today. Retiring any one of them
is gated on a decommissioning checklist that doesn't have its criteria
written yet — proof came before sequencing, on purpose, not the other way
around.

## What I would tell someone starting this

A duplicated scaffold isn't free just because every copy compiles and passes
its own tests. Close to fifty tools copied three times didn't fail because
anyone chose badly — they failed because the codebase had no path for a fix
in one place to reach the other two. The point of unifying wasn't reducing
how many servers exist; it was making "fixed once" actually mean fixed
everywhere, and then proving that before trusting it enough to turn anything
off.
