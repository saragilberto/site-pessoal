---
title: 'One validated query, three doors: adding a CLI without adding a bypass'
description: 'tenant-scoped-rag grew a second MCP transport and a clipboard-delivery CLI for local LLMs that speak neither stdio nor HTTP. The design question was not "does it work" but "does walking through the new door skip the check the old ones enforce."'
pubDate: 2026-09-01
tags: ['MCP', 'RAG', 'CLI', 'architecture']
draft: false
---

`tenant-scoped-rag` started with one way in: an MCP server talking stdio to
a client that already spoke the protocol. That covers an agent running
inside an IDE or a terminal. It does not cover a local LLM running in a
browser tab, because a browser tab is not a subprocess and cannot open a
stdio pipe. So the project grew a second transport, HTTP with
server-sent events, for exactly that case.

And then it grew a third door that isn't MCP at all: a CLI, `rag-context`,
that runs the same retrieval, checks the local LLM's health endpoint, and
puts the result on the clipboard for a human to paste. No protocol
handshake, no tool schema, no client library — just a scoped query and
a copy-paste.

## The question a second door always raises

Every time a system gains a new way to reach the same data, the interesting
question isn't "does the new path work," it's "does the new path enforce
the same rule the old ones do." A stdio MCP tool and an HTTP MCP tool
that both check tenant scope are only actually equivalent if the checking
code is the same code, not two implementations of the same intent that
will eventually drift.

That's why the refactor that mattered most in this batch of commits wasn't
either transport. It was pulling search validation and mode dispatch out
of the server into a `rag.query` function that both the server and the CLI
call directly. The MCP server doesn't own the check anymore — it's a
caller of the check, same as the CLI is. A door that skips MCP entirely
still has to go through `rag.query` to get an answer, and `rag.query` is
the thing that knows which tenant is asking and refuses to look past it.
The alternative — writing a second, CLI-shaped validation path "because
it's just a local script, not exposed to a network" — is exactly the kind
of shortcut that turns into an unscoped query eighteen months from now,
once someone forgets the CLI was ever supposed to be constrained.

## Why the clipboard, and not a fourth transport

The tempting fix for "the local LLM doesn't speak MCP" is to keep adding
transports until one fits — WebSocket next, then whatever the next runtime
prefers. That treats the problem as a protocol gap. It usually isn't. A lot
of local-LLM front ends have no plugin surface at all; the only input they
accept is whatever the user types or pastes into the chat box. No transport
closes that gap, because there's no client on the other end to speak it to.

So the CLI doesn't try to be a fourth transport. It does the retrieval,
formats it as a context block, and hands it to the one interface every
chat UI already has: the paste buffer. A `--open` flag pairs it with
launching the browser tab, so the whole round trip is "run one command,
paste once." It's a deliberately unglamorous answer, but it's honest about
where the actual gap is — not in the protocol, in the client.

## What got tested, and what that says about the design

The test added alongside the CLI covers the argument-parser plumbing and
the `--open` flag specifically, not just a happy-path "does retrieval
return something." That's a narrow thing to bother testing, and the reason
it's worth testing is that CLI argument wiring is exactly where a flag
silently stops doing what its name says — `--open` failing to open, or a
scope flag failing to reach the call it's supposed to constrain, are the
same class of bug even though only one of them is a security bug. Testing
the plumbing, not just the retrieval logic behind it, is what catches the
second kind before it ships as the first kind's sibling.

## The actual claim

Three doors into the same corpus — stdio for MCP-native clients, HTTP/SSE
for browser-based ones, a clipboard hand-off for everything else — sounds
like three places isolation could quietly diverge. It isn't, because there
is exactly one place tenant scope is decided: `rag.query`, called by all
three, none of which is trusted to make that decision on its own. Adding a
door was never the risky part. Giving any door its own opinion about who's
allowed to ask would have been.
