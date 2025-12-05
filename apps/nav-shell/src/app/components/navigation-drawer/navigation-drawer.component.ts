import { Component, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NavLink } from '../../app'
import { FeatureStatusDirective } from '../../directives/feature-status.directive'

const PORTFOLIO_TITLE = 'JeffApp'

@Component({
	selector: 'app-navigation-drawer',
	templateUrl:
		'./navigation-drawer.component.html',
	styleUrl: './navigation-drawer.component.scss',
	imports: [RouterModule, FeatureStatusDirective]
})
export class NavigationDrawerComponent {
	links = input.required<NavLink[]>()
	isOpen = input.required<boolean>()

	title = PORTFOLIO_TITLE

	// constructor() {}
}
