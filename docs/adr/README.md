# Architecture Decision Records (ADRs)

This directory contains records of significant architectural decisions made for the JeffApp portfolio application.

## Active ADRs

| ADR                                           | Title                                                | Status   | Date       |
| --------------------------------------------- | ---------------------------------------------------- | -------- | ---------- |
| [001](./001-runtime-configuration.md)         | Runtime Configuration via APP_INITIALIZER            | Accepted | 2025-01-18 |
| [002](./002-component-showcase-deployment.md) | Component Showcase as Standalone Static App          | Accepted | 2025-01-18 |
| [003](./003-affected-only-cicd.md)            | Affected-Only CI/CD with Conditional Render Webhooks | Accepted | 2025-01-18 |

## Supporting Documentation

- [DEPENDENCIES.md](./DEPENDENCIES.md) - Visual dependency map of apps, libs, and deployment pipeline

## ADR Process

When making significant architectural decisions:

1. **Create ADR:** Copy template, number sequentially, describe context and decision
2. **Status:** Draft → Proposed → Accepted/Rejected → Superseded (if replaced)
3. **Review:** Discuss with stakeholders before accepting
4. **Implement:** Update code and docs to match decision
5. **Reference:** Link ADR in relevant code comments and docs

### What Warrants an ADR?

- Changes to deployment architecture or CI/CD pipeline
- New runtime configuration or environment handling patterns
- Introduction of new frameworks, libraries, or tools
- Significant refactoring of shared libraries or cross-cutting concerns
- Security or performance patterns that affect multiple apps

### What Doesn't Need an ADR?

- Component-level implementation details
- Bug fixes that don't change architecture
- Styling or UX changes
- Adding new pages or routes within existing apps

## Template

```markdown
# ADR XXX: [Title]

**Status:** Draft | Proposed | Accepted | Rejected | Superseded by [ADR-YYY]
**Date:** YYYY-MM-DD
**Deciders:** [Names/Roles]

## Context

[Problem statement and requirements]

## Decision

[What was decided and why]

## Consequences

### Positive

- [Benefits]

### Negative

- [Trade-offs]

### Mitigation

- [How we address negatives]

## Alternatives Considered

- [Option A: why rejected]
- [Option B: why rejected]

## References

- [Related ADRs, docs, external links]
```

## History

This ADR directory was established on 2025-01-18 to document the architectural foundation of JeffApp as part of the portfolio story. Future ADRs will be added as the application evolves.
