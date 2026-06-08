import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnvironmentService } from '../../services/environment.service';

interface Session {
  dispatch_id: string;
  agent?: string;
  model?: string;
  account?: string;
  status?: string;
  session_name?: string;
  created_at?: string;
  completed_at?: string;
  brief_path?: string;
  brief_name?: string;
  return_doc_path?: string;
  duration_seconds?: number | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  cost_usd?: number | null;
  cost_estimated?: boolean;
  signal_sent?: boolean;
}

interface SessionSummary {
  total_sessions: number;
  by_status: Record<string, number>;
  by_agent: Record<string, number>;
  by_model: Record<string, number>;
  by_account: Record<string, number>;
  total_cost_usd: number;
  total_tokens_in: number;
  total_tokens_out: number;
  cost_is_estimated: boolean;
}

@Component({
  selector: 'app-ai-workshop-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="workshop-container">
      <div class="workshop-header">
        <h2>AI Workshop</h2>
        <p class="subtitle">Session tracking and cost dashboard</p>
      </div>

      <!-- Summary Cards -->
      <div class="summary-section">
        @if (summaryLoading) {
          <p class="muted">Loading summary…</p>
        }
        @if (!summaryLoading && summaryError) {
          <p class="muted error">{{ summaryError }}</p>
        }
        @if (!summaryLoading && !summaryError && summary) {
          <div class="summary-grid">
            <div class="summary-card">
              <span class="card-label">Sessions Today</span>
              <span class="card-value">{{ countSince(sessions, todayIso()) }}</span>
              <span class="card-sub">{{ countSince(sessions, weekIso()) }} this week · {{ summary.total_sessions }} all time</span>
            </div>
            <div class="summary-card">
              <span class="card-label">Cost Today</span>
              <span class="card-value">{{ formatCost(costSince(sessions, todayIso())) }}</span>
              <span class="card-sub">{{ formatCost(costSince(sessions, weekIso())) }} this week · {{ formatCost(summary.total_cost_usd) }} all time{{ summary.cost_is_estimated ? ' (est.)' : '' }}</span>
            </div>
            <div class="summary-card">
              <span class="card-label">By Account</span>
              @for (entry of accountEntries(); track entry[0]) {
                <div class="card-row">
                  <span class="account-label">{{ entry[0] }}</span>
                  <span class="account-count">{{ entry[1] }}</span>
                </div>
              }
            </div>
            <div class="summary-card">
              <span class="card-label">Avg Duration</span>
              <span class="card-value">{{ formatDuration(avgDuration()) }}</span>
              <span class="card-sub">Most expensive: {{ topModel() }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <select class="filter-select" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterAgent" (ngModelChange)="applyFilters()">
          <option value="">All agents</option>
          @for (agent of uniqueAgents(); track agent) {
            <option [value]="agent">{{ agent }}</option>
          }
        </select>
        <select class="filter-select" [(ngModel)]="filterAccount" (ngModelChange)="applyFilters()">
          <option value="">All accounts</option>
          @for (account of uniqueAccounts(); track account) {
            <option [value]="account">{{ account }}</option>
          }
        </select>
        <select class="filter-select" [(ngModel)]="filterModel" (ngModelChange)="applyFilters()">
          <option value="">All models</option>
          @for (model of uniqueModels(); track model) {
            <option [value]="model">{{ model }}</option>
          }
        </select>
        <input
          type="date"
          class="filter-input"
          [(ngModel)]="filterDateFrom"
          (ngModelChange)="applyFilters()"
          placeholder="From"
        />
        <input
          type="date"
          class="filter-input"
          [(ngModel)]="filterDateTo"
          (ngModelChange)="applyFilters()"
          placeholder="To"
        />
        @if (hasActiveFilters()) {
          <button class="filter-clear" (click)="clearFilters()">Clear</button>
        }
      </div>

      <!-- Sessions Table -->
      <div class="table-section">
        @if (sessionsLoading) {
          <p class="muted">Loading sessions…</p>
        }
        @if (!sessionsLoading && sessionsError) {
          <p class="muted error">{{ sessionsError }}</p>
        }
        @if (!sessionsLoading && !sessionsError && filteredSessions.length === 0) {
          <p class="muted">No sessions found.</p>
        }
        @if (!sessionsLoading && !sessionsError && filteredSessions.length > 0) {
          <div class="table-wrapper">
            <table class="sessions-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Brief</th>
                  <th>Account</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th class="num-col">Tokens In</th>
                  <th class="num-col">Tokens Out</th>
                  <th class="num-col">Cost</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filteredSessions; track s.dispatch_id) {
                  <tr class="session-row" (click)="openDetail(s)">
                    <td class="agent-cell">{{ s.agent ?? '—' }}</td>
                    <td class="brief-cell" [title]="s.brief_path ?? ''">{{ s.brief_name ?? briefSlug(s.brief_path) }}</td>
                    <td>{{ s.account ?? '—' }}</td>
                    <td class="model-cell">{{ shortModel(s.model) }}</td>
                    <td>
                      <span class="status-badge" [class]="'badge-' + (s.status ?? 'unknown')">
                        {{ s.status ?? 'unknown' }}
                      </span>
                    </td>
                    <td class="time-cell">{{ formatRelative(s.created_at ?? '') }}</td>
                    <td class="time-cell">{{ formatDuration(s.duration_seconds ?? null) }}</td>
                    <td class="num-col">{{ formatTokens(s.tokens_in) }}</td>
                    <td class="num-col">{{ formatTokens(s.tokens_out) }}</td>
                    <td class="num-col cost-cell" [class.estimated]="s.cost_estimated">{{ formatCostCell(s) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Session Detail Drawer -->
      @if (selectedSession) {
        <div class="drawer-backdrop" (click)="closeDetail()"></div>
        <aside class="detail-drawer" role="dialog" aria-label="Session detail">
          <header class="drawer-header">
            <h3>Session Detail</h3>
            <button class="drawer-close" (click)="closeDetail()" aria-label="Close">✕</button>
          </header>
          <div class="drawer-body">
            <div class="detail-row">
              <span class="detail-label">Dispatch ID</span>
              <span class="detail-value mono copyable" (click)="copy(selectedSession.dispatch_id)" title="Click to copy">{{ selectedSession.dispatch_id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Brief</span>
              <span class="detail-value mono">{{ selectedSession.brief_path ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Brief name</span>
              <span class="detail-value">{{ selectedSession.brief_name ?? '—' }}</span>
            </div>
            @if (selectedSession.return_doc_path) {
              <div class="detail-row">
                <span class="detail-label">Return doc</span>
                <span class="detail-value mono">{{ selectedSession.return_doc_path }}</span>
              </div>
            }
            <div class="detail-row">
              <span class="detail-label">Agent</span>
              <span class="detail-value">{{ selectedSession.agent ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Model</span>
              <span class="detail-value">{{ selectedSession.model ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account</span>
              <span class="detail-value">{{ selectedSession.account ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="status-badge" [class]="'badge-' + (selectedSession.status ?? 'unknown')">{{ selectedSession.status ?? 'unknown' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Started</span>
              <span class="detail-value">{{ selectedSession.created_at ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Completed</span>
              <span class="detail-value">{{ selectedSession.completed_at ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">{{ formatDuration(selectedSession.duration_seconds ?? null) }}</span>
            </div>
            <div class="detail-section-heading">Cost breakdown</div>
            <div class="detail-row">
              <span class="detail-label">Tokens in</span>
              <span class="detail-value">{{ formatTokens(selectedSession.tokens_in) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tokens out</span>
              <span class="detail-value">{{ formatTokens(selectedSession.tokens_out) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cost</span>
              <span class="detail-value">{{ formatCostCell(selectedSession) }}</span>
            </div>
            @if (selectedSession.signal_sent !== undefined) {
              <div class="detail-row">
                <span class="detail-label">Signal sent</span>
                <span class="detail-value">{{ selectedSession.signal_sent ? 'Yes' : 'No' }}</span>
              </div>
            }
          </div>
        </aside>
      }
    </section>
  `,
  styles: [`
    .workshop-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 0;

      .workshop-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 24px;
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

      .muted {
        color: var(--color-text-muted);
        font-size: 0.95rem;
        &.error { color: var(--color-ruby-600); }
      }
    }

    // Summary cards
    .summary-section {
      margin-bottom: 32px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .summary-card {
      padding: 18px 20px;
      background: var(--color-bg-secondary);
      border-radius: 10px;
      border-top: 3px solid var(--color-primary);
      display: flex;
      flex-direction: column;
      gap: 4px;

      .card-label {
        font-size: 0.8rem;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .card-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .card-sub {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }

      .card-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--color-text-secondary);
      }

      .account-label { font-weight: 500; }
      .account-count { color: var(--color-text-muted); }
    }

    // Filter bar
    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-select, .filter-input {
      padding: 6px 10px;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-primary);
      border-radius: 6px;
      color: var(--color-text-primary);
      font-size: 0.85rem;

      &:focus {
        outline: none;
        border-color: var(--color-primary);
      }
    }

    .filter-clear {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid var(--color-text-muted);
      border-radius: 6px;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      cursor: pointer;

      &:hover { border-color: var(--color-text-primary); color: var(--color-text-primary); }
    }

    // Table
    .table-section {
      margin-bottom: 40px;
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--color-border-primary);
    }

    .sessions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        padding: 10px 14px;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-muted);
        background: var(--color-bg-secondary);
        border-bottom: 1px solid var(--color-border-primary);
      }

      .num-col { text-align: right; }

      .session-row {
        cursor: pointer;
        transition: background 0.15s;

        &:hover { background: var(--color-bg-secondary); }
        &:not(:last-child) td { border-bottom: 1px solid var(--color-border-primary); }
      }

      td {
        padding: 10px 14px;
        color: var(--color-text-primary);
        vertical-align: middle;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .agent-cell { font-weight: 600; }
      .brief-cell { color: var(--color-text-secondary); font-size: 0.8rem; }
      .model-cell { color: var(--color-text-muted); font-size: 0.8rem; }
      .time-cell { color: var(--color-text-muted); font-size: 0.8rem; }
      .cost-cell { font-weight: 500; &.estimated { color: var(--color-text-muted); font-style: italic; } }
    }

    // Status badges
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;

      &.badge-completed { background: rgba(46, 204, 113, 0.15); color: var(--color-status-online); }
      &.badge-running, &.badge-claimed { background: rgba(52, 152, 219, 0.15); color: var(--color-primary); }
      &.badge-failed { background: rgba(231, 76, 60, 0.15); color: var(--color-ruby-600); }
      &.badge-partial { background: rgba(230, 126, 34, 0.15); color: #e67e22; }
      &.badge-pending, &.badge-unknown { background: rgba(149, 165, 166, 0.15); color: var(--color-text-muted); }
    }

    // Detail drawer
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 100;
    }

    .detail-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(480px, 95vw);
      background: var(--color-bg-primary);
      border-left: 1px solid var(--color-border-primary);
      z-index: 101;
      overflow-y: auto;
      display: flex;
      flex-direction: column;

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--color-border-primary);

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .drawer-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;

          &:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); }
        }
      }

      .drawer-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .detail-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        color: var(--color-text-muted);
      }

      .detail-value {
        font-size: 0.875rem;
        color: var(--color-text-primary);
        word-break: break-all;

        &.mono { font-family: monospace; font-size: 0.8rem; }

        &.copyable {
          cursor: pointer;
          color: var(--color-primary);
          &:hover { text-decoration: underline; }
        }
      }
    }

    .detail-section-heading {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--color-text-muted);
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border-primary);
    }

    @media (max-width: 768px) {
      .workshop-container .workshop-header h2 { font-size: 2rem; }
      .summary-grid { grid-template-columns: 1fr 1fr; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .filter-select, .filter-input { width: 100%; }
    }

    @media (max-width: 600px) {
      .workshop-container { padding: 20px 16px; }
      .summary-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AiWorkshopSessionsComponent implements OnInit {
  private env = inject(EnvironmentService);

  protected summaryLoading = true;
  protected summaryError = '';
  protected summary: SessionSummary | null = null;

  protected sessionsLoading = true;
  protected sessionsError = '';
  protected sessions: Session[] = [];
  protected filteredSessions: Session[] = [];

  protected selectedSession: Session | null = null;

  protected filterStatus = '';
  protected filterAgent = '';
  protected filterAccount = '';
  protected filterModel = '';
  protected filterDateFrom = '';
  protected filterDateTo = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadSummary(), this.loadSessions()]);
  }

  private async loadSummary(): Promise<void> {
    try {
      const res = await fetch(`${this.env.getApiGatewayUrl()}/api/sessions/summary`, { credentials: 'include' });
      if (!res.ok) {
        this.summaryError = res.status === 401 ? 'Not authenticated' : 'Failed to load summary';
      } else {
        this.summary = await res.json() as SessionSummary;
      }
    } catch {
      this.summaryError = 'Could not reach gateway';
    } finally {
      this.summaryLoading = false;
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      const res = await fetch(`${this.env.getApiGatewayUrl()}/api/sessions?limit=200`, { credentials: 'include' });
      if (!res.ok) {
        this.sessionsError = res.status === 401 ? 'Not authenticated' : 'Failed to load sessions';
      } else {
        const body = await res.json() as { sessions?: Session[] };
        this.sessions = body.sessions ?? [];
        this.filteredSessions = this.sessions;
      }
    } catch {
      this.sessionsError = 'Could not reach gateway';
    } finally {
      this.sessionsLoading = false;
    }
  }

  protected applyFilters(): void {
    this.filteredSessions = this.sessions.filter((s) => {
      if (this.filterStatus && s.status !== this.filterStatus) return false;
      if (this.filterAgent && s.agent !== this.filterAgent) return false;
      if (this.filterAccount && s.account !== this.filterAccount) return false;
      if (this.filterModel && s.model !== this.filterModel) return false;
      if (this.filterDateFrom && (s.created_at ?? '') < this.filterDateFrom) return false;
      if (this.filterDateTo && (s.created_at ?? '') > this.filterDateTo + 'T23:59:59') return false;
      return true;
    });
  }

  protected clearFilters(): void {
    this.filterStatus = '';
    this.filterAgent = '';
    this.filterAccount = '';
    this.filterModel = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filteredSessions = this.sessions;
  }

  protected hasActiveFilters(): boolean {
    return !!(this.filterStatus || this.filterAgent || this.filterAccount || this.filterModel || this.filterDateFrom || this.filterDateTo);
  }

  protected openDetail(s: Session): void {
    this.selectedSession = s;
  }

  protected closeDetail(): void {
    this.selectedSession = null;
  }

  protected copy(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  protected uniqueAgents(): string[] {
    return [...new Set(this.sessions.map((s) => s.agent).filter((a): a is string => !!a))];
  }

  protected uniqueAccounts(): string[] {
    return [...new Set(this.sessions.map((s) => s.account).filter((a): a is string => !!a))];
  }

  protected uniqueModels(): string[] {
    return [...new Set(this.sessions.map((s) => s.model).filter((m): m is string => !!m))];
  }

  protected accountEntries(): [string, number][] {
    return Object.entries(this.summary?.by_account ?? {});
  }

  protected todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  protected weekIso(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }

  protected countSince(sessions: Session[], since: string): number {
    return sessions.filter((s) => (s.created_at ?? '') >= since).length;
  }

  protected costSince(sessions: Session[], since: string): number {
    return sessions
      .filter((s) => (s.created_at ?? '') >= since)
      .reduce((sum, s) => sum + (typeof s.cost_usd === 'number' ? s.cost_usd : 0), 0);
  }

  protected avgDuration(): number | null {
    const withDuration = this.sessions.filter((s) => typeof s.duration_seconds === 'number');
    if (!withDuration.length) return null;
    const total = withDuration.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    return Math.round(total / withDuration.length);
  }

  protected topModel(): string {
    if (!this.summary) return '—';
    const rates: Record<string, number> = {
      'claude-opus-4-6': 75,
      'claude-sonnet-4-6': 15,
      'claude-haiku-4-5': 4,
    };
    const models = Object.keys(this.summary.by_model);
    return models.sort((a, b) => (rates[b] ?? 0) - (rates[a] ?? 0))[0] ?? '—';
  }

  protected briefSlug(path?: string): string {
    if (!path) return '—';
    return (path.split('/').pop() ?? '').replace(/-brief\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  }

  protected shortModel(model?: string): string {
    if (!model) return '—';
    return model.replace('claude-', '').replace(/-\d+$/, '');
  }

  protected formatRelative(iso: string): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  protected formatDuration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }

  protected formatTokens(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString();
  }

  protected formatCost(n: number): string {
    return `$${n.toFixed(2)}`;
  }

  protected formatCostCell(s: Session): string {
    if (s.cost_usd === null || s.cost_usd === undefined) return '—';
    const base = `$${s.cost_usd.toFixed(2)}`;
    return s.cost_estimated ? `~${base}` : base;
  }
}
