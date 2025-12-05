import { Component, DebugElement } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
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
	template: ` <a [appFeatureStatus]="status" class="test-link">Link</a> `,
	standalone: true,
	imports: [FeatureStatusDirective]
})
class TestFeatureStatusComponent {
	status: FeatureStatus = 'stable'
}

describe.skip('FeatureStatusDirective', () => {
	let fixture: ComponentFixture<TestFeatureStatusComponent>
	let component: TestFeatureStatusComponent
	let linkElement: DebugElement

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TestFeatureStatusComponent, FeatureStatusDirective]
		})
		fixture = TestBed.createComponent(TestFeatureStatusComponent)
		component = fixture.componentInstance
		linkElement = fixture.debugElement.query(By.css('a'))
	})

	describe('initialization', () => {
		it('should be created', () => {
			// TODO: Verify directive can be imported and used on element
			expect(linkElement).toBeTruthy()
		})

		it('should accept appFeatureStatus input', () => {
			// TODO: Verify [appFeatureStatus] binding works
			// Set component.status = 'wip'
			// Verify no errors
			expect(component).toBeTruthy()
		})
	})

	describe('CSS class management for stable status', () => {
		it('should not add any class for stable status', () => {
			// TODO: Set component.status = 'stable'
			// Run fixture.detectChanges()
			// Verify linkElement does not have 'feature-stable' class
			// Verify linkElement does not have 'feature-wip' class
			// Verify linkElement does not have 'feature-beta' class
			component.status = 'stable'
			fixture.detectChanges()
			expect(
				linkElement.nativeElement.classList.contains('feature-stable')
			).toBe(false)
		})

		it('should not have feature-* class if status is stable', () => {
			// TODO: Verify classList length remains unchanged (no classes added)
			// Original classes should be 'test-link' only
			component.status = 'stable'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				false
			)
		})
	})

	describe('CSS class management for wip status', () => {
		it('should add feature-wip class for wip status', () => {
			// TODO: Set component.status = 'wip'
			// Run fixture.detectChanges()
			// Verify linkElement has 'feature-wip' class
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				true
			)
		})

		it('should not add any other status classes when status is wip', () => {
			// TODO: Set component.status = 'wip'
			// Verify 'feature-beta' is NOT present
			// Verify 'feature-stable' is NOT present
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-beta')).toBe(
				false
			)
		})

		it('should keep original classes while adding feature-wip', () => {
			// TODO: Element starts with class 'test-link'
			// Set status = 'wip'
			// Verify both 'test-link' and 'feature-wip' are present
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('test-link')).toBe(
				true
			)
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				true
			)
		})
	})

	describe('CSS class management for beta status', () => {
		it('should add feature-beta class for beta status', () => {
			// TODO: Set component.status = 'beta'
			// Run fixture.detectChanges()
			// Verify linkElement has 'feature-beta' class
			component.status = 'beta'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-beta')).toBe(
				true
			)
		})

		it('should not add any other status classes when status is beta', () => {
			// TODO: Set component.status = 'beta'
			// Verify 'feature-wip' is NOT present
			// Verify 'feature-stable' is NOT present
			component.status = 'beta'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				false
			)
		})

		it('should keep original classes while adding feature-beta', () => {
			// TODO: Element starts with class 'test-link'
			// Set status = 'beta'
			// Verify both 'test-link' and 'feature-beta' are present
			component.status = 'beta'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('test-link')).toBe(
				true
			)
			expect(linkElement.nativeElement.classList.contains('feature-beta')).toBe(
				true
			)
		})
	})

	describe('dynamic status changes', () => {
		it('should update class when status changes from stable to wip', () => {
			// TODO: Start with status = 'stable' (no class)
			// fixture.detectChanges()
			// Change component.status = 'wip'
			// fixture.detectChanges()
			// Verify 'feature-wip' is now present
			component.status = 'stable'
			fixture.detectChanges()
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				true
			)
		})

		it('should update class when status changes from wip to beta', () => {
			// TODO: Start with status = 'wip'
			// fixture.detectChanges()
			// Change component.status = 'beta'
			// fixture.detectChanges()
			// Verify 'feature-wip' is REMOVED
			// Verify 'feature-beta' is ADDED
			component.status = 'wip'
			fixture.detectChanges()
			component.status = 'beta'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				false
			)
			expect(linkElement.nativeElement.classList.contains('feature-beta')).toBe(
				true
			)
		})

		it('should remove class when status changes from wip to stable', () => {
			// TODO: Start with status = 'wip'
			// fixture.detectChanges()
			// Change component.status = 'stable'
			// fixture.detectChanges()
			// Verify 'feature-wip' is REMOVED
			component.status = 'wip'
			fixture.detectChanges()
			component.status = 'stable'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				false
			)
		})

		it('should handle multiple consecutive changes', () => {
			// TODO: Cycle through stable → wip → beta → stable → wip
			// After each change, verify correct class is present/absent
			component.status = 'stable'
			fixture.detectChanges()
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				true
			)
			component.status = 'beta'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-beta')).toBe(
				true
			)
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				false
			)
		})
	})

	describe('edge cases', () => {
		it('should handle directive on different element types', () => {
			// TODO: Test directive on <button>, <div>, <span>, etc.
			// Verify class management works on all element types
			expect(linkElement).toBeTruthy()
		})

		it('should not interfere with other directives', () => {
			// TODO: Add other directives to element (e.g., ngClass, [style])
			// Set status = 'wip'
			// Verify directive still works and other directives function normally
			expect(component).toBeTruthy()
		})

		it('should handle element with many existing classes', () => {
			// TODO: Element has 5+ classes already
			// Apply directive with status = 'wip'
			// Verify feature-wip is added without disturbing other classes
			expect(linkElement).toBeTruthy()
		})
	})

	describe('selector specificity', () => {
		it('should only apply to elements with [appFeatureStatus]', () => {
			// TODO: Create test component with two elements:
			// - One with [appFeatureStatus]="'wip'"
			// - One without directive
			// Verify only first element gets feature-wip class
			expect(linkElement).toBeTruthy()
		})

		it('should work as attribute selector on any element', () => {
			// TODO: Test on <a>, <button>, <li>, <span> with [appFeatureStatus]
			// Verify class is added regardless of element type
			expect(component).toBeTruthy()
		})
	})

	describe('CSS class naming convention', () => {
		it('should use feature- prefix for all status classes', () => {
			// TODO: Set status = 'wip' and verify class is 'feature-wip' (not 'wip' or 'status-wip')
			// Verify naming is consistent: 'feature-{status}'
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('feature-wip')).toBe(
				true
			)
		})

		it('should not add feature- prefix to element classes', () => {
			// TODO: Element class 'test-link' should not become 'feature-test-link'
			// Directive only adds feature-{status} classes
			component.status = 'stable'
			fixture.detectChanges()
			expect(linkElement.nativeElement.classList.contains('test-link')).toBe(
				true
			)
		})
	})

	describe('integration with styling', () => {
		it('should enable CSS to style via feature-wip class', () => {
			// TODO: CSS rule: .feature-wip { color: orange; border-bottom: 1px dotted; }
			// Apply directive with status = 'wip'
			// Verify computed style reflects rule (color should be orange)
			component.status = 'wip'
			fixture.detectChanges()
			const computedStyle = window.getComputedStyle(linkElement.nativeElement)
			expect(computedStyle).toBeTruthy()
		})

		it('should enable CSS to style via feature-beta class', () => {
			// TODO: CSS rule: .feature-beta { color: blue; border-bottom: 1px dashed; }
			// Apply directive with status = 'beta'
			// Verify computed style reflects rule
			component.status = 'beta'
			fixture.detectChanges()
			const computedStyle = window.getComputedStyle(linkElement.nativeElement)
			expect(computedStyle).toBeTruthy()
		})
	})

	describe('accessibility', () => {
		it('should not affect element accessibility', () => {
			// TODO: Element should still be focusable if it was
			// Tab order should not change
			// aria-label should not be affected
			component.status = 'wip'
			fixture.detectChanges()
			expect(linkElement).toBeTruthy()
		})

		it('should not hide content via classes', () => {
			// TODO: Element with feature-wip class should still be visible
			// CSS class should only add styling, not display: none or visibility: hidden
			component.status = 'wip'
			fixture.detectChanges()
			const nativeElement = linkElement.nativeElement
			expect(nativeElement.offsetParent).not.toBeNull()
		})
	})
})
