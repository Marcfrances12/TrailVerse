import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicNavbar } from '../public-navbar/public-navbar';
import { RouteChat } from '../../shared/components/route-chat/route-chat';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, PublicNavbar, RouteChat],
  templateUrl: './public-layout.html'
})
export class PublicLayout {}
