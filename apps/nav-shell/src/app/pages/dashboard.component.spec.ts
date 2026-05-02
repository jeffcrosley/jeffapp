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
      expect(headings.some(h => h?.includes('In-Flight Tasks'))).toBe(true);
      expect(headings.some(h => h?.includes('Hot Projects'))).toBe(true);
    });

    it('should show online indicator when health check succeeds', () => {
      const el: HTMLElement = fixture.nativeElement;
      const indicator = el.querySelector('.indicator.online');
      expect(indicator).toBeTruthy();
    });

    it('should show empty state for tasks when none returned', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No in-progress tasks');
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
    it('should render in-flight task cards', async () => {
      const tasks = [
        { id: '1', title: 'Write tests', project: 'jeffapp', status: 'in-progress', updated_at: new Date().toISOString() },
        { id: '2', title: 'Deploy gateway', project: 'jeffapp', status: 'in-progress', updated_at: new Date().toISOString() },
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
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const cards = el.querySelectorAll('.task-card');
      expect(cards.length).toBe(2);
      expect(el.textContent).toContain('Write tests');
      expect(el.textContent).toContain('Deploy gateway');
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
        });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const projectCards = el.querySelectorAll('.project-card');
      expect(projectCards.length).toBe(0);
    });
  });
});
