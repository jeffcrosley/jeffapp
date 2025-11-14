# JeffApp

> A full-pipeline portfolio application showcasing modern web development practices, microfrontend architecture, and cross-framework component design.

## 🎯 Purpose

JeffApp is a living portfolio and resume application for Jeff Crosley, built to demonstrate:

- **Technical proficiency** across multiple languages and frameworks
- **Modern architecture patterns** including microfrontends and microservices
- **AI-forward engineering** with test-driven development (TDD)
- **Cross-framework component libraries** using Web Components
- **Production-grade CI/CD** with automated testing and deployment

This project serves as both a showcase for prospective employers and a learning platform for exploring new technologies and patterns.

## 🏗️ Architecture

### Microfrontend + Microservices

**Frontend:**
- `apps/nav-shell` — Angular 20 shell orchestrating multiple microfrontend sub-apps
- Future sub-apps in various frameworks (React, Vue, Svelte, etc.) to showcase versatility

**Backend:**
- `apps/api-gateway` — Express.js gateway routing to multiple microservice backends
- Future microservices in varied languages (Python, Go, Rust, etc.) to demonstrate full-stack capabilities

**Component Libraries:**
- `@jeffapp/ui-components` — Stencil-based Web Components for production use
- `@jeffapp/ui-components-native` — Vanilla Web Components showcasing fundamentals
- `@jeffapp/ui-angular` — Angular-specific utilities and wrappers
- `@jeffapp/ui-react` — React-specific utilities and wrappers

### Technology Stack

- **Build System:** Nx 22 monorepo with affected-based CI/CD
- **Frontend:** Angular 20 (standalone components), React 18+
- **Backend:** Node.js with Express
- **Components:** Stencil, Web Components API
- **Testing:** Jest (unit), Playwright (e2e)
- **CI/CD:** GitHub Actions with Nx Cloud caching
- **Deployment:** Render (with webhook-based deployments)
- **Code Quality:** ESLint, Prettier, TypeScript strict mode


## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

**Start the Angular shell:**
```bash
npx nx serve nav-shell
```

**Start the API gateway:**
```bash
npx nx serve api-gateway
```

**Run affected tests:**
```bash
npx nx affected --target=test
```

**View dependency graph:**
```bash
npx nx graph
```

### Building

**Build specific project:**
```bash
npx nx build nav-shell
```

**Build all affected projects:**
```bash
npx nx affected --target=build
```

## 🧩 Component Libraries

### Using Web Components

**In Angular apps:**
```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@jeffapp/ui-components';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<app-button label="Click me" variant="primary"></app-button>`
})
```

**In React apps:**
```typescript
import { loadWebComponents, AppButton } from '@jeffapp/ui-react';

loadWebComponents();

function App() {
  return <AppButton label="Click me" variant="primary" />;
}
```

### Building Component Libraries

**Build Stencil components:**
```bash
npx nx run ui-components:build
```

**Build all libraries:**
```bash
npx nx run-many --target=build --projects=ui-*
```

## 🧪 Development Philosophy

### Test-Driven Development (TDD)

This project follows TDD principles:
- Features are built test-first when feasible
- Tests guide implementation and architecture
- All changes must pass affected tests before deployment

### Modularity & Loose Coupling

- Components and services are kept loosely coupled
- Changes are localized to single projects when possible
- Architecture prioritizes flexibility and scalability

### AI-Assisted Development

- AI agents are guided by `.github/copilot-instructions.md`
- Agents raise concerns about testability and coupling
- Human oversight ensures architectural consistency

## 🚢 CI/CD Pipeline

### GitHub Actions Workflow

- **Automated testing** on all pull requests
- **Affected-based execution** (only tests/builds changed projects)
- **Nx Cloud caching** for faster builds
- **Deployment hooks** to Render on successful merges to main

### Deployment

- **Frontend:** `nav-shell` deployed to Render
- **Backend:** `api-gateway` deployed to Render
- **Libraries:** Published as npm packages (future)

## 📚 Project Structure

```
jeffapp/
├── apps/
│   ├── nav-shell/              # Angular 20 shell app
│   ├── nav-shell-e2e/          # Playwright e2e tests
│   ├── api-gateway/            # Express.js API gateway
│   └── api-gateway-e2e/        # API e2e tests
├── libs/
│   ├── ui-components/          # Stencil Web Components
│   ├── ui-components-native/   # Vanilla Web Components
│   ├── ui-angular/             # Angular utilities
│   └── ui-react/               # React utilities
└── .github/
    ├── copilot-instructions.md # AI agent guidance
    └── workflows/              # CI/CD pipelines
```

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome! Please open an issue to discuss any changes.

## 📄 License

MIT License - feel free to use this as inspiration for your own portfolio projects!

## 👨‍💻 About

Built by Jeff Crosley as a demonstration of full-pipeline engineering capabilities. For more information, visit the deployed application or check out the [contact page](apps/nav-shell/src/app/components/contact.component.ts).

---

*Powered by [Nx](https://nx.dev) • Deployed on [Render](https://render.com)*
