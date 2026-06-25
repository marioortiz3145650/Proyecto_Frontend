import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Lotes } from './pages/gallinas/lotes/lotes';
import { Galpones } from './pages/gallinas/galpones/galpones';
import { Razas } from './pages/gallinas/razas/razas';
import { ProduccionManualComponent } from './pages/produccion/manual/produccion-manual';
import { ProduccionAutomaticaComponent } from './pages/produccion/automatica/produccion-automatica';
import { Alimentos } from './pages/alimentacion/alimentos/alimentos';
import { Consumo } from './pages/alimentacion/consumo/consumo';
import { Salud } from './pages/salud/salud';
import { Alertas } from './pages/alertas/alertas';
import { Reportes } from './pages/reportes/reportes';
import { Configuracion } from './pages/configuracion/configuracion';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: LoginComponent }
    ]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'gallinas/lotes', component: Lotes },
      { path: 'gallinas/galpones', component: Galpones },
      { path: 'gallinas/razas', component: Razas },
      { path: 'produccion', redirectTo: 'produccion/manual', pathMatch: 'full' },
      { path: 'produccion/manual', component: ProduccionManualComponent },
      { path: 'produccion/automatica', component: ProduccionAutomaticaComponent },
      { path: 'alimentacion/alimentos', component: Alimentos },
      { path: 'alimentacion/consumo', component: Consumo },
      { path: 'salud', component: Salud },
      { path: 'alertas', component: Alertas },
      { path: 'reportes', component: Reportes },
      { path: 'configuracion', component: Configuracion, canActivate: [roleGuard] },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
