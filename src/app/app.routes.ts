import { Routes } from '@angular/router';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { DashboardComponent } from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: '**', redirectTo: '/dashboard' }
];
