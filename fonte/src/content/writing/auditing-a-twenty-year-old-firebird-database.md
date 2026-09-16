---
title: 'A column named TEN_ID is a relationship, not a coincidence'
description: 'A twenty-year-old Firebird schema has no comments and no declared foreign keys — the naming convention is the only thing that still says how the tables relate. Two heuristics for a read-only inventory pass, and a hook that reuses gate-shell.mjs verbatim, scoped to one guarantee: no write reaches the legacy database while the inventory runs.'
pubDate: 2026-10-16
tags: ['agent-harness-cookbook', 'Claude Code', 'hooks', 'legacy systems']
draft: true
---

Every example in this cookbook so far assumes the codebase already has some
structure worth enforcing — a `TenantModel` base class, a `TaxRuleService`,
a test file next to a hook. A twenty-year-old Firebird database doesn't
give you that. It gives you tables named `CUSTOMERS` and `INVOICES`, columns
named `TEN_ID` and `FLG_ACTIVE`, and nothing else — no comments, no
declared foreign keys, no way to ask the schema itself what it means. The
naming convention is the documentation, and it's the only documentation
there is.

[`inventario-legado`](https://github.com/saragilberto/agent-harness-cookbook/tree/main/exemplos/inventario-legado)
is the eighth and last example in the cookbook. Before an agent proposes
anything against a schema like this, it needs to read it first — and the
connection it reads through needs to be mechanically incapable of writing
anything while that reading happens.

## What the naming convention is actually saying

```sql
CREATE TABLE CUSTOMERS (
  CUST_ID INTEGER NOT NULL,
  CUST_NM VARCHAR(60),
  TEN_ID INTEGER,
  FLG_ACTIVE CHAR(1) DEFAULT 'Y',
  PRIMARY KEY (CUST_ID)
);
```

`TEN_ID` is not a coincidence. It's a foreign key to a `TENANTS` table —
the same tenant-scoping concept `grader-deterministico` and
`gate-shell` both assume is already enforced elsewhere in this cookbook's
fictional domain. Here it's enforced by nothing. There's no `FOREIGN KEY`
constraint, no `CHECK`, not even a comment. The relationship is completely
real and completely unenforced, and the only reason anyone can tell it's
there at all is that whoever named this column two decades ago followed a
convention consistently enough that the pattern survived.

```js
const looksLikeForeignKey = /_ID$/i.test(column.name) && !table.primaryKey.includes(column.name);
if (looksLikeForeignKey && !table.foreignKeyColumns.has(column.name)) {
  suspiciousPatterns.push({
    table: table.name,
    column: column.name,
    kind: "implicit-foreign-key",
    message: `${table.name}.${column.name} looks like a foreign key but has no FOREIGN KEY constraint.`,
  });
}
```

`inventory()` reads that convention back out: any column ending in `_ID`
that isn't the table's own primary key, and has no declared constraint
pointing at it, gets flagged. Not as an error — as a fact worth surfacing
before anyone decides `TEN_ID` is safe to drop or rename.

## The control case is what makes the heuristic trustworthy

`fixtures/schema.sql` has one table that breaks the pattern on purpose:

```sql
CREATE TABLE TAX_RULES (
  RULE_ID INTEGER NOT NULL,
  TEN_ID INTEGER,
  PCT NUMERIC(5,2),
  FOREIGN KEY (TEN_ID) REFERENCES TENANTS (TEN_ID),
  PRIMARY KEY (RULE_ID)
);
```

`TAX_RULES.TEN_ID` has the exact same name and the exact same shape as
`CUSTOMERS.TEN_ID` — the only difference is a declared constraint. Writing
the flag for the undeclared case took ten minutes. Trusting it took a
second table that *does* have the constraint, and a test asserting the
heuristic stays silent about it:

```js
test("does not flag a *_ID column that has a real FOREIGN KEY constraint", () => {
  const { suspiciousPatterns } = inventory(schema);
  const flagged = suspiciousPatterns.some((p) => p.table === "TAX_RULES" && p.column === "TEN_ID");
  assert.equal(flagged, false);
});
```

Same discipline as `grader-deterministico`'s `Payment extends TenantModel`
fixture: a scanner proven only against violations will happily also flag
things that are fine, and nothing in a violations-only test suite would
ever tell you that.

## The other heuristic: a type that predates a real boolean

```sql
FLG_ACTIVE CHAR(1) DEFAULT 'Y',
```

Firebird didn't always have a native boolean type, and a lot of schemas
from this era standardized on `CHAR(1)` — `'Y'`/`'N'`, sometimes a
three-state flag nobody remembers the third value for. `inventory()` flags
every `CHAR(1)` column as a likely undocumented flag, on the same logic as
the foreign-key heuristic: it's not proof of a problem, it's a fact
specific enough to make someone check before they assume they know what
the column means.

## Reading is not enough — the connection has to be unable to write

```js
export function evaluate(command) {
  if (!LEGACY_DB_MARKER.test(normalized)) {
    return { decision: "allow" };
  }

  if (WRITE_VERB.test(normalized)) {
    return {
      decision: "deny",
      ruleId: "IL01",
      reason: "write operation against the legacy schema",
      hint: "This connection is read-only until the inventory is signed off. Use a SELECT or the -x metadata extraction instead, and open a migration for any actual write.",
    };
  }

  return { decision: "allow" };
}
```

`readonly-guard.mjs` is `gate-shell.mjs`'s function verbatim in shape —
pure `evaluate()`, denial with a hint, CLI plumbing kept separate — aimed
at exactly one thing: no command that touches the legacy database and
contains a write verb gets through, while anything that doesn't mention
that database at all passes untouched. The guard isn't "no writes
anywhere." It's "this one connection, this one guarantee," which is the
right scope for a rule that exists because the schema underneath it is
still being understood, not because writes are dangerous in general.

## What transfers

The two heuristics are specific to this fixture's abbreviations and this
one legacy quirk. What transfers is the order of operations: read first,
using heuristics honest about being heuristics and proven against a case
they should stay quiet on, and only then let anything propose a change —
through a connection that's mechanically read-only until that inventory is
actually signed off, not just verbally agreed to be careful around.

## Limitations

- **The DDL parser is regex, not a real SQL parser.** Firebird's actual
  syntax has more shapes than four `CREATE TABLE` statements — computed
  columns, domains, `CHECK` constraints — none of it handled here.
- **The implicit-foreign-key heuristic is a naming convention, not proof.**
  A `_ID` column that doesn't mean "references another table" is a false
  positive; a real reference named differently is a false negative.
- **`readonly-guard` matches a database marker string, not a real
  connection.** The same command reaching the same database through a
  different alias or a wrapper script wouldn't be recognized — the same
  class of limitation `gate-shell`'s own README documents for text-pattern
  gates.
- **This proves read-only enforcement, not a complete inventory.** A
  schema this old can have triggers or stored procedures the pass never
  sees if nobody points it there.
