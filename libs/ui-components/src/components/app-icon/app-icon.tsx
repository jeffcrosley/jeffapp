import {
	Component,
	h,
	Host,
	Prop,
	State
} from '@stencil/core'
import { iconCache } from './services/icon-cache.service'
import { resolveIconUrl } from './utils/icon-resolver'

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
	private static readonly MAX_RETRIES = 1
	private static readonly RETRY_DELAY_MS = 3000

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

	// TODO: Implement theme detection logic

	componentWillLoad = async () => {
		this.svgContent = await this.fetchIcon()
	}

	private fetchIcon = async () => {
		this.isLoading = true

		for (
			let attempt = 0;
			attempt <= AppIcon.MAX_RETRIES;
			attempt++
		) {
			const fetcher = async () => {
				const url = resolveIconUrl(this.name)
				const response = await fetch(url)
				if (!response.ok) {
					throw new Error(
						`Failed to fetch icon: ${response.status} ${response.statusText}`
					)
				}
				const svgText = await response.text()
				this.isLoading = false
				return this.sanitizeSVG(svgText)
			}
			try {
				return await iconCache.get(this.name, fetcher)
			} catch (error) {
				iconCache.clear(this.name)
				if (attempt === AppIcon.MAX_RETRIES) {
					console.error(
						`Failed to load icon "${this.name}":`,
						error
					)
					this.hasError = true
					this.isLoading = false
					return
				}

				await this.pauseBeforeRetry(
					AppIcon.RETRY_DELAY_MS
				)
			}
		}
	}

	private sanitizeSVG = (svg: string): string => {
		// Basic sanitization - remove <script> tags and on* attributes
		return svg
			.replace(
				/<script[\s\S]*?>[\s\S]*?<\/script>/gi,
				''
			)
			.replace(/\son\w+="[^"]*"/gi, '')
	}

	private getColorValue(): string | undefined {
		if (!this.color) return undefined

		// Palette keys: map to icon color tokens
		const paletteKeys = [
			'sapphire',
			'emerald',
			'amethyst',
			'garnet',
			'amber',
			'topaz',
			'onyx',
			'peridot',
			'ruby',
			'citrine'
		]

		if (
			paletteKeys.includes(this.color.toLowerCase())
		) {
			return `var(--icon-${this.color.toLowerCase()})`
		}

		// Already a CSS variable or literal color
		return this.color
	}

	private pauseBeforeRetry = async (
		ms: number
	) => {
		return new Promise((resolve) =>
			setTimeout(resolve, ms)
		)
	}

	render() {
		const sizeClass = `icon-${this.size}`
		const colorValue = this.getColorValue()
		const hostStyle = colorValue
			? { '--icon-color': colorValue }
			: {}

		return (
			<Host style={hostStyle}>
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
