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
