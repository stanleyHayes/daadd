# PROMPT_PLAYBOOK.md

> Reusable prompts and instructions distilled from the prompts that built this codebase, refined and generalized so your team can drop them into a new AI-agent session at the start of any new project and reliably get the same caliber of output.
>
> **How to use:** copy the section that applies. Replace `<...>` placeholders with project specifics. The prompts assume a capable model (Claude Opus, GPT-5-class) with file-edit + shell-run tools and a few minutes of patience for multi-commit work.

---

## Table of contents

1. [Why this exists](#1-why-this-exists)
2. [The kickoff prompt](#2-the-kickoff-prompt) — what you say first
3. [Standing instructions to paste into every session](#3-standing-instructions-to-paste-into-every-session)
4. [Decision-driving follow-ups](#4-decision-driving-follow-ups)
5. [Quality-bar prompts](#5-quality-bar-prompts)
6. [Pivot prompts that worked here](#6-pivot-prompts-that-worked-here)
7. [Status / scope-control prompts](#7-status--scope-control-prompts)
8. [Anti-patterns — prompts that LOOK helpful but cause regressions](#8-anti-patterns--prompts-that-look-helpful-but-cause-regressions)
9. [A complete kickoff transcript](#9-a-complete-kickoff-transcript-edited)

---

## 1. Why this exists

Most AI-agent sessions produce mediocre code because the operator doesn't tell the agent enough about the bar to clear. This playbook captures the specific phrasing that drove this project to:

- 16 atomic commits with proper Conventional Commit messages.
- A living `ARCHITECTURE.md` updated alongside every code change.
- Doc comments on every exported symbol.
- A real test pyramid: testcontainers for integration, uber-gomock for unit.
- A pre-commit + CI pipeline that fails loud on lint, format, or test regressions.
- Strategy / Repository / Composition-Root / Adapter patterns applied where they actually buy something.

The prompts below are not magic words. They tell the agent **what to optimize for** and **what mistakes to avoid**. The agent does the rest.

---

## 2. The kickoff prompt

Paste this **first**. Replace the placeholders.

```
You are working on a new project: <one-line description>.

Your role: principal engineer. I will give you architectural goals
and you will execute them across many commits.

Operating constraints — read once, follow throughout:

  1. Produce atomic commits along the way with Conventional Commit
     messages (feat, fix, chore, docs, test, refactor, perf, build,
     ci, style). One concern per commit. Detailed bodies that
     explain the WHY, not just the WHAT. Do NOT include any AI tool
     authorship in commit messages.

  2. Write tests at every layer:
       - Unit tests with mocks for collaborators.
       - Integration tests against real dependencies (Postgres,
         Redis, etc.) via testcontainers.
       - End-to-end smoke from a built binary for any new endpoint.

  3. Doc comments on every exported package, type, function, method,
     constant, and field. Non-trivial unexported helpers too.

  4. Use design patterns where they pay off: Strategy for swappable
     external providers, Repository for persistence, Adapter for
     cross-package interface bridging, Composition-Root for DI.

  5. Maintain TWO authoritative docs alongside the code:
       - SPECIFICATION.md — the product + technical spec.
       - ARCHITECTURE.md — the live code map and per-commit change log.
     Every commit that adds or moves code updates ARCHITECTURE.md in
     the SAME commit.

  6. Always install the LATEST STABLE version of every dependency
     when introducing it. Do not pin to older majors unless you
     document a downstream blocker.

  7. Use TodoWrite (or equivalent) to track the commit sequence.

Greenfield protocol:
  - Start by reading any briefing material I attach.
  - Produce SPECIFICATION.md, ARCHITECTURE.md, an AGENT_PLAN.md task
    queue, and a CONTRIBUTING.md before any code.
  - Scaffold the directory structure, then build feature by feature.
  - Pause and ask before introducing a new external dependency
    category (DB, auth provider, hosting target).

Stack rules (override as needed):
  - <Backend language / framework>
  - <Frontend stack — name what you DO and DON'T want>
  - <DB / cache>
  - <Deploy targets>

Style rules:
  - Conventional Commits, no AI-tool authorship.
  - golangci-lint / equivalent linters configured strictly from day 1.
  - Pre-commit hooks for format + lint + commit-message regex.
  - GitHub Actions CI blocks merge on lint / test failure.

When you need a decision I haven't given, list 2–3 options with
their tradeoffs and pick one. Don't ask broad open-ended questions.

Begin by acknowledging these constraints in one sentence, then
read the brief and produce SPECIFICATION.md.
```

**Why this works**

- States the deliverable cadence ("atomic commits along the way") up front, so the agent doesn't dump everything into one mega-commit.
- Pre-commits the agent to a quality bar (tests + doc comments + CI) before it writes any code, which is much harder to walk back later.
- Names the patterns you want — agents over-use abstractions when allowed to "pick" and under-use them when not asked. Naming them explicitly normalizes their use.
- "Latest stable of every dep" prevents the cargo-cult version pinning that plagues AI-written code.
- The "list 2–3 options" rule turns ambiguous moments into decisions you can ratify in one line, instead of derailing the session.

---

## 3. Standing instructions to paste into every session

Drop these in `.claude/instructions.md` (or your tool's equivalent) so every session in the project inherits them.

```
PROJECT STANDING ORDERS

Architecture
  - Layering: cmd -> http -> service -> store -> platform -> domain.
    Imports flow inward only. Domain has no outside imports.
  - Provider-pluggable categories (SMS, mail, media, AI scorer) live
    behind interfaces with at least: stub (dev/test) + real impl +
    factory. Factory refuses to return stub in production.
  - Consumer-defined interface pattern: the consuming package owns
    the interface; the producing package implements it. Adapters
    live in the composition root or in a thin shared package.

Tests
  - Unit tests use uber-gomock + testify; no hand-rolled fakes.
  - All mocks live in internal/mocks generated from //go:generate
    directives in mocks/doc.go.
  - Integration tests use testcontainers via internal/testdb. One
    container per test package via sync.Once.
  - External test packages (foo_test) for tests that need mocks
    of an interface defined IN the same package — required to
    avoid import cycles.

Commits
  - Conventional Commits format: <type>(<scope>)?(!)?: <subject>
  - Detailed body: WHY, not WHAT.
  - One concern per commit.
  - Never include AI-tool authorship.
  - Every commit updates ARCHITECTURE.md change-log in the same
    commit. Recording the prior commit's SHA in the same edit is
    fine — backfill the current commit's SHA in the NEXT commit.

Docs
  - SPECIFICATION.md is authoritative for product + tech decisions.
  - ARCHITECTURE.md is the live code map: package-by-package
    breakdown + cross-reference tables + change log.
  - CONTRIBUTING.md documents the developer workflow.
  - docs/ethics-and-legal.md (if applicable) holds non-negotiable
    feature constraints.

Lint
  - golangci-lint must be 0 issues before any commit.
  - errorlint, errcheck, gosec, staticcheck, gocritic enabled.
  - Exceptions need //nolint comments with justifications.
```

---

## 4. Decision-driving follow-ups

When the agent has surfaced an "open question" (and you've been clear it should not invent answers), use one of these:

```
For each open question, pick the option with the best value/cost
ratio at MVP scale. Document the reasoning in SPECIFICATION.md §13
(or wherever the open questions live). Defer higher-overhead
alternatives until traction justifies them.
```

```
I confirm domain = <X>. For the rest, do some research and choose
the option that gives me the most value for money. Write up your
picks with one-line justifications.
```

These work because they cap the loop: instead of pinging back and forth, the agent commits to a stack and tells you why, and you only intervene if you disagree.

---

## 5. Quality-bar prompts

After the kickoff, drop these in at the right moments.

### To enforce architecture documentation

```
I need an architecture document for how the whole codebase works
together. Like a reference for finding something in the codebase or
getting an overview of where every function, struct, class,
interface, service, etc. is. Document everything there. Also add a
doc comment to every function, struct, etc.
```

### To install lint + CI on a tree that doesn't have it

```
Add linting to the Makefile. Add all the linting rules — strict.
Add pre-commit hooks so commit messages follow Conventional Commits.
Add GitHub Actions CI that blocks merge unless tests AND lints pass.
```

### To switch the test framework after the project has gone wrong with hand-rolled fakes

```
For testing, we will use testcontainers for integration tests, and
uber-gomock + testify for unit tests. Refactor existing tests to
match. Add a make generate target for regenerating mocks. Document
the convention in CONTRIBUTING.md.
```

### To add an operator CLI

```
Build a CLI using urfave/cli for running operational commands. It
should share internal packages with the server so they don't drift.
Include commands for: migrations (up + status), user creation,
issuing tokens for testing, health pinging dependencies, and
test-send for every external provider (SMS, mail, ...).
```

### To enforce the gRPC vs REST boundary

```
Use gRPC where it pays off — typically the internal service-to-
service boundary. External clients (browsers, mobile) stay on
REST/JSON. Define proto contracts in a top-level /proto/ directory
managed by Buf. Check generated stubs into the repo so CI doesn't
need protoc.
```

### To preserve the playbook for future agents

```
I want to preserve and refine all the good commands I gave you into
a playbook my team can feed to their agents when they start new
projects. Also create a LEARNING.md that teaches every concept used
in this project so a junior engineer can ramp up by reading it.
```

---

## 6. Pivot prompts that worked here

When the agent has chosen a stack you don't want, give a single corrective and let the agent re-plan:

```
Use <X> not <Y>. Use the latest of every package. I don't want
<unwanted thing>.
```

Example (real):
```
Use React not Next.js. Use the latest of every package. I don't
want Next.js or Tailwind CSS.
```

The agent will redo plans, configs, package lists, and architecture diagrams in one round. Don't over-explain — the agent infers reasons.

To redirect a deployment target:

```
Deployments will be at <static host> and <container host>. I
usually use <media host> and <email provider>.
```

To redirect a UI library:

```
Why not <UI library X> instead of <UI library Y>?
```

This is a question, but it's also a directive — the agent will explain its choice AND consider yours. If you push back, it'll switch.

---

## 7. Status / scope-control prompts

Mid-session, when work is accumulating:

```
Pause. Status summary: what's done, what's pending, biggest risks
on remaining work. Then propose three options for what to do next —
keep going, stop here, or skip ahead — with the tradeoffs of each.
I'll pick.
```

This was the prompt that produced the "Option A/B/C/D" checkpoint mid-build on this project. It's the single most effective way to avoid agent burnout (and your own).

When you need to time-box:

```
Finish only commits <X> and <Y>. Stop after that — additional
features are out of scope for this session. Document what's deferred
in AGENT_PLAN.md.
```

---

## 8. Anti-patterns — prompts that LOOK helpful but cause regressions

Things you might be tempted to say but shouldn't:

- **"Just keep going and surprise me."** Agents over-build under-prioritized features when given this latitude. Always cap with a phase or commit budget.

- **"Add tests for everything."** Too vague. Agents respond by adding low-value tests (mostly assertions of trivial getters). Be specific: "Unit tests with gomock for every interface; integration tests via testcontainers for every repository."

- **"Refactor this to be cleaner."** Without a target architecture or smell to fix, the agent will churn the file without improving anything measurable. Instead: "Refactor X to use the Strategy pattern so we can add Y later."

- **"Write good code."** Means nothing. The standing-orders block + the kickoff prompt's quality bar replaces this phrase.

- **"Skip the tests, we don't have time."** Saves an hour today, costs ten next month. Skip code instead — defer features, never defer tests for the features you do ship.

- **"Use the latest version of <library>."** Better: "Always install the latest stable version of every dependency." Phrasing it as a project-wide policy stops the agent from one-shot updating one library while pinning others.

- **"Make the commit message shorter."** The detailed bodies are the value. Better: "Keep titles under 70 chars; the body is the documentation."

---

## 9. A complete kickoff transcript (edited)

Here's a sanitized version of the prompts that produced this project, in order, with the agent's responses summarized in italics.

```
USER: <Brief: cyber-security platform for Ghana, defensive scam detection.>
AGENT: <Reads brief, produces SPECIFICATION.md + AGENT_PLAN.md + ethics doc + initial scaffold.>

USER: yeah proceed. give me commits along the way with good commit
      titles and messages so I can trace. write tests. use the best
      architecture. you're a principal engineer. write extendable
      code. use design patterns. do not include claude in any
      commit message.
AGENT: <Plans 12 commits. Begins.>

USER: use React not Next.js. use the latest of every package. I
      don't want Next.js or Tailwind CSS.
AGENT: <Redoes frontend plan, updates SPECIFICATION.md, AGENT_PLAN.md,
       memory.>

USER: deployments will be at Vercel, Render. I usually use Cloudinary
      and Resend.
AGENT: <Locks in those provider choices in SPECIFICATION.md §13.>

USER: I need an architecture document for how the whole codebase
      works together. Like a reference for finding something in the
      codebase. Document everything. Add doc comments to every
      function, struct, etc.
AGENT: <Creates docs/ARCHITECTURE.md, audits existing code for doc
       comments, updates AGENT_PLAN to mandate the pattern.>

USER: use grpc necessary. don't forget that.
AGENT: <Documents gRPC for internal service-to-service, REST at edge.
       Adds Proto/Buf track to AGENT_PLAN.>

USER: with the open ended questions, the only one I can confirm is
      the domain. usenemesis.com. For the rest do some research and
      choose one that brings me big value for money.
AGENT: <Picks SMS provider, AI hosting, legal entity, team shape,
       analytics, lead routing, marketing copy ownership. Justifies
       each with one line. User confirms.>

USER: add linting to the makefile. also add all the linting rules.
      also add pre-commit so it follows a good commit message
      pattern. add CI for GitHub Actions so you can only merge if
      tests and lints pass.
AGENT: <Adds .golangci.yml, .pre-commit-config.yaml, .githooks/
       commit-msg, .github/workflows/ci.yml, CONTRIBUTING.md.
       Fixes lint issues caught in existing code.>

USER: you can also build a cmd using urfavcli for running some
      commands easily.
AGENT: <Adds cmd/nemesisctl with migrate/user/token/health/sms/mail
       subcommands.>

USER: for testing, we will use testcontainers for integration tests
      and uber gomock and testify for unit tests.
AGENT: <Refactors test infra: internal/testdb (testcontainers
       helpers), internal/mocks (gomock-generated), migrates 7
       existing tests, updates CI to remove docker service block.>

USER: let's go with B
      (i.e. finish the Go backend, defer frontends + AI service)
AGENT: <Builds OTP service, auth handlers, check endpoints, reports/
       alerts/leads. Stops at Go backend feature-complete.>

USER: I want to preserve and refine all the good commands I gave you
      into a playbook my team can feed to their agents. Also create a
      LEARNING.md.
AGENT: <Writes this file and LEARNING.md.>
```

Notice the pattern: most user prompts are 1–3 sentences. Each one names a constraint, a target, or a directive — never an open question. The agent fills in the long form (specs, plans, code, tests, docs). Operator effort scales sublinearly with output volume.

---

**Maintenance:** when a new pattern proves out in another project, add it here under §5 (quality-bar prompts) or §6 (pivot prompts). Keep §8 (anti-patterns) up to date as you discover new failure modes.
