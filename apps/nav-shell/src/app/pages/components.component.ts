import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EnvironmentService } from '../services/environment.service';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 
      Sandbox attributes: allow-scripts + allow-same-origin
      Browser warning about "escaping sandboxing" is expected and acceptable here.
      Both shell and showcase are controlled microfrontends in the same monorepo.
      This combination is required for the showcase to load its own resources and run Web Components.
      Security note: Only use this combination with trusted, controlled content.
    -->
    <iframe
      class="showcase-frame"
      [src]="showcaseUrlSafe"
      title="Component Showcase"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .showcase-frame {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }
    `,
  ],
})
export class ComponentsComponent {
  private readonly envService = inject(EnvironmentService);
  private readonly sanitizer = inject(DomSanitizer);
  protected showcaseUrlSafe: SafeResourceUrl;

  constructor() {
    // Get showcase URL from environment service
    const showcaseUrl = this.envService.getShowcaseUrl();
    // Sanitize iframe src to satisfy Angular's security context
    this.showcaseUrlSafe =
      this.sanitizer.bypassSecurityTrustResourceUrl(showcaseUrl);
  }
}
