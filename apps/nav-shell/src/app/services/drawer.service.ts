import {
	effect,
	inject,
	Injectable,
	signal
} from '@angular/core'
import { BreakpointService } from './breakpoint.service'

@Injectable({
	providedIn: 'root'
})
export class DrawerService {
	#isOpen = signal(false)
	isOpen$ = this.#isOpen.asReadonly()

	constructor() {
		const breakpointService = inject(BreakpointService)
		effect(() => {
			const isDesktop = breakpointService.isDesktop$()
			if (isDesktop && this.#isOpen()) {
				this.#isOpen.set(false)
			}
		})
	}

	toggle = (): void => this.#isOpen.set(!this.#isOpen())
	open = (): void => this.#isOpen.set(true)
	close = (): void => this.#isOpen.set(false)
}
