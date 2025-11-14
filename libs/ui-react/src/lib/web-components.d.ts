import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'app-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          label?: string;
          variant?: 'primary' | 'secondary';
          disabled?: boolean;
        },
        HTMLElement
      >;
      'native-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          title?: string;
          description?: string;
        },
        HTMLElement
      >;
      'native-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          status?: 'success' | 'warning' | 'error' | 'info';
          label?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
