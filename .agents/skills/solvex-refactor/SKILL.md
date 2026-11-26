---
name: solvex-refactor
description: Refactor existing Solvex React, TypeScript, Express or SQL-related code to improve maintainability without intentionally changing observable behavior. Use for extracting components, hooks, routes, services, removing duplication and simplifying complex modules; not for new features or bug fixes.
---

# Solvex behavior-preserving refactoring

Improve code structure in small, verifiable steps while preserving user flows, API contracts, permissions and database behavior.

## Workflow

1. Read applicable AGENTS.md, README, relevant docs and package manifests. Inspect the target code, callers, dependencies, tests and configuration. Check git status and preserve existing user changes.
2. Identify a concrete problem: excessive responsibilities, duplication, coupling, difficult testing or unclear naming. Explain the proposed improvement and define what must remain unchanged.
3. Establish a baseline by running relevant existing tests, lint and build checks. Record pre-existing failures. Add characterization tests for important untested behavior where feasible. If baseline verification is blocked, reduce the scope and disclose the risk; do not claim behavior equivalence.
4. Plan small coherent changes. Prefer extraction and relocation over rewriting. Keep public contracts stable. Avoid introducing abstractions with no demonstrated benefit.
5. Refactor incrementally, checking affected tests after meaningful steps. Preserve unrelated edits and avoid broad formatting churn.
6. Review the final diff for unintended changes. Run relevant frontend/backend tests, lint, type-check and build commands defined by the repository. Compare outcomes with the baseline.
7. Update architectural documentation or imports when the structure changes; do not alter business requirements or acceptance criteria.

## Frontend guidance

- If a large component such as App.tsx exists, inspect its responsibilities before extracting feature components, pages or hooks.
- Preserve state ownership, effect dependencies, event behavior, navigation, visible text and layout.
- Avoid unnecessary global state, memoization and new dependencies.
- Keep component interfaces clear and typed; follow established naming and folder conventions.

## Backend guidance

- If route handlers are overly large, separate routing, validation, business logic and data access only where this improves clarity.
- Preserve endpoint paths, methods, status codes, response shapes, middleware order, authorization and error semantics.
- Preserve SQL parameterization, transaction boundaries, ordering, null handling and constraints.
- Do not change database schema or migrations as part of a routine refactor.

## Boundaries

- No new features, intentional bug fixes, visual redesign, dependency upgrades or technology migrations unless separately authorized.
- If a bug or security flaw is discovered, report it separately. Do not silently change behavior under the label of refactoring.
- Never weaken authorization or tests to simplify the code.
- Do not use destructive git commands, discard user edits, push, merge or deploy without explicit authorization.

## Definition of done

- The identified maintainability problem is reduced with a focused diff.
- Existing externally observable behavior and contracts are preserved to the extent verified.
- Relevant tests and checks show no newly introduced failures.
- Any unverified behavior, pre-existing failures or separate improvement opportunities are documented.

## Final report

Explain the before/after structure, changed files, reason for each significant extraction, preserved contracts, baseline versus final check results, and remaining risks. Do not claim improved performance or verified equivalence without evidence.
