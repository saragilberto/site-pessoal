---
title: 'A local dashboard where every repo is a person at a desk'
description: 'A read-mostly status panel for a multi-repo, multi-agent workflow: who is working, who is waiting on review, which PRs need attention, and how the production bots are doing. What it reads, what it refuses to do, and why the review button can never approve anything.'
pubDate: 2026-11-24
tags: ['agentic workflows', 'multi-repo', 'observability', 'developer tooling']
draft: false
---

Once an orchestrator is dispatching work to a session per repo, a new
problem shows up. You can no longer tell, at a glance, what is going on.
Which repo is mid-task? Which one is waiting for me? Which PRs have been
sitting without a review for two days? Is the production support bot
actually up?

The answer used to be "switch terminals and look". That doesn't scale past
three or four repos, and it fails quietly: the repo that needs you is
exactly the one you aren't looking at.

So I built a small local dashboard. Each repo is a little character at a
desk. The metaphor is silly on purpose. A row of desks is faster to read
than a table of statuses, and I notice a red tag before I notice a cell
changing text.

<video controls preload="none" playsinline poster="/media/escritorio-poster.jpg" width="100%">
  <source src="/media/escritorio.mp4" type="video/mp4" />
  A screen recording of the dashboard, in anonymized mode.
</video>

*The dashboard running in recording mode: product and bot names are replaced on screen, the data is real.*

## The layout follows the dependency graph

Desks are arranged in rows called waves. The waves aren't designed by hand:
they're computed from the dependency declarations in the same file the
orchestrator already uses. A repo that depends on nothing sits in wave 1,
the ones that depend on those sit in wave 2, and so on.

That is also the order in which releases go out. The dashboard doesn't
invent a second source of truth for it; it reuses the one that already
decides the order of work.

Production gets its own row at the bottom, drawn differently (dashed
outline) so nobody confuses a bot with a repo.

## What each character says

| State | Meaning | What you see |
|---|---|---|
| In task | A session is working, a subagent is running, files are modified, or there's a work branch without a PR | Stays at the desk, laptop screen lit |
| Waiting | A PR is waiting on review, or the repo is idle | Wanders to the kitchen, sofa or notice board (at most three away from desks) |
| Needs attention | The session is blocked on an answer from me | Red tag, plus a button that jumps straight to that terminal |
| In a meeting | The orchestrator just wrote a briefing or dispatched tasks | The involved repos walk to the meeting room |

Clicking a character shows the detail: branch, changed files, latest tag,
PRs with review decision and check results, sessions and subagents.

The "at most three away from desks" cap is a small thing I'd defend. Without
it, a quiet day turns the whole office into a crowd at the sofa, and the one
desk that matters stops standing out.

## Where the data comes from

Nothing here is exotic, which is the point.

- **The dependency file** gives the repo list, the waves and the session
  names.
- **Local git** gives branch, working tree state and latest tag. The agent's
  own config folder is ignored when deciding if the tree is dirty, otherwise
  every repo would look permanently modified.
- **The GitHub CLI** gives open PRs, review decision and check results.
- **Agent hooks** give sessions, subagents and dispatches. They append to a
  local event log, and what they record is deliberately thin: the repo name,
  short ids and the event type. Never a prompt, a response or a command.
- **A status file for the production bots**, covered below.

If the hooks aren't installed, the dashboard still works. It falls back to
inferring state from git and GitHub alone. That matters for trust: a panel
that goes blank when one input is missing teaches you to stop looking at it.

## PR alerts and a review that cannot approve

Every open PR that isn't a draft and has no review decision triggers an
alert: a chip in the header, a pulsing badge on the repo's character, and a
counter in the browser tab title, so it's visible even when the tab is in the
background.

Next to it is a **Send to review** button. It starts a headless agent
session in the repo folder, and the constraints are the interesting part:

1. The reviewer reads the diff, checks it against the repo's own
   instructions file, and looks for bugs, security and tenant-isolation
   risks, and missing tests.
2. Its tools are read-only: viewing the PR, its diff and its checks, plus
   git log, diff and show.
3. The report is saved locally, with buttons to view or redo it.
4. Publishing it as a PR comment is a separate, optional step with a
   two-click confirmation, and the comment says it is an automated review.

The limits are hard numbers, not intentions: a spending cap and a 20-minute
timeout per review, and at most three reviews running at once. And it never
approves and never requests changes. Those two GitHub actions carry weight in
a team's process, and I don't want an automated reviewer casting them.

Nothing reaches GitHub unless I click twice.

## Production bots without crossing a user boundary

The support agents run in containers under a different user account on the
same machine, one the dashboard can't see into directly. Rather than punch a
hole through that boundary, a small exporter that lives in the bot's own repo
writes a status file every 30 seconds into a shared folder. The dashboard
reads that file and draws one character per bot.

| State | Meaning |
|---|---|
| Serving | Activity in the last 5 minutes |
| Online | Container up, waiting for a message |
| Down | Container stopped, or the agent session inside it has died |
| No signal | The file is older than 150 seconds, so the exporter itself stopped |

"No signal" is a distinct state on purpose. If the exporter dies and the
dashboard keeps showing the last known "online", it's lying. Showing the
bots with no state at all says the true thing: I don't know.

The exporter only reads the container runtime and records state. It never
touches conversations, prompts, messages, environment variables or secrets.

## Three ways to open it

| Mode | Audience | What changes |
|---|---|---|
| Full | Me, on my machine | Listens on loopback only. Has the actions: jump to terminal, send to review, publish as comment |
| Read-only | Management, on the internal network | Same screen, no action buttons at all. Requires a username and password, shows no review reports, and rate-limits the refresh button to one every 15 seconds |
| Recording | Videos and demos | Swaps names on screen: products become "product 1, 2…", bots become "support 1, 2…". The data is unchanged |

The read-only mode is the one I thought hardest about. It only binds outside
loopback when started with the read-only flag **and** a password is set.
There's no way to start it exposed and writable by accident.

It also has an honest caveat. The password travels over HTTP Basic, in
cleartext on the internal network. The mitigation is to use a password that
exists only for this panel, and the real fix is an HTTPS proxy in front. I'd
rather write that limitation down than imply the panel is more locked down
than it is.

The recording mode exists because I wanted to show this tool publicly
without showing the names of real products or bots. Anonymization is applied
at render time, so the demo and the real thing are the same code path.

## What it never does

This list is the design:

- Merge
- Tag or publish
- Deploy
- Push
- Approve a PR
- Type into a terminal tab

The only local actions are bringing a Terminal window to the front and
running a read-only review. The POST endpoints accept only local requests,
only repo names that exist in the dependency file, and only PRs that the
GitHub CLI reported as open. An endpoint that accepts arbitrary repo names
and PR numbers is a tool waiting to be pointed at the wrong thing.

It's the same rule as the orchestrator: the agent and the tooling around it
can observe, summarize and prepare, but the irreversible or outward-facing
step belongs to a person.

## What I'd say about it honestly

It's a small Python script with a test file, not a product. It has no
persistence beyond an event log, and the "office" is a rendering of state
that already exists in git, GitHub and a few hooks. Nothing about it is
clever.

What it changed is where my attention goes. Before, I polled terminals.
Now I look at one screen, and the things that need me are the things that
are red, pulsing or in the tab title. The cost of coordinating many agents
is mostly the cost of knowing which one needs you, and that turns out to be a
small, cheap thing to build once the state is already being recorded
somewhere.
