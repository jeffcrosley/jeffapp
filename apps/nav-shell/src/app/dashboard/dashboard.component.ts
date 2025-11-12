import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected welcomeMessage = 'Welcome to your Portfolio Dashboard';
  protected description =
    'This is your central hub for showcasing your software engineering work, projects, and skills.';

  protected dashboardItems = [
    {
      title: 'Projects',
      icon: '📁',
      description: 'View your completed and ongoing projects',
    },
    {
      title: 'Skills',
      icon: '🛠️',
      description: 'Showcase your technical skills and expertise',
    },
    {
      title: 'Experience',
      icon: '💼',
      description: 'Highlight your professional background',
    },
    {
      title: 'Contact',
      icon: '📧',
      description: 'Get in touch with you',
    },
  ];
}
