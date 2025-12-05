import { Component, signal } from '@angular/core'

@Component({
	selector: 'app-navigation-drawer',
	template: `<div class="navigation-drawer">
		<!-- Navigation drawer content goes here -->
	</div>`,
	styles: [
		`
			.navigation-drawer {
				/* Styles for the navigation drawer */
			}
		`
	]
})
export class NavigationDrawerComponent {
	#isOpen = signal(false)
	isOpen$ = this.#isOpen.asReadonly()

	links = []
}
