```markdown
<!-- Copilot instructions: concise, actionable guidance for AI agents working in the jeffapp monorepo -->

# Copilot instructions — jeffapp (Nx monorepo)

Core idea: this repo is an Nx monorepo hosting an Angular standalone shell (`apps/nav-shell`) and an Express API Gateway (`apps/api-gateway`). Sub-services live under `apps/` and are integrated via the gateway or Nx projects.

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

- nav-shell uses standalone components and Router setup in `apps/nav-shell/src/app/app.config.ts`. Prefer adding routes in `app.config.ts` and lazy-loading sub-apps via router configuration.
- api-gateway exposes `/health` in `apps/api-gateway/src/main.ts`. Proxy middleware examples are commented there — when adding a sub-service, uncomment and set `target` to the sub-service URL and pathRewrite as needed.
- Project ports: `nav-shell` normally uses 4200 for Angular dev (follow `project.json`), `api-gateway` uses 3333 or `process.env.PORT` for cloud.

Files that capture primary conventions:

- `apps/nav-shell/src/main.ts` and `apps/nav-shell/src/app/` — Angular entry + routing pattern.
- `apps/api-gateway/src/main.ts` — Express entry, health check, proxy templates.
- `nx.json` — caching/target defaults (tests run with passWithNoTests; builds cache enabled).
- `package.json` — dependency matrix (Angular v20, Nx v22). Use Nx generators where possible (`@nx/angular`, `@nx/node`).

Practical advice for AI edits in this repo:

- Prefer updating files under `apps/*` and `libs/*` and run `npx nx test` afterwards. Keep changes minimal and localized to a single project when possible.
- When adding a new app or lib, use Nx generators (examples in `package.json`/nx.json). Avoid hand-editing workspace manifests unless necessary.
- Do not check in built artifacts under `dist/`.

Edge cases & verification steps:

- Tests: Jest is configured at the root and per-project. `npx nx test <project>` will pass with no tests by design (see `nx.json` targetDefaults).
- Lint: use `npx nx lint <project>`; root uses `eslint.config.mjs` (flat config).

If anything is ambiguous, read these files first: `apps/api-gateway/src/main.ts`, `apps/nav-shell/src/app/app.config.ts`, `nx.json`, `package.json`, and `apps/*/project.json`.

If you want me to expand any section or add examples (e.g., a sample proxy config, or a guide for adding a new Nx app + tests), tell me which part to expand.

---

Updated: 2025-11-12
```

- **Entry**: `src/main.ts` → `src/app/app.ts` (root component)
