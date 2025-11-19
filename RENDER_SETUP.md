# Render Dashboard Configuration

This document describes the required Render dashboard settings for the jeffapp deployment.

## Architecture Overview

- **GitHub Actions** handles CI/CD: affected detection, build, test, lint
- **Render** handles hosting: receives webhook, pulls code, builds, serves
- **Deploy hooks** trigger Render builds only for affected apps

## Service 1: jeffapp-api-gateway

**Service Type:** Web Service (Node.js)

**Settings:**

- **Name:** `jeffapp-api-gateway`
- **Environment:** Node
- **Branch:** `main`
- **Root Directory:** (leave blank - monorepo root)
- **Build Command:**
  ```bash
  npx nx build api-gateway --configuration=production
  ```
- **Start Command:**
  ```bash
  node dist/apps/api-gateway/main.js
  ```
- **Health Check Path:** `/health`
- **Auto-Deploy:** ❌ **OFF** (we use GitHub Actions webhooks)

**Environment Variables:**

- `PORT`: (Render sets automatically)
- Add any other env vars your API needs

**Deploy Hook:**

1. Go to Settings → Deploy Hook
2. Copy the webhook URL
3. Add to GitHub repository secrets as `RENDER_API_DEPLOY_HOOK`

---

## Service 2: jeffapp-nav-shell

**Service Type:** Static Site

**Settings:**

- **Name:** `jeffapp-nav-shell`
- **Branch:** `main`
- **Root Directory:** (leave blank - monorepo root)
- **Build Command:**
  ```bash
  npx nx build nav-shell --configuration=production
  ```
- **Publish Directory:**
  ```
  dist/apps/nav-shell/browser
  ```
- **Auto-Deploy:** ❌ **OFF** (we use GitHub Actions webhooks)

**Rewrite Rules (CRITICAL for SPA routing):**
Add this rewrite rule to handle client-side routing:

| Source | Destination   | Type    |
| ------ | ------------- | ------- |
| `/*`   | `/index.html` | rewrite |

Without this, direct navigation to `/dashboard`, `/about`, etc. will return 404.

**Deploy Hook:**

1. Go to Settings → Deploy Hook
2. Copy the webhook URL
3. Add to GitHub repository secrets as `RENDER_SHELL_DEPLOY_HOOK`

---

## GitHub Secrets Setup

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add two repository secrets:
   - `RENDER_API_DEPLOY_HOOK`: Webhook URL from api-gateway service
   - `RENDER_SHELL_DEPLOY_HOOK`: Webhook URL from nav-shell service

---

## Verification

After setup, test the deployment flow:

1. **Make a change** to `apps/api-gateway/src/main.ts`
2. **Commit and push** to `main` branch
3. **Watch GitHub Actions**:
   - Should detect `api-gateway` as affected
   - Should run lint, test, build on affected projects
   - Should trigger `deploy_api_gateway` job (curl to webhook)
4. **Watch Render**:
   - api-gateway service should start building
   - Build should run `npx nx build api-gateway --configuration=production`
   - After build, should start with `node dist/apps/api-gateway/main.js`
5. **Test the deployment**:
   - Visit your api-gateway URL + `/health`
   - Should return `{ "status": "ok" }`

Repeat for `nav-shell`:

1. Make a change to `apps/nav-shell/src/app/components/home.component.ts`
2. Commit and push to `main`
3. GitHub Actions should detect `nav-shell` as affected
4. Render nav-shell should build
5. Test by visiting your nav-shell URL directly at routes like `/dashboard`, `/about`

---

## Troubleshooting

**Build fails with "command not found":**

- Ensure build command is exactly: `npx nx build <app-name> --configuration=production`
- Render installs dependencies from `package.json` automatically

**Static site returns 404 on routes:**

- Check Rewrite Rules are configured: `/*` → `/index.html` (type: rewrite)
- Ensure Publish Directory is exactly: `dist/apps/nav-shell/browser`

**Deploy hook not triggering:**

- Verify webhook URL is correctly set in GitHub secrets
- Check GitHub Actions logs for curl response
- Ensure job condition is met: `github.event_name == 'push'` and app is affected

**Both services building when only one changed:**

- Check `npx nx show projects --affected --base=origin/main` locally
- Ensure GitHub Actions is using correct base/head refs for affected calculation
