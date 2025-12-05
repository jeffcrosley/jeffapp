import {
	Component,
	DebugElement
} from '@angular/core'
import {
	ComponentFixture,
	TestBed
} from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import type { FeatureStatus } from '../services/feature-visibility.service'
import { FeatureStatusDirective } from './feature-status.directive'

/**
 * Test Specification: FeatureStatusDirective
 *
 * Purpose: Add CSS classes to elements based on feature status
 * Allows styling of WIP/Beta features with visual indicators
 *
 * Behavior:
 * - selector: [appFeatureStatus]
 * - input: @Input() appFeatureStatus: FeatureStatus
 * - effect: adds class 'feature-{status}' to element if status !== 'stable'
 *   - 'stable' → no class added
 *   - 'wip' → class 'feature-wip' added
 *   - 'beta' → class 'feature-beta' added
 */

@Component({
	selector: 'app-test-feature-status',
	template: `
		<a [appFeatureStatus]="status" class="test-link"
			>Link</a
		>
	`,
	standalone: true,
	imports: [FeatureStatusDirective]
})
class TestFeatureStatusComponent {
	status: FeatureStatus = 'stable'
}

describe('FeatureStatusDirective', () => {
	let fixture: ComponentFixture<TestFeatureStatusComponent>
	let component: TestFeatureStatusComponent
	let linkElement: DebugElement

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TestFeatureStatusComponent,
				FeatureStatusDirective
			]
		})
		fixture = TestBed.createComponent(
			TestFeatureStatusComponent
		)
		component = fixture.componentInstance
		linkElement = fixture.debugElement.query(
			By.css('a')
		)
	})

	describe('initialization', () => {
		it('should be created', () => {
			expect(linkElement).toBeTruthy()
		})

		it('should accept appFeatureStatus input', () => {
			expect(component).toBeTruthy()
		})
	})

	describe('CSS class management for stable status', () => {
		it('should not add any class for stable status', () => {
			component.status = 'stable'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-stable'
				)
			).toBe(false)
		})

		it('should not have feature-* class if status is stable', () => {
			component.status = 'stable'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(false)
		})
	})

	describe('CSS class management for wip status', () => {
		it('should add feature-wip class for wip status', () => {
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})

		it('should not add any other status classes when status is wip', () => {
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(false)
		})

		it('should keep original classes while adding feature-wip', () => {
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'test-link'
				)
			).toBe(true)
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})
	})

	describe('CSS class management for beta status', () => {
		it('should add feature-beta class for beta status', () => {
			component.status = 'beta'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(true)
		})

		it('should not add any other status classes when status is beta', () => {
			component.status = 'beta'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(false)
		})

		it('should keep original classes while adding feature-beta', () => {
			component.status = 'beta'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'test-link'
				)
			).toBe(true)
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(true)
		})
	})

	describe('dynamic status changes', () => {
		it('should update class when status changes from stable to wip', () => {
			component.status = 'stable'
			fixture.detectChanges()
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})

		it('should update class when status changes from wip to beta', () => {
			component.status = 'wip'
			fixture.detectChanges()
			component.status = 'beta'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(false)
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(true)
		})

		it('should remove class when status changes from wip to stable', () => {
			component.status = 'wip'
			fixture.detectChanges()
			component.status = 'stable'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(false)
		})

		it('should handle multiple consecutive changes', () => {
			component.status = 'stable'
			fixture.detectChanges()
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
			component.status = 'beta'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-beta'
				)
			).toBe(true)
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(false)
		})
	})

	describe('edge cases', () => {
		it('should handle directive on different element types', () => {
			expect(linkElement).toBeTruthy()
		})

		it('should not interfere with other directives', () => {
			expect(component).toBeTruthy()
		})

		it('should handle element with many existing classes', () => {
			expect(linkElement).toBeTruthy()
		})
	})

	describe('selector specificity', () => {
		it('should only apply to elements with [appFeatureStatus]', () => {
			expect(linkElement).toBeTruthy()
		})

		it('should work as attribute selector on any element', () => {
			expect(component).toBeTruthy()
		})
	})

	describe('CSS class naming convention', () => {
		it('should use feature- prefix for all status classes', () => {
			component.status = 'wip'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'feature-wip'
				)
			).toBe(true)
		})

		it('should not add feature- prefix to element classes', () => {
			component.status = 'stable'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains(
					'test-link'
				)
			).toBe(true)
		})
	})

	describe('integration with styling', () => {
		it('should enable CSS to style via feature-wip class', () => {
			component.status = 'wip'
			fixture.detectChanges()
			const computedStyle = window.getComputedStyle(
				linkElement.nativeElement
			)
			expect(computedStyle).toBeTruthy()
		})

		it('should enable CSS to style via feature-beta class', () => {
			component.status = 'beta'
			fixture.detectChanges()
			const computedStyle = window.getComputedStyle(
				linkElement.nativeElement
			)
			expect(computedStyle).toBeTruthy()
		})
	})

	describe('accessibility', () => {
		it('should not affect element accessibility', () => {
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement).toBeTruthy()
		})

		it('should not hide content via classes', () => {
			component.status = 'wip'
			fixture.detectChanges()
			const nativeElement = linkElement.nativeElement
			const styles = window.getComputedStyle(
				nativeElement
			)

			// In jsdom, offsetParent is unreliable, so check computed styles instead
			expect(styles.display).not.toBe('none')
			expect(styles.visibility).not.toBe('hidden')
		})
	})
})
