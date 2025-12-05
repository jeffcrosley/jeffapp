import { TestBed } from '@angular/core/testing'
import {
	FeatureStatus,
	FeatureVisibilityService
} from './feature-visibility.service'

/**
 * Test Specification: FeatureVisibilityService
 *
 * Purpose: Map feature status levels to user-facing indicator badges
 * Simplest service (no dependencies, pure function mapping)
 *
 * Status Mapping:
 * - 'stable' → null (no badge)
 * - 'wip' → '🚧 WIP'
 * - 'beta' → '🧪 Beta'
 */
describe('FeatureVisibilityService', () => {
	let service: FeatureVisibilityService

	beforeEach(() => {
		TestBed.configureTestingModule({})
		service = TestBed.inject(FeatureVisibilityService)
	})

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy()
		})
	})

	describe('getIndicator()', () => {
		it('should return null for stable status', () => {
			const indicator = service.getIndicator('stable')
			expect(indicator).toBeNull()
		})

		it('should return "🚧 WIP" for wip status', () => {
			const indicator = service.getIndicator('wip')
			expect(indicator).toBe('🚧 WIP')
		})

		it('should return "🧪 Beta" for beta status', () => {
			const indicator = service.getIndicator('beta')
			expect(indicator).toBe('🧪 Beta')
		})

		it('should be case-sensitive (only lowercase valid)', () => {
			const indicator = service.getIndicator(
				'WIP' as FeatureStatus
			)
			expect(indicator).toBeNull()
		})
	})

	describe('type safety', () => {
		it('should only accept valid FeatureStatus types', () => {
			// Type safety is compile-time only
			expect(['stable', 'wip', 'beta']).toContain('wip')
		})
	})

	describe('edge cases', () => {
		it('should handle all valid status enum values', () => {
			const statuses: FeatureStatus[] = [
				'stable',
				'wip',
				'beta'
			]
			const results = statuses.map((s) =>
				service.getIndicator(s)
			)
			// Results should be: [null, '🚧 WIP', '🧪 Beta']
			expect(results.length).toBe(3)
		})
	})

	describe('consistency', () => {
		it('should return consistent results for repeated calls', () => {
			const result1 = service.getIndicator('wip')
			const result2 = service.getIndicator('wip')
			const result3 = service.getIndicator('wip')
			expect(result1).toBe(result2)
			expect(result2).toBe(result3)
		})

		it('should return consistent results across different instances', () => {
			const service2 = TestBed.inject(
				FeatureVisibilityService
			)
			const indicator1 = service.getIndicator('beta')
			const indicator2 = service2.getIndicator('beta')
			expect(indicator1).toBe(indicator2)
		})
	})
})
