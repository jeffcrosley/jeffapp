import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { EnvironmentService } from '../services/environment.service';

interface GtdTask {
  id: string;
  title: string;
  project?: string;
  status?: string;
  updated_at?: string;
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

      <!-- In-Flight Tasks -->
      <div class="dashboard-section">
        <h3>In-Flight Tasks</h3>
        @if (tasksLoading) {
          <p class="muted">Loading tasks…</p>
        }
        @if (!tasksLoading && tasksError) {
          <p class="muted error">{{ tasksError }}</p>
        }
        @if (!tasksLoading && !tasksError && inFlightTasks.length === 0) {
          <p class="muted">No in-progress tasks.</p>
        }
        @if (!tasksLoading && !tasksError && inFlightTasks.length > 0) {
          <div class="task-list">
            @for (task of inFlightTasks; track task.id) {
              <div class="task-card">
                <span class="task-title">{{ task.title }}</span>
                @if (task.project) {
                  <span class="task-project">{{ task.project }}</span>
                }
              </div>
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
        @if (!tasksLoading && hotProjects.length === 0) {
          <p class="muted">No recently active projects.</p>
        }
        @if (!tasksLoading && hotProjects.length > 0) {
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
          border-bottom: 2px solid #ecf0f1;

          h2 {
            font-size: 2.5rem;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 700;
          }

          .subtitle {
            font-size: 1.1rem;
            color: #7f8c8d;
            margin: 0;
          }
        }

        .dashboard-section {
          margin-bottom: 48px;

          h3 {
            font-size: 1.5rem;
            color: #2c3e50;
            margin-bottom: 20px;
            font-weight: 600;

            .section-hint {
              font-size: 0.9rem;
              color: #95a5a6;
              font-weight: 400;
            }
          }

          .muted {
            color: #95a5a6;
            font-size: 0.95rem;

            &.error {
              color: #e74c3c;
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
                background: #2ecc71;
                box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
              }

              &.offline {
                background: #e74c3c;
              }

              &.loading {
                background: #f39c12;
                animation: pulse 1.2s ease-in-out infinite;
              }
            }

            .status-label {
              font-size: 1rem;
              color: #2c3e50;
              font-weight: 500;
            }

            .status-detail {
              font-size: 0.9rem;
              color: #95a5a6;
            }
          }

          .task-list {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .task-card {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px 18px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 3px solid #3498db;
              gap: 12px;

              .task-title {
                font-size: 0.95rem;
                color: #2c3e50;
                font-weight: 500;
                flex: 1;
              }

              .task-project {
                font-size: 0.85rem;
                color: #3498db;
                font-weight: 500;
                white-space: nowrap;
              }
            }
          }

          .project-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;

            .project-card {
              padding: 18px 20px;
              background: #f8f9fa;
              border-radius: 10px;
              border-top: 3px solid #3498db;
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
                  color: #2c3e50;
                  font-weight: 600;
                }

                .project-count {
                  font-size: 0.8rem;
                  color: #7f8c8d;
                  font-weight: 500;
                }
              }

              .project-updated {
                font-size: 0.8rem;
                color: #95a5a6;
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
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private env = inject(EnvironmentService);

  protected healthLoading = true;
  protected healthError = '';
  protected healthOnline = false;

  protected tasksLoading = true;
  protected tasksError = '';
  protected inFlightTasks: GtdTask[] = [];
  protected hotProjects: ProjectGroup[] = [];

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadHealth(), this.loadTasks()]);
  }

  private async loadHealth(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/health`);
      if (res.status === 503) {
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

  private async loadTasks(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/tasks?status=in-progress`);
      if (!res.ok) {
        this.tasksError = res.status === 503 ? 'GTD token not configured' : 'Failed to load tasks';
      } else {
        const body = await res.json() as { tasks?: GtdTask[] };
        this.inFlightTasks = body.tasks ?? [];
        this.hotProjects = this.deriveHotProjects(this.inFlightTasks);
      }
    } catch {
      this.tasksError = 'Could not reach gateway';
    } finally {
      this.tasksLoading = false;
    }
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
