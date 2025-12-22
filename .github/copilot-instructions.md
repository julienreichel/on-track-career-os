# AI Career OS - Copilot Instructions

## Stack & Architecture

**Nuxt 4** (TypeScript strict) + **AWS Amplify Gen2** (GraphQL + Lambda) + **Nuxt UI** + Cognito auth

### Data Model (5 Domains)

1. User Identity: `UserProfile`, `PersonalCanvas`, `Experience`
2. Stories: `STARStory` (STAR methodology)
3. Job/Company: `JobDescription`, `Company`, `CompanyCanvas`
4. Materials: `CVDocument`, `CoverLetter`, `SpeechBlock`, `KPISet`
5. Interview: `InterviewQuestionSet`, `InterviewSession`

Owner-based auth on all models: `authorization((allow) => [allow.owner()])`

### AI Operations (17 total)

- Strict JSON I/O only (no free text)
- Lambda per operation: `ai.parseJobDescription`, `ai.generatePersonalCanvas`, `ai.generateStarStory`, etc.
- Error format: `{ success: boolean, data?: {}, error?: { code, message, details } }`

## Critical Rules

### 🚨 Internationalization (i18n)

- **NO HARD-CODED STRINGS** - ALL text via `t('key.path')`
- Files: `i18n/locales/{locale}.json`

### 🚨 Nuxt UI Components

- **USE NUXT UI FIRST** - avoid raw Tailwind
- Priority: `<UButton>`, `<UCard>`, `<UFormField>` > semantic HTML > custom CSS
- Key components: UForm, UInput, UTable, UModal, UToast, UIcon, UButton, UCard
- Composables: `useToast()`, `useOverlay()`, `useFormField()`
- See `docs/Nuxt UI.md` for 150+ components

### Code Quality

- Complexity ≤16, nesting ≤4, function lines ≤100, params ≤4
- No `any` types, type imports only, unused vars start with `_`
- Conventional commits: `feat|fix|docs|style|refactor|test|chore(scope): desc`
- TDD: Write tests FIRST, 80%+ coverage required

## Project Structure

**`srcDir: 'src/'`** - All app code in `src/`

- `src/pages/` → File-based routing (Profile/Jobs/Applications/Interview)
- `src/components/` → Auto-imported, map to CDM entities
- `src/composables/` → State + logic (useUserProfile, useStoryEngine, useCanvasEngine, etc.)
- `src/data/repositories/` → GraphQL ops via repository pattern
- `src/domain/` → Business rules, `src/application/` → Services
- `amplify/` → Backend (outside src), `@amplify` alias for types

## Patterns & Conventions

**Data Access**: Repository pattern → type safety + GraphQL mapping
**Naming**: AI ops `camelCase`, JSON `snake_case`, GraphQL `PascalCase`, relationships `hasMany/hasOne/belongsTo`
**Error Handling**: No silent errors, structured codes (`AI_SCHEMA_ERROR`, `AI_PROVIDER_ERROR`, `AI_TIMEOUT`)
**Composables over stores**: Use `useUserProfile()`, `useStoryEngine()`, etc.

## Documentation & Implementation

**Key Docs**: `docs/` → Architecture, AI_Interaction_Contract, Conceptual_Data_Model, Component_Page_Mapping, Tech_Fundation_Specs, EPIC_Roadmap, Nuxt UI.md
**MVP**: User discovery → Job analysis → Material generation (see EPIC_Roadmap.md)
**Implementation Order**: Data models → Composables → Components → Pages → AI Lambdas → Tests (TDD)

## Nuxt MCP Integration

**Model Context Protocol (MCP)** for Nuxt provides direct access to official Nuxt documentation, module information, and examples.

### Available MCP Tools

The Nuxt MCP is already configured in `.vscode/mcp.json` and provides these tools:

**Documentation Tools:**

- `mcp_nuxt_list-documentation-pages` - Browse all Nuxt docs (version 3.x, 4.x, or all)
- `mcp_nuxt_get-documentation-page` - Get full content of specific doc page (e.g., `/docs/4.x/getting-started/introduction`)
- `mcp_nuxt_get-getting-started-guide` - Quick access to getting started guide (3.x or 4.x)

**Module Tools:**

- `mcp_nuxt_list-modules` - Search/filter Nuxt modules by category, downloads, stars
- `mcp_nuxt_get-module` - Get detailed info about specific module (README, compatibility, maintainers, stats)

**Blog & Updates:**

- `mcp_nuxt_list-blog-posts` - List all Nuxt blog posts with metadata
- `mcp_nuxt_get-blog-post` - Get full blog post content (e.g., `/blog/v4`)

**Deployment:**

- `mcp_nuxt_list-deploy-providers` - List all deployment platforms (Vercel, Cloudflare, etc.)
- `mcp_nuxt_get-deploy-provider` - Get deployment instructions for specific provider

### When to Use Nuxt MCP

✅ **USE WHEN:** Verify Nuxt 4 APIs, find best practices, search modules, deployment instructions, latest features

### Quick Reference

**Common Paths**: `/docs/4.x/getting-started/*`, `/docs/4.x/guide/concepts/*`, `/docs/4.x/guide/directory-structure/*`
**Module Categories**: UI, Security, Database, Testing, Performance, SEO

## Secrets & Environment

AI keys: Amplify env vars (dev/prod) | CI: GitHub Secrets | Testing: fake AI provider
