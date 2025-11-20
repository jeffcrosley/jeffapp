import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="about-container">
      <div class="about-header">
        <h2>About Me</h2>
        <div class="about-intro">
          <h3>{{ name }}</h3>
          <p class="bio">{{ bio }}</p>
        </div>
      </div>

      <div class="about-content">
        <!-- Skills Section -->
        <div class="skills-section">
          <h3>Skills & Technologies</h3>
          <div class="skills-grid">
            <span *ngFor="let skill of skills" class="skill-badge">{{
              skill
            }}</span>
          </div>
        </div>

        <!-- Experience Section -->
        <div class="experience-section">
          <h3>Professional Experience</h3>
          <div class="timeline">
            <div
              *ngFor="let job of experience; let last = last"
              class="timeline-item"
              [class.last]="last"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h4>{{ job.title }}</h4>
                <p class="company">{{ job.company }}</p>
                <p class="duration">{{ job.duration }}</p>
                <p class="description">{{ job.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .about-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px 0;

        .about-header {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 2px solid #ecf0f1;

          h2 {
            font-size: 2.5rem;
            color: #2c3e50;
            margin-bottom: 30px;
            font-weight: 700;
          }

          .about-intro {
            h3 {
              font-size: 1.8rem;
              color: #2c3e50;
              margin: 0 0 15px 0;
              font-weight: 600;
            }

            .bio {
              font-size: 1.1rem;
              color: #7f8c8d;
              max-width: 700px;
              margin: 0 auto;
              line-height: 1.6;
            }
          }
        }

        .about-content {
          .skills-section {
            margin-bottom: 50px;

            h3 {
              font-size: 1.5rem;
              color: #2c3e50;
              margin-bottom: 20px;
              font-weight: 600;
            }

            .skills-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;

              .skill-badge {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.95rem;
                font-weight: 500;
                transition: all 0.3s ease;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
                }
              }
            }
          }

          .experience-section {
            h3 {
              font-size: 1.5rem;
              color: #2c3e50;
              margin-bottom: 30px;
              font-weight: 600;
            }

            .timeline {
              position: relative;
              padding-left: 30px;

              .timeline-item {
                position: relative;
                margin-bottom: 30px;
                padding-bottom: 30px;
                border-left: 2px solid #ecf0f1;

                &.last {
                  border-left: none;
                }

                .timeline-dot {
                  position: absolute;
                  left: -10px;
                  top: 0;
                  width: 18px;
                  height: 18px;
                  background: #3498db;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 0 2px #3498db;
                }

                .timeline-content {
                  h4 {
                    font-size: 1.2rem;
                    color: #2c3e50;
                    margin: 0 0 5px 0;
                    font-weight: 600;
                  }

                  .company {
                    color: #3498db;
                    font-weight: 500;
                    font-size: 1rem;
                    margin: 0 0 5px 0;
                  }

                  .duration {
                    color: #95a5a6;
                    font-size: 0.9rem;
                    margin: 0 0 10px 0;
                    font-weight: 500;
                  }

                  .description {
                    color: #7f8c8d;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin: 0;
                  }
                }
              }
            }
          }
        }

        @media (max-width: 768px) {
          .about-header {
            h2 {
              font-size: 2rem;
            }

            .about-intro {
              h3 {
                font-size: 1.4rem;
              }

              .bio {
                font-size: 1rem;
              }
            }
          }

          .about-content {
            .experience-section {
              .timeline {
                padding-left: 20px;

                .timeline-item {
                  .timeline-dot {
                    left: -8px;
                  }
                }
              }
            }
          }
        }
      }
    `,
  ],
})
export class AboutComponent {
  protected name = 'Full-Pipeline AI-Forward Engineer';
  protected bio =
    'Building modern web applications with microfrontend architecture, cross-framework component libraries, and test-driven development. This portfolio demonstrates proficiency across multiple languages, frameworks, and the full software development lifecycle.';

  protected skills = [
    'Angular 20',
    'React 18+',
    'TypeScript',
    'Stencil',
    'Web Components',
    'Node.js',
    'Express.js',
    'Nx Monorepo',
    'Jest',
    'Playwright',
    'GitHub Actions',
    'Docker',
    'Render',
    'TDD',
    'Microfrontends',
    'REST APIs',
  ];

  protected experience = [
    {
      title: 'Microfrontend Architecture',
      company: 'JeffApp Project',
      duration: '2025',
      description:
        'Designed and implemented a microfrontend shell with Angular 20 to orchestrate multiple sub-apps in varied frameworks, demonstrating architectural versatility and framework expertise.',
    },
    {
      title: 'Cross-Framework Component System',
      company: 'JeffApp Project',
      duration: '2025',
      description:
        'Built a hybrid component library system using Stencil Web Components, vanilla Web Components, and framework-specific wrappers for Angular and React, showcasing deep understanding of web standards.',
    },
    {
      title: 'CI/CD & DevOps Pipeline',
      company: 'JeffApp Project',
      duration: '2025',
      description:
        'Implemented automated testing and deployment pipelines with GitHub Actions, Nx Cloud caching, and Render webhooks, demonstrating full-stack DevOps capabilities and modern best practices.',
    },
  ];
}
