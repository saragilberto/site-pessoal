---
title: 'A heap flag is not a memory budget: reverting a Docker build decision hours after shipping it'
description: 'Moving a frontend build into a Docker image assumed a VM had 8GB of RAM. It had 1.7GB. Halving the V8 heap did not fix the hang, because the native minifier allocates memory outside that heap entirely — the actual fix was reverting to a single build path, not a smaller number.'
pubDate: 2026-09-08
tags: ['infra', 'Docker', 'Node.js', 'architecture']
draft: true
---

The build had been running on the VM's host for a while — a known debt, since
the rest of the stack ran in Docker and this one step didn't. The mitigation
in place was a manual workaround: build on your own laptop first, rsync the
output over, skip the host build with a flag. Two paths to the same result,
one of them a step a person has to remember.

So I moved the build into the image. A new stage in the Dockerfile, Node
inside the container, `docker compose up --build` covering the frontend the
same way it already covered everything else. One path, no flag, no manual
step to forget. I wrote it up as an ADR, the way this codebase requires for
anything touching infra, and shipped it the same afternoon.

## The assumption I didn't check

The heap cap I carried over — `--max-old-space-size=1536` — came from a
previous ADR that sized the production VM at 8GB. I never re-verified that
number for the *particular* VM I was deploying to. I was investigating an
unrelated slowness on that VM within the same session, and `free -h` answered
a question I hadn't asked yet: 1.7GB of real RAM, not 8. Postgres, Redis,
three PHP-FPM workers and nginx were already resident before the build even
started.

Caught in time, in principle. I recalculated the heap to fit what was
actually free — down to 768MB — validated it locally, and moved on.
"Validated locally" is doing a lot of work in that sentence: the build
completed in about 11 seconds with no heap error, on a machine with plenty of
RAM to spare. That is not the same claim as "works under the memory pressure
of the real VM," and I'd even written that caveat into the ADR's addendum at
the time. I shipped the smaller number anyway, because it was a strictly
more conservative version of a decision already made.

## The number that mattered wasn't the heap

The real deploy hung at the exact same point as before the change — silently,
mid "rendering chunks," no error, no exit code to grep for. Halving the heap
moved nothing.

`NODE_OPTIONS=--max-old-space-size` caps one specific thing: the heap that
V8's own garbage collector manages. The bundler's native minifier and the
Rust-based engine behind the CSS pipeline don't allocate through that heap —
their memory shows up as RSS on the process, entirely outside what the flag
governs. On a host with 8GB to spare, that distinction never mattered enough
to notice. On a host with roughly 1GB free after everything else already
running got its share, it was the whole story. Dropping the cap from 1536MB
to 768MB, or to 512MB, or to 256MB, changes when V8 collects garbage. It does
not touch the allocation that was never V8's to control in the first place.

## Reverting instead of tuning further

The instinct after a failed fix is usually to try a smaller number, or a
different flag. I didn't, because the failure had already answered that
question: the bottleneck wasn't sized wrong, it was in the wrong place
entirely. No value of that flag was going to change where the memory went.

So the build moved back out of the image, fully — not behind a flag guarding
two paths, one path, restored to what it had been before that afternoon.
Where the Docker approach used to try building and hope, the deploy script
now checks for the compiled output before it does anything else, and aborts
loudly if it's missing, instead of attempting a build the VM has already
demonstrated it can't finish. I considered keeping the Docker stage around,
inert, in case a future VM had the RAM for it. I didn't: a path that isn't
exercised is a path nobody notices going stale, and "works on a VM we don't
have yet" isn't a claim I can test.

## What I'm carrying forward

A spec number from a different decision, made for a different VM, isn't a
fact about the VM in front of you — it's an assumption wearing a fact's
clothes until someone runs `free -h`. And a flag with a memory-sounding name
doesn't mean it governs all the memory a process touches; it governs exactly
what its own documentation says it governs, and a native dependency
underneath your bundler is under no obligation to respect it. The fix here
cost me an afternoon and one extra ADR. Skipping the re-verification the
first time would have cost the next deploy that hit the same VM.
