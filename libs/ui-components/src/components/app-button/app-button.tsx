import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'app-button',
  styleUrl: 'app-button.scss',
  shadow: true,
})
export class AppButton {
  @Prop() label = 'Click me';
  @Prop() variant: 'primary' | 'secondary' = 'primary';
  @Prop() disabled = false;

  render() {
    return (
      <button class={`btn btn-${this.variant}`} disabled={this.disabled}>
        {this.label}
      </button>
    );
  }
}
