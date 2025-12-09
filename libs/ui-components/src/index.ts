export type {
	Components,
	JSX
} from './components'

// Import built custom elements to trigger auto-registration
// Using require at build time ensures components are available for dev servers
// The dist/components files call defineCustomElement() immediately on import
import('../dist/components/app-button.js')
import('../dist/components/app-card.js')
