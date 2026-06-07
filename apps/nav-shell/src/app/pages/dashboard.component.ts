import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import '@jeffapp/ui-components-native';
import { EnvironmentService } from '../services/environment.service';
import { EventBusService, BusEvent } from '../services/event-bus.service';

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

interface Dispatch {
  dispatch_id: string;
  agent?: string;
  brief_path?: string;
  status?: string;
  created_at?: string;
  claimed_at?: string;
  completed_at?: string;
  session_name?: string;
  error?: string;
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
        <h3>Dispatch Status <span class="section-hint">(recent 20)</span></h3>
        @if (dispatchesLoading) {
          <p class="muted">Loading dispatches…</p>
        }
        @if (!dispatchesLoading && dispatchesError) {
          <p class="muted error">{{ dispatchesError }}</p>
        }
        @if (!dispatchesLoading && !dispatchesError && dispatches.length === 0) {
          <p class="muted">No dispatches found.</p>
        }
        @if (!dispatchesLoading && !dispatchesError && dispatches.length > 0) {
          <div class="dispatch-list">
            @for (d of dispatches; track d.dispatch_id) {
              <div class="dispatch-row">
                <span class="dispatch-badge" [class]="'badge-' + (d.status ?? 'unknown')">
                  {{ d.status ?? 'unknown' }}
                </span>
                <span class="dispatch-agent">{{ d.agent ?? '—' }}</span>
                <span class="dispatch-brief">{{ briefSlug(d.brief_path) }}</span>
                <span class="dispatch-time">{{ formatRelative(d.created_at ?? '') }}</span>
                @if (d.session_name) {
                  <span class="dispatch-session muted">{{ d.session_name }}</span>
                }
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

          .dispatch-list {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .dispatch-row {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 14px;
              background: var(--color-bg-secondary);
              border-radius: 8px;
              font-size: 0.9rem;
              flex-wrap: wrap;

              .dispatch-badge {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                flex-shrink: 0;

                &.badge-running, &.badge-claimed {
                  background: rgba(52, 152, 219, 0.15);
                  color: var(--color-primary);
                }
                &.badge-completed {
                  background: rgba(46, 204, 113, 0.15);
                  color: var(--color-status-online);
                }
                &.badge-failed {
                  background: rgba(231, 76, 60, 0.15);
                  color: var(--color-ruby-600);
                }
                &.badge-pending, &.badge-unknown {
                  background: rgba(149, 165, 166, 0.15);
                  color: var(--color-text-muted);
                }
              }

              .dispatch-agent {
                font-weight: 600;
                color: var(--color-text-primary);
                min-width: 60px;
              }

              .dispatch-brief {
                color: var(--color-text-secondary);
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .dispatch-time {
                color: var(--color-text-muted);
                font-size: 0.8rem;
                flex-shrink: 0;
              }

              .dispatch-session {
                font-size: 0.75rem;
                font-family: monospace;
              }
            }
          }

          .brief-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

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
  protected dispatches: Dispatch[] = [];

  async ngOnInit(): Promise<void> {
    if (!this.env.getApiGatewayUrl()) {
      await this.env.loadConfig();
    }
    this.eventBus.connect();
    this.eventSub = this.eventBus.events$.subscribe((event: BusEvent) => {
      if (event.type === 'dispatch.running' || event.type === 'dispatch.completed' || event.type === 'dispatch.failed') {
        this.mergeDispatch(event.data as Dispatch);
      }
    });
    await Promise.all([this.loadHealth(), this.loadRecentTasks(), this.loadBriefs(), this.loadDispatches()]);
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
    this.eventBus.disconnect();
  }

  private mergeDispatch(updated: Dispatch): void {
    const idx = this.dispatches.findIndex(d => d.dispatch_id === updated.dispatch_id);
    if (idx >= 0) {
      this.dispatches = [
        ...this.dispatches.slice(0, idx),
        { ...this.dispatches[idx], ...updated },
        ...this.dispatches.slice(idx + 1),
      ];
    } else {
      this.dispatches = [updated, ...this.dispatches].slice(0, 20);
    }
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
        this.tasksError = res.status === 401 ? 'Session expired — please reload' : res.status === 503 ? 'GTD token not configured' : 'Failed to load tasks';
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
        this.dispatchesError = res.status === 401 ? 'Not authenticated' : 'Failed to load dispatches';
      } else {
        this.dispatches = (await res.json()) as Dispatch[];
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
        this.briefsError = res.status === 401 ? 'Session expired — please reload' : 'Failed to load briefs';
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

  protected toTitleCase(s: string): string {
    return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  protected tasksJson(tasks: BriefTask[]): string {
    return JSON.stringify(tasks);
  }

  protected briefSlug(briefPath: string | undefined): string {
    if (!briefPath) return '—';
    const name = briefPath.split('/').pop() ?? briefPath;
    return name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-[^-]+-/, '');
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
    if (!iso) return 'unknown';
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
