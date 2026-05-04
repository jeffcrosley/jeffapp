import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { EnvironmentService } from '../services/environment.service';

const mockEnvService = {
  getApiGatewayUrl: () => 'http://localhost:3333',
  isLocalDevelopment: () => true,
  isProduction: () => false,
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    global.fetch = jest.fn();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: EnvironmentService, useValue: mockEnvService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ reachable: true, upstream: { status: 'ok' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ briefs: [] }),
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render the dashboard header', () => {
      const el: HTMLElement = fixture.nativeElement;
      const h2 = el.querySelector('h2');
      expect(h2?.textContent?.trim()).toBe('Dashboard');
    });

    it('should render three section headings', () => {
      const el: HTMLElement = fixture.nativeElement;
      const headings = Array.from(el.querySelectorAll('h3')).map(h => h.textContent?.trim());
      expect(headings.some(h => h?.includes('System Health'))).toBe(true);
      expect(headings.some(h => h?.includes('Work In Progress'))).toBe(true);
      expect(headings.some(h => h?.includes('Hot Projects'))).toBe(true);
    });

    it('should show online indicator when health check succeeds', () => {
      const el: HTMLElement = fixture.nativeElement;
      const indicator = el.querySelector('.indicator.online');
      expect(indicator).toBeTruthy();
    });

    it('should show empty state for briefs when none returned', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No active work');
    });
  });

  describe('health check failure', () => {
    it('should show offline indicator when health returns 503', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: 'GTD_AGENT_TOKEN not configured' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: 'GTD_AGENT_TOKEN not configured' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ briefs: [] }),
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const offline = el.querySelector('.indicator.offline');
      expect(offline).toBeTruthy();
    });
  });

  describe('tasks rendering', () => {
    it('should render brief cards with nested tasks', async () => {
      const briefs = [
        {
          slug: 'aia-e2e-day1',
          filename: '2026-05-04-saturn-aia-e2e-day1.md',
          agent: 'saturn',
          tasks: [
            { id: 't1', title: 'Write tests', project: 'jeffapp' },
            { id: 't2', title: 'Deploy gateway', project: 'jeffapp' },
          ],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ reachable: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ briefs }),
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const wipCards = el.querySelectorAll('wip-card');
      expect(wipCards.length).toBe(1);
      expect(wipCards[0].getAttribute('slug')).toBe('aia-e2e-day1');
      expect(wipCards[0].getAttribute('agent')).toBe('saturn');
      const tasks = JSON.parse(wipCards[0].getAttribute('tasks') ?? '[]');
      expect(tasks.length).toBe(2);
      expect(tasks[0].title).toBe('Write tests');
      expect(tasks[1].title).toBe('Deploy gateway');
    });

    it('should derive hot projects from recent tasks', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      const tasks = [
        { id: '1', title: 'Task A', project: 'alpha', status: 'in-progress', updated_at: recentDate.toISOString() },
        { id: '2', title: 'Task B', project: 'alpha', status: 'in-progress', updated_at: recentDate.toISOString() },
        { id: '3', title: 'Task C', project: 'beta', status: 'in-progress', updated_at: recentDate.toISOString() },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ reachable: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ briefs: [] }),
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const projectCards = el.querySelectorAll('.project-card');
      expect(projectCards.length).toBe(2);
      expect(el.textContent).toContain('alpha');
      expect(el.textContent).toContain('beta');
    });

    it('should exclude tasks older than 3 days from hot projects', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);

      const tasks = [
        { id: '1', title: 'Old task', project: 'stale-project', status: 'in-progress', updated_at: oldDate.toISOString() },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ reachable: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ briefs: [] }),
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const projectCards = el.querySelectorAll('.project-card');
      expect(projectCards.length).toBe(0);
    });
  });

  describe('Work In Progress section', () => {
    it('renders brief cards when briefs data is present', async () => {
      const briefs = [
        {
          slug: 'dashboard-brief-view',
          filename: '2026-05-04-mercury-dashboard-brief-view.md',
          agent: 'mercury',
          tasks: [{ id: 't1', title: 'Add briefs endpoint', project: 'jeffapp' }],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reachable: true }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ tasks: [] }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ briefs }) });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const wipCard = el.querySelector('wip-card');
      expect(wipCard).toBeTruthy();
      expect(wipCard?.getAttribute('slug')).toBe('dashboard-brief-view');
      expect(wipCard?.getAttribute('agent')).toBe('mercury');
      const tasks = JSON.parse(wipCard?.getAttribute('tasks') ?? '[]');
      expect(tasks[0].title).toBe('Add briefs endpoint');
    });

    it('renders empty state when briefs array is empty', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reachable: true }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ tasks: [] }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ briefs: [] }) });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('wip-card')).toBeNull();
      expect(el.textContent).toContain('No active work');
    });

    it('shows queue message when brief has no tasks claimed', async () => {
      const briefs = [
        {
          slug: 'empty-brief',
          filename: '2026-05-04-saturn-empty-brief.md',
          agent: 'saturn',
          tasks: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reachable: true }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ tasks: [] }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ briefs }) });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const wipCard = el.querySelector('wip-card');
      expect(wipCard).toBeTruthy();
      expect(wipCard?.getAttribute('slug')).toBe('empty-brief');
      const tasks = JSON.parse(wipCard?.getAttribute('tasks') ?? '[]');
      expect(tasks.length).toBe(0);
    });
  });
});
