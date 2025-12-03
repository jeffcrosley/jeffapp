import { Injectable } from '@angular/core';
import { DEFAULT_DEV_CONFIG, NavShellConfig } from '../types/config';

/**
 * Environment configuration service
 * Provides runtime URLs for showcase and API gateway based on environment.
 *
 * @see .github/adr/001-runtime-configuration.md
 */
@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private config: NavShellConfig | null = null;

  /**
   * Load runtime configuration from config.json
   * Called during app initialization via APP_INITIALIZER
   */
  async loadConfig(): Promise<void> {
    try {
      const response = await fetch('/config.json');
      const data = (await response.json()) as NavShellConfig;
      this.config = data;

      // Optionally cache on window for debugging
      if (typeof window !== 'undefined') {
        window.__navShellConfig = data;
      }
    } catch (error) {
      console.warn('Could not load config.json, using defaults:', error);
      this.config = DEFAULT_DEV_CONFIG;
    }
  }

  /**
   * Get the component showcase URL
   * In dev, uses localhost; in production, uses config.json value
   */
  getShowcaseUrl(): string {
    if (this.isLocalDevelopment()) {
      return DEFAULT_DEV_CONFIG.showcaseUrl;
    }
    return this.config?.showcaseUrl ?? DEFAULT_DEV_CONFIG.showcaseUrl;
  }

  /**
   * Get the API gateway URL
   * In dev, uses localhost; in production, uses config.json value
   */
  getApiGatewayUrl(): string {
    if (this.isLocalDevelopment()) {
      return DEFAULT_DEV_CONFIG.apiGatewayUrl;
    }
    return this.config?.apiGatewayUrl ?? DEFAULT_DEV_CONFIG.apiGatewayUrl;
  }

  /**
   * Check if running in local development mode
   * Detects localhost, 127.0.0.1, or .local domains
   */
  isLocalDevelopment(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local')
    );
  }

  /**
   * Check if running in production mode (inverse of dev detection)
   */
  isProduction(): boolean {
    return !this.isLocalDevelopment();
  }
}
