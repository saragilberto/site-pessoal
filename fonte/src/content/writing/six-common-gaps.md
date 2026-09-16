---
title: 'Six common gaps, and the audit script that hit one of its own'
description: 'A .claude/ setup accumulates gaps nobody goes back to check for — a hook with no test, a permission that allows everything, a .gitignore that never learned about .env. Building the scanner for it, one of the six fixture files it needs to prove gap six disappeared into git silently, ignored by a rule the fixture itself was demonstrating.'
pubDate: 2026-10-06
tags: ['agent-harness-cookbook', 'Claude Code', 'testing', 'tooling']
draft: true
---

A team adopts Claude Code, writes a `CLAUDE.md`, adds a hook, feels done.
Nobody goes back to check whether that setup still holds up six months
later, because there's no moment that prompts anyone to look. The gaps
that show up aren't exotic — they're the same six, over and over: a hook
with no test, a permission that quietly allows everything, a `.gitignore`
that never learned about `.env`.

[`auditoria-harness`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/auditoria-harness)
is the seventh example in the cookbook: a scanner for exactly those six
gaps, built the same way every other example here is — a pure function
over data, a thin loader that's the only part touching a real directory.

## The six

```
AH01  no CLAUDE.md at the project root
AH02  no PreToolUse hook configured
AH03  .gitignore doesn't exclude .env
AH04  Bash(*) in permissions.allow
AH05  a configured hook has no corresponding test file
AH06  .claude/settings.local.json exists but isn't excluded in .gitignore
```

AH05 is the one that ties back to the first article in this series:
`gate-shell.mjs`'s `evaluate()` was correct the whole time I was building
it, and the bug — an entry-point check that silently failed on a path with
a space in it — lived one line below, invisible to `node --test` because
the suite never exercised the CLI at all. AH05 exists because that's not a
one-off. It reads every hook's `command` string out of `settings.json`,
pulls the `.mjs` path out of it, and checks for a sibling
`<script>.test.mjs`. A hook with logic and no test for its entry point is
exactly the shape of gap that produced that bug.

## Testing six checks without six directories

```js
export function audit(configTree) {
  const gaps = [];
  const has = (path) => configTree.files.includes(path);
  // ...
}
```

`audit()` takes a plain `{ files, contents }` object, not a directory path.
That's what makes each of the six checks testable as three lines of inline
data instead of its own fixture folder:

```js
test("AH04: Bash(*) in permissions.allow", () => {
  const settings = { permissions: { allow: ["Bash(*)"] } };
  const configTree = { files: [".claude/settings.json"], contents: { ".claude/settings.json": JSON.stringify(settings) } };
  assert.ok(ids(audit(configTree)).includes("AH04"));
});
```

`loadConfigTree()` is the only function that ever calls `readdirSync` —
everything that decides whether a gap exists runs against data a test can
construct by hand. Two real fixture directories, `fixtures/clean/` (zero
gaps) and `fixtures/gappy/` (all six), exist on top of that only to prove
the six checks compose correctly together against something that looks
like an actual `.claude/` folder, not to be the only test each check gets.

## The fixture that disappeared into its own subject matter

Building `fixtures/gappy/`, I needed a `.claude/settings.local.json` file
present so AH06 — "exists but isn't excluded in `.gitignore`" — had
something real to catch. I wrote the file, ran the tests, they passed,
committed, pushed. Everything looked done.

It wasn't. `git status` after the push showed nothing, which is the tell —
a file that's supposed to be tracked and shows no diff either was never
touched or was never added in the first place:

```
$ git ls-files | grep settings.local
```

Nothing. Two things were quietly eating that file. My global
`~/.config/git/ignore` has a `**/.claude/settings.local.json` rule —
reasonable for real projects, since that file is meant to hold personal
overrides nobody else should see. And the *fixture's own* `.gitignore`,
written as test data to represent what a project's ignore file looks like,
also lists `.claude/settings.local.json` on that exact line — which git
reads as a real ignore rule for anything under that directory, because git
doesn't know the difference between a `.gitignore` that's fixture content
and a `.gitignore` that's actually governing the repository. It's the same
file to git either way.

The tests never caught it because they ran against my working copy, where
the file existed on disk whether or not git was tracking it. The gap was
invisible until a clean clone — the same blind spot AH05 is built to catch
in a hook's own test suite, just one layer up, in the example's own test
data instead of its subject. `git add -f` on the two files that needed it,
a clone into a temp directory, and rerunning the suite there is what
actually proved the fixtures were complete — not the green suite running
against the working copy that had been quietly accumulating untracked
state.

## What transfers

The six gaps are the six I've seen repeat; a different team's `.claude/`
setup will have its own recurring pattern, and this is a template for
turning "we should really check for that" into a function instead of a
habit nobody remembers to keep. The part worth keeping regardless of which
six you pick: run the test suite against a fresh clone before trusting it,
not just against the tree that's been sitting on disk while you built the
fixtures. A green suite against your own working copy and a green suite
against what's actually committed are two different claims, and the gap
between them is exactly where an ignored file hides.

## Limitations

- **Six is not exhaustive.** These are the six that kept showing up, not a
  taxonomy of everything that can be wrong with a `.claude/` setup.
- **Presence, not quality.** AH02 passes as soon as any `PreToolUse` hook
  exists — it says nothing about whether that hook's rules are any good.
- **`.gitignore` checks are exact-line matches.** A pattern that covers
  `.env` some other way — a glob, different spacing — won't be recognized,
  even if it works.
- **AH05's script extraction is a regex on a command string,** not a shell
  parser — a hook invoked through a wrapper, or with arguments before the
  path, may not be detected.
