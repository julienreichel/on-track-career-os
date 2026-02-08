You are an expert staff engineer + tech lead assistant for a Nuxt 4 + TypeScript (strict) app using Nuxt UI, Amplify Gen2 (GraphQL), and an AI-Operations Lambda layer with strict schema validation (AI Interaction Contract).

We will implement [EPIC name]

Context you MUST align with (existing project patterns):

- Frontend uses Nuxt UI and the standard page scaffold: UContainer → UPage → UPageHeader/UPageBody; composable-first state management; reusable “Card” patterns; TagInput-based list editing; robust testing split (Vitest unit/composable/component/page + Playwright E2E happy path).
- AI layer is a registry of deterministic “AI operations” with strict input/output schemas and fallback strategies; app never receives free-form text (JSON only).

Your task:
Generate a SMALL SET of “master prompts” (typically 4–6) that I can give to another coding agent to implement then EPIC end-to-end.
Each prompt must guide implementation but must NOT provide a full technical solution; it should give boundaries, context, and acceptance criteria so the coding agent can implement cleanly.

For EACH master prompt, use this structure:

1. Title
2. Intro: context + why this prompt exists (tie to EPIC and current project status)
3. Feature scope: what to implement and what is explicitly out of scope
4. Composables / services / repositories / domain modules to create or update (favor DRY and consistency with existing patterns like useJobAnalysis/useCanvasEngine)
5. Components to create or update (use Nuxt UI; reuse existing canvas components/patterns where possible)
6. Pages/routes to create or update (and expected navigation/breadcrumb behavior)
7. AI operations impact (if applicable): operation name(s), what inputs they take, what outputs they must produce, strict schema validation + fallback rules, and where they are called from
8. Testing requirements: which Vitest tests to add (unit + Nuxt page/component) and the single Playwright E2E happy path for the EPIC
9. Acceptance criteria: clear checklist (functional + DX + correctness)

Constraints:

- Must remain consistent with JSON/Text I/O for AI ops; no free-text to the app except for CV anc cover letter.
- Keep code CLEAN + DRY + YANGNI: reuse existing patterns; avoid duplicating canvas logic; prefer shared “canvas engine” abstractions if already present.
- No new frameworks; stay within Nuxt 4 + Nuxt UI + existing testing toolchain.

Output:

- Provide the set of master prompts in copy/paste-ready format.
- Each master prompt should be complete and standalone.
- Do not include code solutions; only implementation guidance and boundaries.

---

---

---

## Master Prompt 1 — Public Landing Routing & Auth Gate

### 1) Title

**L1-A: Replace “login-wall” with public landing route + correct auth gating**

### 2) Intro (context + why)

Today, anonymous users hitting the site are redirected to `/login`, which creates confusion and kills conversion. This EPIC introduces a **public landing experience** and updates the auth gating so users see what the app is before signing in. This prompt exists to implement the **routing + middleware** layer cleanly and consistently with existing project patterns (Nuxt 4 composables/middleware, strict TS).

### 3) Feature scope

**In scope**

- Make `/` accessible publicly (no forced redirect to `/login`).
- If authenticated, `/` should route to the current “authenticated home” behavior (whatever the app uses today: dashboard/onboarding/etc.).
- Add/adjust global or per-route middleware to:
  - Protect authenticated pages (existing behavior should remain)
  - Allow public access to landing page and auth routes

- Ensure navigation between Landing ↔ Login is explicit and consistent.

**Out of scope**

- No new onboarding flow logic (keep existing `/onboarding` behavior).
- No new analytics/telemetry beyond what already exists.
- No changes to Cognito/Amplify auth implementation beyond routing/gating.

### 4) Composables / services / repositories / domain modules

- Update or create a **single** auth composable or helper used by middleware (e.g., `useAuthState()` / `useSession()` depending on your current patterns).
- Create/update a **route middleware** (global or named) that implements:
  - Public routes allowlist: `/`, `/login`, password reset routes (if any), assets
  - Auth-required routes: everything else (or explicit list)

- Keep the logic DRY: one authoritative place for “isAuthenticated”.

### 5) Components to create or update

- None required (routing only). If needed, update existing header/nav component behavior for logged-in vs logged-out.

### 6) Pages/routes to create or update

- Update `/` route behavior:
  - Anonymous: render Landing page
  - Authenticated: redirect to existing authenticated entry point (document which route and why)

- Ensure `/login` remains accessible publicly.
- Breadcrumbs: Landing typically has no breadcrumb, but if you have a standard layout, ensure it doesn’t show misleading breadcrumb trails.

### 7) AI operations impact

- None. Landing is static content; **no AI operations**.

### 8) Testing requirements

**Vitest**

- Unit test middleware logic (public vs protected behavior; authenticated vs anonymous).
- Page test for `/`:
  - Anonymous: renders landing marker content (e.g., hero headline)
  - Authenticated: triggers redirect (mock auth state).

**Playwright (single happy path)**

- Anonymous visits `/` → sees landing hero + CTA.
- Click “Create account” CTA → lands on `/login` with “Create Account” tab selected (or equivalent UI state).
- Optional: click “Sign in” CTA → lands on `/login` sign-in state.

### 9) Acceptance criteria (checklist)

- [ ] Anonymous users are not redirected to `/login` on `/`.
- [ ] Authenticated users do not see landing content; they are routed to the correct authenticated entry route.
- [ ] Auth-required pages remain protected as before.
- [ ] Middleware logic is centralized, typed, and covered by unit tests.
- [ ] Playwright happy path passes reliably.

---

## Master Prompt 2 — Landing Page Content & Layout (Nuxt UI Scaffold)

### 1) Title

**L1-B: Implement the public Landing page UI using Nuxt UI scaffold**

### 2) Intro

Now that `/` is public, we need a landing page that explains the product in <30 seconds: what it is, who it’s for, what outcomes it provides, how it works, and why it’s different. This prompt exists to implement the landing UI **cleanly** with Nuxt UI and existing page scaffolds (UContainer → UPage → UPageHeader/UPageBody) with reusable card patterns.

### 3) Feature scope

**In scope**

- Build `/` landing page using:
  - Hero section (headline, subtext, primary/secondary CTA)
  - “How it works” step section (3–5 steps)
  - “What makes it different” comparison section
  - “Trust & control” section (AI suggestions editable; data is user-owned; nothing saved without validation)
  - Optional: “Preview” section using static placeholder blocks or existing app screenshots (keep lightweight)
  - Final CTA block (create account / sign in)

- Content should align with the “AI Career Coach” positioning and the “guided journey” message.

**Out of scope**

- No blog, pricing, testimonials, SEO deep work.
- No dynamic personalization.
- No new CMS / content system.

### 4) Composables / services / repositories / domain modules

- Create `useLandingContent()` composable returning a typed structure for the sections (hero, steps, comparison rows, trust bullets, CTAs).
  - Keep it local and simple (YAGNI), but avoid hardcoding large blobs directly in template.
  - Consider i18n keys only if your app already has i18n patterns—otherwise keep copy inline but structured.

### 5) Components to create or update

Create reusable components under a `landing/` folder (or project standard):

- `LandingHero`
- `LandingHowItWorks`
- `LandingComparison`
- `LandingTrust`
- `LandingCTA`
  Use:
- Nuxt UI cards (`UCard`), badges (`UBadge`), buttons (`UButton`), icons if already standard
- Keep layout responsive; avoid custom CSS; prefer utility classes consistent with project.

### 6) Pages/routes to create or update

- Update `/pages/index.vue` to render landing for anonymous users (if routing is already handled elsewhere, keep it purely a page).
- Navigation behavior:
  - Primary CTA: “Create account” → `/login` with create tab selected
  - Secondary CTA: “Sign in” → `/login` default state
  - “See how it works” anchor scrolls to the step section (no external routing).

### 7) AI operations impact

- None.

### 8) Testing requirements

**Vitest**

- Component tests for at least:
  - `LandingHero` renders headline + CTA buttons
  - `LandingHowItWorks` renders correct number of steps from `useLandingContent`

- Page test for `/` to ensure all sections render.

**Playwright**

- Covered in Prompt 1’s E2E; do not add extra E2E beyond that single happy path.

### 9) Acceptance criteria

- [ ] Landing page uses standard Nuxt UI scaffold (`UContainer`, `UPage`, `UPageHeader/UPageBody`).
- [ ] Copy clearly describes “AI Career Coach” and the step-by-step journey.
- [ ] CTAs route correctly to `/login` with expected state.
- [ ] Components are reusable, typed, and minimal custom CSS.
- [ ] Vitest coverage added for key components + page render.

---

## Master Prompt 3 — Login Page Integration (Entry from Landing + State)

### 1) Title

**L1-C: Landing-to-Login integration (CTA routes + tab state + UX polish)**

### 2) Intro

Landing must convert. That means CTAs must send users to the right auth state without confusion. Current login page has “Sign In / Create Account” tabs. This prompt ensures that routing supports these entry points and the UI clearly matches the CTA intent.

### 3) Feature scope

**In scope**

- Ensure `/login` supports an explicit entry state:
  - `?mode=signup` (or similar) opens Create Account tab
  - default is Sign In

- Ensure CTA from landing uses the correct query param.
- Add a minimal “Back to Home” link on login page for users who want to re-check context.

**Out of scope**

- No redesign of Cognito UI beyond small changes.
- No new auth flows.

### 4) Composables / services / repositories / domain modules

- Add a small composable or helper for parsing query-state (e.g., `useAuthEntryMode()`).
- Do not duplicate route parsing logic across multiple components.

### 5) Components to create or update

- Update existing `/login` page to:
  - Read the entry mode from route query
  - Set initial tab accordingly
  - Provide a subtle link to `/` (Nuxt UI link/button)

### 6) Pages/routes to create or update

- `/login`: add support for query param and ensure it’s stable on refresh.
- Breadcrumb behavior: login remains simple; no breadcrumb required.

### 7) AI operations impact

- None.

### 8) Testing requirements

**Vitest**

- Unit test the entry-mode parser composable.
- Page/component test verifying `/login?mode=signup` selects Create Account tab.

**Playwright**

- Covered by Prompt 1 E2E (CTA to signup).

### 9) Acceptance criteria

- [ ] Landing “Create account” CTA results in Create Account tab selected.
- [ ] Landing “Sign in” CTA results in Sign In state.
- [ ] `/login` includes a “Back to Home” link.
- [ ] Behavior is deterministic on refresh and covered by tests.

---

## Master Prompt 4 — Trust & Safety Messaging + Data Control (Pre-auth + Consistency)

### 1) Title

**L1-D: Trust messaging and data-control statements aligned with product principles**

### 2) Intro

Beta feedback shows users worry about AI-generated data being saved without validation and want clarity on what happens to their data. Your product principles explicitly say “AI outputs are suggestions” and “user validation is the final step.” This prompt exists to ensure landing and auth surfaces communicate trust consistently and accurately.

### 3) Feature scope

**In scope**

- Add “You stay in control” section on landing with 3–5 concrete bullets:
  - AI suggestions are editable
  - Nothing is saved without validation (only if true in product; if not fully true yet, phrase as roadmap or adjust)
  - User-owned data, deletable
  - Security basics (encrypted in transit/at rest, Cognito auth) — only if already true per current architecture

- Add small “Privacy / Data” hint near signup on `/login` if appropriate (1–2 lines, link to landing trust section or future policy placeholder).

**Out of scope**

- No legal policy writing.
- No full privacy policy page unless you already have a placeholder route.

### 4) Composables / services / repositories / domain modules

- Centralize trust bullets in `useLandingContent()` (or similar) so copy isn’t duplicated.
- If you already have app-wide “principles” constants, reuse them.

### 5) Components to create or update

- `LandingTrust` component (if not already created in Prompt 2).
- Optional: small `AuthTrustHint` component on login/signup.

### 6) Pages/routes

- `/` landing: ensure trust section exists and is reachable via anchor link.
- `/login`: add minimal trust hint without clutter.

### 7) AI operations impact

- None.

### 8) Testing requirements

**Vitest**

- Component test for `LandingTrust` rendering correct bullets.
- If `/login` hint added, test it renders.

**Playwright**

- No additional E2E.

### 9) Acceptance criteria

- [ ] Trust messaging is consistent with actual platform behavior (no false promises).
- [ ] Landing includes a trust section with concrete statements.
- [ ] Copy is centralized and not duplicated across components.
- [ ] Tests cover trust component rendering.

---

## Master Prompt 5 — Polish: Responsive Layout, Accessibility, and Empty-state Consistency

### 1) Title

**L1-E: Landing UX polish (responsive, accessible, consistent UI patterns)**

### 2) Intro

Landing is the first impression. It must feel calm, professional, and consistent with the rest of the app. Beta feedback highlights users missing actions when they’re off-screen; landing must avoid hidden CTAs and maintain clarity.

### 3) Feature scope

**In scope**

- Ensure CTAs are visible without scrolling on typical desktop viewport.
- Ensure mobile layout remains readable and CTA remains reachable early.
- Add basic accessibility improvements:
  - Proper heading hierarchy
  - Buttons have clear labels
  - Links are keyboard focusable

- Ensure consistent spacing and card patterns (Nuxt UI, no bespoke CSS frameworks).

**Out of scope**

- No design system overhaul.
- No animations unless already standard.

### 4) Composables / services / repositories / domain modules

- None.

### 5) Components

- Review landing components for:
  - consistent `UCard` usage
  - shared spacing utilities
  - reuse existing “Card section” patterns from the app if present.

### 6) Pages/routes

- `/` only.

### 7) AI operations impact

- None.

### 8) Testing requirements

**Vitest**

- Minimal snapshot-style component tests are acceptable if your repo uses them; otherwise prefer explicit assertions.
- Add at least one test asserting hero CTA is present.

**Playwright**

- Extend the single happy path only if needed to assert the CTA is visible and clickable at common viewport sizes (desktop default is enough; avoid multiple viewport suites unless already used).

### 9) Acceptance criteria

- [ ] Landing is readable and well-structured on mobile and desktop.
- [ ] Primary CTA appears above the fold on desktop.
- [ ] No “hidden action” issue: CTAs are obvious and reachable.
- [ ] No new styling approach introduced; Nuxt UI patterns respected.
- [ ] Tests confirm key UI elements exist.

## Master Prompt 6 — SEO + Social Sharing Metadata (Low Cost, High Impact)

### 1) Title

**L1-F: Add SEO + OpenGraph metadata for Landing and Auth entry points**

### 2) Intro (context + why)

With a public landing page, we need basic SEO and social sharing metadata so the app looks credible when shared (LinkedIn, Slack, email) and is indexed correctly. This is a **high-impact, low-cost** addition that improves trust and discoverability without adding new frameworks.

### 3) Feature scope

**In scope**

- Add page-level metadata for:
  - `/` (Landing)
  - `/login` (Auth)

- Provide:
  - `<title>` and meta description
  - OpenGraph tags (og:title, og:description, og:type, og:image, og:url)
  - Twitter card tags (twitter:card, twitter:title, twitter:description, twitter:image)

- Add a single default social preview image reference (use an existing asset or add a lightweight placeholder image in the repo).
- Ensure canonical URL behavior is sensible (basic, not over-engineered).

**Out of scope**

- No sitemap generation unless already part of the project.
- No structured data schema markup (JSON-LD) unless already used.
- No multi-language SEO unless i18n SEO is already present.

### 4) Composables / services / repositories / domain modules

- Create a small composable like `useSeoMetaDefaults()` (or equivalent pattern in your repo) that returns typed defaults:
  - `siteName`
  - default title template
  - default description
  - `ogImage` path
  - base URL (from runtime config)

- Add a helper to build absolute URLs safely (avoid duplicating URL join logic in pages).

### 5) Components to create or update

- None required.
- If your project already centralizes head config in layout, ensure new logic composes with it rather than duplicating.

### 6) Pages/routes to create or update (navigation/breadcrumbs)

- `/pages/index.vue`:
  - Set SEO meta specific to Landing (clear positioning: AI Career Coach, outcomes, guided journey)

- `/pages/login.vue`:
  - Set SEO meta appropriate for Auth (short, not marketing-heavy)

- Ensure metadata does not conflict with authenticated pages (keep those unchanged unless already broken).

### 7) AI operations impact

- None.

### 8) Testing requirements

**Vitest**

- Add page-level tests asserting key meta fields are set:
  - Landing: title + description present (and optionally og:title)
  - Login: title present and differs from landing

- Keep tests robust (avoid brittle full-head snapshots if your repo doesn’t use them).

**Playwright**

- No additional E2E required beyond the single happy path.
- If you already inspect meta tags in E2E, add a minimal assertion for landing title only; otherwise skip to keep scope tight.

### 9) Acceptance criteria (functional + DX + correctness)

- [ ] Landing page sets title, description, OG and Twitter meta tags.
- [ ] Login page sets at least title + description (and optionally OG).
- [ ] Base URL used for absolute OG URLs comes from runtime config (no hardcoded domains).
- [ ] Social preview image exists in repo and is referenced consistently.
- [ ] SEO logic is centralized (composable/helper) and not duplicated across pages.
- [ ] Vitest tests cover presence of core meta tags without brittle snapshots.
