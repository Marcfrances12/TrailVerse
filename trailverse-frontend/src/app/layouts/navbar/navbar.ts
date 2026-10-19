import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class Navbar {
  readonly abierto = signal(false);

  toggle(): void {
    this.abierto.update((valor) => !valor);
  }

  cerrar(): void {
    this.abierto.set(false);
  }
}