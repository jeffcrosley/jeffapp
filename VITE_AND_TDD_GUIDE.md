# Vite Overview & TDD Workflow Strategy

## What is Vite?

**Vite** (French for "fast") is a modern build tool and dev server created by Evan You (Vue.js creator). It's fundamentally different from traditional bundlers like Webpack.

### Core Concepts

**1. ES Modules Native**
- Vite serves source code as native ES modules during development
- Your browser imports files directly: `import { foo } from './bar.js'`
- No bundling needed during dev (instant startup)

**2. Hot Module Replacement (HMR)**
- Changes reflect instantly without full page reload
- Updates only the changed module, not entire bundle
- State is preserved between updates

**3. Production Bundling**
- Uses Rollup under the hood for production builds
- Optimized, tree-shaken, minified output
- Code splitting and lazy loading built-in

### How You'll Interact with Vite

**Development:**
```bash
# Start dev server (instant startup, HMR enabled)
npx nx serve component-showcase

# Visits http://localhost:4200
# Changes to .ts, .scss files update instantly
# No build step, no waiting
```

**Building:**
```bash
# Production build (uses Rollup)
npx nx build component-showcase

# Output: dist/component-showcase/
# Optimized, minified, ready to deploy
```

**Testing:**
```bash
# Run Vitest tests
npx nx test component-showcase

# Uses same Vite config
# Instant test startup (no bundling)
# Watch mode for TDD
npx vitest --watch
```

### Vite Config (`vite.config.ts`)

```typescript
export default defineConfig(() => ({
  // Where vite runs from
  root: __dirname,
  
  // Dev server settings
  server: {
    port: 4200,
    host: 'localhost',
    // HMR, proxies, CORS, etc.
  },
  
  // Build output
  build: {
    outDir: '../dist/component-showcase',
    // Rollup options, minification, etc.
  },
  
  // Plugins extend functionality
  plugins: [
    nxViteTsPaths(),  // TypeScript path resolution
    nxCopyAssetsPlugin(['*.md']),  // Copy static files
  ],
  
  // Test configuration (Vitest)
  test: {
    globals: true,  // No need to import describe, it, expect
    environment: 'jsdom',  // DOM APIs for testing
    coverage: { ... },
  },
}));
```

### Key Differences from Webpack

| Feature | Webpack | Vite |
|---------|---------|------|
| **Dev Startup** | Bundles everything first (slow) | Serves on-demand (instant) |
| **HMR** | Replaces modules in bundle | Native ESM replacement |
| **Config** | Complex, verbose | Simple, minimal |
| **Production** | Webpack bundling | Rollup bundling |
| **Speed** | Slower (bundling overhead) | Faster (no bundling in dev) |

### When to Use Vite vs Webpack

**Use Vite for:**
- New projects (especially vanilla, React, Vue, Svelte)
- Fast iteration (HMR is critical)
- Modern browsers (ES modules support)
- Simple config needs

**Use Webpack for:**
- Legacy projects already configured
- Complex build requirements (specific loaders, plugins)
- Browser compatibility needs (IE11, etc.)
- Angular apps (Angular CLI uses Webpack/esbuild internally)

---

## TDD Workflow Strategy for JeffApp Portfolio

Your instinct is excellent: **Use tests as a development driver to demonstrate proficiency while building systematically.**

### Proposed Model

**Three-Tier Approach:**

#### Tier 1: Infrastructure & Foundation (AI Implements)
**What:** Core setup, configurations, boilerplate
**Why:** Not demonstrative of skill, time-consuming
**Examples:**
- Nx project setup
- ESLint, TypeScript, Vitest configuration
- Deployment workflows (GitHub Actions, Render)
- Project structure (folders, routing basics)
- Dependency management

**AI Role:** Full implementation

#### Tier 2: Feature Scaffolding (AI Generates Tests, You Implement)
**What:** New components, pages, features
**Why:** Demonstrates TDD discipline, design thinking, implementation skill
**Examples:**
- New Web Components (button, card, form, modal)
- New pages (dashboard content, project showcase)
- API endpoints (when you add backend features)
- State management logic

**AI Role:** Generate comprehensive tests with clear requirements
**Your Role:** Implement code to make tests pass

**Example Workflow:**
```typescript
// AI Generates:
describe('ProjectCard Component', () => {
  it('should render project title and description', () => {
    const card = document.createElement('project-card');
    card.setAttribute('title', 'My Project');
    card.setAttribute('description', 'A cool project');
    document.body.appendChild(card);
    
    expect(card.shadowRoot?.querySelector('h3')?.textContent).toBe('My Project');
    expect(card.shadowRoot?.querySelector('p')?.textContent).toBe('A cool project');
  });
  
  it('should emit click event when card is clicked', () => {
    const card = document.createElement('project-card');
    const clickHandler = vi.fn();
    card.addEventListener('cardClick', clickHandler);
    
    card.click();
    
    expect(clickHandler).toHaveBeenCalledOnce();
  });
  
  it('should support multiple tags', () => {
    const card = document.createElement('project-card');
    card.setAttribute('tags', 'React,TypeScript,Vite');
    
    const tags = card.shadowRoot?.querySelectorAll('.tag');
    expect(tags?.length).toBe(3);
  });
});

// You Implement:
class ProjectCard extends HTMLElement {
  // ... implementation to pass tests
}
```

#### Tier 3: Complex Features & Integration (Collaborative)
**What:** Multi-component features, complex interactions
**Why:** Balances learning with productivity
**Examples:**
- Interactive component gallery with live code editing
- Module federation setup (if you add React/Angular showcases)
- Authentication/authorization (if you add user features)
- Real-time features (WebSockets, etc.)

**AI Role:** Pair programming—suggest approaches, generate tests, implement alongside you
**Your Role:** Design decisions, critical path implementation, learning new patterns

### Benefits of This Model

**For Portfolio:**
- **Demonstrates TDD discipline** (employers love this)
- **Shows test-writing ability** (you review/understand AI-generated tests)
- **Proves implementation skill** (you write passing code)
- **Documents thought process** (git commits show test-first approach)

**For Learning:**
- **Focused practice** (implement features, not boilerplate)
- **Immediate feedback** (tests tell you when you're done)
- **Gradual complexity** (start simple, add features incrementally)
- **Real-world workflow** (mirrors professional TDD)

**For Velocity:**
- **Skip tedious setup** (AI handles config/infrastructure)
- **Clear requirements** (tests are executable specs)
- **Avoid bikeshedding** (tests define "done")
- **Faster iteration** (no ambiguity about what to build)

### Practical Example: Next Feature

**Scenario:** Add a "Copy Code" button to code examples in component showcase

**Tier 2 Workflow:**

**Step 1:** You describe feature
> "I want a copy-to-clipboard button on each code example in the gallery. When clicked, it should copy the code and show visual feedback ('Copied!' message)."

**Step 2:** AI generates tests
```typescript
describe('Code Example Copy Feature', () => {
  beforeEach(() => {
    // Setup DOM with code example
  });
  
  it('should render copy button on each code example', () => {
    // Assert button exists
  });
  
  it('should copy code to clipboard when clicked', async () => {
    // Mock clipboard API
    // Click button
    // Assert clipboard contains code
  });
  
  it('should show "Copied!" feedback for 2 seconds', async () => {
    // Click button
    // Assert feedback appears
    // Wait 2 seconds
    // Assert feedback disappears
  });
  
  it('should handle clipboard permission errors gracefully', () => {
    // Mock clipboard failure
    // Click button
    // Assert error handling (fallback message)
  });
});
```

**Step 3:** You implement
- Add button to `gallery.ts` template
- Implement `copyToClipboard()` function
- Add feedback UI logic
- Handle edge cases

**Step 4:** Run tests, iterate until green
```bash
npx vitest --watch
```

**Step 5:** Commit with test-first evidence
```bash
git add .
git commit -m "feat: add copy-to-clipboard for code examples (TDD)"
```

### Recommended Workflow Commands

**Starting a new feature:**
```bash
# 1. Describe to AI what you want to build
# 2. AI generates tests
# 3. Run tests in watch mode
npx vitest --watch component-showcase

# 4. Implement until tests pass
# 5. Commit with TDD message
git add .
git commit -m "feat(component-showcase): [feature] (TDD)"
```

**During development:**
```bash
# Check build still works
npx nx build component-showcase

# Lint your code
npx nx lint component-showcase

# Run all affected tests
npx nx affected --target=test
```

### Calibration Questions

**For each new feature, ask:**
1. **Infrastructure or feature?**
   - Infrastructure → AI implements fully
   - Feature → Generate tests, you implement

2. **Simple or complex?**
   - Simple (single component) → Tier 2 (tests-first)
   - Complex (multi-component) → Tier 3 (collaborative)

3. **Learning goal or production goal?**
   - Learning → You implement (slower but educational)
   - Production → AI assists (faster but less practice)

### Success Metrics

**You'll know this approach is working when:**
- Git history shows test commits before implementation
- You can explain every test case (they're clear specs)
- Tests catch regressions (you've broken tests while coding)
- Velocity increases (less "what should I build next?" paralysis)
- Portfolio reviewers see systematic, test-driven development

---

## Quick Reference

**Vite Commands:**
```bash
npx nx serve component-showcase    # Dev server (HMR)
npx nx build component-showcase    # Production build
npx nx test component-showcase     # Run tests once
npx vitest --watch                 # Test watch mode (TDD)
```

**TDD Workflow:**
1. Describe feature to AI
2. AI generates tests
3. Run `npx vitest --watch`
4. Implement until green
5. Refactor if needed
6. Commit

**Nx + Vite Integration:**
- Nx orchestrates (affected commands, caching, graph)
- Vite executes (dev server, build, test)
- Best of both worlds (monorepo power + Vite speed)

---

Ready to proceed with this workflow? The next feature could be:
- Enhanced component gallery (interactive props editor)
- Copy-to-clipboard for code examples
- Dark mode toggle
- Component search/filter
- Live code playground

Pick one and I'll generate comprehensive tests for you to implement!
