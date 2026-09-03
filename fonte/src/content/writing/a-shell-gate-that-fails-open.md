---
title: 'A rule in CLAUDE.md is a suggestion: a PreToolUse hook is not'
description: 'A hook that blocks destructive shell commands before Claude Code runs them — force pushes, DDL, writes to .env — with tests split into blocks, allows, and known evasions. Plus a bug I found while verifying the README example against my own machine: the entry-point check silently failed whenever the path had a space in it.'
pubDate: 2026-09-03
tags: ['Claude Code', 'hooks', 'shell', 'testing']
draft: false
---

A rule written in `CLAUDE.md` is a suggestion. The agent reads it, agrees,
and sometimes does something different anyway — not out of malice, just
because the prohibition only exists as text in a context window that's full,
in the middle of a long task, competing with everything else the model is
holding onto. What turns policy into a guarantee is something that runs
before the command executes and doesn't depend on anyone remembering
anything. That's what a `PreToolUse` hook is for.

[`gate-shell`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/gate-shell)
is the first example in a small cookbook I'm building on governing
agent-generated code — runnable code, not slideware, because a gate you
can't paste into a terminal and watch block something isn't a gate you can
trust.

## The contract

Claude Code pipes JSON on stdin — `{ tool_name, tool_input }` — before it
runs a `Bash` tool call. The hook exits `0` to allow, or `2` with a message
on stderr to deny. That message goes back to the agent, so it can't just say
"no." A denial with no path forward is what makes an agent retry the same
blocked command three times and then improvise something worse.

```js
export function evaluate(command) {
  // ...
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return { decision: "deny", ruleId: rule.id, reason: rule.reason, hint: rule.hint };
    }
  }
  return { decision: "allow" };
}
```

Seven rules, each one a thesis about what should never happen without a
human in the loop: recursive removal from `/` or `~`, force push, a direct
write to `main`, a remote script piped straight into `sh`, destructive DDL,
`chmod 777`, a write to a `.env` file. Every rule carries a `reason` for the
log and a `hint` for the agent — and the hint is the one that matters more,
because it's the difference between the agent trying again the right way
and burning the rest of its budget stuck.

The one allowlist entry — `git log` — exists because every allowlist is debt.
Each entry is a hole punched in the gate on purpose, so it needs a written
reason, not just a pattern that happened to be convenient.

## Fails open, not closed

If the input isn't valid JSON, the hook allows and writes a note to stderr
instead of blocking. That's a deliberate trade: a gate that fails closed on
its own bug locks up the whole session over nothing; a gate that fails open
loses one check but leaves a trace. The second costs less, as long as the
failure is actually visible instead of silent — which turned out to matter
more than I expected, for a reason that had nothing to do with the gate
logic itself.

## The bug the README caught

The example's README shows the hook working from the command line:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' \
  | node gate-shell.mjs; echo "exit=$?"
# [SH002] Command blocked: force push.
# exit=2
```

Copy-pasting your own README before publishing it is not optional, and it's
a good thing I did: on my machine it printed nothing and exited `0`. The
force push was allowed.

`evaluate()` itself was correct — I checked it directly, it returned `deny`
every time. The bug was one line below it, the standard Node idiom for "was
this file run directly, or only imported":

```js
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

My repository lives under a path with a space in it — `MacBook Pro II`.
`import.meta.url` percent-encodes that space as `%20`. The manual
`file://${process.argv[1]}` concatenation doesn't encode anything. The two
strings never matched, `main()` never ran, and the script exited cleanly
with nothing having happened at all — no error, no stderr, no signal that
anything was wrong. It only *looked* like a gate. The fix is
`pathToFileURL(process.argv[1]).href`, which does the encoding correctly:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
```

The unsettling part isn't the bug — it's a one-line idiom mistake anyone
copies from Stack Overflow. It's that `node --test` never caught it, because
the test suite calls `evaluate()` directly and never exercises the CLI
entry point at all. A green suite and a working gate are not the same
claim, and the only reason I caught the gap here was that the README made a
promise specific enough to fail against — "run this, see exit 2." Vague
documentation doesn't get to be wrong.

## Tests split by what they're for

```
blocks  — the gate does what it promises
allows  — the gate doesn't get in the way of normal work
evasion — attempts to get around it
```

The middle group is deliberately the largest of the three. A gate that
blocks correctly but also blocks `rm -rf ./build` or a normal
`git commit -m "fix"` gets disabled by the second week, and after that the
protection is zero regardless of how clever the regex was. A false positive
costs more than a false negative here, because a false negative is still a
gap — a false positive is a reason to turn the whole thing off.

The evasion group is two tests marked `skip`, not deleted:

```js
test("evasion via environment variable is not detected", { skip: "known limitation" }, () => {
  assert.equal(evaluate("R=rm; $R -rf /").decision, "deny");
});
```

`R=rm; $R -rf /` gets past every pattern here, and so does a base64-encoded
payload piped into `sh`. Recording that as a skipped test, in the same file
that proves the seven rules that *do* work, is more honest than a limitations
section in a README nobody reads before they trust the tool. Detection here
is text-pattern matching, not a shell parser — it stops a careless command,
not an adversarial one.

## What transfers

The seven rules are specific to my own workflow. Yours will name different
commands. What transfers is the shape: a rule with an id, a reason, and a
hint; the decision isolated in a pure function so it can be tested without
simulating an agent's runtime at all; and a test suite that treats "what
this doesn't catch" as a first-class, checked-in fact rather than an
aspiration.
