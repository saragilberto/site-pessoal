---
title: 'The same rule, written twice: one version literally cannot block anything'
description: 'Never assign Invoice.discountPercent directly — route it through TaxRuleService. Writing that rule as CLAUDE.md prose and as a PreToolUse hook, side by side, with a function structurally incapable of returning anything but "not enforced" for the text version, and a test proving only the hook stops the write.'
pubDate: 2026-10-01
tags: ['agent-harness-cookbook', 'Claude Code', 'hooks', 'testing']
draft: true
---

`gate-shell` argued that a rule in `CLAUDE.md` is a suggestion and a
`PreToolUse` hook is not. That's a claim about two different things — text
versus a hook — and it's easy to read it as "hooks are just more thorough
documentation." They're not documentation at all. They're a different kind
of object. The clearest way I found to show that difference was to stop
comparing two different mechanisms and instead write the *same* rule twice,
so the only variable left is whether anything is actually listening for the
write.

[`regra-com-mecanismo`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/regra-com-mecanismo)
is the fourth example in the cookbook. The rule: never assign
`Invoice.discountPercent` directly — route it through
`TaxRuleService::applyDiscount()`, which recalculates tax alongside the
discount. A discount applied without recalculating tax is a wrong invoice
that looks correct until someone audits it.

## Version one: the sentence

```js
export const RULE_TEXT = `
## Discounts

Never assign Invoice.discountPercent directly. Always go through
TaxRuleService::applyDiscount(), which recalculates tax alongside the
discount. A discount applied without recalculating tax is a wrong invoice
that looks correct until someone audits it.
`;

export function checkTextRule(content) {
  return "not enforced";
}
```

`checkTextRule()` takes the file content as an argument and ignores it
completely. That's not a stub I forgot to finish — it's the honest
implementation of "a sentence in a context window." There is no version of
this function that inspects `content` and returns something else, because
prose has no hook into the moment a write happens. It can only be read
before the fact and regretted after it.

## Version two: the mechanism

```js
export function evaluate({ filePath, content } = {}) {
  if (typeof content !== "string") {
    return { decision: "allow" };
  }

  if (typeof filePath === "string" && filePath.includes("TaxRuleService")) {
    return { decision: "allow" };
  }

  if (RULE.pattern.test(content)) {
    return { decision: "deny", ruleId: RULE.id, reason: RULE.reason, hint: RULE.hint };
  }

  return { decision: "allow" };
}
```

Same fact about the domain, wired as a `PreToolUse` hook on `Write`/`Edit`
instead of a paragraph — same shape as `gate-shell.mjs`: a pure decision
function, one exception written down instead of assumed, a CLI entry point
that never touches the decision itself. The one exception is
`TaxRuleService` itself: it's the file that's allowed to touch
`discountPercent` directly, because it's what the rule routes everyone else
to. Encoding that exception as a file-path check, instead of leaving it as
an unstated "well, obviously not there," is what makes the rule specific
enough to test instead of just specific enough to sound right out loud.

## The test is the argument

```js
test("the text rule never blocks anything, even given a violation", () => {
  assert.equal(checkTextRule(violation), "not enforced");
});

test("the hook blocks a direct assignment outside TaxRuleService", () => {
  const result = evaluate({ filePath: "app/Http/Controllers/InvoiceController.php", content: violation });
  assert.equal(result.decision, "deny");
  assert.equal(result.ruleId, "RC01");
});
```

Both tests run against the exact same fixture — a controller that assigns
`$invoice->discountPercent` straight from a request parameter. The text
version doesn't fail this test because it never had a chance to pass it:
there's nothing in `checkTextRule()` that could distinguish `violation.php`
from an empty string. The hook version denies it with an id and a hint that
says what to do instead — `Route discount changes through
TaxRuleService::applyDiscount()` — because a deny with no path forward is
what makes an agent retry the same blocked write, or improvise around it.

## What transfers

The rule itself is Acme Invoices' rule; yours will be about a different
field in a different service. What transfers is the exercise: pick one
sentence already sitting in your own `CLAUDE.md`, and try to write a second
version of it as a function that actually receives the write before it
happens. If you can't — if the check would need to inspect intent, or
tone, or "did the developer mean to do this" — that's information too. Some
rules genuinely can't become a mechanism cheaply, and knowing which ones
those are before you promise your team a guarantee you can't build is worth
the fifteen minutes the exercise takes.

## Limitations

- **The hook only sees what the tool-use protocol exposes** — the file
  content Claude Code is about to write, nothing more. Same class of limit
  as `gate-shell`'s text-pattern matching: it reads text, not semantics.
- **One rule, one file-path exception.** A real rule set needs many rules,
  and needs to handle a class split across files, a trait, or someone
  renaming `TaxRuleService` itself — none of that is here.
- **This doesn't prove hooks are sufficient — only that text alone is
  insufficient.** A hook can be misconfigured, unregistered, or buggy on its
  own terms. `gate-shell`'s own README documents exactly that: a hook that
  silently allowed everything because of a one-line path-encoding bug,
  caught only because the README's own example was run against a real
  machine before publishing.
