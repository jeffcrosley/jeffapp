import { Injectable, OnDestroy, signal } from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class DrawerService implements OnDestroy {
	#isOpen = signal(false)
	isOpen$ = this.#isOpen.asReadonly()

	ngOnDestroy(): void {}

	toggle(): void {
		this.#isOpen.set(!this.#isOpen())
	}

	open(): void {
		this.#isOpen.set(true)
	}

	close(): void {
		this.#isOpen.set(false)
	}
}
