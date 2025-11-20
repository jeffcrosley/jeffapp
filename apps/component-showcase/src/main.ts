/**
 * Main entry point for Component Showcase
 * A framework-agnostic gallery demonstrating @jeffapp Web Components
 */

import { renderGallery } from './pages/gallery';
import './styles.scss';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');

  if (!root) {
    console.error('Root element not found');
    return;
  }

  // Render the gallery page
  renderGallery(root);
});
