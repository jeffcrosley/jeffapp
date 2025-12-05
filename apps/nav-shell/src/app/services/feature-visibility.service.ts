import { Injectable } from '@angular/core'

export type FeatureStatus = 'stable' | 'wip' | 'beta'

@Injectable({
	providedIn: 'root'
})
export class FeatureVisibilityService {
	getIndicator(status: FeatureStatus): string | null {
		switch (status) {
			case 'stable':
				return null
			case 'wip':
				return '🚧 WIP'
			case 'beta':
				return '🧪 Beta'
			default:
				return null
		}
	}
}
