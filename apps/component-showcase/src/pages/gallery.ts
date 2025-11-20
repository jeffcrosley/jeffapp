/**
 * Component Gallery Page
 * Demonstrates Stencil and Native Web Components from @jeffapp libraries
 */

import '@jeffapp/ui-components';
import '@jeffapp/ui-components-native';

export function renderGallery(container: HTMLElement): void {
  container.innerHTML = `
    <div class="gallery-container">
      <header class="gallery-header">
        <h1>JeffApp Component Library</h1>
        <p class="subtitle">Framework-agnostic Web Components showcasing cross-platform compatibility</p>
      </header>

      <section class="component-section">
        <h2>Stencil Components</h2>
        <p class="section-description">
          Production-grade Web Components built with Stencil for optimal performance and developer experience.
        </p>
        
        <div class="component-demo">
          <h3>Button Component</h3>
          <div class="demo-area">
            <app-button label="Primary Button" variant="primary"></app-button>
            <app-button label="Secondary Button" variant="secondary"></app-button>
            <app-button label="Disabled Button" variant="primary" disabled></app-button>
          </div>
          <details class="code-example">
            <summary>View Code</summary>
            <pre><code>&lt;app-button label="Primary Button" variant="primary"&gt;&lt;/app-button&gt;
&lt;app-button label="Secondary Button" variant="secondary"&gt;&lt;/app-button&gt;
&lt;app-button label="Disabled Button" variant="primary" disabled&gt;&lt;/app-button&gt;</code></pre>
          </details>
        </div>
      </section>

      <section class="component-section">
        <h2>Native Web Components</h2>
        <p class="section-description">
          Vanilla JavaScript Web Components demonstrating fundamental browser APIs without framework dependencies.
        </p>
        
        <div class="component-demo">
          <h3>Card Component</h3>
          <div class="demo-area cards">
            <native-card title="Feature One" description="Built with pure Web Components API">
              <p>This card uses Shadow DOM and custom elements.</p>
            </native-card>
            <native-card title="Feature Two" description="No framework required">
              <p>Zero dependencies, maximum portability.</p>
            </native-card>
            <native-card title="Feature Three" description="Works everywhere">
              <p>Compatible with Angular, React, Vue, Svelte, and vanilla JS.</p>
            </native-card>
          </div>
          <details class="code-example">
            <summary>View Code</summary>
            <pre><code>&lt;native-card title="Feature One" description="Built with pure Web Components API"&gt;
  &lt;p&gt;This card uses Shadow DOM and custom elements.&lt;/p&gt;
&lt;/native-card&gt;</code></pre>
          </details>
        </div>

        <div class="component-demo">
          <h3>Badge Component</h3>
          <div class="demo-area">
            <native-badge label="New" variant="primary"></native-badge>
            <native-badge label="Beta" variant="secondary"></native-badge>
            <native-badge label="Deprecated" variant="warning"></native-badge>
          </div>
          <details class="code-example">
            <summary>View Code</summary>
            <pre><code>&lt;native-badge label="New" variant="primary"&gt;&lt;/native-badge&gt;
&lt;native-badge label="Beta" variant="secondary"&gt;&lt;/native-badge&gt;
&lt;native-badge label="Deprecated" variant="warning"&gt;&lt;/native-badge&gt;</code></pre>
          </details>
        </div>
      </section>

      <section class="component-section integration-notes">
        <h2>Framework Integration</h2>
        <div class="integration-grid">
          <div class="integration-card">
            <h3>Angular</h3>
            <p>Use <code>CUSTOM_ELEMENTS_SCHEMA</code> and import components directly.</p>
            <code class="inline-code">@jeffapp/ui-angular</code>
          </div>
          <div class="integration-card">
            <h3>React</h3>
            <p>Use type-safe wrappers with React event handlers.</p>
            <code class="inline-code">@jeffapp/ui-react</code>
          </div>
          <div class="integration-card">
            <h3>Vanilla / Other</h3>
            <p>Import and use directly - no configuration needed.</p>
            <code class="inline-code">Universal compatibility</code>
          </div>
        </div>
      </section>

      <footer class="gallery-footer">
        <p>Built with <strong>Nx</strong>, <strong>Stencil</strong>, and <strong>Web Components</strong></p>
        <p class="tech-stack">TypeScript • Shadow DOM • Custom Elements • ES Modules</p>
      </footer>
    </div>
  `;

  // Add event listeners for interactive demos
  setupInteractivity(container);
}

function setupInteractivity(container: HTMLElement): void {
  // Listen for button clicks from Stencil components
  const buttons = container.querySelectorAll('app-button');
  buttons.forEach((button) => {
    button.addEventListener('buttonClick', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Button clicked:', customEvent.detail);

      // Visual feedback
      const feedback = document.createElement('div');
      feedback.className = 'click-feedback';
      feedback.textContent = `✓ ${customEvent.detail.label} clicked`;
      container.querySelector('.gallery-header')?.appendChild(feedback);

      setTimeout(() => feedback.remove(), 2000);
    });
  });
}
