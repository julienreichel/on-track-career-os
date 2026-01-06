# Codebase Audit Checklist (MVP → Consolidation)

## Purpose

Identify technical debt and refactoring opportunities to improve:

- maintainability
- performance
- security
- UI consistency
- long-term product evolution

## Output format (mandatory)

Produce a report with:

- **Findings list**, grouped by section below
- For each finding:
  - `severity`: `P0` (must fix) | `P1` (should fix) | `P2` (nice to fix)
  - `category`: one of the sections below
  - `location`: file path(s)
  - `symptom`: what’s wrong
  - `whyItMatters`: impact
  - `suggestedFix`: concrete refactor approach
  - `estimatedEffort`: `S` | `M` | `L`
  - `risk`: `low` | `medium` | `high`

- End with:
  - **Top 10 refactor backlog** (sorted P0→P2)
  - **Quick wins (≤ 1h each)**
  - **Big rocks (multi-day)**

---

# Priority order (do in this order)

## 1) P0 Security & Privacy (first)

### 1.1 Sensitive data exposure

**Look for**

- CV text, job text, emails/phones logged to console/server logs
- storing raw files in unsafe places
- leaking internal errors containing data

**How to detect**

- search for: `console.log(`, `logger.`, `debug`, `print`, `toast.error(error)`
- search for obvious PII fields: `cvText`, `rawText`, `email`, `phone`, `linkedin`, `address`

**Output**

- list exact log lines + suggested redaction strategy

### 1.2 Rendering untrusted content (XSS risks)

**Look for**

- `v-html`
- markdown rendering without sanitization
- displaying user input as HTML

**How to detect**

- search for: `v-html`, `innerHTML`, markdown render components

**Output**

- where it happens, risk level, safe alternative

### 1.3 Client-side secrets / env misuse

**Look for**

- env vars that should be server-only used on client
- accidental inclusion of secrets in runtime config

**How to detect**

- check `runtimeConfig`, `process.env`, `import.meta.env`

**Output**

- list any suspicious keys and where they are used

---

## 2) P0 Data & GraphQL Performance (second)

### 2.1 Forbidden / costly patterns (your list + more)

**Look for**

- `list()` usage in hot paths
- missing pagination
- fetching full objects when only partial is used
- multiple sequential calls that should be relationships

**How to detect**

- grep for: `list`, `limit`, `nextToken`, repository list methods
- identify pages that load “everything” then filter client-side

**Output**

- per page/repo: what query is used, why it’s expensive, propose query shape

### 2.2 N+1 patterns

**Look for**

- fetching a list, then fetching details for each item in a loop

**How to detect**

- look for `for (...) await repo.get(...)`
- look for `Promise.all(items.map(...get...))`

**Output**

- replacement: expand selection sets, relationships, or batch query design

---

## 3) P0 Reliability & Error Handling (third)

### 3.1 Missing states (loading / empty / error)

**Look for**

- pages/components without clear loading skeleton
- empty lists with no call-to-action
- errors swallowed or only logged

**How to detect**

- review key pages flows; search for `catch {}` and `catch (e) {}` without rethrow/UX

**Output**

- list pages missing states + standard pattern to apply

### 3.2 Inconsistent error UX

**Look for**

- some use toast, some inline, some silent
- inconsistent validation messaging

**How to detect**

- grep for `useToast`, `UAlert`, `errorMessage`, `setErrors`

**Output**

- propose a single “Error Display Standard” + places deviating

---

## 4) P0 Architecture & Boundaries (fourth)

### 4.1 Layering violations

**Look for**

- UI directly calling repositories
- domain logic in pages/components
- composables doing too much (business rules + UI)

**How to detect**

- in pages/components: imports from `src/data/` or deep domain services
- very long page scripts

**Output**

- list violations + suggested move (service/composable/component)

### 4.2 Single source of truth breaches

**Look for**

- duplicated types/constants/schemas across layers
- same validation rules repeated differently

**How to detect**

- grep repeated object shapes / repeated constants / multiple “type copies”

**Output**

- propose consolidation targets

---

## 5) P1 Dead code & duplication (fifth)

### 5.1 Dead code

**Look for**

- unused components/composables/helpers
- unused GraphQL types or operations
- unreachable routes

**How to detect**

- static analysis + grep “not used”
- check exports never imported
- check `describe.skip`, `TODO remove`, commented blocks

**Output**

- list deletions by file + dependency impact

### 5.2 Duplicated code (logic + UI)

**Look for**

- similar logic across workflows (save/cancel/dirty tracking)
- repeated form layouts
- repeated fetch patterns

**How to detect**

- search repeated snippets (same blocks / same functions)
- identify “same feature implemented 2 ways”

**Output**

- candidate extractions: shared composables, shared components, shared utilities

---

## 6) P1 UI consistency & design system compliance (sixth)

### 6.1 Custom CSS / non-Nuxt UI patterns

**Look for**

- custom CSS files or scoped styles where Nuxt UI exists
- inconsistent spacing/typography
- manual buttons/inputs instead of Nuxt UI components

**How to detect**

- grep: `<style`, `.css`, `class="...custom..."`, `scoped`
- inspect component structure: should follow your standard scaffold

**Output**

- list files with custom CSS + replacement plan

### 6.2 Duplicated components

**Look for**

- two “Card” components doing the same
- multiple TagInput variants
- multiple modal confirm implementations

**How to detect**

- scan components folder for similarly named components
- compare props and usage

**Output**

- consolidation proposal: keep one, deprecate others

---

## 7) P1 Complexity hotspots (seventh)

### 7.1 Over-complex pages/components

**Look for**

- very long `<script setup>`
- too many responsibilities in one file
- deeply nested conditionals

**How to detect**

- file length thresholds (e.g., >250 lines)
- functions with high cyclomatic complexity (if lint reports exist)
- too many watchers/computed

**Output**

- component extraction plan: “page orchestrates, components render, composables own logic”

### 7.2 Watchers / reactivity performance traps

**Look for**

- deep watchers on big objects
- watchers doing async work without cancelation
- computed doing heavy mapping on every render

**How to detect**

- grep: `watch(`, `{ deep: true }`, `watchEffect`

**Output**

- alternatives: computed memoization, shallow refs, explicit triggers

---

## 8) P1 i18n readiness (eighth)

### 8.1 Hard-coded strings

**Look for**

- user-facing text directly in templates/script
- inconsistent labels across pages

**How to detect**

- grep for obvious UI text in components/pages
- check toast messages, empty states, validation messages

**Output**

- list strings + proposed i18n keys structure

---

## 9) P2 Testing health (ninth)

### 9.1 Skipped or flaky tests

**Look for**

- `describe.skip`, `test.skip`, `fixme`
- unstable selectors / strict mode violations
- repeated setup boilerplate

**How to detect**

- grep for `.skip(`, `.only(`, `fixme`
- scan E2E selectors for `getByText` ambiguity

**Output**

- list + fix approach (stable roles, test ids if necessary)

### 9.2 Coverage gaps on critical UX

**Look for**

- onboarding flows, empty state guidance, AI failure recovery not tested

**How to detect**

- map tests to pages and identify untested UX outcomes

**Output**

- propose new test cases (titles only + where they belong)

---

## 10) P2 Dependency & build hygiene (tenth)

### 10.1 Dependency bloat

**Look for**

- unused packages
- overlapping libraries (two markdown libs, etc.)

**How to detect**

- compare package.json with imports
- check bundle-size warnings if any

**Output**

- uninstall candidates + risk notes

### 10.2 Build & runtime anti-patterns

**Look for**

- SSR unsafe code without guards
- large libs imported in many places
- lack of code splitting (route-level)

**How to detect**

- grep for `window`, `document`
- check imports of heavy libs in shared components

**Output**

- list risks + recommended dynamic import boundaries

---

# Definitions

## Severity

- **P0**: security/perf/reliability issues that can break users, leak data, or explode costs
- **P1**: maintainability and UX consistency issues that slow development and confuse users
- **P2**: optimizations and cleanliness improvements

## Effort

- **S**: < 2 hours
- **M**: half-day to 2 days
- **L**: > 2 days

---

# Final deliverable structure (must follow)

1. Executive summary (10 bullets max)
2. Findings by checklist section (in the same order)
3. Top 10 refactor backlog (P0→P2)
4. Quick wins
5. Big rocks
6. Optional: proposed “Refactor Sprint Plan” (1–2 weeks)
