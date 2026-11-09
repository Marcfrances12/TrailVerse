import { Routes } from '@angular/router';
import { ShopDetail } from './pages/shop-detail/shop-detail';
import { ShopList } from './pages/shop-list/shop-list';

export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopList, title: 'Rutas · TrailVerse' },
  { path: ':slug', component: ShopDetail, title: 'Detalle de ruta · TrailVerse' }
];
