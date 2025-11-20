import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';

/**
 * @slot - Custom content for the card body
 */
@Component({
  tag: 'app-card',
  styleUrl: 'app-card.scss',
  shadow: true,
})
export class AppCard {
  /**
   * The card title
   */
  @Prop() title!: string;

  /**
   * The card description text
   */
  @Prop() description!: string;

  /**
   * Optional image URL to display at the top of the card
   */
  @Prop() imageUrl?: string;

  /**
   * Alt text for the image (defaults to "Card image")
   */
  @Prop() imageAlt = 'Card image';

  /**
   * Card variant: default, highlighted, or compact
   */
  @Prop() variant: 'default' | 'highlighted' | 'compact' = 'default';

  /**
   * Emitted when the card is clicked
   */
  @Event() cardClick: EventEmitter<{ title: string }>;

  render() {
    // TODO: Implement the render method
    // You'll need to add event handlers (handleClick, handleKeyPress) when implementing
    // Requirements:
    // 1. Root element should be a div with class "card" and "card-{variant}"
    // 2. Add role="button", tabindex="0", aria-label with title
    // 3. Add onClick handler calling handleClick
    // 4. Add onKeyPress handler calling handleKeyPress
    // 5. If imageUrl exists, render img with class "card-image", src={imageUrl}, alt={imageAlt}
    // 6. Render h3 with class "card-title" containing {title}
    // 7. Render p with class "card-description" containing {description}
    // 8. Render div with class "card-slot" containing <slot />

    return (
      <div>
        <p>TODO: Implement app-card component</p>
      </div>
    );
  }
}
