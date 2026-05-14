import { Routes } from '@angular/router';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Lotes } from './pages/gallinas/lotes/lotes';
import { Galpones } from './pages/gallinas/galpones/galpones';
import { Razas } from './pages/gallinas/razas/razas';
import { Cierres } from './pages/gallinas/cierres/cierres';
import { Produccion } from './pages/produccion/produccion';
import { Alimentos } from './pages/alimentos/alimentos';
import { Salud } from './pages/salud/salud';
import { Alertas } from './pages/alertas/alertas';
import { Reportes } from './pages/reportes/reportes';
import { Configuracion } from './pages/configuracion/configuracion';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'gallinas/lotes', component: Lotes },
  { path: 'gallinas/galpones', component: Galpones },
  { path: 'gallinas/razas', component: Razas },
  { path: 'gallinas/cierres', component: Cierres },
  { path: 'produccion', component: Produccion },
  { path: 'alimentos', component: Alimentos },
  { path: 'salud', component: Salud },
  { path: 'alertas', component: Alertas },
  { path: 'reportes', component: Reportes },
  { path: 'configuracion', component: Configuracion },
  { path: '**', redirectTo: '/dashboard' }
];
