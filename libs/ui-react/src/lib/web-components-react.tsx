import React from 'react';
import '../types';

/**
 * React utilities for integrating Web Components from @jeffapp/ui-components and @jeffapp/ui-components-native
 *
 * React requires explicit type declarations for custom elements to work with JSX.
 * This file provides type-safe wrappers and utilities for using Web Components in React.
 */

/**
 * Load Web Components libraries
 * Call this in your React app's entry point (e.g., main.tsx) to register all custom elements
 *
 * Note: The actual import statements should be added by the consuming application:
 * import '@jeffapp/ui-components';
 * import '@jeffapp/ui-components-native';
 */
export function loadWebComponents() {
  // This function is a placeholder for documentation purposes
  // The consuming application should import the component libraries directly
  console.log('Web Components should be imported in your app entry point');
}

/**
 * Example React wrapper component for app-button
 * Demonstrates how to create type-safe React components wrapping Web Components
 */
export interface AppButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}) => {
  return (
    <app-button
      label={label}
      variant={variant}
      disabled={disabled}
      onClick={onClick}
    />
  );
};

/**
 * Example React wrapper for native-card
 */
export interface NativeCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const NativeCard: React.FC<NativeCardProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <native-card title={title} description={description}>
      {children}
    </native-card>
  );
};

/**
 * Example React wrapper for native-badge
 */
export interface NativeBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
}

export const NativeBadge: React.FC<NativeBadgeProps> = ({ status, label }) => {
  return <native-badge status={status} label={label} />;
};
