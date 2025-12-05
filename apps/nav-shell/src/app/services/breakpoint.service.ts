import { Injectable, OnDestroy, signal } from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class BreakpointService implements OnDestroy {
	#isDesktop = signal(true)
	isDesktop$ = this.#isDesktop.asReadonly()

	constructor() {
		this.#isDesktop.set(matchMedia('(min-width: 1024px)').matches)
	}

	ngOnDestroy(): void {}
}
