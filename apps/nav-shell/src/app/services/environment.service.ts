import { Injectable } from '@angular/core';

/**
 * Environment configuration service
 * Provides runtime URLs for showcase and API gateway based on environment
 */
@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private config: any = null;

  /**
   * Load runtime configuration from config.json
   * Call this during app initialization
   */
  async loadConfig(): Promise<void> {
    try {
      const response = await fetch('/config.json');
      this.config = await response.json();
    } catch (error) {
      console.warn('Could not load config.json, using defaults:', error);
    }
  }

  /**
   * Get the component showcase URL
   * In dev, uses direct URL to localhost:4300
   * In production, loads from config.json
   */
  getShowcaseUrl(): string {
    // Dev: if running on localhost, always use local showcase
    if (this.isLocalDevelopment()) {
      return 'http://localhost:4300';
    }

    // Production: use config.json
    if (this.config?.showcaseUrl) {
      return this.config.showcaseUrl;
    }

    // Check for build-time injected value (legacy support)
    if (typeof (globalThis as any).SHOWCASE_URL === 'string') {
      return (globalThis as any).SHOWCASE_URL;
    }

    // Fallback
    return 'http://localhost:4300';
  }

  /**
   * Get the API gateway URL
   */
  getApiGatewayUrl(): string {
    // Dev: if running on localhost, always use local gateway
    if (this.isLocalDevelopment()) {
      return 'http://localhost:3333';
    }

    // Production: use config.json
    if (this.config?.apiGatewayUrl) {
      return this.config.apiGatewayUrl;
    }

    // Check for build-time injected value (legacy support)
    if (typeof (globalThis as any).API_GATEWAY_URL === 'string') {
      return (globalThis as any).API_GATEWAY_URL;
    }

    return 'http://localhost:3333';
  }

  /**
   * Check if running in local development mode
   */
  private isLocalDevelopment(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    );
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return typeof (globalThis as any).PRODUCTION !== 'undefined'
      ? (globalThis as any).PRODUCTION === true
      : false;
  }
}
