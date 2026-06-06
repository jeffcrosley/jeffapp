import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from './environment.service';

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

  private get base(): string {
    return `${this.env.getApiGatewayUrl()}/api/status`;
  }

  async postStatus(color: string, note?: string): Promise<StatusEvent> {
    const resp = await fetch(`${this.base}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color, note: note ?? null }),
    });
    if (!resp.ok) throw new Error(`POST /status failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent };
    return data.event;
  }

  async getCurrentStatus(userId: string): Promise<StatusEvent | null> {
    const resp = await fetch(`${this.base}/current/${userId}`, {
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(`GET /status/current failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent | null };
    return data.event;
  }

  async acknowledge(eventId: string): Promise<StatusEvent> {
    const resp = await fetch(`${this.base}/${eventId}/acknowledge`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!resp.ok) throw new Error(`POST /acknowledge failed: ${resp.status}`);
    const data = await resp.json() as { event: StatusEvent };
    return data.event;
  }

  async getHistory(limit = 50, offset = 0): Promise<{ events: StatusEvent[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const resp = await fetch(`${this.base}/history?${params}`, {
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(`GET /history failed: ${resp.status}`);
    return resp.json() as Promise<{ events: StatusEvent[]; total: number }>;
  }

  async getMe(): Promise<AppUser> {
    const resp = await fetch(`${this.base}/me`, {
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(`GET /me failed: ${resp.status}`);
    const data = await resp.json() as { user: AppUser };
    return data.user;
  }

  async getUsers(): Promise<AppUser[]> {
    const resp = await fetch(`${this.base}/users`, {
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(`GET /users failed: ${resp.status}`);
    const data = await resp.json() as { users: AppUser[] };
    return data.users;
  }
}
