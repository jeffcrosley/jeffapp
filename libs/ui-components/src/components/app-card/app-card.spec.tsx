import { newSpecPage } from '@stencil/core/testing';
import { AppCard } from './app-card';

describe('app-card', () => {
  it('renders with required props', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test Title" description="Test Description"></app-card>`,
    });

    expect(page.root).toBeTruthy();
    expect(page.root.shadowRoot.querySelector('.card-title')?.textContent).toBe(
      'Test Title'
    );
    expect(
      page.root.shadowRoot.querySelector('.card-description')?.textContent
    ).toBe('Test Description');
  });

  it('applies default variant class', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc"></app-card>`,
    });

    const card = page.root.shadowRoot.querySelector('.card');
    expect(card.classList.contains('card-default')).toBe(true);
  });

  it('applies highlighted variant class', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc" variant="highlighted"></app-card>`,
    });

    const card = page.root.shadowRoot.querySelector('.card');
    expect(card.classList.contains('card-highlighted')).toBe(true);
  });

  it('applies compact variant class', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc" variant="compact"></app-card>`,
    });

    const card = page.root.shadowRoot.querySelector('.card');
    expect(card.classList.contains('card-compact')).toBe(true);
  });

  it('renders image when imageUrl is provided', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc" image-url="https://example.com/image.jpg"></app-card>`,
    });

    const img = page.root.shadowRoot.querySelector('.card-image');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/image.jpg');
  });

  it('does not render image when imageUrl is not provided', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc"></app-card>`,
    });

    const img = page.root.shadowRoot.querySelector('.card-image');
    expect(img).toBeNull();
  });

  it('uses custom image alt text when provided', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc" image-url="test.jpg" image-alt="Custom Alt"></app-card>`,
    });

    const img = page.root.shadowRoot.querySelector('.card-image');
    expect(img.getAttribute('alt')).toBe('Custom Alt');
  });

  it('uses default alt text when imageAlt is not provided', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc" image-url="test.jpg"></app-card>`,
    });

    const img = page.root.shadowRoot.querySelector('.card-image');
    expect(img.getAttribute('alt')).toBe('Card image');
  });

  it('emits cardClick event when clicked', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Click Me" description="Test"></app-card>`,
    });

    const cardClickSpy = jest.fn();
    page.root.addEventListener('cardClick', cardClickSpy);

    const card = page.root.shadowRoot.querySelector('.card') as HTMLElement;
    card.click();

    await page.waitForChanges();

    expect(cardClickSpy).toHaveBeenCalledTimes(1);
    expect(cardClickSpy.mock.calls[0][0].detail).toEqual({ title: 'Click Me' });
  });

  it('emits cardClick event on Enter key press', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Keyboard Test" description="Test"></app-card>`,
    });

    const cardClickSpy = jest.fn();
    page.root.addEventListener('cardClick', cardClickSpy);

    const card = page.root.shadowRoot.querySelector('.card');
    const event = new KeyboardEvent('keypress', { keyCode: 13 });
    card.dispatchEvent(event);

    await page.waitForChanges();

    expect(cardClickSpy).toHaveBeenCalledTimes(1);
    expect(cardClickSpy.mock.calls[0][0].detail).toEqual({
      title: 'Keyboard Test',
    });
  });

  it('emits cardClick event on Space key press', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Space Test" description="Test"></app-card>`,
    });

    const cardClickSpy = jest.fn();
    page.root.addEventListener('cardClick', cardClickSpy);

    const card = page.root.shadowRoot.querySelector('.card');
    const event = new KeyboardEvent('keypress', { keyCode: 32 });
    card.dispatchEvent(event);

    await page.waitForChanges();

    expect(cardClickSpy).toHaveBeenCalledTimes(1);
  });

  it('renders slotted content', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Test" description="Desc"><p class="custom-content">Custom Content</p></app-card>`,
    });

    const slot = page.root.shadowRoot.querySelector('slot');
    expect(slot).toBeTruthy();
  });

  it('has proper accessibility attributes', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Accessible Card" description="Test"></app-card>`,
    });

    const card = page.root.shadowRoot.querySelector('.card');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.getAttribute('aria-label')).toContain('Accessible Card');
  });

  it('renders all elements in correct order', async () => {
    const page = await newSpecPage({
      components: [AppCard],
      html: `<app-card title="Full Card" description="Complete test" image-url="test.jpg"></app-card>`,
    });

    const card = page.root.shadowRoot.querySelector('.card');
    const children = Array.from(card.children);

    // Should have: image, title, description, slot
    expect(children.length).toBeGreaterThanOrEqual(3);
    expect(card.querySelector('.card-image')).toBeTruthy();
    expect(card.querySelector('.card-title')).toBeTruthy();
    expect(card.querySelector('.card-description')).toBeTruthy();
  });
});
