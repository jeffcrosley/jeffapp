import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import '@jeffapp/ui-components-native';
import { EnvironmentService } from '../services/environment.service';
import { EventBusService, BusEvent } from '../services/event-bus.service';

// ─── Dispatch lifecycle types ─────────────────────────────────────────────────

const DISPATCH_STAGES = ['dispatched', 'started', 'executing', 'return_written', 'complete'] as const;
type DispatchStage = typeof DISPATCH_STAGES[number];

const STAGE_LABELS: Record<string, string> = {
  dispatched: 'Dispatched',
  started: 'Started',
  executing: 'Executing',
  return_written: 'Return Written',
  complete: 'Complete',
};

const AGENT_GLYPHS: Record<string, string> = {
  saturn: '♄',
  neptune: '♆',
  mars: '♂',
  mercury: '☿',
  jupiter: '♃',
};

interface DispatchSession {
  dispatch_id: string;
  agent: string;
  slug: string;
  stage: DispatchStage;
  status: 'pending' | 'running' | 'complete' | 'failed';
  started_at?: string;
  detail?: string;
}

// ─── API snapshot shape (from GET /api/dispatches) ───────────────────────────

interface ApiDispatch {
  dispatch_id: string;
  agent?: string;
  brief_path?: string;
  slug?: string;
  status?: string;
  created_at?: string;
  claimed_at?: string;
  completed_at?: string;
  session_name?: string;
  error?: string;
}

// ─── Other dashboard types ────────────────────────────────────────────────────

interface GtdTask {
  id: string;
  title: string;
  project?: string;
  status?: string;
  updated_at?: string;
}

interface BriefTask {
  id: string;
  title: string;
  status?: string;
  project?: string;
}

interface Brief {
  slug: string;
  filename: string;
  agent: string;
  tasks: BriefTask[];
}

interface ProjectGroup {
  name: string;
  tasks: GtdTask[];
  latestUpdate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="dashboard-container">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <p class="subtitle">Live GTD system status</p>
      </div>

      <!-- System Health -->
      <div class="dashboard-section">
        <h3>System Health</h3>
        @if (healthLoading) {
          <div class="status-row">
            <span class="indicator loading"></span>
            <span class="status-label">Checking…</span>
          </div>
        }
        @if (!healthLoading && healthError) {
          <div class="status-row">
            <span class="indicator offline"></span>
            <span class="status-label">Unreachable</span>
            <span class="status-detail">{{ healthError }}</span>
          </div>
        }
        @if (!healthLoading && !healthError) {
          <div class="status-row">
            <span class="indicator" [class.online]="healthOnline" [class.offline]="!healthOnline"></span>
            <span class="status-label">{{ healthOnline ? 'Online' : 'Degraded' }}</span>
          </div>
        }
      </div>

      <!-- Dispatch Status -->
      <div class="dashboard-section">
        <div class="section-title-row">
          <h3>Dispatch Status <span class="section-hint">(recent 20)</span></h3>
          @if (sseReconnecting) {
            <div class="reconnecting-badge">
              <span class="reconnecting-dot"></span>
              reconnecting…
            </div>
          }
        </div>

        @if (dispatchesLoading) {
          <p class="muted">Loading dispatches…</p>
        }
        @if (!dispatchesLoading && dispatchesError) {
          <p class="muted error">{{ dispatchesError }}</p>
        }
        @if (!dispatchesLoading && !dispatchesError && sessions.length === 0) {
          <p class="muted">No dispatches found.</p>
        }
        @if (!dispatchesLoading && !dispatchesError && sessions.length > 0) {
          <div class="dispatch-session-list">
            @for (session of sessions; track session.dispatch_id) {
              <div class="dispatch-session-card" [class]="'card-' + session.status">
                <div class="session-header">
                  <span class="agent-glyph" [title]="session.agent">{{ agentGlyph(session.agent) }}</span>
                  <span class="session-agent">{{ session.agent }}</span>
                  <span class="session-slug">{{ session.slug }}</span>
                  <span class="session-badge" [class]="'badge-' + session.status">
                    {{ statusLabel(session.status) }}
                  </span>
                  <span class="session-elapsed muted">{{ formatRelative(session.started_at ?? '') }}</span>
                </div>
                <div class="stepper">
                  @for (stage of STAGES; track stage; let last = $last) {
                    <div class="stepper-step">
                      <div class="stepper-dot"
                           [class.completed]="isCompleted(session, stage)"
                           [class.current]="isCurrent(session, stage)"
                           [class.failed-at]="isFailedAt(session, stage)">
                        @if (isFailedAt(session, stage)) {
                          <span class="fail-x">✕</span>
                        }
                      </div>
                      <div class="stepper-label" [class.dim]="isFuture(session, stage)">
                        {{ stageLabel(stage) }}
                      </div>
                    </div>
                    @if (!last) {
                      <div class="stepper-connector" [class.filled]="isCompleted(session, stage)"></div>
                    }
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Work In Progress -->
      <div class="dashboard-section">
        <h3>Work In Progress</h3>
        @if (briefsLoading) {
          <p class="muted">Loading briefs…</p>
        }
        @if (!briefsLoading && briefsError) {
          <p class="muted error">{{ briefsError }}</p>
        }
        @if (!briefsLoading && !briefsError && briefs.length === 0) {
          <p class="muted">No active work.</p>
        }
        @if (!briefsLoading && !briefsError && briefs.length > 0) {
          <div class="brief-list">
            @for (brief of briefs; track brief.slug) {
              <wip-card
                [attr.slug]="brief.slug"
                [attr.agent]="brief.agent"
                [attr.tasks]="tasksJson(brief.tasks)"
              ></wip-card>
            }
          </div>
        }
      </div>

      <!-- Hot Projects -->
      <div class="dashboard-section">
        <h3>Hot Projects <span class="section-hint">(active last 3 days)</span></h3>
        @if (tasksLoading) {
          <p class="muted">Loading projects…</p>
        }
        @if (!tasksLoading && tasksError) {
          <p class="muted error">{{ tasksError }}</p>
        }
        @if (!tasksLoading && !tasksError && hotProjects.length === 0) {
          <p class="muted">No recently active projects.</p>
        }
        @if (!tasksLoading && !tasksError && hotProjects.length > 0) {
          <div class="project-list">
            @for (project of hotProjects; track project.name) {
              <div class="project-card">
                <div class="project-header">
                  <span class="project-name">{{ project.name }}</span>
                  <span class="project-count">{{ project.tasks.length }} task{{ project.tasks.length !== 1 ? 's' : '' }}</span>
                </div>
                <span class="project-updated">Updated {{ formatRelative(project.latestUpdate) }}</span>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px 0;

        .dashboard-header {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 2px solid var(--color-border-primary);

          h2 {
            font-size: 2.5rem;
            color: var(--color-text-primary);
            margin-bottom: 10px;
            font-weight: 700;
          }

          .subtitle {
            font-size: 1.1rem;
            color: var(--color-text-muted);
            margin: 0;
          }
        }

        .dashboard-section {
          margin-bottom: 48px;

          h3 {
            font-size: 1.5rem;
            color: var(--color-text-primary);
            margin-bottom: 20px;
            font-weight: 600;

            .section-hint {
              font-size: 0.9rem;
              color: var(--color-text-muted);
              font-weight: 400;
            }
          }

          .section-title-row {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;

            h3 {
              margin-bottom: 0;
            }
          }

          .reconnecting-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.78rem;
            color: var(--color-text-muted);

            .reconnecting-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: var(--color-topaz-600);
              animation: pulse 1.2s ease-in-out infinite;
            }
          }

          .muted {
            color: var(--color-text-muted);
            font-size: 0.95rem;

            &.error {
              color: var(--color-ruby-600);
            }
          }

          .status-row {
            display: flex;
            align-items: center;
            gap: 12px;

            .indicator {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              flex-shrink: 0;

              &.online {
                background: var(--color-status-online);
                box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
              }

              &.offline {
                background: var(--color-ruby-600);
              }

              &.loading {
                background: var(--color-status-loading);
                animation: pulse 1.2s ease-in-out infinite;
              }
            }

            .status-label {
              font-size: 1rem;
              color: var(--color-text-primary);
              font-weight: 500;
            }

            .status-detail {
              font-size: 0.9rem;
              color: var(--color-text-muted);
            }
          }

          // ─── Dispatch session list ─────────────────────────────────────────

          .dispatch-session-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .dispatch-session-card {
            padding: 14px 16px;
            background: var(--color-bg-secondary);
            border-radius: 8px;
            border-left: 3px solid var(--color-border-primary);
            transition: border-color 0.2s;

            &.card-running {
              border-left-color: var(--color-sapphire-600);
            }

            &.card-complete {
              border-left-color: var(--color-emerald-600);
            }

            &.card-failed {
              border-left-color: var(--color-ruby-600);
            }

            .session-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 12px;
              font-size: 0.88rem;
              flex-wrap: wrap;

              .agent-glyph {
                font-size: 1.05rem;
                flex-shrink: 0;
                opacity: 0.85;
              }

              .session-agent {
                font-weight: 600;
                color: var(--color-text-primary);
                flex-shrink: 0;
              }

              .session-slug {
                color: var(--color-text-secondary);
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 0.82rem;
              }

              .session-badge {
                padding: 2px 7px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                flex-shrink: 0;

                &.badge-running {
                  background: rgba(59, 130, 246, 0.12);
                  color: var(--color-sapphire-600);
                }

                &.badge-complete {
                  background: rgba(5, 150, 105, 0.12);
                  color: var(--color-emerald-600);
                }

                &.badge-failed {
                  background: rgba(220, 38, 38, 0.12);
                  color: var(--color-ruby-600);
                }

                &.badge-pending {
                  background: rgba(100, 116, 139, 0.12);
                  color: var(--color-text-muted);
                }
              }

              .session-elapsed {
                font-size: 0.78rem;
                flex-shrink: 0;
              }
            }

            // ─── Stepper ───────────────────────────────────────────────────

            .stepper {
              display: flex;
              align-items: flex-start;
              overflow-x: auto;
              padding-bottom: 2px;

              .stepper-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 76px;
                flex-shrink: 0;

                .stepper-dot {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 2px solid var(--color-border-primary);
                  background: transparent;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: background 0.25s, border-color 0.25s;

                  &.completed {
                    background: var(--color-emerald-600);
                    border-color: var(--color-emerald-600);
                  }

                  &.current {
                    background: var(--color-sapphire-600);
                    border-color: var(--color-sapphire-600);
                    animation: dot-pulse 1.5s ease-in-out infinite;
                  }

                  &.failed-at {
                    background: var(--color-ruby-600);
                    border-color: var(--color-ruby-600);
                  }

                  .fail-x {
                    font-size: 0.55rem;
                    color: #fff;
                    line-height: 1;
                    font-weight: 700;
                  }
                }

                .stepper-label {
                  font-size: 0.62rem;
                  color: var(--color-text-secondary);
                  text-align: center;
                  margin-top: 5px;
                  white-space: nowrap;

                  &.dim {
                    color: var(--color-text-disabled);
                  }
                }
              }

              .stepper-connector {
                flex: 1;
                height: 2px;
                background: var(--color-border-primary);
                margin-top: 7px;
                min-width: 16px;
                transition: background 0.25s;

                &.filled {
                  background: var(--color-emerald-600);
                }
              }
            }
          }

          // ─── Briefs ────────────────────────────────────────────────────────

          .brief-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          // ─── Hot projects ──────────────────────────────────────────────────

          .project-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;

            .project-card {
              padding: 18px 20px;
              background: var(--color-bg-secondary);
              border-radius: 10px;
              border-top: 3px solid var(--color-primary);
              transition: transform 0.2s ease, box-shadow 0.2s ease;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 14px rgba(52, 152, 219, 0.15);
              }

              .project-header {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                margin-bottom: 6px;

                .project-name {
                  font-size: 1rem;
                  color: var(--color-text-primary);
                  font-weight: 600;
                }

                .project-count {
                  font-size: 0.8rem;
                  color: var(--color-text-secondary);
                  font-weight: 500;
                }
              }

              .project-updated {
                font-size: 0.8rem;
                color: var(--color-text-muted);
              }
            }
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.45); }
          50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0); }
        }

        @media (max-width: 768px) {
          .dashboard-header h2 {
            font-size: 2rem;
          }

          .dashboard-section .project-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          padding: 20px 16px;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private env = inject(EnvironmentService);
  private eventBus = inject(EventBusService);
  private eventSub: Subscription | null = null;
  private sseConnSub: Subscription | null = null;
  private hasConnectedOnce = false;

  protected readonly STAGES: readonly DispatchStage[] = DISPATCH_STAGES;

  protected healthLoading = true;
  protected healthError = '';
  protected healthOnline = false;

  protected tasksLoading = true;
  protected tasksError = '';
  protected hotProjects: ProjectGroup[] = [];

  protected briefsLoading = true;
  protected briefsError = '';
  protected briefs: Brief[] = [];

  protected dispatchesLoading = true;
  protected dispatchesError = '';
  protected sessions: DispatchSession[] = [];
  protected sseReconnecting = false;

  async ngOnInit(): Promise<void> {
    if (!this.env.getApiGatewayUrl()) {
      await this.env.loadConfig();
    }
    this.eventBus.connect();

    this.sseConnSub = this.eventBus.connected$.subscribe(connected => {
      if (connected) {
        this.hasConnectedOnce = true;
        this.sseReconnecting = false;
      } else if (this.hasConnectedOnce) {
        this.sseReconnecting = true;
      }
    });

    this.eventSub = this.eventBus.events$.subscribe((event: BusEvent) => {
      const d = event.data as Record<string, unknown>;
      if (d && typeof d === 'object' && 'stage' in d && 'dispatch_id' in d) {
        this.handleLifecycleEvent(d);
      } else if (
        event.type === 'dispatch.running' ||
        event.type === 'dispatch.completed' ||
        event.type === 'dispatch.failed'
      ) {
        this.mergeLegacyDispatch(event.data as ApiDispatch);
      }
    });

    await Promise.all([
      this.loadHealth(),
      this.loadRecentTasks(),
      this.loadBriefs(),
      this.loadDispatches(),
    ]);
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
    this.sseConnSub?.unsubscribe();
    this.eventBus.disconnect();
  }

  private handleLifecycleEvent(d: Record<string, unknown>): void {
    const dispatch_id = d['dispatch_id'] as string;
    const agent = (d['agent'] as string) ?? 'Unknown';
    const slug = (d['slug'] as string) ?? 'unknown';
    const rawStage = d['stage'] as string;
    const rawStatus = d['status'] as string;
    const detail = d['detail'] as string | undefined;
    const ts = d['ts'] as string | undefined;

    const stage = (DISPATCH_STAGES as readonly string[]).includes(rawStage)
      ? (rawStage as DispatchStage)
      : 'dispatched';

    const status: DispatchSession['status'] =
      rawStatus === 'completed' || rawStatus === 'complete'
        ? 'complete'
        : rawStatus === 'failed'
          ? 'failed'
          : rawStatus === 'running' || rawStatus === 'claimed'
            ? 'running'
            : 'pending';

    const idx = this.sessions.findIndex(s => s.dispatch_id === dispatch_id);
    const existing = idx >= 0 ? this.sessions[idx] : undefined;

    const updated: DispatchSession = {
      dispatch_id,
      agent,
      slug,
      stage,
      status,
      detail,
      started_at: existing?.started_at ?? ts,
    };

    if (idx >= 0) {
      this.sessions = [
        ...this.sessions.slice(0, idx),
        { ...existing, ...updated },
        ...this.sessions.slice(idx + 1),
      ];
    } else {
      this.sessions = [updated, ...this.sessions].slice(0, 20);
    }
  }

  private mergeLegacyDispatch(d: ApiDispatch): void {
    const session = this.mapApiDispatch(d);
    const idx = this.sessions.findIndex(s => s.dispatch_id === session.dispatch_id);
    if (idx >= 0) {
      this.sessions = [
        ...this.sessions.slice(0, idx),
        { ...this.sessions[idx], ...session },
        ...this.sessions.slice(idx + 1),
      ];
    } else {
      this.sessions = [session, ...this.sessions].slice(0, 20);
    }
  }

  private mapApiDispatch(d: ApiDispatch): DispatchSession {
    const slug = d.slug ?? this.extractSlug(d.brief_path);

    let stage: DispatchStage = 'dispatched';
    let status: DispatchSession['status'] = 'pending';

    if (d.status === 'completed' || d.status === 'complete') {
      stage = 'complete';
      status = 'complete';
    } else if (d.status === 'failed') {
      stage = 'executing';
      status = 'failed';
    } else if (d.status === 'running' || d.status === 'claimed') {
      stage = 'executing';
      status = 'running';
    }

    return {
      dispatch_id: d.dispatch_id,
      agent: d.agent ?? 'Unknown',
      slug,
      stage,
      status,
      started_at: d.claimed_at ?? d.created_at,
    };
  }

  private extractSlug(briefPath: string | undefined): string {
    if (!briefPath) return '—';
    const name = briefPath.split('/').pop() ?? briefPath;
    return name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-[^-]+-/, '');
  }

  private async loadHealth(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/health`, { credentials: 'include' });
      if (res.status === 401) {
        this.healthError = 'Session expired — please reload';
      } else if (res.status === 503) {
        this.healthError = 'GTD token not configured';
      } else {
        const body = await res.json() as { reachable?: boolean };
        this.healthOnline = body.reachable === true;
      }
    } catch {
      this.healthError = 'Gateway unreachable';
    } finally {
      this.healthLoading = false;
    }
  }

  private async loadRecentTasks(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/tasks/recent`, { credentials: 'include' });
      if (!res.ok) {
        this.tasksError =
          res.status === 401
            ? 'Session expired — please reload'
            : res.status === 503
              ? 'GTD token not configured'
              : 'Failed to load tasks';
      } else {
        const body = await res.json() as { tasks?: GtdTask[] };
        this.hotProjects = this.deriveHotProjects(body.tasks ?? []);
      }
    } catch {
      this.tasksError = 'Could not reach gateway';
    } finally {
      this.tasksLoading = false;
    }
  }

  private async loadDispatches(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/dispatches`, { credentials: 'include' });
      if (!res.ok) {
        this.dispatchesError =
          res.status === 401 ? 'Not authenticated' : 'Failed to load dispatches';
      } else {
        const raw = (await res.json()) as ApiDispatch[];
        this.sessions = raw.map(d => this.mapApiDispatch(d));
      }
    } catch {
      this.dispatchesError = 'Could not reach gateway';
    } finally {
      this.dispatchesLoading = false;
    }
  }

  private async loadBriefs(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/briefs`, { credentials: 'include' });
      if (!res.ok) {
        this.briefsError =
          res.status === 401 ? 'Session expired — please reload' : 'Failed to load briefs';
      } else {
        const body = await res.json() as { briefs?: Brief[] };
        this.briefs = body.briefs ?? [];
      }
    } catch {
      this.briefsError = 'Could not reach gateway';
    } finally {
      this.briefsLoading = false;
    }
  }

  // ─── Template helpers ───────────────────────────────────────────────────────

  protected agentGlyph(agent: string): string {
    return AGENT_GLYPHS[agent.toLowerCase()] ?? '○';
  }

  protected statusLabel(status: DispatchSession['status']): string {
    switch (status) {
      case 'running': return 'running';
      case 'complete': return 'done';
      case 'failed': return 'failed';
      case 'pending': return 'pending';
    }
  }

  protected stageLabel(stage: DispatchStage): string {
    return STAGE_LABELS[stage] ?? stage;
  }

  private stageIndex(stage: DispatchStage): number {
    return DISPATCH_STAGES.indexOf(stage);
  }

  protected isCompleted(session: DispatchSession, stage: DispatchStage): boolean {
    if (session.status === 'complete') return true;
    return this.stageIndex(stage) < this.stageIndex(session.stage);
  }

  protected isCurrent(session: DispatchSession, stage: DispatchStage): boolean {
    if (session.status === 'complete' || session.status === 'failed') return false;
    return stage === session.stage;
  }

  protected isFailedAt(session: DispatchSession, stage: DispatchStage): boolean {
    return session.status === 'failed' && stage === session.stage;
  }

  protected isFuture(session: DispatchSession, stage: DispatchStage): boolean {
    return (
      !this.isCompleted(session, stage) &&
      !this.isCurrent(session, stage) &&
      !this.isFailedAt(session, stage)
    );
  }

  protected tasksJson(tasks: BriefTask[]): string {
    return JSON.stringify(tasks);
  }

  private deriveHotProjects(tasks: GtdTask[]): ProjectGroup[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const groups = new Map<string, GtdTask[]>();
    for (const task of tasks) {
      if (!task.updated_at) continue;
      if (new Date(task.updated_at) < cutoff) continue;
      const key = task.project ?? 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    return Array.from(groups.entries())
      .map(([name, projectTasks]) => ({
        name,
        tasks: projectTasks,
        latestUpdate: projectTasks
          .map(t => t.updated_at ?? '')
          .sort()
          .slice(-1)[0] ?? '',
      }))
      .sort((a, b) => b.latestUpdate.localeCompare(a.latestUpdate));
  }

  protected formatRelative(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  protected toTitleCase(s: string): string {
    return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
