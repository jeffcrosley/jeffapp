````markdown
<!-- Copilot instructions: concise, actionable guidance for AI agents working in the jeffapp monorepo -->

# Copilot instructions — jeffapp (Nx monorepo)

## Project Vision & Purpose

This is a **portfolio/resume application** for Jeff Crosley, a full-pipeline AI-forward engineer, designed to:
- Demonstrate technical capabilities and proficiency across multiple languages and frameworks
- Serve as a living showcase for prospective employers
- Provide a platform for learning and practicing new patterns and technologies

## Architecture Overview

**Microfrontend + Microservices Architecture:**
- `apps/nav-shell` — Angular 20 shell that orchestrates navigation between multiple **microfrontend sub-apps** (each in different languages/frameworks to showcase variety)
- `apps/api-gateway` — Express gateway that routes requests to multiple **microservice backends** (also in varied languages to demonstrate proficiency)
- Future sub-apps will be added under `apps/` and integrated via the shell and gateway
- Shared UI component libraries in `libs/` (may need language-specific versions for different frontend frameworks)

- Frontend: `apps/nav-shell` — Angular 20, standalone components, bootstrapApplication pattern (entry: `src/main.ts` → `src/app/app.ts`).
- Backend: `apps/api-gateway` — Express gateway with a `/health` endpoint; proxy templates are in `src/main.ts` (port defaults to 3333).
- Tooling: Nx (v22), Jest for unit tests, Playwright for e2e, ESLint + Prettier, Webpack for Node builds.

Quick commands you can suggest or run:

- npx nx serve nav-shell # dev server for Angular shell (port per project.json)
- npx nx serve api-gateway # dev server for Express gateway (port 3333 by default)
- npx nx build nav-shell # production build → dist/apps/nav-shell/
- npx nx test <project> # run Jest unit tests for a project (passes with no tests)
- npx nx e2e <project>-e2e # run Playwright e2e tests
- npx nx graph # view dependency graph

Repository-specific patterns and examples (do not change unless you inspected files):

- nav-shell uses a **condensed component architecture**: all component .ts files live in `/components/` with **inline templates (template property) and styles (styles property)**.
  - Example: `apps/nav-shell/src/app/components/about.component.ts` contains the template string and SCSS styles array inline.
  - Routes are defined in `app.routes.ts` and import components from `./components/`.
  - Root component (`app.ts`) also uses the condensed pattern with inline template and styles.
- api-gateway exposes `/health` in `apps/api-gateway/src/main.ts`. Proxy middleware examples are commented there — when adding a sub-service, uncomment and set `target` to the sub-service URL and pathRewrite as needed.
- Project ports: `nav-shell` normally uses 4200 for Angular dev (follow `project.json`), `api-gateway` uses 3333 or `process.env.PORT` for cloud.

Files that capture primary conventions:

- `apps/nav-shell/src/app/components/` — condensed component architecture (template + styles inline in .ts).
- `apps/nav-shell/src/app/app.ts` — root component with inline template and styles.
- `apps/nav-shell/src/app/app.routes.ts` — route definitions importing from `./components/`.
- `apps/api-gateway/src/main.ts` — Express entry, health check, proxy templates.
- `nx.json` — caching/target defaults (tests run with passWithNoTests; builds cache enabled).
- `package.json` — dependency matrix (Angular v20, Nx v22). Use Nx generators where possible (`@nx/angular`, `@nx/node`).

Creating new components:

Create `.ts` file in `apps/nav-shell/src/app/components/` with inline template and styles:

```typescript
import { Component, CommonModule } from '@angular/core';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  template: \`<div class="my-class">{{ data }}</div>\`,
  styles: [\`
    .my-class { color: blue; }
  \`],
})
export class MyComponent {
  protected data = 'Hello';
}
```
````

Then import and add to `app.routes.ts` or use in other components' template.

## Development Philosophy & AI Agent Role

**Test-Driven Development (TDD):**
- Most features should be built TDD-first: define functionality and tests, then implement to satisfy tests
- **Before implementing**: Discuss and confirm test requirements and expected behaviors with the user
- **Alert user when**: Logic becomes untestable or unnecessarily complex
- Tests guide the structure; components and services should emerge from test requirements

**Modularity & Loose Coupling:**
- **Alert user when**: Components/services become too tightly coupled
- Prioritize flexibility and scalability; raise concerns if decisions restrict future growth
- Keep changes minimal and localized to single projects when possible

**AI Agent Responsibilities:**
1. Execute straightforward organization/refactoring tasks
2. Construct and implement tests and components that satisfy them (after discussion/confirmation)
3. Proactively raise concerns about best practices, scalability, coupling, and testability
4. Suggest better approaches when user decisions may limit future flexibility

Practical advice for AI edits in this repo:

- Prefer updating files under `apps/*` and `libs/*` and run `npx nx test` afterwards
- When adding a new component, create it in `apps/nav-shell/src/app/components/` with inline template and styles (see example above)
- When adding a new app or lib, use Nx generators (examples in `package.json`/nx.json). Avoid hand-editing workspace manifests unless necessary
- Do not check in built artifacts under `dist/`
- **Before implementing features**: Discuss test requirements and expected behavior with user

Edge cases & verification steps:

- Tests: Jest is configured at the root and per-project. `npx nx test <project>` will pass with no tests by design (see `nx.json` targetDefaults)
- Lint: use `npx nx lint <project>`; root uses `eslint.config.mjs` (flat config)

## Nx Affected Architecture (v22)

**Important**: Nx v22 does NOT have `print-affected`. Use `nx affected` commands instead:
- `npx nx affected:build` — build only affected projects
- `npx nx affected:test` — test only affected projects
- `npx nx affected --target=<target>` — run any target on affected projects

In CI/CD, use these commands to ensure only changed apps are built, tested, and deployed.

---

If anything is ambiguous, read these files first: `apps/api-gateway/src/main.ts`, `apps/nav-shell/src/app/app.ts`, `apps/nav-shell/src/app/components/`, `nx.json`, `package.json`, and `apps/*/project.json`.

---

Updated: 2025-11-13

```

- **Entry**: `src/main.ts` → `src/app/app.ts` (root component)
```
