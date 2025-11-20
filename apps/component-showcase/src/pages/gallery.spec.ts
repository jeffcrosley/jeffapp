/**
 * Gallery Page Tests
 * Verify that Web Components are properly rendered
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { renderGallery } from './gallery';

describe('Gallery Page', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render the gallery container', () => {
    renderGallery(container);

    const galleryContainer = container.querySelector('.gallery-container');
    expect(galleryContainer).toBeTruthy();
  });

  it('should render the header with title', () => {
    renderGallery(container);

    const header = container.querySelector('.gallery-header h1');
    expect(header?.textContent).toBe('JeffApp Component Library');
  });

  it('should include Stencil component section', () => {
    renderGallery(container);

    const stencilSection = Array.from(
      container.querySelectorAll('.component-section')
    ).find(
      (section) =>
        section.querySelector('h2')?.textContent === 'Stencil Components'
    );

    expect(stencilSection).toBeTruthy();
  });

  it('should include Native component section', () => {
    renderGallery(container);

    const nativeSection = Array.from(
      container.querySelectorAll('.component-section')
    ).find(
      (section) =>
        section.querySelector('h2')?.textContent === 'Native Web Components'
    );

    expect(nativeSection).toBeTruthy();
  });

  it('should render app-button custom elements', () => {
    renderGallery(container);

    const buttons = container.querySelectorAll('app-button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render native-card custom elements', () => {
    renderGallery(container);

    const cards = container.querySelectorAll('native-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render native-badge custom elements', () => {
    renderGallery(container);

    const badges = container.querySelectorAll('native-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should include integration notes section', () => {
    renderGallery(container);

    const integrationSection = container.querySelector('.integration-notes');
    expect(integrationSection).toBeTruthy();

    const integrationCards =
      integrationSection?.querySelectorAll('.integration-card');
    expect(integrationCards?.length).toBe(3); // Angular, React, Vanilla
  });
});
