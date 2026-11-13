import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';

export interface FiltroOpcion {
  valor: string;
  etiqueta: string;
  total?: number;
}

/**
 * unica: radio (un valor). multiple: checkbox (varios valores).
 * segmento: botones excluyentes con aspecto de conmutador.
 * orden: desplegable de un solo valor que no cuenta como filtro.
 * rango: dos deslizadores [mínimo, máximo] dentro de rango.
 * padre: clave del grupo en cuyo desplegable se muestra este grupo.
 * defecto: selección inicial; mientras coincida no cuenta como filtro activo.
 */
export interface FiltroGrupo {
  clave: string;
  titulo: string;
  tipo: 'unica' | 'multiple' | 'segmento' | 'orden' | 'rango';
  opciones: FiltroOpcion[];
  seleccion: string[];
  padre?: string;
  defecto?: string[];
  rango?: { min: number; max: number; unidad: string; sinLimiteEnMaximo: boolean };
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
  private readonly arrastre = signal<{ clave: string; valores: [number, number] } | null>(null);

  constructor() {
    effect(() => {
      this.grupos();
      untracked(() => this.arrastre.set(null));
    });
  }

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
    if (grupo.defecto) {
      return grupo.seleccion.join('|') === grupo.defecto.join('|') ? 0 : 1;
    }

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

  valoresRango(grupo: FiltroGrupo): [number, number] {
    const borrador = this.arrastre();
    if (borrador?.clave === grupo.clave) return borrador.valores;
    return [Number(grupo.seleccion[0]), Number(grupo.seleccion[1])];
  }

  porcentajeRango(grupo: FiltroGrupo, valor: number): number {
    const { min, max } = grupo.rango!;
    return ((valor - min) / (max - min)) * 100;
  }

  // El marcador de mínimo pasa por encima cuando está en la mitad alta, para poder arrastrarlo hacia atrás.
  indiceRango(grupo: FiltroGrupo): number {
    const { min, max } = grupo.rango!;
    return this.valoresRango(grupo)[0] > (min + max) / 2 ? 2 : 1;
  }

  arrastrarRango(grupo: FiltroGrupo, indice: 0 | 1, texto: string): void {
    const [minimo, maximo] = this.valoresRango(grupo);
    const valor = Number(texto);
    const valores: [number, number] = indice === 0
      ? [Math.min(valor, maximo), maximo]
      : [minimo, Math.max(valor, minimo)];

    this.arrastre.set({ clave: grupo.clave, valores });
  }

  soltarRango(grupo: FiltroGrupo): void {
    const borrador = this.arrastre();
    if (borrador?.clave !== grupo.clave) return;

    this.cambiar.emit({ clave: grupo.clave, seleccion: borrador.valores.map(String) });
  }

  etiquetaMaximo(grupo: FiltroGrupo, maximo: number): string {
    const sinLimite = grupo.rango?.sinLimiteEnMaximo && maximo === grupo.rango.max;
    return `${maximo}${grupo.rango?.unidad ?? ''}${sinLimite ? '+' : ''}`;
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
