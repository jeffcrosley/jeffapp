export type {
	Components,
	JSX
} from './components'

// Runtime loader with test-friendly fallback
// In production we dynamically import the built custom elements which self-register
// In test (or when dist isn't built) we register lightweight stubs so DOM queries work
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
	if (typeof window === 'undefined') return

	// Attempt to load the built elements; fall back to stubs if dist is missing
	void import('../dist/components/app-button.js').catch(
		() => defineStub('app-button')
	)
	void import('../dist/components/app-card.js').catch(
		() => defineStub('app-card')
	)
}

loadWebComponents()
