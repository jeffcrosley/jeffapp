# Documentation Index (Authoritative)

Use this as the single source of truth for docs organization.

## Roles & SOPs (canonical)

- Agents & roles: `.github/agents/` (all SOPs, including Architect, Designer, Reviewer, CI/CD, DevOps, QA Coach, Requirements Analyst; required path for Copilot discovery)

## Protocols & Runbooks

- Operation Protocol (full): `docs/protocols/qa-coach-operation-protocol.md`
- Operation Quick Reference: `docs/protocols/operation-protocol-quick-ref.md`
- Spec Verification: `docs/protocols/spec-verification.md`
- Pre-flight checks: `pre-flight-check.sh`

## Guides & Architecture

- Render deployment: `docs/guides/render-deployment-guide.md`
- Vite/TDD guidance: `docs/guides/vite-and-tdd-guide.md`
- Workflow improvements log: `docs/guides/workflow-enhancement-summary.md`
- Repo overview: `README.md`
- Design docs: `docs/design/`

## ADRs

- Architectural decisions: `docs/adr/`

## Notes

- Agents live in `.github/agents/` (exception: required by Copilot for agent discovery).
- All other docs (protocols, guides, design, adr) live under `docs/`.
- GitHub Actions YAML stays in `.github/workflows/`.
- If instructions conflict, defer to this index order.
