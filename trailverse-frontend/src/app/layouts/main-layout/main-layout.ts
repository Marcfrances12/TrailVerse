import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Sidebar, Loader],
  templateUrl: './main-layout.html'
})
export class MainLayout {}
