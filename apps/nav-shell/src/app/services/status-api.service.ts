import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { OidcAuthService } from './oidc-auth.service';

export interface StatusEvent {
  id: string;
  user_id: string;
  color: string;
  note: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  user_name: string;
  acknowledged_by_name?: string;
}

export interface AppUser {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class StatusApiService {
  private env = inject(EnvironmentService);
  private oidc = inject(OidcAuthService);

  private get headers(): Record<string, string> {
    const token = this.oidc.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private get base(): string {
    return `${this.env.getApiGatewayUrl()}/api/status`;
  }

  async postStatus(color: string, note?: string): Promise<StatusEvent> {
    const resp = await fetch(`${this.base}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ color, note: note ?? null }),
    });
    if (!resp.ok) throw new Error(`POST /status failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent };
    return data.event;
  }

  async getCurrentStatus(userId: string): Promise<StatusEvent | null> {
    const resp = await fetch(`${this.base}/current/${userId}`, {
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`GET /status/current failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent | null };
    return data.event;
  }

  async acknowledge(eventId: string): Promise<StatusEvent> {
    const resp = await fetch(`${this.base}/${eventId}/acknowledge`, {
      method: 'POST',
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`POST /acknowledge failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent };
    return data.event;
  }

  async getHistory(limit = 50, offset = 0): Promise<{ events: StatusEvent[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const resp = await fetch(`${this.base}/history?${params}`, {
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`GET /history failed: ${resp.status}`);
    return resp.json() as Promise<{ events: StatusEvent[]; total: number }>;
  }

  async getMe(): Promise<AppUser> {
    const resp = await fetch(`${this.base}/me`, {
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`GET /me failed: ${resp.status}`);
    const data = await resp.json() as { user: AppUser };
    return data.user;
  }

  async getUsers(): Promise<AppUser[]> {
    const resp = await fetch(`${this.base}/users`, {
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`GET /users failed: ${resp.status}`);
    const data = await resp.json() as { users: AppUser[] };
    return data.users;
  }
}
