/**
 * Native Web Component WipCard
 * Displays a work-in-progress brief with its agent and task list.
 * Uses CSS custom properties so it respects the host document's theme.
 */

interface WipTask {
  id: string;
  title: string;
  project?: string;
}

class WipCard extends HTMLElement {
  static get observedAttributes() {
    return ['slug', 'agent', 'tasks'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  private toTitleCase(s: string): string {
    return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private parseTasks(): WipTask[] {
    const raw = this.getAttribute('tasks');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as WipTask[];
    } catch {
      return [];
    }
  }

  private render() {
    const slug = this.getAttribute('slug') ?? '';
    const agent = this.getAttribute('agent') ?? '';
    const tasks = this.parseTasks();

    if (!this.shadowRoot) return;

    const taskItems = tasks.length === 0
      ? `<p class="muted">Brief in queue — no tasks claimed yet</p>`
      : tasks.map(t => `
          <div class="task-card">
            <span class="task-title">${t.title}</span>
            ${t.project ? `<span class="task-project">${t.project}</span>` : ''}
          </div>
        `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .brief-card {
          padding: 18px 20px;
          background: var(--color-bg-secondary, #f1f5f9);
          border-radius: 10px;
          border-left: 4px solid var(--color-amethyst-600, #7c3aed);
        }
        .brief-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }
        .brief-title {
          font-size: 1rem;
          color: var(--color-text-primary, #0f172a);
          font-weight: 600;
        }
        .agent-badge {
          font-size: 0.8rem;
          color: var(--color-amethyst-600, #7c3aed);
          font-weight: 500;
          background: var(--color-wip-accent-bg, rgba(124, 58, 237, 0.1));
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .task-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--color-bg-elevated, #ffffff);
          border-radius: 8px;
          border-left: 3px solid var(--color-primary, #0066cc);
          gap: 12px;
        }
        .task-title {
          font-size: 0.95rem;
          color: var(--color-text-primary, #0f172a);
          font-weight: 500;
          flex: 1;
        }
        .task-project {
          font-size: 0.85rem;
          color: var(--color-primary, #0066cc);
          font-weight: 500;
          white-space: nowrap;
        }
        .muted {
          font-size: 0.95rem;
          color: var(--color-text-muted, #64748b);
          margin: 0;
        }
      </style>
      <div class="brief-card">
        <div class="brief-header">
          <span class="brief-title">${this.toTitleCase(slug)}</span>
          <span class="agent-badge">${this.toTitleCase(agent)}</span>
        </div>
        <div class="task-list">
          ${taskItems}
        </div>
      </div>
    `;
  }
}

customElements.define('wip-card', WipCard);

export { WipCard };
