/**
 * SVG sanitization utility.
 * Strips dangerous content from SVG strings before injection.
 */

/**
 * Remove dangerous elements and attributes from SVG content
 */
export function sanitizeSVG(
	svgContent: string
): string {
	// Remove <script> and <foreignObject> tags (and their content)
	let sanitized = svgContent
		.replace(
			/<script[\s\S]*?>[\s\S]*?<\/script>/gi,
			''
		)
		.replace(
			/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi,
			''
		)

	// Remove on* event handler attributes (e.g., onload, onclick)
	sanitized = sanitized.replace(
		/\son\w+="[^"]*"/gi,
		''
	)

	// Only allow safe SVG elements and attributes
	// List of allowed elements
	const allowedElements = [
		'svg',
		'g',
		'path',
		'circle',
		'rect',
		'polygon',
		'polyline',
		'line',
		'ellipse'
	]
	// List of allowed attributes
	const allowedAttrs = [
		'd',
		'fill',
		'stroke',
		'stroke-width',
		'viewBox',
		'cx',
		'cy',
		'r',
		'x',
		'y',
		'width',
		'height',
		'points',
		'transform',
		'class',
		'style',
		'opacity',
		'rx',
		'ry'
	]

	// Use DOMParser for robust filtering
	try {
		const parser = new DOMParser()
		const doc = parser.parseFromString(
			sanitized,
			'image/svg+xml'
		)
		const traverse = (node: Element) => {
			// Remove disallowed elements
			if (!allowedElements.includes(node.tagName)) {
				node.parentNode?.removeChild(node)
				return
			}
			// Remove disallowed attributes
			Array.from(node.attributes).forEach((attr) => {
				if (!allowedAttrs.includes(attr.name)) {
					node.removeAttribute(attr.name)
				}
			})
			// Traverse children
			Array.from(node.children).forEach(traverse)
		}
		const svg = doc.documentElement
		traverse(svg)
		return svg.outerHTML
	} catch (e) {
		// Fallback: return basic sanitized string
		return sanitized
	}
}
