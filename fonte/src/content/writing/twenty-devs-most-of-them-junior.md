---
title: 'Twenty junior devs and a suggestion they did not have to understand'
description: 'CLAUDE.md can ask a junior dev to "read carefully before accepting" — it cannot make it true. A PreToolUse hook that blocks a write to a sensitive path unless the assistant already wrote a one-line justification in the preceding transcript turn, read straight out of the JSONL Claude Code hands the hook, not a flag passed in on trust.'
pubDate: 2026-10-08
tags: ['agent-harness-cookbook', 'Claude Code', 'hooks', 'onboarding']
draft: true
---

`regra-com-mecanismo` picked a rule that's easy to state cleanly: never
assign a field directly, always go through the service. Most rules a junior
dev actually needs aren't that clean. The failure isn't usually "did
something destructive happen" — it's quieter than that. It's a suggestion
accepted because it compiled, not because anyone understood why it was
right. `CLAUDE.md` can say "read carefully before accepting a suggestion."
It cannot make that true, for the same reason it can't make any rule true:
it's a sentence in a context window, not something that happens at the
moment of the decision.

[`onboarding-junior`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/onboarding-junior)
is the sixth example in the cookbook, and it's the first one in the series
that doesn't try to detect a bad change. It tries to force one specific,
cheap thing to exist before a risky change lands at all: a sentence saying
why.

## What counts as "sensitive" here

```js
export const SENSITIVE_PATTERNS = [
  { id: "OJ01", pattern: /^app\/Services\//, area: "a service class" },
  { id: "OJ02", pattern: /^database\/migrations\//, area: "a migration" },
];
```

Business logic and schema — the two categories where "it worked when I ran
it" and "it's correct" are furthest apart, and where a junior dev is least
equipped to tell the difference on sight. Everything else — a view, a
stylesheet, a config file — passes through untouched. The hook isn't trying
to slow down all writes; it's trying to slow down exactly the ones where
understanding matters most and is least likely to already be there.

## Reading the transcript instead of trusting a flag

The obvious lazy version of this hook takes a `justification` field
straight out of `tool_input` and checks its length. That version proves
nothing — it only checks that *something* was passed in, and whatever
calls the hook controls what that something is. The actual mechanism reads
the assistant's own preceding message out of the conversation:

```js
export function lastAssistantText(transcriptText) {
  const lines = transcriptText.trim().split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    const role = entry?.type ?? entry?.message?.role;
    if (role !== "assistant") continue;

    const content = entry.message?.content ?? entry.content;
    if (Array.isArray(content)) {
      return content.filter((b) => b?.type === "text").map((b) => b.text).join("\n");
    }
    if (typeof content === "string") return content;
  }

  return "";
}
```

Claude Code already hands every `PreToolUse` hook a `transcript_path` — the
JSONL file of the session so far. This reads the last assistant turn out of
it and looks for a `Justification:` line in what the assistant *actually
said*, before proposing the write, not in a field a caller decided to
attach. The distinction matters the same way it mattered in
`gate-shell`: the hook has to observe something that happened, not accept a
claim about what happened.

## The length check is honest about what it can't do

```js
if (justification.length >= MIN_JUSTIFICATION_LENGTH) {
  return { decision: "allow" };
}
```

Twenty characters. That's not a quality bar — "fixes it, trust me" is
nineteen characters short of qualifying only by accident, and twenty
characters of padding would sail through exactly as well as a real reason.
The mechanism isn't grading the reasoning. It's forcing the act of writing
one down, on the theory that the sentence itself is the intervention: a dev
who has to type why a change is correct, even badly, has to form an opinion
about it first. A dev who never has to write anything can accept forever
without ever forming one. Whether the sentence is *right* is still a job
for a senior reviewer reading the diff — this only guarantees there's
something for them to read.

## What transfers

The two path patterns are Acme Invoices' businesses-logic and schema
directories; a real team names its own. What transfers is the shape of the
intervention: pick the category of change where "compiled" and "correct"
diverge the most, and force a one-line commitment to exist before that
category of change lands — read from something the agent actually said,
not from a value a caller can set to whatever makes the check pass.

## Limitations

- **The check doesn't validate content, only presence.** A junior dev who
  learns to type filler text defeats the mechanism while still satisfying
  it — this is a floor, not a review.
- **Two path patterns, illustrative.** A real rollout needs the actual
  sensitive paths for its own codebase, and there are usually more than
  two.
- **Only the immediately preceding assistant turn is read.** A
  justification written three turns earlier and still relevant to the
  current write is invisible to this check.
- **This is a floor, not a review process.** It guarantees a sentence
  exists before a risky write lands. It does not guarantee a senior dev
  ever reads it.
