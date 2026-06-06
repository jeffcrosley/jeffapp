import { Route } from '@angular/router'
import { AboutComponent } from './pages/about.component'
import { ComponentsComponent } from './pages/components.component'
import { ContactComponent } from './pages/contact.component'
import { DashboardComponent } from './pages/dashboard.component'
import { HomeComponent } from './pages/home/home.component'
import { authGuard } from './guards/auth.guard'
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component'
import { TrafficLightPage } from './pages/traffic-light/traffic-light.page'

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: () => {
			const returnUrl = sessionStorage.getItem('auth_return_url')
			if (returnUrl) {
				sessionStorage.removeItem('auth_return_url')
				return returnUrl
			}
			return '/traffic-light'
		},
		pathMatch: 'full'
	},
	{
		path: 'auth/callback',
		component: AuthCallbackComponent
	},
	{
		path: 'home',
		component: HomeComponent,
		canActivate: [authGuard]
	},
	{
		path: 'about',
		component: AboutComponent,
		canActivate: [authGuard]
	},
	{
		path: 'contact',
		component: ContactComponent,
		canActivate: [authGuard]
	},
	{
		path: 'components',
		component: ComponentsComponent,
		canActivate: [authGuard]
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
		redirectTo: '/traffic-light'
	}
]
