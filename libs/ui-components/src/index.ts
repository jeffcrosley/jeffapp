export type {
	Components,
	JSX
} from './components'

// Load Web Components with a test-safe path
// - In production: dynamically import built custom elements (self-register)
// - In tests (NODE_ENV === 'test'): register stubs and skip disk access to dist/

const defineStub = (tag: string) => {
	if (typeof customElements === 'undefined') return
	if (!customElements.get(tag)) {
		customElements.define(
			tag,
			class extends HTMLElement {}
		)
	}
}

const loadWebComponents = () => {
	// Ensure we only run in browser-like contexts
	if (typeof window === 'undefined') return

	const isTest =
		typeof process !== 'undefined' &&
		process.env &&
		process.env.NODE_ENV === 'test'

	if (isTest) {
		// Tests: avoid hitting dist/ and keep DOM queries working
		defineStub('app-button')
		defineStub('app-card')
		return
	}

	// Production/runtime: attempt to load built elements, fall back silently
	void import('../dist/components/app-button.js').catch(
		() => defineStub('app-button')
	)
	void import('../dist/components/app-card.js').catch(
		() => defineStub('app-card')
	)
}

loadWebComponents()
