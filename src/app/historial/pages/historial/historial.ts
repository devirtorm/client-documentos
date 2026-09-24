import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideFileText,
    lucideShoppingCart,
    lucideSearch,
    lucideLoader2,
    lucidePackageSearch,
    lucideChevronDown,
    lucideWifiOff,
} from '@ng-icons/lucide';
import { Remisiones } from '../../services/remisiones';
import { RemisionHistorial } from '../../interfaces/remision';
import { Pedidos } from '../../services/pedidos';
import { DocumentoHistorial } from '../../interfaces/documento';
import { ItemDocumento } from "../components/item-documento/item-documento";
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { LoadMoreButtonComponent } from '../../../shared/components/load-more-button/load-more-button.component';
import { Conexion } from '../../../shared/services/conexion';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import { toast } from '@spartan-ng/brain/sonner';

type TabType = 'remisiones' | 'pedidos';

@Component({
    selector: 'app-historial',
    imports: [
        ...HlmInputImports,
        ...HlmButtonImports,
        ...HlmBadgeImports,
        NgIcon,
        ItemDocumento,
        AppHeaderComponent,
        LoadMoreButtonComponent
    ],
    templateUrl: './historial.html',
    styleUrl: './historial.css',
    providers: [
        provideIcons({
            lucideFileText,
            lucideShoppingCart,
            lucideSearch,
            lucideLoader2,
            lucidePackageSearch,
            lucideChevronDown,
            lucideWifiOff,
        }),
    ],
})
export class Historial implements OnDestroy {
    private remisionesService = inject(Remisiones);
    private pedidosService = inject(Pedidos);
    private configService = inject(ConfiguracionService);
    protected conexionService = inject(Conexion);

    protected readonly activeTab = signal<TabType>('remisiones');
    protected readonly searchQuery = signal('');
    protected readonly isLoading = signal(false);
    protected readonly isLoadingMore = signal(false);

    // Debounce search
    private readonly searchSubject = new Subject<string>();
    private readonly searchSubscription: Subscription;

    // Remisiones data
    protected readonly remisiones = signal<RemisionHistorial[]>([]);
    protected readonly currentPage = signal(0);
    protected readonly totalPages = signal(0);
    protected readonly totalElements = signal(0);

    // Pedidos data
    protected readonly pedidos = signal<DocumentoHistorial[]>([]);
    protected readonly pedidosCurrentPage = signal(0);
    protected readonly pedidosTotalPages = signal(0);
    protected readonly pedidosTotalElements = signal(0);

    protected readonly hasMoreRemisiones = computed(
        () => this.currentPage() < this.totalPages() - 1,
    );

    protected readonly hasMorePedidos = computed(
        () => this.pedidosCurrentPage() < this.pedidosTotalPages() - 1,
    );

    constructor() {
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ).subscribe((query) => {
            this.searchQuery.set(query);
            if (this.activeTab() === 'remisiones') {
                this.loadRemisiones();
            } else {
                this.loadPedidos();
            }
        });
    }

    ngOnInit(): void {
        const tab = this.configService.tipoDocumento() === 'P'
            ? 'pedidos'
            : 'remisiones';

        this.setTab(tab);

        if (tab === 'pedidos') {
            this.loadPedidos();
        } else {
            this.loadRemisiones();
        }
    }

    ngOnDestroy(): void {
        this.searchSubscription.unsubscribe();
    }

    protected setTab(tab: TabType): void {
        this.activeTab.set(tab);
        this.searchQuery.set('');

        if (tab === 'remisiones' && this.remisiones().length === 0) {
            this.loadRemisiones();
        }

        if (tab === 'pedidos' && this.pedidos().length === 0) {
            this.loadPedidos();
        }
    }

    protected onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchSubject.next(input.value);
    }

    protected loadRemisiones(): void {
        this.isLoading.set(true);
        const query = this.searchQuery();
        this.remisionesService.getHistorialByAgente(0, this.configService.itemsPorPagina(), query).subscribe({
            next: (page) => {
                this.remisiones.set(page.content);
                this.currentPage.set(page.page.number);
                this.totalPages.set(page.page.totalPages);
                this.totalElements.set(page.page.totalElements);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                toast.error('Error al cargar historial de remisiones');
            },
        });
    }

    protected loadPedidos(): void {
        this.isLoading.set(true);
        const query = this.searchQuery();
        this.pedidosService.getHistorialByAgente(0, this.configService.itemsPorPagina(), query).subscribe({
            next: (page) => {
                this.pedidos.set(page.content);
                this.pedidosCurrentPage.set(page.page.number);
                this.pedidosTotalPages.set(page.page.totalPages);
                this.pedidosTotalElements.set(page.page.totalElements);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                toast.error('Error al cargar historial de pedidos');
            },
        });
    }

    protected loadMoreRemisiones(): void {
        if (this.isLoadingMore() || !this.hasMoreRemisiones()) return;

        this.isLoadingMore.set(true);
        const nextPage = this.currentPage() + 1;
        const query = this.searchQuery();
        this.remisionesService.getHistorialByAgente(nextPage, this.configService.itemsPorPagina(), query).subscribe({
            next: (page) => {
                this.remisiones.update((current) => [...current, ...page.content]);
                this.currentPage.set(page.page.number);
                this.totalPages.set(page.page.totalPages);
                this.isLoadingMore.set(false);
            },
            error: () => {
                this.isLoadingMore.set(false);
                toast.error('Error al cargar más remisiones');
            },
        });
    }

    protected loadMorePedidos(): void {
        if (this.isLoadingMore() || !this.hasMorePedidos()) return;

        this.isLoadingMore.set(true);
        const nextPage = this.pedidosCurrentPage() + 1;
        const query = this.searchQuery();
        this.pedidosService.getHistorialByAgente(nextPage, this.configService.itemsPorPagina(), query).subscribe({
            next: (page) => {
                this.pedidos.update((current) => [...current, ...page.content]);
                this.pedidosCurrentPage.set(page.page.number);
                this.pedidosTotalPages.set(page.page.totalPages);
                this.isLoadingMore.set(false);
            },
            error: () => {
                this.isLoadingMore.set(false);
                toast.error('Error al cargar más pedidos');
            },
        });
    }
}
