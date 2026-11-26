---
name: solvex-frontend
description: Implement or improve Solvex React and TypeScript screens, components, forms, navigation, API integration, accessibility and frontend tests. Use for user-facing changes; not for backend-only changes or purely behavior-preserving refactoring.
---

# Solvex frontend

Build maintainable, accessible interfaces for the solar power plant service management application.

## Workflow

1. Read applicable AGENTS.md instructions, README and relevant requirements in docs/. Inspect the frontend package.json, existing screens, styles, routing, API client and tests. Discover actual paths and commands rather than assuming them.
2. Identify the intended role (plant owner, technician or service manager), user goal, acceptance criteria and existing UI patterns. For missing requirements, use the smallest reasonable assumption and report it; do not invent business rules.
3. Inspect backend routes and response types before integrating an API. If an API is missing, report the dependency or implement it only when the task authorizes full-stack changes. Never hide missing integration with mock production data.
4. Reuse existing components, styles and dependencies. Extract focused components or hooks when this reduces duplication or complexity. Keep TypeScript types explicit at API boundaries; avoid unnecessary any, type assertions and duplicated server state.
5. Implement the smallest complete user flow. Preserve unrelated functionality and navigation. Keep visible text, validation messages and errors in Slovenian; follow existing date and number formats.
6. Add loading, empty, error and success states where relevant. Prevent accidental repeated submissions. Preserve input after recoverable errors. Validate inputs for usability, but rely on server-side validation and authorization for security.
7. Verify responsive layouts, semantic elements, accessible labels, keyboard navigation, visible focus and understandable error messages. Use browser tools if available; never claim visual verification without performing it.
8. Add or update tests using the repository's existing test framework. Prefer user-observable behavior over implementation details. Cover the happy path, invalid input, API failures and role-specific rendering as applicable.
9. Run the applicable lint, type-check, build and test commands defined by the project. Fix regressions caused by your changes. Report commands, results and any environmental blockers.

## Domain and security rules

- Keep owner, technician and manager workflows consistent with documented requirements.
- Do not assume that hiding buttons or routes enforces permissions. Authorization belongs on the server.
- Do not expose credentials, tokens or sensitive user data in client code, logs or messages.
- Do not change API contracts, database schema or dependencies without a task-related reason; explain necessary changes.
- Do not redesign unrelated screens or introduce a new UI framework without approval.
- Do not push, merge or deploy without explicit authorization.

## Definition of done

- Requested UI flow is implemented and connected to the real API where required.
- Relevant loading, empty, error and success states are handled.
- Slovenian text, accessibility and responsive behavior are addressed.
- Relevant tests and quality checks pass, or blockers are explicitly recorded.

## Final report

Summarize the user flow, changed files, API dependencies, tests and commands with actual results, visual checks performed, and remaining limitations. Distinguish verified behavior from assumptions.
