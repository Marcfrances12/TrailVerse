import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface FiltroOpcion {
  valor: string;
  etiqueta: string;
  total?: number;
}

/**
 * unica: radio (un valor). multiple: checkbox (varios valores).
 * segmento: botones excluyentes con aspecto de conmutador.
 * padre: clave del grupo en cuyo desplegable se muestra este grupo.
 */
export interface FiltroGrupo {
  clave: string;
  titulo: string;
  tipo: 'unica' | 'multiple' | 'segmento';
  opciones: FiltroOpcion[];
  seleccion: string[];
  padre?: string;
}

export interface FiltroCambio {
  clave: string;
  seleccion: string[];
}

const OPCIONES_VISIBLES = 6;

@Component({
  selector: 'app-filter-panel',
  imports: [NgTemplateOutlet],
  host: { class: 'lg:sticky lg:top-24 lg:self-start' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-panel.html'
})
export class FilterPanel {
  readonly grupos = input.required<FiltroGrupo[]>();
  readonly hayActivos = input(false);
  readonly cambiar = output<FiltroCambio>();
  readonly limpiar = output<void>();

  readonly abierto = signal(false);
  readonly raices = computed(() => this.grupos().filter((grupo) => !grupo.padre));

  private readonly desplegados = signal<Record<string, boolean>>({});
  private readonly expandidos = signal<Record<string, boolean>>({});

  alternar(): void {
    this.abierto.update((valor) => !valor);
  }

  hijos(grupo: FiltroGrupo): FiltroGrupo[] {
    return this.grupos().filter((item) => item.padre === grupo.clave);
  }

  estaAbierto(grupo: FiltroGrupo): boolean {
    return this.desplegados()[grupo.clave] ?? this.contarSeleccion(grupo) > 0;
  }

  alternarGrupo(grupo: FiltroGrupo): void {
    const abierto = this.estaAbierto(grupo);
    this.desplegados.update((mapa) => ({ ...mapa, [grupo.clave]: !abierto }));
  }

  contarSeleccion(grupo: FiltroGrupo): number {
    const porDefecto = grupo.tipo === 'segmento' ? grupo.opciones[0]?.valor : '';
    const propia = grupo.seleccion.filter((valor) => valor !== '' && valor !== porDefecto).length;
    return propia + this.hijos(grupo).reduce((total, hijo) => total + this.contarSeleccion(hijo), 0);
  }

  hayMasOpciones(grupo: FiltroGrupo): boolean {
    return grupo.opciones.length > OPCIONES_VISIBLES;
  }

  expandido(grupo: FiltroGrupo): boolean {
    return this.expandidos()[grupo.clave] ?? false;
  }

  opcionesVisibles(grupo: FiltroGrupo): FiltroOpcion[] {
    return this.expandido(grupo) ? grupo.opciones : grupo.opciones.slice(0, OPCIONES_VISIBLES);
  }

  alternarExpandido(grupo: FiltroGrupo): void {
    const expandido = this.expandido(grupo);
    this.expandidos.update((mapa) => ({ ...mapa, [grupo.clave]: !expandido }));
  }

  seleccionar(grupo: FiltroGrupo, valor: string, marcado: boolean): void {
    let seleccion: string[];

    if (grupo.tipo === 'multiple') {
      seleccion = marcado
        ? [...grupo.seleccion, valor]
        : grupo.seleccion.filter((item) => item !== valor);
    } else {
      seleccion = [valor];
    }

    this.cambiar.emit({ clave: grupo.clave, seleccion });
  }
}
