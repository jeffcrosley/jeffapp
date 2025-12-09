import { Route } from '@angular/router'
import { AboutComponent } from './pages/about.component'
import { ComponentsComponent } from './pages/components.component'
import { ContactComponent } from './pages/contact.component'
import { HomeComponent } from './pages/home/home.component'

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full'
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
		path: '**',
		redirectTo: '/home'
	}
]
