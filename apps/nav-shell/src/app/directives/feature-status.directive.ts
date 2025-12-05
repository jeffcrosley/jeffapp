import {
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	Renderer2
} from '@angular/core'
import { FeatureStatus } from '../services/feature-visibility.service'

@Directive({
	selector: '[appFeatureStatus]'
})
export class FeatureStatusDirective {
	appFeatureStatus = input<FeatureStatus>('stable')

	#el: ElementRef = inject(ElementRef)
	#renderer: Renderer2 = inject(Renderer2)

	constructor() {
		effect(() =>
			this.#updateFeatureStatusClass(
				this.appFeatureStatus()
			)
		)
	}

	#updateFeatureStatusClass = (
		status: FeatureStatus
	): void => {
		const el = this.#el.nativeElement
		this.#renderer.removeClass(el, 'feature-wip')
		this.#renderer.removeClass(el, 'feature-beta')
		if (status !== 'stable')
			this.#renderer.addClass(
				el,
				`feature-${status}`
			)
	}
}
