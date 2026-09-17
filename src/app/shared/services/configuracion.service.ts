import { Injectable, signal } from '@angular/core';

export type TipoDocumento = 'P' | 'M';

export interface Configuracion {
  tipoDocumento: TipoDocumento;
  tema: 'light' | 'dark' | 'system';
  mostrarPreciosEnLista: boolean;
  itemsPorPagina: number;
}

const STORAGE_KEY = 'app_configuracion';

const DEFAULTS: Configuracion = {
  tipoDocumento: 'P',
  tema: 'system',
  mostrarPreciosEnLista: true,
  itemsPorPagina: 20,
};

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly _config = signal<Configuracion>(this.cargar());

  readonly config = this._config.asReadonly();
  readonly tipoDocumento = () => this._config().tipoDocumento;
  readonly itemsPorPagina = () => this._config().itemsPorPagina;

  private cargar(): Configuracion {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      // Si el JSON está corrupto, usar valores por defecto
    }
    return { ...DEFAULTS };
  }

  guardar(cambios: Partial<Configuracion>): void {
    const nuevo = { ...this._config(), ...cambios };
    this._config.set(nuevo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
  }
}
