import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected portfolioTitle = 'JeffApp';
  protected navigationLinks = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'About Me', route: '/about' },
  ];
}
