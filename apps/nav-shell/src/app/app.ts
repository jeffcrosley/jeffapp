import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="portfolio-header">
      <div class="header-container">
        <h1 class="portfolio-title">{{ portfolioTitle }}</h1>
        <nav class="navbar">
          <ul class="nav-links">
            <li *ngFor="let link of navigationLinks">
              <a
                *ngIf="!link.external"
                [routerLink]="link.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
              >
                {{ link.label }}
              </a>
              <a
                *ngIf="link.external"
                [href]="link.route"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      // Portfolio Header & Navigation Styles
      $primary-color: #2c3e50;
      $secondary-color: #3498db;
      $accent-color: #ecf0f1;
      $text-color: #2c3e50;
      $border-color: #bdc3c7;

      .portfolio-header {
        background-color: $primary-color;
        color: $accent-color;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 100;

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;

          @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }

        .portfolio-title {
          color: $accent-color;
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;

          @media (max-width: 768px) {
            font-size: 1.4rem;
          }
        }

        .navbar {
          flex-grow: 1;

          @media (max-width: 768px) {
            width: 100%;
          }
        }

        .nav-links {
          list-style: none;
          display: flex;
          gap: 30px;
          margin: 0;
          padding: 0;

          @media (max-width: 768px) {
            flex-direction: column;
            gap: 10px;
          }

          li {
            a {
              color: $accent-color;
              text-decoration: none;
              font-weight: 500;
              font-size: 1rem;
              padding: 8px 12px;
              border-radius: 4px;
              transition: all 0.3s ease;
              display: inline-block;

              &:hover {
                background-color: rgba(255, 255, 255, 0.1);
                color: $secondary-color;
              }

              &.active {
                background-color: $secondary-color;
                color: white;
                font-weight: 600;
              }
            }
          }
        }
      }

      .main-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;

        @media (max-width: 768px) {
          padding: 20px 15px;
        }
      }
    `,
  ],
})
export class App {
  protected portfolioTitle = 'JeffApp';
  protected navigationLinks = [
    { label: 'Home', route: '/home' },
    { label: 'Components', route: 'http://localhost:4300', external: true },
    { label: 'Contact', route: '/contact' },
  ];
}
