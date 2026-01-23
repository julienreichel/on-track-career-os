# On Track Career

> AI-powered career development platform to help you understand yourself, analyze opportunities, and communicate your value.

[![Test](https://github.com/julienreichel/on-track-career-os/actions/workflows/test.yml/badge.svg)](https://github.com/julienreichel/on-track-career-os/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)](./coverage)

## 🎯 Overview

**Your On Track Career** guides you through a structured job search workflow:

1. **Know Yourself** → Build your professional profile, document experiences with STAR methodology, generate your Personal Canvas
2. **Understand the Opportunity** → Analyze job descriptions, research companies, create role and company canvases
3. **Communicate Your Value** → Generate tailored CVs, cover letters, elevator pitches that match your strengths to company needs
4. **Prepare & Apply** → Practice with AI-generated interview questions and simulations

## 🏗️ Architecture

- **Frontend**: Nuxt 4 + TypeScript (strict) + Nuxt UI + Tailwind CSS
- **Backend**: AWS Amplify Gen2 (GraphQL) + Lambda functions
- **Auth**: AWS Cognito with owner-based authorization
- **AI**: Structured AI operations (17 operations) with strict JSON I/O validation
- **State Management**: Composables over global stores

See [docs/High_Level_Architecture.md](docs/High_Level_Architecture.md) for details.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm/pnpm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/julienreichel/on-track-career-os.git
cd on-track-career-os

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### With Amplify Backend

```bash
# Start Amplify sandbox (requires AWS credentials)
npx ampx sandbox --once

# In another terminal, start the dev server
npm run dev
```

## 🧪 Testing

This project follows [Nuxt testing best practices](https://nuxt.com/docs/getting-started/testing) with **96% code coverage**.

```bash
# Run all tests
npm test

# Run unit tests (Node env - fast!)
npm run test:unit

# Run Nuxt tests (Nuxt runtime env - components, layouts)
npm run test:nuxt

# Watch mode for TDD
npm run test:watch

# Interactive UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

**Test Structure:**

- `test/unit/` - Unit tests in Node environment (domain, application, data layers)
- `test/nuxt/` - Tests requiring Nuxt runtime (components, layouts with i18n, routing, etc.)

See [test/README.md](test/README.md) for detailed testing documentation.

## 📋 Code Quality

```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Lint with ESLint
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type checking
npx vue-tsc --noEmit
```

**Pre-commit checklist:**

- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ No linting errors
- ✅ Code formatted

## 🏗️ Project Structure

```
on-track-career-os/
├── src/                      # Application code (srcDir: 'src/')
│   ├── components/           # Auto-imported Vue components
│   ├── composables/          # Auto-imported composables
│   ├── pages/                # File-based routing
│   ├── layouts/              # Layout components
│   ├── domain/               # Business logic (services, repositories)
│   ├── application/          # Application layer (use cases)
│   ├── data/                 # Data layer (GraphQL, schemas)
│   └── types/                # TypeScript type definitions
├── amplify/                  # AWS Amplify backend
│   ├── auth/                 # Cognito authentication
│   ├── data/                 # GraphQL schema & models
│   └── backend.ts            # Backend configuration
├── test/                     # Test files
│   ├── unit/                 # Unit tests (business logic)
│   └── integration/          # Integration tests (components)
├── docs/                     # Documentation
└── i18n/                     # Internationalization
```

## 🛠️ Key Technologies

| Category      | Technology                      |
| ------------- | ------------------------------- |
| **Framework** | Nuxt 4.2.1                      |
| **Language**  | TypeScript (strict mode)        |
| **UI**        | Nuxt UI 4.2.1 + Tailwind CSS    |
| **Backend**   | AWS Amplify Gen2                |
| **Database**  | DynamoDB (via Amplify Data)     |
| **Auth**      | AWS Cognito                     |
| **Testing**   | Vitest 3.2.4 + @nuxt/test-utils |
| **Linting**   | ESLint + Prettier               |
| **i18n**      | @nuxtjs/i18n 10.2.1             |

## 📚 Documentation

- [Product Description](docs/Product_Description.md) - Vision and features
- [High-Level Architecture](docs/High_Level_Architecture.md) - System design
- [Conceptual Data Model](docs/Conceptual_Data_Model.md) - Domain entities
- [AI Interaction Contract](docs/AI_Interaction_Contract.md) - AI operations spec
- [Component/Page Mapping](docs/Component_Page_Mapping.md) - UI structure
- [Tech Foundation Specs](docs/Tech_Fundation_Specs.md) - Technical decisions
- [EPIC Roadmap](docs/EPIC_Roadmap.md) - Development phases
- [Testing Strategy](test/README.md) - Testing approach

## 🎨 Development Guidelines

### Mandatory Conventions

1. **i18n First** - No hard-coded strings. All user-facing text must use `t('key.path')`
2. **Nuxt UI Components** - Use `<UButton>`, `<UCard>`, etc. instead of raw Tailwind classes
3. **Test-Driven Development** - Write tests before implementation, maintain 80%+ coverage
4. **Conventional Commits** - Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
5. **Owner-Based Auth** - All GraphQL models use `authorization((allow) => [allow.owner()])`

### Code Organization

- **Domain Layer** (`src/domain/`) - Business logic, repositories
- **Application Layer** (`src/application/`) - Use cases, composables
- **Data Layer** (`src/data/`) - GraphQL operations, schema types
- **Presentation Layer** (`src/pages/`, `src/components/`) - UI components

## 🚢 Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline runs on every push to `main` and on pull requests.

### Pipeline Stages

1. **Test** - Runs linting, type checking, and all test suites (unit, amplify, nuxt) with coverage validation (80% threshold)
2. **Deploy Backend** (main branch only) - Deploys or updates the Amplify sandbox on AWS (persistent across runs)
3. **E2E Sandbox Tests** - Tests backend integration with real AWS services
4. **E2E Tests** - Runs Playwright tests against the deployed application

**Note**: The Amplify sandbox backend is **persistent** and reused across CI runs for efficiency. It is updated rather than recreated on each deployment.

### Required GitHub Secrets

To enable the full CI/CD pipeline, configure these secrets in your repository settings:

| Secret                  | Description                        | Required For       |
| ----------------------- | ---------------------------------- | ------------------ |
| `AWS_ACCESS_KEY_ID`     | AWS access key for Amplify         | Backend deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for Amplify         | Backend deployment |
| `AWS_REGION`            | AWS region (default: eu-central-1) | Backend deployment |
| `CODECOV_TOKEN`         | Codecov token for coverage reports | Coverage tracking  |

### Manual Backend Cleanup

The CI backend is persistent to save deployment time. To manually clean it up:

```bash
# Using npm script (requires AWS credentials in environment)
npm run cleanup:sandbox

# Or run the script directly
bash scripts/cleanup-sandbox.sh
```

Make sure to set your AWS credentials before running:

```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="eu-central-1"
npm run cleanup:sandbox
```

### Local E2E Testing

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e

# Or run specific tests
npm run test:e2e -- test/e2e/smoke.spec.ts

# Interactive mode
npm run test:e2e:ui
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Write tests first (TDD approach)
3. Implement the feature
4. Ensure tests pass: `npm test`
5. Check coverage: `npm run test:coverage` (must be 80%+)
6. Format & lint: `npm run format && npm run lint`
7. Commit with conventional commit: `git commit -m "feat(scope): add amazing feature"`
8. Push and create a Pull Request

## 📄 License

MIT License - see [license.txt](license.txt) for details.

Copyright (c) 2024 Julien Reichel

## 👤 Author

**Julien Reichel**

---

**Status**: 🎯 v0.11.0 - EPIC 3C Complete (85% MVP)

Current Coverage: **96%+** | Tests: **1500+ passing** | Build: ✅ Passing

**Implemented Features:**

- ✅ User Profile & Personal Canvas (EPIC 1A, 1B)
- ✅ STAR Stories & Experience Builder (EPIC 2)
- ✅ Generic CV Generation with Templates (EPIC 3, 3B, 3C)
- ✅ CV Customization & Settings (EPIC 3C)
- ✅ Job Description Analysis (EPIC 5A)
- ✅ Company Analysis & Canvas (EPIC 5B)
- ✅ User-Job-Company Matching (EPIC 5C)
- ✅ Onboarding & Guidance (EPIC F2)
