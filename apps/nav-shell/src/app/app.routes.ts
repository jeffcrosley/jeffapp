import { Route } from '@angular/router'
import { AboutComponent } from './pages/about.component'
import { ComponentsComponent } from './pages/components.component'
import { ContactComponent } from './pages/contact.component'
import { DashboardComponent } from './pages/dashboard.component'
import { HomeComponent } from './pages/home/home.component'
import { authGuard } from './guards/auth.guard'
import { LoginPage } from './pages/login/login.page'
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component'
import { TrafficLightPage } from './pages/traffic-light/traffic-light.page'

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
		path: 'auth/callback',
		component: AuthCallbackComponent
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
		path: 'traffic-light',
		component: TrafficLightPage,
		canActivate: [authGuard]
	},
	{
		path: '**',
		redirectTo: '/home'
	}
]
