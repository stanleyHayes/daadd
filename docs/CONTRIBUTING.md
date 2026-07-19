# Contributing to DAADD

This document outlines the development workflow, testing standards, and code quality expectations for the DAADD platform.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Branching Strategy](#branching-strategy)
3. [Commit Guidelines](#commit-guidelines)
4. [Testing Standards](#testing-standards)
5. [Code Quality](#code-quality)
6. [Documentation](#documentation)
7. [Submitting Changes](#submitting-changes)

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **Docker** and **Docker Compose** (for local infrastructure: MongoDB, Redis)

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd daadd

# Install dependencies across all workspaces
npm install

# Start infrastructure (MongoDB, Redis)
npm run docker:up

# Start development servers (backend + frontend)
npm run dev
```

### Workspace Structure

The monorepo uses npm workspaces:

- **backend/** — Express.js API server (port 4000)
- **frontend/** — React + Vite web application (port 3000)
- **mobile/** — Expo React Native (standalone, not in workspaces, port 8082)
- **shared/** — Shared TypeScript types and utilities

To run commands in a specific workspace:

```bash
npm run <command> --workspace=backend
npm run <command> --workspace=frontend
npm run <command> --workspace=shared

# Or from the workspace directory
cd backend && npm run <command>
```

---

## Branching Strategy

- **main** — Production-ready code. All merges require passing CI and code review.
- **feature/\*** — Feature branches (e.g., `feature/oauth-google`). Branch from `main`.
- **fix/\*** — Bug fix branches (e.g., `fix/token-expiry`). Branch from `main`.
- **docs/\*** — Documentation updates (e.g., `docs/api-spec`).

### Creating a New Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

---

## Commit Guidelines

This project uses **Conventional Commits** format to ensure clear, atomic, and traceable changes.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type** (required): One of:

- **feat** — A new feature
- **fix** — A bug fix
- **docs** — Documentation-only changes
- **style** — Code style changes (formatting, semicolons, whitespace) — no logic change
- **refactor** — Code refactoring without changing behavior or adding features
- **perf** — Performance improvements
- **test** — Adding or updating tests
- **chore** — Build tooling, dependency updates, infrastructure
- **ci** — CI/CD pipeline changes
- **build** — Build system changes

**Scope** (optional): The module, service, or feature affected. Examples:

- `oauth`
- `campaign-service`
- `analytics-dashboard`
- `platform-accounts`

**Subject** (required):

- Lowercase, no period at the end
- Imperative mood ("add feature", not "added feature")
- Under 50 characters preferred
- Specific and descriptive

**Body** (required for non-trivial commits):

- Wrap at 100 characters
- Explain **WHY** the change was made, not WHAT (code shows the what)
- Reference issues if applicable (e.g., "Fixes #123")
- Include any breaking changes or migration notes

**Footer** (optional):

- Document breaking changes: `BREAKING CHANGE: <description>`
- Reference issues: `Closes #123`, `Relates to #456`

### Example Commits

**Good:**

```
feat(oauth): implement Google Ads OAuth flow

Add Google OAuth authorization and token exchange endpoints with state
token validation and AES-256-GCM token encryption at rest.

This enables advertisers to connect their Google Ads accounts to the
platform without storing plaintext credentials.

Implements:
- GET /api/v1/oauth/authorize/google — returns authorization URL
- GET /api/v1/oauth/callback/google — handles callback, stores encrypted token
- Encryption utility for token storage
- PlatformAccount entity and repository

Security: Tokens encrypted with AES-256-GCM; IV randomized per token.
```

**Good:**

```
fix(token-refresh): handle LinkedIn token expiry without refresh

LinkedIn OAuth does not support refresh tokens (no standard grant type).
Update token refresh queue to skip LinkedIn accounts and notify admins
to re-authorize annually.

Prevents job from failing when LinkedIn token expires; rest of platforms
refresh successfully.

Fixes #89
```

**Bad:**

```
update stuff
```

```
feat: add new feature built with Claude
```

```
docs: fix typos.
```

### Pre-commit Enforcement

Commit messages are validated by **commitlint**. Invalid messages will be rejected:

```bash
$ git commit -m "add some stuff"
⧙ input: add some stuff
✖ subject may not start with an uppercase letter [subject-case]
```

---

## Testing Standards

All features must include tests at every layer.

### Unit Tests

- **Location:** Colocated in `*.test.ts` files or in `__tests__/` directory
- **Framework:** Jest (backend), Vitest (frontend)
- **Coverage:** Aim for >75% on critical paths (auth, payment, data mutation)
- **Mocks:** Use `@testing-library/*` for React components; mock external dependencies (APIs, databases)

Example (backend service):

```typescript
// services/__tests__/campaign.service.test.ts
describe('CampaignService', () => {
  let service: CampaignService;
  let mockRepository: MockedObjectDeep<ICampaignRepository>;

  beforeEach(() => {
    mockRepository = mock<ICampaignRepository>();
    service = new CampaignService(mockRepository);
  });

  test('should create campaign with initial status DRAFT', async () => {
    const result = await service.create({...});
    expect(result.status).toBe('DRAFT');
  });
});
```

Example (frontend component):

```typescript
// pages/__tests__/CampaignsListPage.test.tsx
import { render, screen } from '@testing-library/react';
import { CampaignsListPage } from '../CampaignsListPage';

test('renders campaigns list', () => {
  render(<CampaignsListPage />);
  expect(screen.getByText(/campaigns/i)).toBeInTheDocument();
});
```

### Integration Tests

- **Location:** `backend/__tests__/integration/` or similar
- **Framework:** Jest with testcontainers
- **Scope:** Test against real dependencies (MongoDB, Redis) via containers
- **Coverage:** All repository methods, critical service workflows

Example:

```typescript
// backend/__tests__/integration/platform-account.repository.test.ts
describe('PlatformAccountRepository Integration', () => {
  let repository: PlatformAccountRepository;
  let mongoContainer: MongoDBContainer;

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer().start();
    repository = new PlatformAccountRepository(mongoContainer.getUri());
  });

  test('should persist and retrieve encrypted tokens', async () => {
    const account = await repository.create({...});
    const retrieved = await repository.findById(account.id);
    expect(retrieved.access_token_encrypted).toBeDefined();
  });
});
```

### End-to-End / Smoke Tests

- Test new API endpoints with real requests
- Verify integration across layers (route → service → repository → database)
- Example: Create campaign → track event → query analytics

### Running Tests

```bash
# Backend tests
npm run test --workspace=backend

# Frontend tests
npm run test --workspace=frontend

# Watch mode
npm run test:watch --workspace=backend
```

---

## Code Quality

### Linting

ESLint is configured strictly with TypeScript support.

```bash
# Check all workspaces
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format code
npm run format
```

**Pre-commit Hook:** Lint failures will prevent commits.

### TypeScript

- **strict: true** — All type checking enabled
- No `any` types without explicit comments
- Use `unknown` for untyped values, then narrow types

### Code Style

- **Imports:** Organized by source (Node.js, npm, relative paths)
- **Comments:** Only explain WHY, not WHAT. Avoid docstring bloat.
- **Error Handling:** Throw `AppError` for domain errors; return valid responses
- **No commented-out code** — Use git history; delete dead code

### Design Patterns

- **Dependency Injection** — Use tsyringe for service composition
- **Repository Pattern** — All DB access through repository interfaces
- **Adapter Pattern** — Platform integrations (OAuth, metrics, CRM) as adapters
- **Strategy Pattern** — Swappable providers (storage, email, AI)
- **Provider Pattern** — External services behind interfaces with stub + real impl

---

## Documentation

### Updated with Every Commit

**SPECIFICATION.md** — Product and technical requirements. Update when:
- Product requirements change
- Technical stack is modified
- Env vars are added/removed

**ARCHITECTURE.md** — Live code map and system overview. Update when:
- New services, routes, or entities are added
- Significant refactoring changes the structure
- Design patterns are applied or changed

Update these docs in the **same commit** that changes the code.

### Doc Comments

Every exported function, class, interface, constant, and field must have a doc comment.

```typescript
// Good
/** Encrypts an OAuth token using AES-256-GCM. IV is randomly generated. */
export function encryptToken(plaintext: string): string { ... }

/** Platform adapter for Google Ads metrics aggregation. */
export class GoogleAdsMetricsAdapter implements IPlatformMetricsAdapter { ... }

// Bad
export function doStuff() { ... }
export class Helper { ... }
```

---

## Submitting Changes

### Before Pushing

1. **Ensure tests pass:** `npm run test`
2. **Ensure lint passes:** `npm run lint`
3. **Update docs:** SPECIFICATION.md and ARCHITECTURE.md
4. **Verify commit format:** Message must follow Conventional Commits

### Creating a Pull Request

- Title should be concise (under 70 chars)
- Body should describe WHAT changed and WHY
- Link related issues (e.g., "Closes #123")
- Ensure all CI checks pass

### Code Review

- All PRs require at least one approval before merge
- CI (lint, test) must pass
- ARCHITECTURE.md and SPECIFICATION.md must be updated
- No "Built with Claude" or AI-authorship markers in commit messages

### Merge to Main

Once approved and CI passes:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/my-feature
git push origin main
```

---

## Troubleshooting

### Commitlint Errors

```bash
# View commitlint rules
npx commitlint --print-config

# Bypass temporarily (not recommended)
git commit --no-verify -m "message"
```

### Tests Failing Locally

```bash
# Ensure Docker containers are running
npm run docker:up

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run specific test file
npm run test -- backend/__tests__/integration/campaign.test.ts
```

### Lint Issues

```bash
# Auto-fix common issues
npm run lint -- --fix

# Format all files
npm run format
```

---

## Questions?

Refer to:
- **SPECIFICATION.md** — Product and technical decisions
- **ARCHITECTURE.md** — Code structure and patterns
- **PROMPT_PLAYBOOK.md** — Quality standards and principles
- **DESIGN_SYSTEM.md** — UI/UX conventions

