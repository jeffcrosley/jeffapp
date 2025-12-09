export type {
	Components,
	JSX
} from './components'

// Stencil loader for runtime component registration
// In tests, we define stubs to avoid loader initialization
const defineStub = (tag: string) => {
	if (typeof customElements === 'undefined') return
	if (!customElements.get(tag)) {
		customElements.define(
			tag,
			class extends HTMLElement {}
		)
	}
}

const isTest =
	typeof globalThis !== 'undefined' &&
	(globalThis as any).process?.env?.NODE_ENV === 'test'

if (isTest) {
	// Tests: register stubs to avoid loader/dist dependencies
	defineStub('app-button')
	defineStub('app-card')
} else if (typeof window !== 'undefined') {
	// Production/runtime: use Stencil's built-in loader
	import('../loader').then(({ defineCustomElements }) => {
		defineCustomElements(window)
	}).catch(() => {
		// Fallback to stubs if loader fails
		defineStub('app-button')
		defineStub('app-card')
	})
}
