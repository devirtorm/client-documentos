import { Component, input, inject, Output, EventEmitter } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideChevronLeft, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgIcon, ...HlmButtonImports],
  providers: [provideIcons({ lucideChevronLeft, lucideMoon, lucideSun })],
  template: `
    <header class="sticky top-0 z-30 bg-background/20 backdrop-blur-xl border-b-2 rounded-b-3xl border-border/60">
      <div class="flex items-start gap-2 px-4 pt-3 pb-2.5">

        <!-- Left Action Slot -->
        <ng-content select="[left-action]"></ng-content>

        <!-- Titles -->
        <div class="flex-1 min-w-0">
          @if (title()) {
            <div class="h-8 flex items-center">
              @if (showBackBtn()) {
                <button hlmBtn variant="ghost" size="icon" class="shrink-0 mr-2 size-7 rounded-full -ml-1 hover:text-foreground hover:bg-muted/60 transition-colors" (click)="goBack()">
                  <ng-icon name="lucideChevronLeft" size="18" />
                </button>
              }
              <h1 class="text-[19px] font-bold tracking-tight text-foreground truncate">{{ title() }}</h1>
            </div>
          }
          @if (subtitle()) {
            <p class="text-[12px] text-muted-foreground mt-0.5 leading-snug" [innerHTML]="subtitle()"></p>
          }
          <!-- En caso de necesitar HTML complejo en el subtitulo -->
          <ng-content select="[subtitle-content]"></ng-content>
        </div>

        <!-- Right Action Slot -->
        <div class="shrink-0 flex items-center gap-1">
          <ng-content select="[right-action]"></ng-content>

          <!-- Theme Toggle -->
          @if (showThemeToggle()) {
            <button hlmBtn variant="ghost" size="icon" class="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" (click)="toggleTheme()">
              <ng-icon [name]="themeService.isDark() ? 'lucideSun' : 'lucideMoon'" size="18" />
            </button>
          }
        </div>
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
