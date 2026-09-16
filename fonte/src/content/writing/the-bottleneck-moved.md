---
title: 'The bottleneck moved: a git log already has the two numbers that prove it'
description: 'Code generation got faster; review did not. "PRs feel bigger lately" is a feeling, not a number — this reads a normalized git log and turns it into PR size and time-to-merge, with the two edge cases (an open PR, an empty merge) that make the difference between a metric and a script that crashes on real history.'
pubDate: 2026-09-16
tags: ['agent-harness-cookbook', 'code review', 'metrics', 'git']
draft: false
---

Code generation got faster. Review didn't move at the same pace, because
review is still one human reading a diff at human speed. Nobody notices the
gap opening because nobody measures it — "the PRs feel bigger lately" is a
feeling a team can agree on over coffee and still do nothing about, because
a feeling doesn't tell you which PR, by how much, or since when.

[`metricas-revisao`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/metricas-revisao)
is the third example in the same cookbook `gate-shell` and
`grader-deterministico` opened: two numbers, PR size and time-to-merge,
pulled out of a plain git log with no dependency and no API call.

## A PR isn't a field, it's inferred

A git log doesn't have a "PR" concept — it has commits, and some of them
happen to be merges. So the log is read oldest-first, and every regular
commit accumulates into a batch until the next merge commit closes it:

```js
export function computeMetrics(commits) {
  const prs = [];
  let batch = [];

  for (const commit of commits) {
    if (commit.isMerge) {
      if (batch.length > 0) {
        const size = batch.reduce((sum, c) => sum + c.linesChanged, 0);
        const hoursToMerge = (commit.timestamp - batch[0].timestamp) / 3600;
        prs.push({ mergeCommit: commit.hash, size, hoursToMerge, commitCount: batch.length });
      }
      batch = [];
    } else {
      batch.push(commit);
    }
  }

  return { prs, openCommits: batch.length };
}
```

`isMerge` is just "two or more parents" — the log carries no other signal
that a PR just closed, because real `git log` doesn't either. `size` sums
lines changed across the batch; `hoursToMerge` is the merge's timestamp
minus the first commit's. Run against a fixture with one PR opened and
merged in thirty minutes and another that sat for two commits and forty
hours, it prints exactly that contrast:

```
merge_commit  size  hours_to_merge  commits
m1            12    0.5             1
m2            650   40.0            2

1 commit(s) still open, not merged yet.
```

## The two cases that decide whether it's a metric or a crash

Writing the happy path — one batch, one merge, one row — took the fifteen
minutes above. Trusting it against a real repository's history took two
more cases that have nothing to do with the happy path and everything to do
with what a real log actually contains.

**Trailing commits with no merge yet.** Every repository has an open PR at
the moment you run the script. If the last commits in the log never hit a
merge, they're not a PR — they're work in progress, and reporting them as
one would invent a merge timestamp that hasn't happened yet. The fixture's
last commit is exactly this case, and `computeMetrics` reports it
separately as `openCommits`, not as a zero-duration PR:

```js
// Commits left in the batch belong to a PR that's still open. They're not
// a PR yet — reporting them as one would invent a merge time that hasn't
// happened.
return { prs, openCommits: batch.length };
```

**A merge with nothing behind it.** Two merges back to back — or a merge
commit with no substantive change of its own — closes an empty batch. The
naive version of this function would push a zero-commit PR with a
`hoursToMerge` computed from whatever commit happened to be first in an
unrelated batch. The actual version just skips it:

```js
// A merge with no preceding commits (e.g. an empty merge, or two merges
// back to back) closes nothing — skip it instead of emitting a zero-commit
// PR that would just be noise in the metric.
if (batch.length > 0) {
  // ...
}
```

Neither case shows up if you only test against a log you wrote yourself to
look clean. Both show up in the first afternoon you point this at a
repository that's actually been lived in.

## Why it doesn't shell out to git

`parseLog()` never calls `git`. It reads a fixed, documented format —

```bash
git log --reverse --pretty=format:'%H|%P|%ct' --numstat
```

— from a file, and that's a deliberate trade against the repo's own rule of
staying dependency-free and deterministic. Shelling out to `git` would make
the example one command shorter and untestable without a real repository
sitting next to it; reading a fixture makes every test case — the fast PR,
the slow one, the open commit, the empty merge — a few lines of `.log` text
that runs in milliseconds and never depends on what happens to be in
`.git` on whoever's machine runs the suite.

## What transfers

The rule of thumb — "PRs feel bigger lately" — is common to every team that
started generating more code than it used to. What transfers here isn't the
log format, which is a fixture convention specific to this example, but the
shape: infer the unit that matters (a PR) from the unit the tool actually
gives you (a commit), and write down the two things that happen in real
history before you ever see them break a naive version — the batch that
never closes, and the merge that closes nothing.

## Limitations

- **The log format is a fixed convention, not a real `git log` call.**
  Point this at a real repository's history and it needs the exact
  `--pretty` shape above first — there is no fallback parser for a
  differently formatted log.
- **Squash merges look like regular commits.** A squashed PR becomes a
  single non-merge commit that gets silently absorbed into whatever batch
  is open when the next real merge happens, instead of counting as its own
  PR.
- **Size is lines changed, not effort.** A 200-line generated migration and
  a 200-line change to a tax-rate service score identically, even though a
  reviewer spends five minutes on one and an afternoon on the other.
- **No file-count or file-type weighting.** A PR touching one file and a
  PR touching twenty score the same if the line totals match.
