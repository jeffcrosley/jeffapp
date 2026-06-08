import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
  created_at?: string;
  completed_at?: string;
  detail?: string;
  error?: string;
  session_name?: string;
  model?: string;
  account?: string;
  return_doc?: string;
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
  model?: string;
  account?: string;
  return_doc?: string;
}

// ─── GTD work types ───────────────────────────────────────────────────────────

interface GtdTask {
  id: string;
  title: string;
  claimed: boolean;
  context?: string;
  priority?: string;
}

interface GtdProject {
  name: string;
  tasks: GtdTask[];
}

interface GtdWorkResponse {
  projects: GtdProject[];
  ungrouped: GtdTask[];
}

type StageFilter = 'all' | 'running' | 'done' | 'failed';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="dashboard-container">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <p class="subtitle">In-progress dispatches</p>
      </div>

      <!-- ── Work In Progress ────────────────────────────────────────────── -->
      <div class="dashboard-section">
        <div class="section-title-row">
          <h3>Work In Progress <span class="section-hint">(recent 20)</span></h3>
          @if (sseReconnecting) {
            <div class="reconnecting-badge">
              <span class="reconnecting-dot"></span>
              reconnecting…
            </div>
          }
        </div>

        <!-- Stage filter -->
        <div class="filter-bar">
          @for (f of FILTERS; track f.key) {
            <button
              class="filter-btn"
              [class.active]="activeFilter === f.key"
              (click)="setFilter(f.key)"
            >{{ f.label }}</button>
          }
        </div>

        @if (dispatchesLoading) {
          <p class="muted">Loading dispatches…</p>
        }
        @if (!dispatchesLoading && dispatchesError) {
          <p class="muted error">{{ dispatchesError }}</p>
        }
        @if (!dispatchesLoading && !dispatchesError && filteredSessions.length === 0) {
          <p class="muted">No dispatches found.</p>
        }
        @if (!dispatchesLoading && !dispatchesError && filteredSessions.length > 0) {
          <div class="dispatch-session-list">
            @for (session of filteredSessions; track session.dispatch_id) {
              <div
                class="dispatch-session-card"
                [class]="'card-' + session.status"
                [class.card-stale]="isStale(session)"
                (click)="openModal(session)"
                role="button"
                tabindex="0"
                (keydown.enter)="openModal(session)"
                (keydown.space)="openModal(session)"
              >
                <div class="session-header">
                  <span class="agent-glyph" [title]="session.agent">{{ agentGlyph(session.agent) }}</span>
                  <span class="session-agent">{{ session.agent }}</span>
                  <span class="session-slug">{{ session.slug }}</span>
                  <span class="session-badge" [class]="'badge-' + session.status">
                    {{ statusLabel(session.status) }}
                  </span>
                  <span class="session-elapsed muted">{{ formatRelative(session.started_at ?? '') }}</span>
                  @if (isStale(session)) {
                    <span class="stale-badge">⚠ stale?</span>
                  }
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

      <!-- ── Available Work ──────────────────────────────────────────────── -->
      <div class="dashboard-section">
        <h3>Available Work</h3>

        @if (workLoading) {
          <p class="muted">Loading tasks…</p>
        }
        @if (!workLoading && workError) {
          <p class="muted error">{{ workError }}</p>
        }
        @if (!workLoading && !workError) {
          <!-- Projects -->
          @for (project of workProjects; track project.name) {
            <div class="work-project">
              <button
                class="project-header"
                (click)="toggleProject(project.name)"
                [attr.aria-expanded]="!isProjectCollapsed(project.name)"
              >
                <span class="project-chevron">{{ isProjectCollapsed(project.name) ? '▶' : '▼' }}</span>
                <span class="project-name">{{ project.name }}</span>
                <span class="project-count">{{ project.tasks.length }}</span>
              </button>
              @if (!isProjectCollapsed(project.name)) {
                <ul class="task-list">
                  @for (task of project.tasks; track task.id) {
                    <li class="task-item">
                      @if (task.claimed) {
                        <span class="wip-dot" title="In progress"></span>
                      }
                      <span class="task-title">{{ task.title }}</span>
                      @if (task.context) {
                        <span class="context-tag">{{ task.context }}</span>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          }

          <!-- Ungrouped -->
          @if (workUngrouped.length > 0) {
            <div class="work-project">
              <button
                class="project-header"
                (click)="toggleProject('__ungrouped__')"
                [attr.aria-expanded]="!isProjectCollapsed('__ungrouped__')"
              >
                <span class="project-chevron">{{ isProjectCollapsed('__ungrouped__') ? '▶' : '▼' }}</span>
                <span class="project-name">Ungrouped</span>
                <span class="project-count">{{ workUngrouped.length }}</span>
              </button>
              @if (!isProjectCollapsed('__ungrouped__')) {
                <ul class="task-list">
                  @for (task of workUngrouped; track task.id) {
                    <li class="task-item">
                      @if (task.claimed) {
                        <span class="wip-dot" title="In progress"></span>
                      }
                      <span class="task-title">{{ task.title }}</span>
                      @if (task.context) {
                        <span class="context-tag">{{ task.context }}</span>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          }

          @if (workProjects.length === 0 && workUngrouped.length === 0) {
            <p class="muted">No open tasks.</p>
          }
        }
      </div>

      <!-- ── Inbox ───────────────────────────────────────────────────────── -->
      <div class="dashboard-section">
        <h3>Inbox <span class="section-hint">({{ inboxItems.length }})</span></h3>

        @if (inboxLoading) {
          <p class="muted">Loading inbox…</p>
        }
        @if (!inboxLoading && inboxError) {
          <p class="muted error">{{ inboxError }}</p>
        }
        @if (!inboxLoading) {
          @if (inboxItems.length > 0) {
            <ul class="inbox-list">
              @for (item of inboxItems; track $index) {
                <li class="inbox-item">{{ item }}</li>
              }
            </ul>
          } @else if (!inboxError) {
            <p class="muted">Inbox is empty.</p>
          }

          <div class="inbox-compose">
            <textarea
              #inboxTextarea
              class="inbox-textarea"
              [value]="inboxInput"
              (input)="onInboxInput($event)"
              (keydown)="onInboxKeydown($event)"
              placeholder="Add to inbox… (Enter to submit, Shift+Enter for new line)"
              rows="1"
            ></textarea>
            <button
              class="inbox-submit-btn"
              (click)="submitInbox()"
              [disabled]="inboxSubmitting || !inboxInput.trim()"
            >{{ inboxSubmitting ? '…' : 'Add' }}</button>
          </div>
        }
      </div>
    </section>

    <!-- ── Dispatch detail modal ──────────────────────────────────────────── -->
    @if (selectedSession) {
      <div class="modal-overlay" role="dialog" aria-modal="true" (click)="closeModal()" (keydown.escape)="closeModal()">
        <div class="modal-content" tabindex="-1" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeModal()" aria-label="Close">&times;</button>

          <div class="modal-slug">{{ selectedSession.slug }}</div>

          <div class="modal-meta-row">
            <span class="modal-agent-glyph">{{ agentGlyph(selectedSession.agent) }}</span>
            <span class="modal-agent-name">{{ selectedSession.agent }}</span>
            @if (selectedSession.model) {
              <span class="modal-meta-pill">{{ selectedSession.model }}</span>
            }
            @if (selectedSession.account) {
              <span class="modal-meta-pill">{{ selectedSession.account }}</span>
            }
            <span class="session-badge" [class]="'badge-' + selectedSession.status">
              {{ statusLabel(selectedSession.status) }}
            </span>
          </div>

          <div class="modal-info-grid">
            @if (selectedSession.created_at) {
              <div class="modal-info-row">
                <span class="modal-info-label">Dispatched</span>
                <span class="modal-info-value">
                  {{ formatRelative(selectedSession.created_at) }}
                  <span class="modal-info-abs">({{ formatAbsolute(selectedSession.created_at) }})</span>
                </span>
              </div>
            }
            <div class="modal-info-row">
              <span class="modal-info-label">Duration</span>
              <span class="modal-info-value">{{ formatModalDuration(selectedSession) }}</span>
            </div>
            @if (selectedSession.session_name) {
              <div class="modal-info-row">
                <span class="modal-info-label">Session</span>
                <span class="modal-info-value">{{ selectedSession.session_name }}</span>
              </div>
            }
            @if (selectedSession.return_doc) {
              <div class="modal-info-row">
                <span class="modal-info-label">Return doc</span>
                <span class="modal-info-value modal-return-doc">{{ selectedSession.return_doc }}</span>
              </div>
            }
          </div>

          <!-- Stages -->
          <div class="modal-stages">
            @for (stage of STAGES; track stage) {
              <div class="modal-stage-row">
                <div class="modal-stage-dot"
                     [class.completed]="isCompleted(selectedSession, stage)"
                     [class.current]="isCurrent(selectedSession, stage)"
                     [class.failed-at]="isFailedAt(selectedSession, stage)">
                  @if (isFailedAt(selectedSession, stage)) {
                    <span class="fail-x">✕</span>
                  } @else if (isCompleted(selectedSession, stage)) {
                    <span class="check">✓</span>
                  }
                </div>
                <span class="modal-stage-label" [class.dim]="isFuture(selectedSession, stage)">
                  {{ stageLabel(stage) }}
                </span>
              </div>
            }
          </div>

          @if (selectedSession.error) {
            <div class="modal-error-callout">
              <strong>Error:</strong> {{ selectedSession.error }}
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 24px 0;

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

          // ─── Stage filter bar ──────────────────────────────────────────

          .filter-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          }

          .filter-btn {
            padding: 4px 14px;
            border-radius: 16px;
            border: 1px solid var(--color-border-primary);
            background: transparent;
            color: var(--color-text-secondary);
            font-size: 0.82rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border-color 0.15s;

            &:hover {
              background: var(--color-bg-secondary);
              color: var(--color-text-primary);
            }

            &.active {
              background: var(--color-primary, #0066cc);
              color: #fff;
              border-color: var(--color-primary, #0066cc);
            }
          }

          // ─── Dispatch session list ─────────────────────────────────────

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
            transition: border-color 0.2s, box-shadow 0.2s;
            cursor: pointer;

            &:hover {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }

            &:focus-visible {
              outline: 2px solid var(--color-primary, #0066cc);
              outline-offset: 2px;
            }

            &.card-running {
              border-left-color: var(--color-sapphire-600);
            }

            &.card-complete {
              border-left-color: var(--color-emerald-600);
            }

            &.card-failed {
              border-left-color: var(--color-ruby-600);
            }

            &.card-stale {
              border-left-color: var(--color-text-muted);
              opacity: 0.72;
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

              .stale-badge {
                font-size: 0.68rem;
                color: var(--color-text-muted);
                padding: 1px 6px;
                border: 1px solid var(--color-border-primary);
                border-radius: 4px;
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

          // ─── Available Work ────────────────────────────────────────────

          .work-project {
            margin-bottom: 12px;
            background: var(--color-bg-secondary);
            border-radius: 8px;
            overflow: hidden;
          }

          .project-header {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 12px 16px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--color-text-primary);
            text-align: left;
            transition: background 0.15s;

            &:hover {
              background: rgba(0, 0, 0, 0.03);
            }

            .project-chevron {
              font-size: 0.65rem;
              color: var(--color-text-muted);
              width: 12px;
              flex-shrink: 0;
            }

            .project-name {
              flex: 1;
            }

            .project-count {
              font-size: 0.75rem;
              font-weight: 500;
              color: var(--color-text-muted);
              background: var(--color-border-primary);
              padding: 1px 8px;
              border-radius: 10px;
            }
          }

          .task-list {
            list-style: none;
            margin: 0;
            padding: 0 0 8px 0;
          }

          .task-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 16px 7px 38px;
            font-size: 0.87rem;
            color: var(--color-text-secondary);

            &:hover {
              background: rgba(0, 0, 0, 0.02);
            }

            .task-title {
              flex: 1;
            }

            .wip-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: var(--color-sapphire-600);
              flex-shrink: 0;
              animation: pulse 1.4s ease-in-out infinite;
            }

            .context-tag {
              font-size: 0.72rem;
              padding: 1px 7px;
              border-radius: 10px;
              background: rgba(100, 116, 139, 0.12);
              color: var(--color-text-muted);
              flex-shrink: 0;
            }
          }

          // ─── Inbox ─────────────────────────────────────────────────────

          .inbox-list {
            list-style: none;
            margin: 0 0 16px 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .inbox-item {
            padding: 8px 14px;
            background: var(--color-bg-secondary);
            border-radius: 6px;
            font-size: 0.88rem;
            color: var(--color-text-secondary);
            border-left: 2px solid var(--color-border-primary);
          }

          .inbox-compose {
            display: flex;
            gap: 8px;
            align-items: flex-start;
            margin-top: 4px;
          }

          .inbox-textarea {
            flex: 1;
            padding: 9px 12px;
            border: 1px solid var(--color-border-primary);
            border-radius: 6px;
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            font-size: 0.88rem;
            font-family: inherit;
            resize: none;
            overflow: hidden;
            line-height: 1.5;
            min-height: 38px;
            transition: border-color 0.15s;

            &::placeholder {
              color: var(--color-text-muted);
            }

            &:focus {
              outline: none;
              border-color: var(--color-primary, #0066cc);
            }
          }

          .inbox-submit-btn {
            padding: 9px 16px;
            background: var(--color-primary, #0066cc);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: opacity 0.15s;
            min-height: 38px;

            &:hover:not(:disabled) {
              opacity: 0.85;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
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
        }

        @media (max-width: 600px) {
          padding: 16px;
        }
      }

      // ── Modal ──────────────────────────────────────────────────────────────

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeIn 0.15s ease;
      }

      .modal-content {
        position: relative;
        background: var(--color-bg-primary, #fff);
        border-radius: 10px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 28px 28px 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.15s ease;
      }

      .modal-close {
        position: absolute;
        top: 14px;
        right: 16px;
        background: transparent;
        border: none;
        font-size: 1.4rem;
        color: var(--color-text-muted);
        cursor: pointer;
        line-height: 1;
        padding: 4px 8px;
        border-radius: 4px;

        &:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-secondary);
        }
      }

      .modal-slug {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 12px;
        padding-right: 32px;
        word-break: break-all;
      }

      .modal-meta-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 20px;

        .modal-agent-glyph {
          font-size: 1.2rem;
          opacity: 0.85;
        }

        .modal-agent-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--color-text-primary);
        }

        .modal-meta-pill {
          font-size: 0.75rem;
          padding: 2px 9px;
          border-radius: 10px;
          background: var(--color-bg-secondary);
          color: var(--color-text-muted);
          border: 1px solid var(--color-border-primary);
        }

        .session-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;

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
      }

      .modal-info-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
        padding: 14px;
        background: var(--color-bg-secondary);
        border-radius: 8px;
      }

      .modal-info-row {
        display: flex;
        gap: 12px;
        font-size: 0.87rem;

        .modal-info-label {
          color: var(--color-text-muted);
          min-width: 80px;
          flex-shrink: 0;
        }

        .modal-info-value {
          color: var(--color-text-primary);
          word-break: break-all;
        }

        .modal-info-abs {
          color: var(--color-text-muted);
          font-size: 0.82rem;
          margin-left: 6px;
        }

        .modal-return-doc {
          font-family: monospace;
          font-size: 0.8rem;
        }
      }

      .modal-stages {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }

      .modal-stage-row {
        display: flex;
        align-items: center;
        gap: 12px;

        .modal-stage-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--color-border-primary);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s, border-color 0.2s;

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

          .fail-x, .check {
            font-size: 0.6rem;
            color: #fff;
            font-weight: 700;
          }
        }

        .modal-stage-label {
          font-size: 0.88rem;
          color: var(--color-text-primary);

          &.dim {
            color: var(--color-text-muted);
          }
        }
      }

      .modal-error-callout {
        background: rgba(220, 38, 38, 0.08);
        border: 1px solid var(--color-ruby-600);
        border-radius: 6px;
        padding: 12px 14px;
        font-size: 0.88rem;
        color: var(--color-ruby-600);
        word-break: break-all;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('inboxTextarea') inboxTextareaRef!: ElementRef<HTMLTextAreaElement>;

  private env = inject(EnvironmentService);
  private eventBus = inject(EventBusService);
  private eventSub: Subscription | null = null;
  private sseConnSub: Subscription | null = null;
  private hasConnectedOnce = false;

  protected readonly STAGES: readonly DispatchStage[] = DISPATCH_STAGES;
  protected readonly FILTERS: { key: StageFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'running', label: 'Running' },
    { key: 'done', label: 'Done' },
    { key: 'failed', label: 'Failed' },
  ];

  // WIP state
  protected dispatchesLoading = true;
  protected dispatchesError = '';
  protected sessions: DispatchSession[] = [];
  private sseCache = new Map<string, DispatchSession>();
  protected sseReconnecting = false;
  protected activeFilter: StageFilter =
    (localStorage.getItem('jeffapp.dashboardFilter') as StageFilter) ?? 'all';

  // Modal state
  protected selectedSession: DispatchSession | null = null;

  // Available Work state
  protected workLoading = true;
  protected workError = '';
  protected workProjects: GtdProject[] = [];
  protected workUngrouped: GtdTask[] = [];
  protected collapsedProjects: Record<string, boolean> = {};

  // Inbox state
  protected inboxLoading = true;
  protected inboxError = '';
  protected inboxItems: string[] = [];
  protected inboxInput = '';
  protected inboxSubmitting = false;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedSession) {
      this.selectedSession = null;
    }
  }

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
      if (typeof event.type === 'string' && event.type.startsWith('dispatch.')) {
        // stage lives on the outer event envelope (not inside event.data)
        const outer = event as unknown as Record<string, unknown>;
        const d = (event.data ?? {}) as Record<string, unknown>;
        const merged: Record<string, unknown> = {
          ...d,
          stage: outer['stage'] ?? d['stage'],
        };
        if (!merged['status']) {
          if (event.type === 'dispatch.completed' || event.type === 'dispatch.complete') {
            merged['status'] = 'complete';
          } else if (event.type === 'dispatch.failed') {
            merged['status'] = 'failed';
          } else if (event.type === 'dispatch.dispatched') {
            merged['status'] = 'pending';
          } else {
            merged['status'] = 'running';
          }
        }
        if (merged['dispatch_id']) {
          this.handleLifecycleEvent(merged);
        }
      }
    });

    await Promise.all([
      this.loadDispatches(),
      this.loadWork(),
      this.loadInbox(),
    ]);
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
    this.sseConnSub?.unsubscribe();
    this.eventBus.disconnect();
  }

  // ─── Stage filter ────────────────────────────────────────────────────────────

  protected isStale(session: DispatchSession): boolean {
    if (session.status !== 'running') return false;
    if (!session.created_at) return false;
    return Date.now() - new Date(session.created_at).getTime() > 120 * 60 * 1000;
  }

  protected get filteredSessions(): DispatchSession[] {
    switch (this.activeFilter) {
      case 'running': return this.sessions.filter(s => s.status === 'running');
      case 'done': return this.sessions.filter(s => s.status === 'complete');
      case 'failed': return this.sessions.filter(s => s.status === 'failed');
      default: return this.sessions;
    }
  }

  protected setFilter(f: StageFilter): void {
    this.activeFilter = f;
    localStorage.setItem('jeffapp.dashboardFilter', f);
  }

  // ─── Modal ───────────────────────────────────────────────────────────────────

  protected openModal(session: DispatchSession): void {
    this.selectedSession = session;
  }

  protected closeModal(): void {
    this.selectedSession = null;
  }

  // ─── Available Work ──────────────────────────────────────────────────────────

  private async loadWork(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/work`, { credentials: 'include' });
      if (!res.ok) {
        this.workError = res.status === 401 ? 'Not authenticated' : 'Failed to load tasks';
      } else {
        const data = (await res.json()) as GtdWorkResponse & { error?: string };
        if (data.error) {
          this.workError = 'Tasks unavailable — MCP session may have expired';
        } else {
          this.workProjects = data.projects ?? [];
          this.workUngrouped = data.ungrouped ?? [];
        }
      }
    } catch {
      this.workError = 'Could not reach gateway';
    } finally {
      this.workLoading = false;
    }
  }

  protected toggleProject(name: string): void {
    this.collapsedProjects = {
      ...this.collapsedProjects,
      [name]: !this.collapsedProjects[name],
    };
  }

  protected isProjectCollapsed(name: string): boolean {
    return !!this.collapsedProjects[name];
  }

  // ─── Inbox ───────────────────────────────────────────────────────────────────

  private async loadInbox(): Promise<void> {
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/inbox`, { credentials: 'include' });
      if (!res.ok) {
        this.inboxError = res.status === 401 ? 'Not authenticated' : 'Failed to load inbox';
      } else {
        const data = (await res.json()) as { items: string[]; error?: string };
        if (data.error) {
          this.inboxError = 'Inbox unavailable';
        } else {
          this.inboxItems = data.items ?? [];
        }
      }
    } catch {
      this.inboxError = 'Could not reach gateway';
    } finally {
      this.inboxLoading = false;
    }
  }

  protected onInboxInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.inboxInput = el.value;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  protected onInboxKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.submitInbox();
    }
  }

  protected async submitInbox(): Promise<void> {
    const text = this.inboxInput.trim();
    if (!text || this.inboxSubmitting) return;
    this.inboxSubmitting = true;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    try {
      const base = this.env.getApiGatewayUrl();
      const res = await fetch(`${base}/api/gtd/inbox`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        this.inboxItems = [...lines.reverse(), ...this.inboxItems];
        this.inboxInput = '';
        const ta = this.inboxTextareaRef?.nativeElement;
        if (ta) {
          ta.value = '';
          ta.style.height = 'auto';
        }
      }
    } catch {
      // fail visible on next load
    } finally {
      this.inboxSubmitting = false;
    }
  }

  // ─── Dispatch lifecycle ──────────────────────────────────────────────────────

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
      created_at: existing?.created_at ?? ts,
    };

    let sessionForCache: DispatchSession;
    if (idx >= 0) {
      sessionForCache = { ...existing!, ...updated };
      this.sessions = [
        ...this.sessions.slice(0, idx),
        sessionForCache,
        ...this.sessions.slice(idx + 1),
      ];
    } else {
      sessionForCache = updated;
      this.sessions = [updated, ...this.sessions].slice(0, 20);
    }
    this.sseCache.set(dispatch_id, sessionForCache);
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
      created_at: d.created_at,
      completed_at: d.completed_at,
      error: d.error,
      session_name: d.session_name,
      model: d.model,
      account: d.account,
      return_doc: d.return_doc,
    };
  }

  private extractSlug(briefPath: string | undefined): string {
    if (!briefPath) return '—';
    const name = briefPath.split('/').pop() ?? briefPath;
    return name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-[^-]+-/, '');
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
        const r2Sessions = raw.map(d => this.mapApiDispatch(d));
        // Merge SSE-observed states — SSE advances stage ahead of R2 writes
        const r2Ids = new Set(r2Sessions.map(s => s.dispatch_id));
        const merged = r2Sessions.map(s => {
          const cached = this.sseCache.get(s.dispatch_id);
          if (!cached) return s;
          const r2Idx = DISPATCH_STAGES.indexOf(s.stage);
          const sseIdx = DISPATCH_STAGES.indexOf(cached.stage);
          return sseIdx > r2Idx ? { ...s, stage: cached.stage, status: cached.status } : s;
        });
        for (const [id, cached] of this.sseCache) {
          if (!r2Ids.has(id)) merged.push(cached);
        }
        this.sessions = merged
          .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
          .slice(0, 20);
      }
    } catch {
      this.dispatchesError = 'Could not reach gateway';
    } finally {
      this.dispatchesLoading = false;
    }
  }

  // ─── Template helpers ────────────────────────────────────────────────────────

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

  protected formatRelative(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  protected formatAbsolute(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatModalDuration(session: DispatchSession): string {
    const start = session.created_at ? new Date(session.created_at).getTime() : null;
    if (!start) return '—';
    const end = session.completed_at ? new Date(session.completed_at).getTime() : Date.now();
    const diffMs = end - start;
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return session.status === 'running' ? `running for ${minutes}m` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    const dur = `${hours}h ${rem}m`;
    return session.status === 'running' ? `running for ${dur}` : dur;
  }
}
