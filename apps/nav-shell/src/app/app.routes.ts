import { Route } from '@angular/router'
import { AboutComponent } from './pages/about.component'
import { ComponentsComponent } from './pages/components.component'
import { ContactComponent } from './pages/contact.component'
import { DashboardComponent } from './pages/dashboard.component'
import { HomeComponent } from './pages/home/home.component'
import { authGuard } from './guards/auth.guard'
import { LoginPage } from './pages/login/login.page'

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full'
	},
	{
		path: 'login',
		component: LoginPage
	},
	{
		path: 'home',
		component: HomeComponent
	},
	{
		path: 'about',
		component: AboutComponent
	},
	{
		path: 'contact',
		component: ContactComponent
	},
	{
		path: 'components',
		component: ComponentsComponent
	},
	{
		path: 'dashboard',
		component: DashboardComponent,
		canActivate: [authGuard]
	},
	{
		path: '**',
		redirectTo: '/home'
	}
]
