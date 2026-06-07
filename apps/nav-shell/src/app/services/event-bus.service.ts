import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface BusEvent {
  type: string;
  timestamp: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class EventBusService implements OnDestroy {
  private env = inject(EnvironmentService);
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly events$ = new Subject<BusEvent>();

  connect(): void {
    if (this.es) return;
    const base = this.env.getApiGatewayUrl();
    this.es = new EventSource(`${base}/events`, { withCredentials: true });

    this.es.onmessage = (e) => {
      try {
        const wrapper = JSON.parse(e.data) as { channel: string; payload: string };
        const event = JSON.parse(wrapper.payload) as BusEvent;
        this.events$.next(event);
      } catch {}
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.es?.close();
    this.es = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
