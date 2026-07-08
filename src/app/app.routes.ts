import { Routes } from '@angular/router';
import { authGuard, adminGuard, roleGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'gallinas/lotes', loadComponent: () => import('./pages/gallinas/lotes/lotes').then(m => m.Lotes) },
      { path: 'gallinas/galpones', loadComponent: () => import('./pages/gallinas/galpones/galpones').then(m => m.Galpones) },
      { path: 'gallinas/razas', loadComponent: () => import('./pages/gallinas/razas/razas').then(m => m.Razas) },
      { path: 'produccion', redirectTo: 'produccion/manual', pathMatch: 'full' },
      { path: 'produccion/manual', loadComponent: () => import('./pages/produccion/manual/produccion-manual').then(m => m.ProduccionManualComponent) },
      { path: 'produccion/automatica', loadComponent: () => import('./pages/produccion/automatica/produccion-automatica').then(m => m.ProduccionAutomaticaComponent) },
      { path: 'alimentacion/alimentos', loadComponent: () => import('./pages/alimentacion/alimentos/alimentos').then(m => m.Alimentos) },
      { path: 'alimentacion/consumo', loadComponent: () => import('./pages/alimentacion/consumo/consumo').then(m => m.Consumo) },
      { path: 'salud', loadComponent: () => import('./pages/salud/salud').then(m => m.Salud) },
      { path: 'alertas', loadComponent: () => import('./pages/alertas/alertas').then(m => m.Alertas) },
      { path: 'reportes', loadComponent: () => import('./pages/reportes/reportes').then(m => m.Reportes) },
      { path: 'configuracion', loadComponent: () => import('./pages/configuracion/configuracion').then(m => m.Configuracion), canActivate: [roleGuard] },
      { path: 'usuarios', loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent), canActivate: [adminGuard] },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
