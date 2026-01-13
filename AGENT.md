# AI Career OS — Agent Instructions

Use this file as the primary guidance for automated changes in this repo. It mirrors
the intent of `.github/copilot-instructions.md` and points to the canonical project
status and technical foundation references.

## Source of Truth

- Project status: `docs/PROJECT_STATUS.md`
- Technical foundations: `docs/Tech_Fundation_Specs.md`
- Additional architecture: `docs/High_Level_Architecture.md`, `docs/Conceptual_Data_Model.md`
- AI interaction rules: `docs/AI_Interaction_Contract.md`

## Stack & Architecture

- Nuxt 4 + TypeScript (strict) + Nuxt UI
- AWS Amplify Gen2 (GraphQL + Lambda) with Cognito auth
- Owner-based auth on all models: `authorization((allow) => [allow.owner()])`

## Critical Rules

- i18n only: no hard-coded strings; use `t('key.path')` and `i18n/locales/*.json`
- Prefer Nuxt UI components over raw Tailwind or custom CSS
- Strict JSON I/O for AI operations (no free text), with consistent error envelope:
  `{ success: boolean, data?: {}, error?: { code, message, details } }`

## Code Quality

- Complexity <= 16, nesting <= 4, function length <= 100 lines, params <= 4
- No `any` types; unused vars must start with `_`
- TDD expected; maintain >= 80% coverage
- Conventional commits: `feat|fix|docs|style|refactor|test|chore(scope): desc`

## Project Structure

- All app code in `src/`
- `src/pages/` routes, `src/components/` UI, `src/composables/` workflows
- Data access via `src/data/repositories/` (repository pattern)
- Domain logic in `src/domain/`, application services in `src/application/`

## Implementation Order

Data models -> composables -> components -> pages -> AI lambdas -> tests.

## Refactoring

When refactoring this code following Martin Fowler’s techniques
