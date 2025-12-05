import {
	Injectable,
	OnDestroy,
	signal
} from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class BreakpointService implements OnDestroy {
	mediaQueryList = window.matchMedia(
		'(min-width: 1024px)'
	)
	listener = (e: MediaQueryListEvent) => {
		this.#isDesktop.set(e.matches)
	}

	#isDesktop = signal(this.mediaQueryList?.matches)
	isDesktop$ = this.#isDesktop.asReadonly()

	constructor() {
		this.mediaQueryList?.addEventListener(
			'change',
			this.listener
		)
	}

	ngOnDestroy(): void {
		this.mediaQueryList?.removeEventListener(
			'change',
			this.listener
		)
	}
}
