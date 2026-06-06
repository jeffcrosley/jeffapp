import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusApiService, StatusEvent, AppUser } from '../../services/status-api.service';
import { AuthService } from '../../services/auth.service';

interface ColorOption {
  key: string;
  emoji: string;
  label: string;
  cssClass: string;
}

const COLORS: ColorOption[] = [
  { key: 'green', emoji: '\u{1F7E2}', label: 'Good', cssClass: 'btn-green' },
  { key: 'yellow', emoji: '\u{1F7E1}', label: 'Meh', cssClass: 'btn-yellow' },
  { key: 'red', emoji: '\u{1F534}', label: 'Rough', cssClass: 'btn-red' },
  { key: 'tap_out', emoji: '\u{1F6D1}', label: 'Tap Out', cssClass: 'btn-tapout' },
];

const COLOR_EMOJI: Record<string, string> = {
  green: '\u{1F7E2}',
  yellow: '\u{1F7E1}',
  red: '\u{1F534}',
  tap_out: '\u{1F6D1}',
};

@Component({
  selector: 'app-traffic-light',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './traffic-light.page.html',
  styleUrls: ['./traffic-light.page.scss'],
})
export class TrafficLightPage implements OnInit, OnDestroy {
  private api = inject(StatusApiService);
  private auth = inject(AuthService);

  colors = COLORS;
  sending = signal(false);
  myUser = signal<AppUser | null>(null);
  myStatus = signal<StatusEvent | null>(null);
  otherStatuses = signal<{ user: AppUser; event: StatusEvent | null }[]>([]);
  history = signal<StatusEvent[]>([]);
  error = signal('');
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.pollTimer = setInterval(() => this.loadData(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  async pressColor(color: string): Promise<void> {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    try {
      await this.api.postStatus(color);
      await this.loadData();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to send status');
    } finally {
      this.sending.set(false);
    }
  }

  async acknowledge(eventId: string): Promise<void> {
    this.error.set('');
    try {
      await this.api.acknowledge(eventId);
      await this.loadData();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to acknowledge');
    }
  }

  colorEmoji(color: string): string {
    return COLOR_EMOJI[color] ?? '';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  logout(): void {
    this.auth.logout();
  }

  private async loadData(): Promise<void> {
    try {
      const [me, usersResult, historyResult] = await Promise.all([
        this.api.getMe(),
        this.api.getUsers(),
        this.api.getHistory(20),
      ]);

      this.myUser.set(me);
      this.history.set(historyResult.events);

      const statusPromises = usersResult.map(async (user) => {
        const event = await this.api.getCurrentStatus(user.id);
        return { user, event };
      });
      const statuses = await Promise.all(statusPromises);

      const mine = statuses.find((s) => s.user.id === me.id);
      this.myStatus.set(mine?.event ?? null);
      this.otherStatuses.set(statuses.filter((s) => s.user.id !== me.id));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load data');
    }
  }
}
