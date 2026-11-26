---
name: solvex-user-story
description: Implement or complete a documented Solvex user story or acceptance criterion across database, Express API and React frontend. Use when the user references a story ID such as US-01, requests a complete feature, or asks to finish a partially implemented story.
---

# Solvex user story implementation

Deliver a complete, testable vertical slice of the requested user story, preserving the existing architecture and documented business rules.

## Workflow

### 1. Discover requirements

- Read applicable AGENTS.md, README, and relevant files under docs/. Locate the requested story by ID or title and extract its acceptance criteria. Read the project status document if present, but verify its claims against current code.
- Identify the actor, prerequisites, main flow, alternative flows, expected state transitions and affected entities.
- Inspect the existing frontend, API, database schema, migrations and tests. Locate reusable functionality and avoid implementing duplicates.
- If documentation conflicts with code, identify the conflict. Do not silently rewrite requirements. Ask only if a consequential business decision cannot be safely inferred; otherwise document assumptions.

### 2. Plan the vertical slice

Map each criterion to the existing implementation, missing changes and a verification method. Identify authorization, data integrity, API contract, UI and test dependencies. Keep the plan scoped to the requested story.

### 3. Implement

- Database: only when necessary, follow existing migration conventions. Preserve existing data, use appropriate constraints and transactions, and keep demo data consistent. Never reset or modify production data to test a change.
- Backend: reuse Express conventions, validate inputs, use parameterized SQL, and enforce authentication, role permissions and resource ownership according to documented rules. Handle failures without leaking internals. Do not invent an authentication mechanism if the project has none; explicitly surface the dependency and address it only within authorized scope.
- Frontend: follow the solvex-frontend skill if available, or inspect its SKILL.md for guidance. Reuse established components and API conventions. Keep user-facing text in Slovenian.
- Preserve existing contracts unless a change is necessary; update affected callers and tests together. Avoid unrelated refactors.

### 4. Verify

- Add or update tests for the acceptance criteria, successful flows, invalid inputs and unauthorized access where applicable.
- Use the configured local/test database and existing test commands; never target production. Inspect environment configuration before running migrations or destructive commands.
- Run relevant lint, type-check, build and test scripts from package manifests and CI workflows. Execute broader checks when feasible.
- For each acceptance criterion, record PASS only with actual verification evidence, FAIL for a failed check, or NOT VERIFIED when blocked or not executed.
- Fix defects introduced by the implementation. Do not weaken tests merely to obtain a passing result.

### 5. Document

Update relevant implementation status and API or setup documentation if the task changes them. Do not mark a story complete when acceptance criteria remain unmet or unverified.

## Constraints

- Preserve the existing React/TypeScript, Express and PostgreSQL stack unless explicitly instructed otherwise.
- Keep owner, technician and service-manager access boundaries intact.
- Do not invent domain rules, expose secrets, use real personal data in tests or make destructive database changes.
- Do not push, merge or deploy without explicit authorization.

## Final report

Include the story ID/title, short implementation summary, changed files, database/API changes, test commands and actual outcomes. Provide a criterion-by-criterion table with criterion, status and evidence. List assumptions, unresolved dependencies and remaining work.
