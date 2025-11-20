import { Injectable } from '@angular/core';

/**
 * Environment configuration service
 * Provides runtime URLs for showcase and API gateway based on environment
 */
@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  /**
   * Get the component showcase URL
   * In dev, uses direct URL to localhost:4300
   * In production, this should be set via build-time replacement or runtime config
   */
  getShowcaseUrl(): string {
    // Check for build-time injected value first (via fileReplacements or define)
    if (typeof (globalThis as any).SHOWCASE_URL === 'string') {
      return (globalThis as any).SHOWCASE_URL;
    }

    // Dev: direct URL to showcase dev server
    return 'http://localhost:4300';
  }

  /**
   * Get the API gateway URL
   */
  getApiGatewayUrl(): string {
    if (typeof (globalThis as any).API_GATEWAY_URL === 'string') {
      return (globalThis as any).API_GATEWAY_URL;
    }

    return 'http://localhost:3333';
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
