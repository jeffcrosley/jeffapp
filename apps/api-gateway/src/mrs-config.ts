export interface MREntry {
  title: string;
  repo: string;
  number: number;
  url: string;
  platform: 'github' | 'gitlab';
  feature?: string;
}

export const MR_CONFIG: MREntry[] = [
  // ── jeffapp ──────────────────────────────────────────────────────────────
  {
    title: 'feat: AI Workshop Sessions API',
    repo: 'jeffcrosley/jeffapp',
    number: 33,
    url: 'https://github.com/jeffcrosley/jeffapp/pull/33',
    platform: 'github',
    feature: 'jeffapp',
  },
  {
    title: 'fix: CI lint errors',
    repo: 'jeffcrosley/jeffapp',
    number: 34,
    url: 'https://github.com/jeffcrosley/jeffapp/pull/34',
    platform: 'github',
    feature: 'jeffapp',
  },
  {
    title: 'feat: Division of Labor page',
    repo: 'jeffcrosley/jeffapp',
    number: 35,
    url: 'https://github.com/jeffcrosley/jeffapp/pull/35',
    platform: 'github',
    feature: 'jeffapp',
  },
  {
    title: 'feat: Dashboard UI polish',
    repo: 'jeffcrosley/jeffapp',
    number: 36,
    url: 'https://github.com/jeffcrosley/jeffapp/pull/36',
    platform: 'github',
    feature: 'jeffapp',
  },
  // ── CI/CD — rest-api ─────────────────────────────────────────────────────
  {
    title: 'Draft: Add ExternalSecret manifest for dev credentials',
    repo: 'credithq/rest-api',
    number: 147,
    url: 'https://gitlab.com/credithq/rest-api/-/merge_requests/147',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Remove per-repo CI variables moving to group level',
    repo: 'credithq/rest-api',
    number: 148,
    url: 'https://gitlab.com/credithq/rest-api/-/merge_requests/148',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Wire shared CI template include (python-service)',
    repo: 'credithq/rest-api',
    number: 149,
    url: 'https://gitlab.com/credithq/rest-api/-/merge_requests/149',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  // ── CI/CD — doc-repo-api ─────────────────────────────────────────────────
  {
    title: 'Draft: Add ExternalSecret manifest for dev credentials',
    repo: 'aiapollo/engineering/doc-repo/doc-repo-api',
    number: 45,
    url: 'https://gitlab.com/aiapollo/engineering/doc-repo/doc-repo-api/-/merge_requests/45',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Wire shared CI template include (python-service)',
    repo: 'aiapollo/engineering/doc-repo/doc-repo-api',
    number: 46,
    url: 'https://gitlab.com/aiapollo/engineering/doc-repo/doc-repo-api/-/merge_requests/46',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Remove per-repo CI variables moving to group level',
    repo: 'aiapollo/engineering/doc-repo/doc-repo-api',
    number: 47,
    url: 'https://gitlab.com/aiapollo/engineering/doc-repo/doc-repo-api/-/merge_requests/47',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  // ── CI/CD — rfp-pipeline ─────────────────────────────────────────────────
  {
    title: 'Draft: Add ExternalSecret manifest for dev credentials',
    repo: 'aiapollo/engineering/workflow/rfp-pipeline',
    number: 13,
    url: 'https://gitlab.com/aiapollo/engineering/workflow/rfp-pipeline/-/merge_requests/13',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Add deploy-config-dev and deploy-config-prod CI jobs',
    repo: 'aiapollo/engineering/workflow/rfp-pipeline',
    number: 14,
    url: 'https://gitlab.com/aiapollo/engineering/workflow/rfp-pipeline/-/merge_requests/14',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Wire shared CI template include (python-service)',
    repo: 'aiapollo/engineering/workflow/rfp-pipeline',
    number: 15,
    url: 'https://gitlab.com/aiapollo/engineering/workflow/rfp-pipeline/-/merge_requests/15',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Remove per-repo CI variables moving to group level',
    repo: 'aiapollo/engineering/workflow/rfp-pipeline',
    number: 16,
    url: 'https://gitlab.com/aiapollo/engineering/workflow/rfp-pipeline/-/merge_requests/16',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  // ── CI/CD — ui-monorepo ──────────────────────────────────────────────────
  {
    title: 'Draft: Migrate ui-monorepo dev deploys from static IAM keys to OIDC',
    repo: 'aiapollo/engineering/ui-monorepo',
    number: 313,
    url: 'https://gitlab.com/aiapollo/engineering/ui-monorepo/-/merge_requests/313',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Wire shared CI template include (node-static)',
    repo: 'aiapollo/engineering/ui-monorepo',
    number: 314,
    url: 'https://gitlab.com/aiapollo/engineering/ui-monorepo/-/merge_requests/314',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  {
    title: 'Draft: Remove per-repo CI variables moving to group level',
    repo: 'aiapollo/engineering/ui-monorepo',
    number: 315,
    url: 'https://gitlab.com/aiapollo/engineering/ui-monorepo/-/merge_requests/315',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  // ── CI/CD — engineering-hub ──────────────────────────────────────────────
  {
    title: 'Draft: Add shared CI template library (python-service, node-static, configmap-deploy)',
    repo: 'aiapollo/engineering/engineering-hub',
    number: 13,
    url: 'https://gitlab.com/aiapollo/engineering/engineering-hub/-/merge_requests/13',
    platform: 'gitlab',
    feature: 'CI/CD',
  },
  // ── Airflow ───────────────────────────────────────────────────────────────
  {
    title: 'docs(airflow): document Authentik OAuth app and sync aia-config secret shape',
    repo: 'aiapollo/engineering/airflow/infrastructure',
    number: 79,
    url: 'https://gitlab.com/aiapollo/engineering/airflow/infrastructure/-/merge_requests/79',
    platform: 'gitlab',
    feature: 'Airflow',
  },
];
