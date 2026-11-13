import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Departure, DepartureStatus, ESTATUSES } from '../../../../core/models/departure.model';
import { capitalizar } from '../../../../shared/utils/formatos';

interface CeldaDia {
  clave: string;
  numero: number;
  total: number;
  hoy: boolean;
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const claveDia = (fecha: Date): string =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const inicioDeMes = (fecha: Date): Date => new Date(fecha.getFullYear(), fecha.getMonth(), 1);

@Component({
  selector: 'app-departures-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departures-calendar.html'
})
export class DeparturesCalendar {
  readonly departures = input.required<Departure[]>();
  readonly diasSemana = DIAS_SEMANA;

  readonly mes = signal(inicioDeMes(new Date()));
  readonly seleccionado = signal(claveDia(new Date()));

  readonly titulo = computed(() =>
    capitalizar(this.mes().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }))
  );

  private readonly porDia = computed(() => {
    const mapa = new Map<string, Departure[]>();
    const ordenadas = [...this.departures()].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    for (const departure of ordenadas) {
      const clave = claveDia(new Date(departure.startDate));
      mapa.set(clave, [...(mapa.get(clave) ?? []), departure]);
    }
    return mapa;
  });

  readonly celdas = computed<(CeldaDia | null)[]>(() => {
    const inicio = this.mes();
    const dias = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
    const hoy = claveDia(new Date());
    const huecos = (inicio.getDay() + 6) % 7;
    const celdas: (CeldaDia | null)[] = Array<CeldaDia | null>(huecos).fill(null);

    for (let numero = 1; numero <= dias; numero++) {
      const clave = claveDia(new Date(inicio.getFullYear(), inicio.getMonth(), numero));
      celdas.push({ clave, numero, total: this.porDia().get(clave)?.length ?? 0, hoy: clave === hoy });
    }

    while (celdas.length % 7 !== 0) celdas.push(null);
    return celdas;
  });

  readonly delDia = computed(() => this.porDia().get(this.seleccionado()) ?? []);

  readonly tituloDia = computed(() => {
    const [anio, mes, dia] = this.seleccionado().split('-').map(Number);
    return capitalizar(
      new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    );
  });

  mesAnterior(): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() - 1, 1));
  }

  mesSiguiente(): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() + 1, 1));
  }

  irAHoy(): void {
    const hoy = new Date();
    this.mes.set(inicioDeMes(hoy));
    this.seleccionado.set(claveDia(hoy));
  }

  seleccionar(clave: string): void {
    this.seleccionado.set(clave);
  }

  nombreRuta(departure: Departure): string {
    const ruta = departure.rutaId;
    return typeof ruta === 'object' && ruta !== null ? ruta.nombre : '—';
  }

  hora(departure: Departure): string {
    return new Date(departure.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  etiquetaStatus(status: DepartureStatus): string {
    return ESTATUSES.find((s) => s.valor === status)?.etiqueta ?? status;
  }

  clasesStatus(status: DepartureStatus): string {
    switch (status) {
      case 'open':
        return 'bg-bosque-100 text-bosque-800';
      case 'full':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-700';
    }
  }
}
