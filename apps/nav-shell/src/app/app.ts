import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected portfolioTitle = 'My SE Portfolio Platform';
  protected navigationLinks = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'About Me', route: '/about' },
  ];
}
