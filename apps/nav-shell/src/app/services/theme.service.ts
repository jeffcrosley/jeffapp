import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Theme Service
 * 
 * Manages light/dark mode theme switching with:
 * - OS preference detection (prefers-color-scheme)
 * - localStorage persistence
 * - Runtime theme application via data-theme attribute
 * 
 * @see .github/adr/004-design-system-architecture.md
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'jeffapp-theme';
  private currentTheme$ = new BehaviorSubject<'light' | 'dark'>('light');
  
  constructor() {
    this.initializeTheme();
  }
  
  /**
   * Initialize theme on service creation
   * Priority: localStorage > OS preference > default light
   */
  private initializeTheme(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const theme = stored || this.detectSystemTheme();
    this.applyTheme(theme as 'light' | 'dark');
  }
  
  /**
   * Detect system/OS color scheme preference
   * @returns 'dark' if user prefers dark mode, 'light' otherwise
   */
  private detectSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  
  /**
   * Apply theme by setting data-theme attribute on document element
   * @param theme - 'light' or 'dark'
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    this.currentTheme$.next(theme);
  }
  
  /**
   * Toggle between light and dark mode
   * Persists choice to localStorage
   */
  toggle(): void {
    const newTheme = this.currentTheme$.value === 'light' ? 'dark' : 'light';
    localStorage.setItem(this.STORAGE_KEY, newTheme);
    this.applyTheme(newTheme);
  }
  
  /**
   * Set specific theme
   * @param theme - 'light' or 'dark'
   */
  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  }
  
  /**
   * Get current theme as observable
   * @returns Observable of current theme
   */
  getTheme(): Observable<'light' | 'dark'> {
    return this.currentTheme$.asObservable();
  }
  
  /**
   * Get current theme value (synchronous)
   * @returns Current theme ('light' or 'dark')
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme$.value;
  }
  
  /**
   * Check if dark mode is active
   * @returns true if dark mode, false if light mode
   */
  isDarkMode(): boolean {
    return this.currentTheme$.value === 'dark';
  }
}
