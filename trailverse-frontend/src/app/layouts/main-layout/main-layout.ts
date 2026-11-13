import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

function rutaHoja(estado: RouterStateSnapshot): ActivatedRouteSnapshot {
  let ruta = estado.root;
  while (ruta.firstChild) ruta = ruta.firstChild;
  return ruta;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './main-layout.html'
})
export class MainLayout {
  private readonly router = inject(Router);

  readonly anchoCompleto = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      startWith(null),
      map(() => rutaHoja(this.router.routerState.snapshot).data['anchoCompleto'] === true)
    ),
    { initialValue: false }
  );
}
