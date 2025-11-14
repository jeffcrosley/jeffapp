import { Route } from '@angular/router';
import { AboutComponent } from './components/about.component';
import { ContactComponent } from './components/contact.component';
import { DashboardComponent } from './components/dashboard.component';

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
