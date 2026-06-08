import { CommonModule } from '@angular/common'
import {
	Component,
	HostListener,
	inject,
	input,
	output
} from '@angular/core'
import { RouterModule } from '@angular/router'
import { NavLink } from '../../app'
import { FeatureStatusDirective } from '../../directives/feature-status.directive'
import { AuthService } from '../../services/auth.service'

const PORTFOLIO_TITLE = 'JeffApp'

@Component({
	selector: 'app-navigation-drawer',
	templateUrl:
		'./navigation-drawer.component.html',
	styleUrl: './navigation-drawer.component.scss',
	imports: [
		RouterModule,
		FeatureStatusDirective,
		CommonModule
	]
})
export class NavigationDrawerComponent {
	@HostListener('document:keydown.escape', [
		'$event'
	])
	onEscKey = (event: KeyboardEvent) => {
		if (this.isOpen()) {
			event.preventDefault()
			this.drawerCloseRequested.emit()
		}
	}

	links = input.required<NavLink[]>()
	isOpen = input.required<boolean>()
	collapsed = input<boolean>(false)

	drawerToggleRequested = output<void>()
	drawerCloseRequested = output<void>()
	collapseToggleRequested = output<void>()

	title = PORTFOLIO_TITLE
	protected auth = inject(AuthService)

	onClickHamburgerButton = (): void =>
		this.drawerToggleRequested.emit()

	onCollapseToggle = (): void =>
		this.collapseToggleRequested.emit()
}
