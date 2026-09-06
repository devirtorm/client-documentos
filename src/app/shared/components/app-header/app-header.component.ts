import { Component, input, inject, Output, EventEmitter } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgIcon, ...HlmButtonImports],
  providers: [provideIcons({ lucideArrowLeft, lucideMoon, lucideSun })],
  template: `
    <header class="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/60">
      <div class="flex items-center gap-3 px-4 pt-3 pb-2.5">
        <!-- Back Button Option -->
        @if (showBackBtn()) {
          <button hlmBtn variant="ghost" size="icon" class="shrink-0 h-9 w-9 rounded-xl -ml-1" (click)="goBack()">
            <ng-icon name="lucideArrowLeft" size="20" />
          </button>
        }

        <!-- Left Action Slot -->
        <ng-content select="[left-action]"></ng-content>

        <!-- Titles -->
        <div class="flex-1 min-w-0">
          @if (title()) {
            <h1 class="text-[20px] font-bold tracking-tight text-foreground">{{ title() }}</h1>
          }
          @if (subtitle()) {
            <p class="text-[13px] text-muted-foreground mt-0.5" [innerHTML]="subtitle()"></p>
          }
          <!-- En caso de necesitar HTML complejo en el subtitulo -->
          <ng-content select="[subtitle-content]"></ng-content>
        </div>

        <!-- Right Action Slot -->
        <ng-content select="[right-action]"></ng-content>

        <!-- Theme Toggle -->
        @if (showThemeToggle()) {
          <button hlmBtn variant="ghost" size="icon" class="shrink-0 h-9 w-9 rounded-xl" (click)="toggleTheme()">
            <ng-icon [name]="themeService.isDark() ? 'lucideSun' : 'lucideMoon'" class="size-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        }
      </div>
      
      <!-- Bottom Content Slot (para buscadores, filtros, etc) -->
      <ng-content select="[bottom-content]"></ng-content>
    </header>
  `
})
export class AppHeaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
  showBackBtn = input<boolean>(false);
  showThemeToggle = input<boolean>(true);

  @Output() back = new EventEmitter<void>();

  public themeService = inject(ThemeService);
  private location = inject(Location);

  toggleTheme(): void {
    const newTheme = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(newTheme);
  }

  goBack(): void {
    if (this.back.observed) {
      this.back.emit();
    } else {
      this.location.back();
    }
  }
}
