import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface BusEvent {
  type: string;
  timestamp: string;
  channel?: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class EventBusService implements OnDestroy {
  private env = inject(EnvironmentService);
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly events$ = new Subject<BusEvent>();
  readonly connected$ = new BehaviorSubject<boolean>(false);

  connect(): void {
    if (this.es) return;
    const base = this.env.getApiGatewayUrl();
    this.es = new EventSource(`${base}/events`, { withCredentials: true });

    this.es.onopen = () => {
      this.connected$.next(true);
    };

    this.es.onmessage = (e) => {
      try {
        const wrapper = JSON.parse(e.data) as { channel: string; payload: string };
        const event = JSON.parse(wrapper.payload) as BusEvent;
        this.events$.next({ ...event, channel: wrapper.channel });
      } catch { /* intentional: non-fatal JSON parse error */ }
    };

    this.es.onerror = () => {
      this.connected$.next(false);
      this.es?.close();
      this.es = null;
      this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.es?.close();
    this.es = null;
    this.connected$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
