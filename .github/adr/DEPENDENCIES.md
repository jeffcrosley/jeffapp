# JeffApp Architecture: Dependency Map

**Updated:** 2025-01-18

## Application Layer

```
apps/nav-shell (Angular 20)
├─→ libs/ui-angular (Angular wrappers)
│   ├─→ libs/ui-components (Stencil Web Components)
│   └─→ libs/ui-components-native (Vanilla Web Components)
├─→ apps/nav-shell/public/config.json (runtime configuration)
├─→ apps/nav-shell/src/app/services/environment.service.ts
└─→ [iframe] apps/component-showcase (via runtime URL)

apps/component-showcase (Vite static)
├─→ libs/ui-components (Stencil)
└─→ libs/ui-components-native (Vanilla)

apps/api-gateway (Express)
└─→ (future) microservice proxies
```

## Library Layer

```
libs/ui-angular (Angular module)
├─→ CUSTOM_ELEMENTS_SCHEMA (for Web Components integration)
├─→ libs/ui-components (runtime import)
└─→ libs/ui-components-native (runtime import)

libs/ui-react (React utilities)
├─→ libs/ui-components (runtime import)
└─→ libs/ui-components-native (runtime import)

libs/ui-components (Stencil)
└─→ [outputs] dist/libs/ui-components, loader/

libs/ui-components-native (Vanilla)
└─→ [outputs] tmp/libs/ui-components-native/build/
```

## CI/CD Pipeline

```
GitHub Actions (.github/workflows/main.yml)
├─→ nx affected (detect changed projects)
├─→ nx affected --target=lint,test,build
└─→ [on success + main branch]
    ├─→ Render Webhook: api-gateway (if affected)
    ├─→ Render Webhook: nav-shell (if affected)
    └─→ Render Webhook: component-showcase (if affected)

Render Services
├─→ api-gateway (Node.js Web Service)
│   └─→ dist/apps/api-gateway/main.js
├─→ nav-shell (Static Site)
│   └─→ dist/apps/nav-shell/browser/
└─→ component-showcase (Static Site, Custom Domain)
    └─→ dist/apps/component-showcase/
```

## Runtime Data Flow

```
User navigates to nav-shell
    ↓
APP_INITIALIZER fires
    ↓
EnvironmentService.loadConfig()
    ↓
fetch('/config.json')
    ↓
Dev detection (hostname check)
    ↓
    ├─→ localhost? → Use http://localhost:4201, :3333
    └─→ production? → Use https://components.jeffcrosley.com, api URL
    ↓
Application bootstrap completes
    ↓
Components render with correct URLs
    ↓
    ├─→ /components page loads iframe with showcaseUrl
    └─→ Future API calls use apiGatewayUrl
```

## Path Mappings (tsconfig.base.json)

```
"@jeffapp/ui-components" → libs/ui-components/src/index.ts
"@jeffapp/ui-components-native" → libs/ui-components-native/src/index.ts
"@jeffapp/ui-angular" → libs/ui-angular/src/index.ts
"@jeffapp/ui-react" → libs/ui-react/src/index.ts
```

## Key Integration Points

### Web Components Integration

- **Production components:** `@jeffapp/ui-components` (Stencil)
- **Portfolio showcase:** `@jeffapp/ui-components-native` (Vanilla)
- **Framework wrappers:** `@jeffapp/ui-angular`, `@jeffapp/ui-react`

### Cross-App Communication

- **nav-shell → component-showcase:** iframe with sandboxed security
- **nav-shell → api-gateway:** future fetch() calls via config URL
- **CI → Render:** webhook triggers on affected-only basis

### Configuration Hierarchy

1. **Build time:** `nx.json`, `project.json` (Nx configuration)
2. **Deploy time:** Render dashboard (build commands, publish dirs)
3. **Runtime:** `public/config.json` loaded via APP_INITIALIZER

## Architectural Decision Records

See `.github/adr/` for detailed rationale:

- [001-runtime-configuration.md](.github/adr/001-runtime-configuration.md)
- [002-component-showcase-deployment.md](.github/adr/002-component-showcase-deployment.md)
- [003-affected-only-cicd.md](.github/adr/003-affected-only-cicd.md)
