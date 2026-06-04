import { Routes } from '@angular/router';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { Dashboard } from './pages/dashboard/dashboard';
import { Lotes } from './pages/gallinas/lotes/lotes';
import { Galpones } from './pages/gallinas/galpones/galpones';
import { Razas } from './pages/gallinas/razas/razas';
import { ProduccionPage } from './pages/produccion/produccion';
import { Alimentos } from './pages/alimentacion/alimentos/alimentos';
import { Consumo } from './pages/alimentacion/consumo/consumo';
import { Salud } from './pages/salud/salud';
import { Alertas } from './pages/alertas/alertas';
import { Reportes } from './pages/reportes/reportes';
import { Configuracion } from './pages/configuracion/configuracion';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'gallinas/lotes', component: Lotes },
  { path: 'gallinas/galpones', component: Galpones },
  { path: 'gallinas/razas', component: Razas },
  { path: 'produccion', component: ProduccionPage },
  { path: 'alimentacion/alimentos', component: Alimentos },
  { path: 'alimentacion/consumo', component: Consumo },
  { path: 'salud', component: Salud },
  { path: 'alertas', component: Alertas },
  { path: 'reportes', component: Reportes },
  { path: 'configuracion', component: Configuracion },
  { path: '**', redirectTo: '/dashboard' }
];
