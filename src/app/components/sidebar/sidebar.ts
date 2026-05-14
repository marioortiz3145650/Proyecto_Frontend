import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="bg-green-800 text-white w-64 min-h-screen p-4">
      <nav class="space-y-2">
        <ng-container *ngFor="let item of menuItems">
          <div *ngIf="item.children" class="mt-4">
            <button 
              (click)="toggleMenu(item.label)"
              class="flex items-center w-full px-4 py-2 rounded hover:bg-green-700 transition-colors">
              <i class="{{ item.icon }} mr-3"></i>
              <span class="flex-1 text-left">{{ item.label }}</span>
              <i class="pi {{ expandedMenus[item.label] ? 'pi-chevron-down' : 'pi-chevron-right' }}"></i>
            </button>
            <div *ngIf="expandedMenus[item.label]" class="ml-6 mt-1 space-y-1">
              <a *ngFor="let child of item.children"
                 [routerLink]="child.route"
                 routerLinkActive="bg-green-700"
                 class="flex items-center px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm">
                <i class="{{ child.icon }} mr-3 text-xs"></i>
                <span>{{ child.label }}</span>
              </a>
            </div>
          </div>
          <a *ngIf="!item.children"
             [routerLink]="item.route"
             routerLinkActive="bg-green-700"
             class="flex items-center px-4 py-2 rounded hover:bg-green-700 transition-colors">
            <i class="{{ item.icon }} mr-3"></i>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
    </aside>
  `,
  styles: []
})
export class SidebarComponent {
  expandedMenus: { [key: string]: boolean } = {};

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/usuarios' },
    { 
      label: 'Gallinas', 
      icon: 'pi pi-box',
      children: [
        { label: 'Lotes', icon: 'pi pi-list', route: '/gallinas/lotes' },
        { label: 'Galpones', icon: 'pi pi-box', route: '/gallinas/galpones' },
        { label: 'Razas', icon: 'pi pi-book', route: '/gallinas/razas' },
        { label: 'Cierres', icon: 'pi pi-calendar', route: '/gallinas/cierres' }
      ]
    },
    { label: 'Producción', icon: 'pi pi-chart-line', route: '/produccion' },
    { label: 'Alimentos', icon: 'pi pi-shopping-cart', route: '/alimentos' },
    { label: 'Salud', icon: 'pi pi-heart', route: '/salud' },
    { label: 'Alertas', icon: 'pi pi-bell', route: '/alertas' },
    { label: 'Reportes', icon: 'pi pi-file', route: '/reportes' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/configuracion' }
  ];

  toggleMenu(label: string): void {
    this.expandedMenus[label] = !this.expandedMenus[label];
  }
}
