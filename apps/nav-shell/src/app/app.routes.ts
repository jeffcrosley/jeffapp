import { Route } from '@angular/router';
import { AboutComponent } from './pages/about.component';
import { ContactComponent } from './pages/contact.component';
import { DashboardComponent } from './pages/dashboard.component';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'contact',
    component: ContactComponent,
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
