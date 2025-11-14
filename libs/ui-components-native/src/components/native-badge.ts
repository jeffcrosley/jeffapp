/**
 * Native Web Component Badge
 * Simple status indicator component
 */
class NativeBadge extends HTMLElement {
  static get observedAttributes() {
    return ['status', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db',
    };
    return colors[status] || colors.info;
  }

  private render() {
    const status = this.getAttribute('status') || 'info';
    const label = this.getAttribute('label') || 'Badge';
    const color = this.getStatusColor(status);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          background: ${color};
          color: white;
        }
      </style>
      <span class="badge">${label}</span>
    `;
  }
}

customElements.define('native-badge', NativeBadge);

export { NativeBadge };
