# Render Deployment Configuration

> Canonical index: `docs/INDEX.md`

## Quick Setup Checklist

### Component Showcase Deployment

- [ ] Create static site in Render dashboard with name: `component-showcase`
- [ ] Configure build settings (see below)
- [ ] Set up SPA rewrite rule: `/*` → `/index.html`
- [ ] Copy deploy hook URL from Render
- [ ] Add to GitHub Secrets as: `RENDER_SHOWCASE_DEPLOY_HOOK`
- [ ] ✅ GitHub Actions workflow already configured (see `deploy_component_showcase` job)

### Production iframe URL Configuration

- [ ] Get deployed showcase URL from Render (e.g., `https://components.jeffcrosley.com`)
- [ ] Choose configuration method:
  - **Option 1 (Recommended):** Create `apps/nav-shell/public/config.json` with `showcaseUrl`
  - **Option 2 (Simpler):** Set `SHOWCASE_URL` environment variable in Render for nav-shell

---

## Component Showcase (Static Site)

### Render Dashboard Settings

**Service Type:** Static Site

**Build & Deploy:**

- **Build Command:**
  ```bash
  npx nx build component-showcase --configuration=production
  ```
- **Publish Directory:** `dist/apps/component-showcase`
- **Branch:** `main`
- **Auto-Deploy:** OFF (use GitHub Actions webhooks)

**Headers & Rewrite Rules:**

1. **Rewrite Rule (SPA routing):**
   - Source: `/*`
   - Destination: `/index.html`
   - Type: `rewrite`

2. **Headers (iframe embedding):**
   - Render Static Sites don't expose custom headers in UI
   - Default behavior (no `X-Frame-Options`) allows embedding
   - If needed in future, front with a minimal Node service to add:
     ```
     Content-Security-Policy: frame-ancestors https://nav-shell.onrender.com
     ```

**Environment Variables:**

- None required (static build)

**Deploy Hook:**

- Copy webhook URL from Render dashboard
- Add to GitHub Secrets as: `RENDER_SHOWCASE_DEPLOY_HOOK`

---

## Nav Shell (Static Site)

### Existing Configuration

**Build Command:**

```bash
npx nx build nav-shell --configuration=production
```

**Publish Directory:** `dist/apps/nav-shell/browser`

**Environment Variables (optional):**

- `SHOWCASE_URL`: Full URL to component-showcase Render site
  - Example: `https://components.jeffcrosley.com`
  - Used by `EnvironmentService` for iframe src in production

---

## GitHub Actions Workflow Updates

### Add Showcase to Affected Detection

**File:** `.github/workflows/main.yml`

**Add after existing affected detection:**

```yaml
- name: Check if component-showcase is affected
  id: affected-showcase
  run: |
   AFFECTED=$(npx nx show projects --affected --base=origin/main --head=HEAD)
   if echo "$AFFECTED" | grep -q "component-showcase"; then
     echo "affected=true" >> $GITHUB_OUTPUT
   else
     echo "affected=false" >> $GITHUB_OUTPUT
   fi
```

**Add deploy job for showcase:**

```yaml
deploy_component_showcase:
 needs: [build, affected]
 runs-on: ubuntu-latest
 if: needs.affected.outputs.showcase_affected == 'true' && github.ref == 'refs/heads/main'
 steps:
  - name: Trigger Render Deploy Hook for Component Showcase
    run: |
     curl -X POST ${{ secrets.RENDER_SHOWCASE_DEPLOY_HOOK }}
```

---

## Production iframe URL Setup (Two Options)

### Option 1: Runtime Config (Recommended)

1. Create `apps/nav-shell/public/config.json`:

   ```json
   {
   	"showcaseUrl": "https://components.jeffcrosley.com"
   }
   ```

2. Update `EnvironmentService` to fetch at startup:

   ```typescript
   private config: any = null;

   async loadConfig(): Promise<void> {
     const response = await fetch('/config.json');
     this.config = await response.json();
   }

   getShowcaseUrl(): string {
     return this.config?.showcaseUrl || '/showcase';
   }
   ```

3. Load config in `main.ts` before bootstrap

### Option 2: Build-Time Replacement (Simpler)

1. Update `.env.production`:

   ```
   SHOWCASE_URL=https://components.jeffcrosley.com
   ```

2. Inject at build time via Angular's `fileReplacements` or define

---

## Testing

**Dev (with proxy):**

```bash
# Terminal 1
npx nx serve component-showcase

# Terminal 2
npx nx serve nav-shell

# Visit: http://localhost:4200/components
# Iframe src will be /showcase (proxied to :4300)
```

**Production URLs:**

- Shell: `https://nav-shell.onrender.com`
- Showcase: `https://components.jeffcrosley.com`
- Iframe src: Full showcase URL (set via env or config.json)

---

## Checklist

- [ ] Create component-showcase static site in Render
- [ ] Configure build command and publish directory
- [ ] Set up rewrite rule for SPA routing
- [ ] Copy deploy hook to GitHub secrets
- [ ] Update GitHub Actions workflow
- [ ] Set production `SHOWCASE_URL` (via config.json or env)
- [ ] Test affected-only deploys

---

## CI/CD Agent Playbook (Render + GitHub Actions)

**Scope:** keep `.github/workflows/main.yml` healthy, validate Render configs, trigger deploy hooks only for affected apps, and surface post-deploy health.

### Agent Duties

- Verify secrets present: `RENDER_API_DEPLOY_HOOK`, `RENDER_SHELL_DEPLOY_HOOK`, `RENDER_SHOWCASE_DEPLOY_HOOK`.
- Validate workflow gates: affected-only `lint/test/build` must run before deploy jobs; deploys gated to `refs/heads/main`.
- Confirm Render services:
  - api-gateway (Node): build `npx nx build api-gateway --configuration=production`, start `node dist/apps/api-gateway/main.js`, health `/health`, port from `PORT`.
  - nav-shell (static): publish `dist/apps/nav-shell/browser`, rewrite `/* -> /index.html`, auto-deploy OFF, branch `main`.
  - component-showcase (static): publish `dist/apps/component-showcase`, rewrite `/* -> /index.html`, auto-deploy OFF, branch `main`.
- Check env/config:
  - prod + local today; keep pattern ready for staging (naming + secrets + hooks).
  - nav-shell: `SHOWCASE_URL` or `config.json` present for iframe.
- Post-deploy checks: hit `/health` (api-gateway) and root pages (shell/showcase); report failures; no Sentry wired yet.
- Documentation: update this guide and related SOPs when workflow or hooks change.

### Standard Validation Steps

1. **Workflow:** ensure affected detection runs and deploy jobs conditioned on affected apps + `main` branch.
2. **Secrets:** `gh secret list` (manual) or workflow dry-run to confirm `RENDER_*_DEPLOY_HOOK` available.
3. **Render:** visually confirm build/start/publish dirs + rewrite rules; auto-deploy OFF.
4. **Env vars:** verify `SHOWCASE_URL` (or `config.json`) set for nav-shell.
5. **Health checks:** after deploy, GET `/health` (api-gateway) and root pages for shell/showcase.

### Optional Future Enhancements

- Add staging environment following same hook pattern.
- Wire Sentry or other error tracking when ready; add DSN as secret and gate deploy on health signal.

### CI/CD Agent Runbook (step-by-step)

**When a PR merges to `main`:**

1. Confirm GitHub Actions workflow still contains affected-only `lint/test/build` gates and deploy jobs conditioned on `refs/heads/main`.
2. Check secrets exist: `RENDER_API_DEPLOY_HOOK`, `RENDER_SHELL_DEPLOY_HOOK`, `RENDER_SHOWCASE_DEPLOY_HOOK` (add staging equivalents when that env exists).
3. Validate Render service settings:

- api-gateway: build `npx nx build api-gateway --configuration=production`; start `node dist/apps/api-gateway/main.js`; health `/health`; port = `PORT`.
- nav-shell: publish `dist/apps/nav-shell/browser`; rewrite `/* -> /index.html`; auto-deploy OFF; branch `main`; `SHOWCASE_URL` or `config.json` present.
- component-showcase: publish `dist/apps/component-showcase`; rewrite `/* -> /index.html`; auto-deploy OFF; branch `main`.

4. Run `npx nx show projects --affected --base=origin/main --head=HEAD` and note affected apps. Only trigger hooks for affected ones.
5. Ensure lint/test/build succeeded for each affected app before any deploy hook fires.
6. Fire hooks in order: api-gateway first (backend), then nav-shell, then component-showcase (if affected).
7. Post-deploy smoke:

- `GET https://<api-gateway>/health` expect 200.
- `GET https://<nav-shell>/` expect 200 and HTML.
- `GET https://<component-showcase>/` expect 200 and HTML (if deployed).
- Record any non-200 as a deploy warning; no Sentry yet.

**Manual run / dry-run mode:**

- Provide a summary of affected apps, missing secrets, and any Render misconfig before triggering hooks.
- If any gate fails (lint/test/build), stop and report; do not trigger deploys.

**How to extend to staging later:**

- Duplicate secrets with `STAGING_` prefix; add staging deploy jobs conditioned on branch/tag; reuse the same validation steps with staging URLs.
