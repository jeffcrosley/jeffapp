import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="dashboard-container">
      <div class="dashboard-header">
        <h2>{{ welcomeMessage }}</h2>
        <p class="subtitle">{{ description }}</p>
      </div>

      <div class="dashboard-grid">
        <div *ngFor="let item of dashboardItems" class="dashboard-card">
          <div class="card-icon">{{ item.icon }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <a [routerLink]="item.route" class="card-link">Explore →</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 20px 0;

        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;

          h2 {
            font-size: 2rem;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 700;
          }

          .subtitle {
            font-size: 1.1rem;
            color: #7f8c8d;
            max-width: 600px;
            margin: 0 auto;
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 30px;

          @media (max-width: 768px) {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        .dashboard-card {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

          &:hover {
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            transform: translateY(-4px);
            border-color: #3498db;
          }

          .card-icon {
            font-size: 3rem;
            margin-bottom: 15px;
          }

          h3 {
            font-size: 1.4rem;
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-weight: 600;
          }

          p {
            color: #7f8c8d;
            font-size: 0.95rem;
            margin-bottom: 15px;
            line-height: 1.5;
          }

          .card-link {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;

            &:hover {
              color: #2980b9;
            }
          }
        }
      }
    `,
  ],
})
export class DashboardComponent {
  protected welcomeMessage = 'For All your Jeff Crosley Needs';
  protected description =
    'Thank you for visitting!  This is a rapidly-changing work in progress.  Please feel free to reach out with any questions or feedback.';

  protected dashboardItems = [
    {
      title: 'Projects',
      icon: '📁',
      description: 'View my completed and ongoing projects',
      route: '/projects',
    },
    {
      title: 'Skills',
      icon: '🛠️',
      description: 'Technical skills and expertise',
      route: '/skills',
    },
    {
      title: 'Experience',
      icon: '💼',
      description: 'Professional background',
      route: '/experience',
    },
    {
      title: 'Contact',
      icon: '📧',
      description: 'Get in touch',
      route: '/contact',
    },
  ];
}
