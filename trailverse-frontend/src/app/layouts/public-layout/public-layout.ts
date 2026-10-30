import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicNavbar } from '../public-navbar/public-navbar';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, PublicNavbar],
  templateUrl: './public-layout.html'
})
export class PublicLayout {}
