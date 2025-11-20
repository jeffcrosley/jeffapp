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
- Tooling: Nx (v22), Jest for unit tests, Vitest (v3.2.4) for Vite apps, Playwright for e2e, ESLint + Prettier, Webpack for Node builds.
- **Important**: Vitest v3.2.4 is required for Angular 20 compatibility. When Nx adds Angular 21 support, upgrade to vitest@^4.0.0.

Quick commands you can suggest or run:

- npx nx serve nav-shell # dev server for Angular shell (port per project.json)
- npx nx serve api-gateway # dev server for Express gateway (port 3333 by default)
- npx nx build nav-shell # production build → dist/apps/nav-shell/
- npx nx test <project> # run Jest unit tests for a project (passes with no tests)
- npx nx e2e <project>-e2e # run Playwright e2e tests
- npx nx graph # view dependency graph

Repository-specific patterns and examples (do not change unless you inspected files):

- nav-shell uses a **condensed page architecture**: all page .ts files live in `/pages/` with **inline templates (template property) and styles (styles property)**. Pages compose UI from shared libraries in `libs/`.
  - Example: `apps/nav-shell/src/app/pages/about.component.ts` contains the template string and SCSS styles array inline.
  - Routes are defined in `app.routes.ts` and import pages from `./pages/`.
  - Root component (`app.ts`) also uses the condensed pattern with inline template and styles.
- api-gateway exposes `/health` in `apps/api-gateway/src/main.ts`. Proxy middleware examples are commented there — when adding a sub-service, uncomment and set `target` to the sub-service URL and pathRewrite as needed.
- Project ports: `nav-shell` normally uses 4200 for Angular dev (follow `project.json`), `api-gateway` uses 3333 or `process.env.PORT` for cloud.

Files that capture primary conventions:

- `apps/nav-shell/src/app/pages/` — condensed page architecture (template + styles inline in .ts) using modern `@if/@for` control flow.
- `apps/nav-shell/src/app/app.ts` — root component with inline template and styles; navigation uses `@for` and `@if/@else` control flow.
- `apps/nav-shell/src/app/app.routes.ts` — route definitions importing from `./pages/`.
- `apps/api-gateway/src/main.ts` — Express entry, health check, proxy templates.
- `nx.json` — caching/target defaults (tests run with passWithNoTests; builds cache enabled).
- `package.json` — dependency matrix (Angular v20, Nx v22). Use Nx generators where possible (`@nx/angular`, `@nx/node`).

Creating new pages:

Create a `.ts` file in `apps/nav-shell/src/app/pages/` with inline template and styles. Prefer Angular's modern control flow syntax (`@if`, `@for`, `@switch`) rather than legacy structural directives. Pages should render UI composed from Nx libraries (e.g., `@jeffapp/ui-components`, `@jeffapp/ui-angular`).

```typescript
import { Component, CommonModule } from '@angular/core';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show) {
    <div class="my-class">{{ data }}</div>
    } @else {
    <div class="my-class">Hidden</div>
    }
    <ul>
      @for (item of items; track item) {
      <li>{{ item }}</li>
      }
    </ul>
  `,
  styles: [
    `
      .my-class {
        color: blue;
      }
    `,
  ],
})
export class MyPage {
  protected data = 'Hello';
  protected show = true;
  protected items = ['One', 'Two', 'Three'];
}
```
````

Then import and add to `app.routes.ts` or embed in other pages via router or composition.

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

## Component Libraries

**Hybrid Architecture for Cross-Framework Support:**

Four complementary libraries demonstrate different approaches:

1. **`@jeffapp/ui-components`** (Stencil - Production Use)

   - Built with Stencil for production-quality Web Components
   - Outputs: Custom Elements, dist bundles, loader
   - Use this for: Real application features requiring cross-framework compatibility
   - Location: `libs/ui-components/`
   - Build: `npx nx build ui-components`
   - Example: `<app-button label="Click me" variant="primary"></app-button>`

2. **`@jeffapp/ui-components-native`** (Vanilla Web Components - Portfolio Showcase)

   - Pure Web Components API (no frameworks/tools)
   - Demonstrates fundamental Web Components knowledge
   - Use this for: Portfolio showcase examples, learning documentation
   - Location: `libs/ui-components-native/`
   - Example: `<native-card title="Title" description="Description"></native-card>`

3. **`@jeffapp/ui-angular`** (Angular-Specific Wrappers)

   - Angular module with CUSTOM_ELEMENTS_SCHEMA for Web Components integration
   - Type-safe directives/pipes/utilities for Angular apps
   - Use this for: Angular-specific features that don't translate to other frameworks
   - Location: `libs/ui-angular/`

4. **`@jeffapp/ui-react`** (React-Specific Wrappers)
   - React utilities and type-safe wrappers for Web Components
   - JSX type declarations for custom elements
   - Use this for: React-specific features, React component wrappers
   - Location: `libs/ui-react/`

**When to use each library:**

- Need cross-framework component? → Use `@jeffapp/ui-components` (Stencil)
- Demonstrating Web Components fundamentals? → Use `@jeffapp/ui-components-native`
- Angular-only feature (pipes, directives, services)? → Use `@jeffapp/ui-angular`
- React-only feature (hooks, context, React wrappers)? → Use `@jeffapp/ui-react`

**Integration in Angular apps:**

```typescript
// Import CUSTOM_ELEMENTS_SCHEMA to use Web Components
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@jeffapp/ui-components'; // Load Stencil components
import '@jeffapp/ui-components-native'; // Load native components

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <app-button label="Stencil" variant="primary"></app-button>
    <native-card title="Native" description="Vanilla"></native-card>
  `
})
```

**Integration in React apps:**

```typescript
// In main.tsx or App.tsx entry point
import { loadWebComponents, AppButton, NativeCard } from '@jeffapp/ui-react';

// Load Web Components once at app startup
loadWebComponents();

// Use type-safe React wrappers or direct JSX
function App() {
  return (
    <>
      <AppButton label="Stencil" variant="primary" onClick={() => alert('clicked')} />
      <NativeCard title="Native" description="Vanilla">
        <p>Card content</p>
      </NativeCard>
    </>
  );
}
```

**Path mappings in `tsconfig.base.json`:**

```json
"paths": {
  "@jeffapp/ui-components": ["libs/ui-components/src/index.ts"],
  "@jeffapp/ui-components-native": ["libs/ui-components-native/src/index.ts"],
  "@jeffapp/ui-angular": ["libs/ui-angular/src/index.ts"],
  "@jeffapp/ui-react": ["libs/ui-react/src/index.ts"]
}
```

## Nx Affected Architecture (v22)

**Important**: Nx v22 does NOT have `print-affected`. Use `nx affected` commands instead:

- `npx nx affected:build` — build only affected projects
- `npx nx affected:test` — test only affected projects
- `npx nx affected --target=<target>` — run any target on affected projects

In CI/CD, use these commands to ensure only changed apps are built, tested, and deployed.

## Deployment Architecture

**GitHub Actions + Render Webhooks**: Clean separation of concerns with affected-only deploys

**CI/CD Pipeline** (`.github/workflows/main.yml`):

1. **Affected Detection**: Uses `npx nx show projects --affected` to identify changed apps
2. **Build & Test**: Runs `nx affected --target=lint,test,build` on affected projects only
3. **Deploy Trigger**: On successful build, triggers Render deploy hooks for affected apps only
   - Only runs on push to `main` branch (not PRs)
   - Conditional jobs: `deploy_api_gateway` and `deploy_nav_shell` only run if respective app is affected

**Render Configuration** (configured in Render dashboard, not code):

- **jeffapp-api-gateway** (Node.js Web Service):

  - Build Command: `npx nx build api-gateway --configuration=production`
  - Start Command: `node dist/apps/api-gateway/main.js`
  - Port: 3333 (or `process.env.PORT` for Render)
  - Health Check: `/health`
  - Deploy Hook: Set in GitHub secrets as `RENDER_API_DEPLOY_HOOK`

- **jeffapp-nav-shell** (Static Site):
  - Build Command: `npx nx build nav-shell --configuration=production`
  - Publish Directory: `dist/apps/nav-shell/browser`
  - **Critical for SPA Routing**: Configure rewrite rules in Render dashboard:
    - Source: `/*`
    - Destination: `/index.html`
    - Type: `rewrite`
  - This ensures direct navigation to `/home`, `/about`, etc. works in production
  - Deploy Hook: Set in GitHub secrets as `RENDER_SHELL_DEPLOY_HOOK`

**Why This Architecture?**

- Single source of truth: GitHub Actions orchestrates the entire pipeline
- Affected-only deploys: Only changed apps trigger deployments (efficient CI/CD)
- Render focuses on hosting: Receives webhook, pulls code, builds from source, serves
- No render.yaml or Dockerfiles needed: Render builds directly from source using configured commands

## Render Dashboard Checklist

Before deployments work correctly, verify these settings in Render dashboard:

**api-gateway service:**

- [ ] Build Command: `npx nx build api-gateway --configuration=production`
- [ ] Start Command: `node dist/apps/api-gateway/main.js`
- [ ] Environment: Node
- [ ] Health Check Path: `/health`
- [ ] Deploy Hook URL copied to GitHub secrets as `RENDER_API_DEPLOY_HOOK`

**nav-shell service:**

- [ ] Build Command: `npx nx build nav-shell --configuration=production`
- [ ] Publish Directory: `dist/apps/nav-shell/browser`
- [ ] Rewrite Rules configured:
  - Source: `/*`
  - Destination: `/index.html`
  - Type: `rewrite`
- [ ] Deploy Hook URL copied to GitHub secrets as `RENDER_SHELL_DEPLOY_HOOK`

**Both services:**

- [ ] Auto-Deploy: **OFF** (we use webhooks from GitHub Actions)
- [ ] Branch: `main`

---

If anything is ambiguous, read these files first: `.github/workflows/main.yml`, `apps/api-gateway/src/main.ts`, `apps/nav-shell/src/app/app.ts`, `apps/nav-shell/src/app/pages/`, `libs/ui-components/`, `nx.json`, `package.json`, and `apps/*/project.json`.

---

Updated: 2025-01-18
