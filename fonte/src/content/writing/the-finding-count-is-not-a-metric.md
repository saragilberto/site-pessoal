---
title: 'The finding count is not a metric: a deterministic grader for a rule with no middle ground'
description: 'An architectural scanner for tenant isolation returns 340 violations before a change and 341 after — a number nobody can act on. Comparing two scans by fingerprint instead of counting them turns it into a yes/no answer, and the fixture that had to exist to trust it was the negative one, not the positive one.'
pubDate: 2026-09-09
tags: ['agent-harness-cookbook', 'testing', 'static analysis', 'evals']
draft: true
---

Every real codebase already has violations. A scanner for the Acme Invoices
domain — one Postgres schema per tenant, so a model that skips it leaks data
across tenants — reports 340 findings before a change and 341 after. Nobody
can act on that number. Is 341 a regression, or is it the same 340 plus one
finding that was already there and just moved three lines down because
someone added an import?

[`grader-deterministico`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/grader-deterministico)
is the second example in the same cookbook `gate-shell` opened: runnable
code for governing what an agent writes, not a slide with a regex on it.

## The question isn't "how many," it's "did this introduce one"

`scan.mjs` walks a directory and matches four patterns — a model that
extends `Model` instead of `TenantModel`, a fixed database connection, a raw
`search_path`, a cache key with no tenant prefix. Ran alone, it returns a
count. That's the wrong question for a change under review. The question
that matters is binary: did *this diff* introduce a new violation, yes or
no. `delta.mjs` answers it by scanning the baseline and the candidate
separately and taking a set difference:

```js
export function delta(baselineFindings, candidateFindings) {
  const baseline = new Set(baselineFindings.map(fingerprint));
  const candidate = new Set(candidateFindings.map(fingerprint));

  return {
    introduced: candidateFindings.filter((f) => !baseline.has(fingerprint(f))),
    resolved: baselineFindings.filter((f) => !candidate.has(fingerprint(f))),
  };
}
```

The useful side effect is that the historical backlog cancels itself out for
free. A violation present in both scans disappears from `introduced` — no
exception file, no frozen baseline someone forgets to update six months
later when it's stale enough to hide a real regression behind it.

## What "the same violation" means

The set difference only works if two scans of the same unchanged code
produce the same fingerprint. `fingerprint()` is three lines, and they're
the ones that decide whether the whole grader is usable:

```js
export function fingerprint(finding) {
  return `${finding.ruleId}::${finding.file}::${finding.evidence}`;
}
```

No line number. `evidence` — the trimmed text of the offending line — is
what carries the finding's identity instead. If the line number were part
of it, adding an unrelated import at the top of a file would shift every
finding below it by one line and the grader would report the entire file as
newly violating on the next unrelated commit. That's not a hypothetical:
it's the first thing that happens to any file that's been open more than a
week.

## The fixture that had to exist was the negative one

Writing the positive case — a model that extends `Model` should be flagged
— took one file and one line. Trusting it took a second file that does
*not* get flagged:

```php
class Payment extends TenantModel
{
    // ...
}
```

The rule's pattern is `/class\s+(\w+)\s+extends\s+Model\b/`. It's tempting
to write that as `/extends\s+\w*Model\b/` to also catch subclasses someone
renamed — until you notice `TenantModel` itself ends in `Model`, and a
looser pattern would flag every single compliant class in the codebase on
day one. The tight version only matches the literal string `extends Model`,
so `extends TenantModel` never reaches it: the substring after `extends ` is
`TenantModel`, not `Model`, and the regex has no way to match starting
midway through a word. That's a design property, not an accident, and the
only way to actually confirm it holds is a fixture that runs the compliant
class through the scanner and asserts zero findings — which is now
`grader.test.mjs`'s second test, sitting right next to the one that checks
the violation *does* get caught. A scanner proven only against violations it
should catch will happily also catch things it shouldn't, and nothing in
that first test would ever tell you.

The three cases from the article's own eval suite — new code that's clean
despite the legacy backlog, new code that introduces exactly the two rules
it should, and the baseline compared against itself — are also runnable as
plain `node:test` assertions now, not just as a script that prints PASS or
FAIL to stdout. `node --test` alone catches a regression; nobody has to
remember to also run `run-eval.mjs`.

## Where LLM-as-judge fits, and where it doesn't

It doesn't fit here. Tenant isolation is a hard rule — a model either
extends `TenantModel` or it doesn't, there's no interpretation to make. An
LLM judge asked the same question would be right most of the time and wrong
some of the time, which means it introduces variance on top of a rule that
was deterministic before you added it. That's a strictly worse system: same
average correctness, now with a random component nobody can reproduce or
debug.

The judge earns its place somewhere else — "does this error message explain
what to do," "does this PR description match the diff." No regex answers
those, and the judge's variance is tolerable there because two experienced
humans reviewing the same text would also disagree with each other some of
the time. The practical split: if two reviewers would always agree, write a
grader. If they could reasonably disagree, that's the judge's job, and
pretending otherwise just hides the disagreement instead of resolving it.

## What transfers

The four rules are Acme Invoices' rules; yours will name different patterns
for a different domain. What transfers is the shape: identity that survives
an unrelated line shift, a set difference instead of a raw count so the
backlog cancels out on its own, and — the part that's easy to skip — a
fixture proving the scanner stays quiet on the code that's already correct,
not only one proving it speaks up on the code that isn't. A scanner nobody's
tested against a clean file is a scanner nobody's actually checked for false
positives, and a false positive here is the one that gets the whole tool
disabled after the first noisy PR review.

## Limitations

- **Regex has no syntax tree.** `class Invoice extends Model` inside a
  comment or a string still counts as a finding. A rule that needs
  precision needs an AST, not a line.
- **Silence is ambiguous.** Zero findings from a pattern that doesn't apply
  to this codebase looks identical to zero findings from real compliance.
  That's the false zero, and it's the main trap in this whole approach.
- **The delta doesn't see renames.** Moving a file shows up as one resolved
  violation and one introduced one, even though nothing actually changed.
- **Four rules is an illustration.** A real isolation suite grows rules for
  jobs, seeders, commands, and migrations one incident at a time — this one
  didn't have an incident behind each rule, and that shows.
