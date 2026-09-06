import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  
  readonly theme = signal<Theme>('system');
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
    
    // Escuchar cambios de preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.theme() === 'system') {
        this.applyTheme(e.matches);
      }
    });
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme) {
      this.theme.set(savedTheme);
    }
    this.updateTheme(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.updateTheme(theme);
  }

  private updateTheme(theme: Theme): void {
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(systemDark);
    } else {
      this.applyTheme(theme === 'dark');
    }
  }

  private applyTheme(isDark: boolean): void {
    this.isDark.set(isDark);
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
