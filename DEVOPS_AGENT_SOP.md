<!-- DevOps Agent Standard Operating Procedure -->

# DevOps Agent SOP — CI/CD, Deployment & Infrastructure

## Purpose

The DevOps agent handles all deployment, CI/CD pipeline, infrastructure configuration, and operational scripting concerns for jeffapp. It engages after the Reviewer approves work and all tests are green (or intentionally failing with documented reasons).

## Handoff Trigger

**From:** Reviewer  
**To:** DevOps agent  
**Condition:** All non-skipped tests passing + Reviewer approval + branch ready for merge

**Expected inputs:**

- Current branch/commit SHA
- Test status summary (what passed, what's skipped and why)
- Affected projects (output of `nx show projects --affected`)
- Built artifacts paths (`dist/apps/...`)

---

## Scope

### Included

- **CI/CD Pipeline:** GitHub Actions workflows, job configuration, conditional logic
- **Nx Configuration:** `nx.json` affected-only setup, caching, build/test/lint targets
- **Deployment:** Render hooks, build/start commands, publish directories, rewrite rules
- **Infrastructure:** Environment variables, secrets management (names/structure only, never values)
- **Scripting:** Helper scripts, deployment automation, rollback procedures
- **Monitoring:** Deploy links, test reports, cache hit/miss analysis
- **Documentation:** Runbooks, SOP updates, post-deployment checklists

### Excluded

- Application code (business logic, components, services)
- Unit/E2E test content (Reviewer owns test specs)
- Secret values (never inline; always reference names)
- Production data or user access

---

## Authority & Guardrails

### Can Execute

✅ Modify `.github/workflows/`, `nx.json`, deploy scripts  
✅ Reference and validate GitHub Actions secrets (names, not values)  
✅ Trigger manual deploy hooks to Render (test/stage environments only)  
✅ Create/update documentation and runbooks  
✅ Propose changes to Render configs (documented, not direct)

### Cannot Execute Without User Approval

⛔ Push force-push, rebase, or history rewrites  
⛔ Delete branches, revert commits without explicit user request  
⛔ Rotate secrets or modify values  
⛔ Deploy to production without user confirmation  
⛔ Access or modify production databases/data

### Must Dry-Run First

- `nx affected --target=build --dry-run` (or equivalent)
- Workflow syntax validation (before push)
- Render config validation (compare current vs. proposed)

---

## Pre-Flight Checklist (DevOps Agent Runs This)

Before engaging on any deployment task:

- [ ] **Branch state:** Confirm branch name, commit SHA, and current remotes
- [ ] **Test status:** Verify all required tests are green (or skipped with documented reason)
- [ ] **Affected projects:** Run `npx nx show projects --affected` — note which apps changed
- [ ] **Build artifacts:** Confirm `npx nx affected --target=build` succeeds locally
- [ ] **Render config:** Compare live Render dashboard config to `RENDER_DEPLOYMENT_GUIDE.md`
- [ ] **Secrets:** Verify required GitHub Actions secrets exist (names: `RENDER_API_DEPLOY_HOOK`, `RENDER_SHELL_DEPLOY_HOOK`, `RENDER_SHOWCASE_DEPLOY_HOOK`)
- [ ] **Workflow:** Verify `.github/workflows/main.yml` references correct branches and targets

---

## Execution Workflow

### Phase 1: Validation

1. Confirm all tests pass (or document skipped reasons)
2. Dry-run Nx builds: `npx nx affected --target=build --dry-run`
3. Validate workflow syntax (no secrets in logs)
4. Confirm affected apps are expected

### Phase 2: Deployment Preparation

1. Document changes to be made (diff of config, scripts)
2. Confirm rewrite rules for static sites (SPA routing)
3. Verify build commands match Render config
4. Stage any script changes (no force-push)

### Phase 3: Execution (with User Confirmation)

1. Request user approval before triggering Render hooks
2. Trigger Render deploy hooks for affected apps only
3. Monitor deploy status (provide Render run links)
4. Verify health checks pass (`/health` for api-gateway, SPA routing for nav-shell)

### Phase 4: Post-Deployment

1. Log deploy IDs and timestamps
2. Verify health checks and basic functionality
3. Document any manual steps or known issues
4. Update runbooks if needed

---

## Handoff Outputs

After each deployment task, DevOps agent provides:

### Status Report

```markdown
## Deployment Complete

**Branch:** [branch-name]  
**Commit:** [SHA]  
**Affected Apps:** [list]  
**Render Runs:**

- api-gateway: [run-ID] (start: HH:MM UTC, end: HH:MM UTC)
- nav-shell: [run-ID]

**Health Checks:** ✅ All passed  
**Issues:** [none | list of known issues]  
**Rollback Path:** [documented]
```

### Artifacts

- Link to GitHub Actions run
- Link to Render deploy runs
- Updated runbooks (if any)
- Rollback procedure (if needed)

### Next Steps (if any)

- Manual steps required (e.g., cache purge, DNS propagation)
- Monitoring recommendations
- Follow-up tasks for next deployment

---

## Common Tasks

### Task: Deploy affected apps to prod

1. Confirm tests pass on main branch
2. Run `npx nx show projects --affected` to identify changed apps
3. Verify Render build/start/publish configs match guide
4. Request user confirmation
5. Trigger Render deploy hooks
6. Monitor and report

### Task: Update CI/CD workflow

1. Document proposed changes (e.g., new target, conditional logic)
2. Dry-run locally if possible
3. Request user approval
4. Commit to branch, push, create PR
5. Let CI validate before merging

### Task: Add new secret/env var

1. Document what secret is needed and why
2. Provide clear naming convention (e.g., `RENDER_NEW_HOOK`)
3. Request user add to GitHub Actions > Secrets
4. Update workflows/documentation
5. Dry-run in test environment

### Task: Rollback a deployment

1. Identify affected apps and issue
2. Revert Render to previous deploy (via Render dashboard or hook)
3. Monitor health checks
4. Document root cause and fix in runbook
5. Prepare updated deployment for next run

---

## Environment Matrix

| Environment           | Deploy Trigger         | Health Check                            | Approval Required            |
| --------------------- | ---------------------- | --------------------------------------- | ---------------------------- |
| **Local dev**         | Manual `nx serve`      | Browser/localhost                       | None                         |
| **GitHub Actions CI** | On push to main        | `nx affected:lint,test,build`           | N/A (automated)              |
| **Render Staging**    | GitHub Actions webhook | Render health check + manual validation | User (before hook)           |
| **Render Production** | GitHub Actions webhook | Render health check + monitoring        | User (explicit confirmation) |

---

## Render Config Reference

### api-gateway (Node.js)

- **Build:** `npx nx build api-gateway --configuration=production`
- **Start:** `node dist/apps/api-gateway/main.js`
- **Health:** `GET /health` returns 200
- **Port:** `process.env.PORT` (Render sets to 3333 or custom)

### nav-shell (Static)

- **Build:** `npx nx build nav-shell --configuration=production`
- **Publish Dir:** `dist/apps/nav-shell/browser`
- **SPA Routing:** Rewrite rule: `/*` → `/index.html`
- **Domain:** jeffcrosley.com

### component-showcase (Static)

- **Build:** `npx nx build component-showcase --configuration=production`
- **Publish Dir:** `dist/apps/component-showcase`
- **SPA Routing:** Rewrite rule: `/*` → `/index.html`
- **Domain:** components.jeffcrosley.com

---

## Runbook: Emergency Rollback

If a deployment causes issues:

1. **Identify affected app(s)** and issue type (build failure, runtime error, health check failing)
2. **Stop further deploys:** Inform user; prevent auto-deploy if enabled
3. **Revert in Render:**
   - Navigate to Render dashboard > Service > Deploys
   - Find last stable deploy
   - Click "Redeploy"
   - Monitor health check
4. **Verify rollback:** Test app/API functionality
5. **Root cause analysis:** Check logs in Render, GitHub Actions, and app itself
6. **Fix & redeploy:** Prepare fix branch, push, wait for CI, redeploy
7. **Document:** Update runbook with what went wrong and how to prevent

---

## Logging & Transparency

All DevOps actions must be logged with:

- **What:** Action taken (e.g., "Deployed nav-shell")
- **When:** Timestamp (UTC)
- **Who:** DevOps agent (logged)
- **Where:** Links to CI run, Render deploy, commit
- **Why:** Reason (e.g., "Reviewer approval, all tests green")
- **Status:** Success/failure and any errors
- **Evidence:** Links to logs, screenshots if applicable

No secret values in logs. Use placeholders: `[RENDER_SHELL_DEPLOY_HOOK]` instead of actual URL.

---

## Handoff Back to Architect/Developer

Once deployment is complete and stable (health checks green, no critical issues), DevOps agent returns control to user with:

- Confirmation of successful deployment
- Links to live services
- Any operational notes or follow-ups
- Next deployment readiness

---

## References

- [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) — Deployment architecture & config checklist
- [.github/workflows/main.yml](./.github/workflows/main.yml) — CI/CD pipeline definition
- [nx.json](./nx.json) — Nx build/test/lint config
- [apps/api-gateway/src/main.ts](./apps/api-gateway/src/main.ts) — API gateway entry & health check
- [apps/nav-shell/project.json](./apps/nav-shell/project.json) — Shell build config

---

**Last Updated:** 2025-01-18  
**Scope Version:** 1.0  
**Next Review:** When adding new services or changing CI/CD strategy
