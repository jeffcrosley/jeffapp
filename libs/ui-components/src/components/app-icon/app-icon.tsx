import {
	Component,
	Host,
	h,
	Prop,
	State
} from '@stencil/core'

/**
 * Icon component that loads SVG icons from CDN with caching, sanitization, and theming.
 * @slot - Optional content to display instead of icon
 */
@Component({
	tag: 'app-icon',
	styleUrl: 'app-icon.scss',
	shadow: true
})
export class AppIcon {
	/**
	 * Icon name (e.g., "angular", "react", "typescript")
	 */
	@Prop() name!: string

	/**
	 * Icon color - either a jewel-tone palette key or any CSS color value
	 */
	@Prop() color?: string

	/**
	 * Icon size variant
	 */
	@Prop() size: 'sm' | 'md' | 'lg' = 'md'

	/**
	 * Custom aria-label (defaults to icon name)
	 */
	@Prop() ariaLabel?: string

	/**
	 * Whether icon is decorative only
	 */
	@Prop() ariaHidden?: boolean

	/**
	 * Cached SVG content
	 */
	@State() svgContent: string | null = null

	/**
	 * Loading state
	 */
	@State() isLoading = true

	/**
	 * Error state (triggers fallback)
	 */
	@State() hasError = false

	// TODO: Implement componentWillLoad() to fetch icon
	// TODO: Implement fetchIcon() with retry logic
	// TODO: Implement sanitizeSVG() to strip dangerous content
	// TODO: Implement theme detection logic
	// TODO: Implement cache deduplication

	render() {
		const sizeClass = `icon-${this.size}`

		return (
			<Host>
				<div class={`icon-wrapper ${sizeClass}`}>
					<div
						class="icon-container"
						role={this.ariaHidden ? undefined : 'img'}
						aria-label={
							this.ariaHidden
								? undefined
								: this.ariaLabel || this.name
						}
					>
						{this.isLoading && (
							<div class="icon-loading">Loading...</div>
						)}
						{this.hasError && (
							<div class="icon-fallback">⚠️</div>
						)}
						{this.svgContent && (
							<div
								class="icon-svg"
								innerHTML={this.svgContent}
							></div>
						)}
					</div>
				</div>
			</Host>
		)
	}
}
