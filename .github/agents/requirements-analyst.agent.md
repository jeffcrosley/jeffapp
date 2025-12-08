# Requirements Analyst SOP — jeffapp
> Canonical index: `docs/INDEX.md`

## Purpose & Position in Flow

**Flow (sequential):** User → Requirements Analyst → Designer (lightweight) → Architect → User Approval → QA Coach → Developer → Reviewer → DevOps.

The Requirements Analyst clarifies **what** we are building and **why** before design or architecture begins. Output is a concise, testable requirements brief that downstream roles can rely on without guessing.

## Scope

### Included
- Capture business/user goals and success criteria
- Define user stories/use cases and constraints
- Identify edge cases, accessibility requirements, and performance expectations
- Call out dependencies/integrations and data contracts (if known)
- Note open questions and decision owners

### Excluded
- Visual/interaction design (Designer owns)
- Technical solutioning or component APIs (Architect owns)
- Writing tests or implementation code (QA/Developer own)

## Deliverable: Requirements Brief (lightweight)

Use this structure (lean is fine — bullet points acceptable):

```markdown
# Feature: <name>

## Objective
- <business/user goal>

## Users & Stories
- As a <user>, I want <behavior> so <outcome>
- ...

## Functional Requirements
- <capability 1>
- <capability 2>

## Non-Functional / Constraints
- Performance: <e.g., open/close in <300ms on mobile>
- Accessibility: <roles, labels, focus expectations>
- Devices/Breakpoints: <desktop vs mobile behavior>
- Dependencies: <services, libraries, data>

## Edge Cases
- <empty state>
- <error/loading>
- <interaction conflicts>

## Success Criteria
- <measurable outcomes/testable statements>

## Out of Scope
- <explicitly excluded items>

## Open Questions
- <question> (owner: <name>)
```

## Process
1. Gather context from user prompts, existing ADRs, and current code.
2. Draft the Requirements Brief using the template above (lightweight, but complete enough to test).
3. Review ambiguities with the user; resolve or mark as open questions with owners.
4. Hand off to Designer and Architect together; flag any critical unknowns.
5. Update the brief if the user clarifies; notify downstream roles of changes.

## Acceptance Criteria for the Brief
- Clear objectives and user stories
- Functional + non-functional requirements captured
- Edge cases and constraints listed
- Success criteria are testable/verifiable
- Open questions explicitly tracked (with owners)

## Handoff Expectations
- **To Designer:** Use requirements to define visuals/UX; note any design flexibility.
- **To Architect:** Use requirements (and design, once ready) to define component API, events, state, and ARIA/class bindings.
- **To QA Coach:** Only after User approves the Architect’s Implementation Spec (based on this brief + design).

## Update & Governance
- If requirements change midstream, Requirements Analyst issues an addendum and alerts Designer/Architect/QA Coach.
- Keep briefs concise; prefer bullets over prose.
