<!--
Project: jeffapp (Resume App - Nx Monorepo)
Purpose: concise guidance for AI coding agents (Copilot/Assistants) working in this repo.
Updated: 2025-11-12
Architecture: Angular shell (nav-shell) + Node.js API Gateway (api-gateway) + future microservices
-->

# Copilot Instructions for jeffapp

**jeffapp** is an **Nx monorepo** hosting a resume application with a modular microservices architecture:

- **Frontend**: Angular standalone app (`nav-shell`) using standalone components and RxJS
- **Backend**: Express.js API Gateway (`api-gateway`) that routes requests to sub-services
- **Future**: Multiple FE (Angular, React) and BE (Node, Go, Python) microservices

## Architecture Overview

```
jeffapp/
├── apps/
│   ├── nav-shell/                    # Angular 20 standalone shell (port 4200)
│   │   └── src/app/                  # standalone components + routing
│   ├── api-gateway/                  # Express.js gateway (port 3333)
│   │   └── src/main.ts               # health check + future proxy routes
│   ├── [future sub-app-1]/           # e.g., Go To-Do service
│   └── [future sub-app-2]/
├── nx.json                           # Nx monorepo config + plugins
├── package.json                      # Angular 20, Express, RxJS, Jest, Playwright
└── tsconfig.base.json                # shared TypeScript config
```

**Key insight**: The API Gateway uses Express and can proxy to external sub-services. Future sub-apps will live in `/apps/` and be orchestrated by Nx.

## Essential Commands

| Command                           | Purpose                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `npx nx serve nav-shell`          | Dev server for Angular shell (dev mode, live reload)       |
| `npx nx build nav-shell`          | Production build of Angular shell → `dist/apps/nav-shell/` |
| `npx nx serve api-gateway`        | Dev server for Express gateway (port 3333)                 |
| `npx nx test <project>`           | Run Jest tests for a project                               |
| `npx nx lint <project>`           | Run ESLint + prettier check                                |
| `npx nx graph`                    | Visual dependency graph (monorepo structure)               |
| `npx nx g @nx/angular:app <name>` | Generate new Angular app in `/apps/`                       |
| `npx nx g @nx/node:app <name>`    | Generate new Node.js app in `/apps/`                       |

## Project Structure & Conventions

### Angular Shell (`apps/nav-shell/`)

- **Type**: Standalone Angular 20 app (bootstrapApplication pattern)
- **Entry**: `src/main.ts` → `src/app/app.ts` (root component)
- **Routing**: Standalone components + `RouterModule` for future lazy-loaded sub-app routes
- **Styles**: SCSS (configured in `angular.json`)
- **Output**: `dist/apps/nav-shell/browser/` (production build)
- **Port**: `:4200` (default dev server)

**Pattern**: Use standalone components; avoid NgModule. Import `RouterModule` in root for micro-frontend routing.

### API Gateway (`apps/api-gateway/`)

- **Type**: Express.js Node.js app
- **Port**: `:3333` (or `process.env.PORT` if set, e.g., on Render)
- **Current state**: Basic health check at `/health`; proxy routes commented out (template for sub-services)
- **Future**: Uncomment `createProxyMiddleware` examples and swap `target` to deployed sub-service URLs
- **Pattern**: One proxy route per sub-service (e.g., `/api/todo`, `/api/resume`)

**Build**: Compiles to `dist/apps/api-gateway/` with Webpack; NX automatically prunes lockfile for deployment.

## Testing & Quality

- **Jest**: Unit tests. Run `npx nx test <project>` or `npx nx test --all` for all.
- **ESLint + Prettier**: Linting + code formatting. Run `npx nx lint <project>`.
- **Playwright**: E2E tests in `/apps/*-e2e/` (auto-generated). Run `npx nx e2e <project>-e2e`.

Config files:

- `jest.config.ts` (root) + per-project `jest.config.ts`
- `eslint.config.mjs` (root, flat config format)
- `.prettierrc` (root)

## Adding a New Microservice

### Example: Adding a Node.js sub-service (Go To-Do backend)

```bash
npx nx g @nx/node:app todo-api --directory apps/services
```

Then in `api-gateway/src/main.ts`, uncomment and update the proxy:

```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

app.use(
  '/api/todo',
  createProxyMiddleware({
    target: 'http://localhost:3001', // or deployed URL
    changeOrigin: true,
    pathRewrite: { '^/api/todo': '' },
  })
);
```

### Example: Adding a sub-component library (shared UI)

```bash
npx nx g @nx/angular:lib shared-ui --directory libs/ui
```

Then import in shell: `import { SharedButton } from '@jeffapp/ui/shared-ui';`

## Code Patterns

### Angular Shell Pattern

- **Entry point**: `bootstrapApplication(App, appConfig)` in `main.ts`
- **Root component**: Export default component with standalone + imports
- **Routing**: `provideRouter(routes)` in `appConfig`; lazy load sub-app routes

### Express Gateway Pattern

- **Health check**: Always implement `/health` endpoint (for Render/K8s liveness probes)
- **Proxying**: Use `http-proxy-middleware` with `changeOrigin: true` to avoid CORS issues
- **Port**: Read from `process.env.PORT` for cloud deployments

## Nx-Specific Notes

- **Dependency graph**: Nx infers dependencies. Use `npx nx graph` to see the project topology.
- **Caching**: Enabled by default for build/test/lint. Use `nx.json` → `targetDefaults` to configure.
- **Plugins**: Active plugins include `@nx/webpack`, `@nx/angular`, `@nx/node`, `@nx/jest`, `@nx/playwright`.
- **Workspace root**: All relative paths assume the root is `/Users/jeffcrosley/Coding/jeffapp/`.

## File Locations for Common Tasks

| Task                            | File(s)                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| Add a route to Angular shell    | `apps/nav-shell/src/app/app.config.ts` (add to routes array)       |
| Add an Express endpoint         | `apps/api-gateway/src/main.ts` (add `app.get/post/...`)            |
| Change shell build output       | `apps/nav-shell/project.json` → `targets.build.options.outputPath` |
| Adjust Jest coverage thresholds | `jest.config.ts` (root)                                            |
| Update shared TS config         | `tsconfig.base.json` → `compilerOptions` or `paths`                |

## Git & CI/CD

- **Repo**: GitHub, branch `main`
- **CI config**: `.gitlab-ci.yml` (GitLab CI setup; review for deployment steps)
- **Node.js**: v20.x (from `package.json` node field or `.nvmrc` if present)
- **Package manager**: npm (lock file: `package-lock.json`)

## What NOT to do

- ❌ Don't modify `package.json` scripts directly; use Nx generators for new apps/libs.
- ❌ Don't add new top-level dependencies without checking if an Nx plugin already provides them.
- ❌ Don't assume ports (e.g., don't hardcode 4200). Reference `project.json` configurations.
- ❌ Don't mix NgModule and standalone components in the same app; nav-shell uses standalone only.
- ❌ Don't check in build artifacts (`dist/`, `.angular/`); ensure `.gitignore` includes them.

## When in Doubt

1. Run `npx nx graph` to visualize project structure.
2. Run `npx nx show project <project-name>` to see all targets (build, serve, test, lint).
3. Check `apps/<project>/project.json` for project-specific config.
4. Look at `.gitlab-ci.yml` for deployment / CI patterns.
5. Use `npx nx --help` or consult [Nx docs](https://nx.dev) for advanced features.

---

**Next steps**: Update the README with dev setup instructions (npm install, `nx serve nav-shell`, `nx serve api-gateway`), deployment targets, and sub-service onboarding guide. Let me know if any section needs clarification.
