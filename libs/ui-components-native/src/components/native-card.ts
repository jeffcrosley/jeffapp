/**
 * Native Web Component Card - No framework dependencies
 * Demonstrates fundamental Web Components API knowledge
 */
class NativeCard extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description'];
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

  private render() {
    const title = this.getAttribute('title') || 'Card Title';
    const description = this.getAttribute('description') || 'Card description';

    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .card-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }
        .card-description {
          font-size: 1rem;
          color: #7f8c8d;
          margin: 0;
        }
        ::slotted(*) {
          margin-top: 1rem;
        }
      </style>
      <div class="card">
        <h3 class="card-title">${title}</h3>
        <p class="card-description">${description}</p>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('native-card', NativeCard);

export { NativeCard };
