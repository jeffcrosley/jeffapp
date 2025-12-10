/**
 * SVG sanitization utility.
 * Strips dangerous content from SVG strings before injection.
 */

/**
 * Remove dangerous elements and attributes from SVG content
 */
export function sanitizeSVG(svgContent: string): string {
  // TODO: Implement sanitization logic
  // - Remove <script> tags
  // - Remove on* event handlers (onload, onclick, etc.)
  // - Remove <foreignObject> tags
  // - Preserve path, g, circle, rect, polygon, polyline, line, ellipse elements
  // - Preserve safe attributes (d, fill, stroke, viewBox, etc.)

  return svgContent
}
