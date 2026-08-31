---
title: 'A cell that starts with "=" is not data: sanitizing exports against formula injection'
description: 'A CSV/Excel export endpoint treated every cell as text, but a spreadsheet application does not. Four leading characters turn a cell into a formula, one shared export base class fixes it for every report at once, and the test that matters checks the byte at index zero, not the string.'
pubDate: 2026-08-31
tags: ['security', 'sanitization', 'CSV', 'testing']
draft: false
---

A report export feature almost never gets a security review, because
nothing about it looks like an attack surface. There's no login form, no
SQL, no file upload. It reads rows the user is already allowed to see and
writes them to a file the user already asked for. The only thing that
changes is the file format — and the file format is exactly where the
vulnerability lives.

## The four characters that matter

Open a CSV in a spreadsheet application and any cell whose content starts
with `=`, `+`, `-` or `@` is not treated as data. It's parsed as a formula.
That's true even though CSV has no concept of formulas at all — the format
itself is just delimited text. The interpretation happens entirely on the
opening side, which is precisely what makes it easy to miss: the export
code is correct CSV, and the vulnerability only appears once someone opens
it in Excel, Sheets, or LibreOffice Calc.

If a value a user controls — a name, a note field, a free-text column —
ever ends up in an exported cell unmodified, and that value happens to
start with one of those four characters, the person opening the file is
now running whatever formula was in that cell. `=HYPERLINK("http://…", "Click")`
exfiltrates data through a link that looks like a normal cell. `=cmd|'/C
calc'!A0`, on older Excel configurations with DDE enabled, runs an
arbitrary command. Neither requires a macro, a plugin, or the victim to
approve anything beyond opening a file they exported from a system they
trust. This is CWE-1236, and it's old enough that most spreadsheet vendors
have shipped partial mitigations — but "partial" is doing a lot of work in
that sentence, and an export endpoint can't rely on the reader's client
being patched.

## Why the fix has to live in one place

The tempting fix is local: find the export code for the report that
prompted the finding, sanitize the fields that came from user input there,
close the ticket. That works for exactly one report. The moment a second
report exports a different user-controlled field — and in a system with
more than a handful of report types, there's always a second one — the
same vulnerability exists again, unfixed, because nobody remembered the
first fix was report-specific.

The decision that actually closes the vulnerability class is putting the
sanitization in the shared code every report export already goes through
— the base export writer, not each report's controller or query. Every
report inherits the fix by construction instead of by someone remembering
to call a helper. That also means the fix doesn't require knowing which
fields are "safe" and which aren't ahead of time: numeric and boolean
values are never prefixed by formula characters by construction, so the
check can run unconditionally on every string cell without a per-column
allowlist to keep in sync as reports change.

The actual sanitization is almost embarrassingly small: if a string cell's
first character is `=`, `+`, `-`, or `@`, prepend a single apostrophe. In
every spreadsheet application this repository's exports need to support, a
leading apostrophe forces the cell to render as literal text — the
formula never evaluates, and the visible content is unchanged for anyone
just reading the export. The whole fix is a few lines. Finding the one
place to put those few lines is the actual work.

## The nuance a naive check misses

The first version of this kind of guard usually checks `value[0]` against
the four characters directly, and that's not quite enough. A cell whose
content is a single leading space followed by `=SUM(...)` still opens as a
formula in some clients, because leading whitespace gets trimmed before
the formula parser looks at the first character — so a check anchored
strictly to index zero can be bypassed by anyone who notices the space
still works. The correct check trims leading whitespace first, then tests
the first non-whitespace character. It's a one-line difference, but it's
the difference between a guard that stops a copy-pasted payload from a
vulnerability scanner and one that stops the actual attack, which will
never be considerate enough to skip the leading space on purpose.

The same trim call happens to cover tab and carriage return too — PHP's
default `ltrim()` strips those along with the space — but that's a
property of the language's default whitespace list, not a case this
codebase tests for directly. Worth knowing the difference: relying on a
standard-library default is not the same claim as having verified the
edge case.

## What got tested

The useful test here isn't "export a report and read the CSV back" — that
confirms the feature still works, not that the vulnerability is closed.
The tests that matter construct a cell value for each of the four trigger
characters, plus one with a leading space before the formula character,
plus a realistic `=HYPERLINK(...)` exfiltration payload, and assert on
the exact resulting string: it must start with the apostrophe, not
whatever character came after it. That's testing the guard at the level
where it can actually fail — the literal output value, not rendered
behavior — because a test that only checks "the formula didn't execute"
can't run inside CI at all; nothing in a test runner opens the file in a
spreadsheet application to find out.

## What this doesn't solve

Prefixing a cell with an apostrophe stops the formula from evaluating.
It doesn't stop `=HYPERLINK(...)` from rendering as inert text that still
contains the URL a phishing attempt wanted visible, and it doesn't stop a
user from manually deleting the apostrophe if they've been told to by
whoever sent them the file — sanitization at the export boundary defends
against a spreadsheet application's default behavior, not against a user
who's been socially engineered into disabling their own protection. It
also assumes every export path in the system funnels through the one
shared writer; the day a report ships with its own bespoke CSV
serialization to work around some formatting limitation, the vulnerability
class is back, in exactly one place, waiting for the same finding to be
filed against it again.

None of that makes the fix wrong. It closes the part of the problem that's
actually the export layer's job to close, and it closes it once, for every
report, instead of once per finding.
