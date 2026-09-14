import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucidePackageSearch, lucideLoader2, lucideChevronDown, lucidePackage } from '@ng-icons/lucide';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Inventarios } from '../../services/inventarios';
import { Inventario as IInventario } from '../../interfaces/inventario';

@Component({
  selector: 'app-inventario',
  imports: [AppHeaderComponent, NgIcon, ...HlmInputImports, ...HlmButtonImports],
  templateUrl: './inventario.html',
  providers: [
    provideIcons({
      lucideSearch,
      lucidePackageSearch,
      lucideLoader2,
      lucideChevronDown,
      lucidePackage
    })
  ]
})
export class Inventario implements OnInit, OnDestroy {
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly items = signal<IInventario[]>([]);
  
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);

  private readonly searchSubject = new Subject<string>();
  private readonly searchSubscription: Subscription;
  private readonly inventariosService = inject(Inventarios);

  constructor() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.cargarInventario();
    });
  }

  ngOnInit(): void {
    this.cargarInventario();
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  protected cargarInventario(): void {
    this.isLoading.set(true);
    const query = this.searchQuery();
    
    this.inventariosService.getInventario(0, 15, query).subscribe({
      next: (page) => {
        this.items.set(page.content);
        this.currentPage.set(page.page.number);
        this.totalPages.set(page.page.totalPages);
        this.totalElements.set(page.page.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  protected readonly hasMoreItems = computed(
    () => this.currentPage() < this.totalPages() - 1
  );

  protected loadMoreInventario(): void {
    if (this.isLoadingMore() || !this.hasMoreItems()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    const query = this.searchQuery();

    this.inventariosService.getInventario(nextPage, 15, query).subscribe({
      next: (page) => {
        this.items.update((current) => [...current, ...page.content]);
        this.currentPage.set(page.page.number);
        this.totalPages.set(page.page.totalPages);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }
}
