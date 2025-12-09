import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core'
import {
	Router,
	RouterModule
} from '@angular/router'
import { NavigationDrawerComponent } from './components/navigation-drawer/navigation-drawer.component'
import { DrawerService } from './services/drawer.service'
import { FeatureStatus } from './services/feature-visibility.service'
import { ThemeService } from './services/theme.service'

export interface NavLink {
	label: string
	route: string
	status: FeatureStatus
	external?: boolean
}

@Component({
	selector: 'app-root',
	imports: [
		CommonModule,
		RouterModule,
		NavigationDrawerComponent
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class App {
	protected portfolioTitle = 'Jeff Crosley'
	protected router = inject(Router)
	protected themeService = inject(ThemeService)
	protected drawerService = inject(DrawerService)

	protected navDrawerIsOpen =
		this.drawerService.isOpen

	protected navigationLinks: NavLink[] = [
		{
			label: 'Home',
			route: '/home',
			status: 'stable'
		},
		{
			label: 'About',
			route: '/about',
			status: 'wip'
		},
		{
			label: 'Components',
			route: '/components',
			status: 'wip'
		},
		{
			label: 'GitHub',
			route:
				'https://github.com/jeffcrosley/jeffapp',
			status: 'stable',
			external: true
		}
	]

	protected isSubappRoute(): boolean {
		return this.router.url.startsWith('/components')
	}

	protected toggleTheme(): void {
		this.themeService.toggle()
	}

	onDrawerCloseRequested = () =>
		this.drawerService.close()
	onDrawerToggleRequested = () =>
		this.drawerService.toggle()
}
