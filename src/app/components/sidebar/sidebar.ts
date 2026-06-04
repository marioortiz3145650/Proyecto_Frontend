import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    <aside 
      [class.-translate-x-full]="!isOpen"
      class="bg-green-800 text-white w-64 min-h-screen p-4 fixed md:static inset-y-0 left-0 transform md:transform-none transition-transform duration-200 ease-in-out z-30 md:translate-x-0">
      
      <!-- Close button visible only on mobile -->
      <div class="flex justify-end md:hidden mb-4">
        <button (click)="closeSidebar.emit()" class="text-white hover:text-gray-300 focus:outline-none bg-transparent border-0 cursor-pointer p-1">
          <i class="pi pi-times text-xl"></i>
        </button>
      </div>

      <nav class="space-y-2">
        <ng-container *ngFor="let item of menuItems">
          <div *ngIf="item.children" class="mt-4">
            <button 
              (click)="toggleMenu(item.label)"
              class="flex items-center w-full px-4 py-2 rounded hover:bg-green-700 transition-colors bg-transparent border-0 text-white cursor-pointer">
              <i class="{{ item.icon }} mr-3"></i>
              <span class="flex-1 text-left">{{ item.label }}</span>
              <i class="pi {{ expandedMenus[item.label] ? 'pi-chevron-down' : 'pi-chevron-right' }}"></i>
            </button>
            <div *ngIf="expandedMenus[item.label]" class="ml-6 mt-1 space-y-1">
              <a *ngFor="let child of item.children"
                 [routerLink]="child.route"
                 routerLinkActive="bg-green-700"
                 (click)="closeSidebar.emit()"
                 class="flex items-center px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm text-white no-underline">
                <i class="{{ child.icon }} mr-3 text-xs"></i>
                <span>{{ child.label }}</span>
              </a>
            </div>
          </div>
          <a *ngIf="!item.children"
             [routerLink]="item.route"
             routerLinkActive="bg-green-700"
             (click)="closeSidebar.emit()"
             class="flex items-center px-4 py-2 rounded hover:bg-green-700 transition-colors text-white no-underline">
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
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/usuarios' },
    { 
      label: 'Gallinas', 
      icon: 'pi pi-box',
      children: [
        { label: 'Lotes', icon: 'pi pi-list', route: '/gallinas/lotes' },
        { label: 'Galpones', icon: 'pi pi-box', route: '/gallinas/galpones' },
        { label: 'Razas', icon: 'pi pi-book', route: '/gallinas/razas' }
      ]
    },
    { label: 'Producción', icon: 'pi pi-chart-line', route: '/produccion' },
    { 
      label: 'Alimentación', 
      icon: 'pi pi-shopping-cart',
      children: [
        { label: 'Alimentos', icon: 'pi pi-list', route: '/alimentacion/alimentos' },
        { label: 'Consumo', icon: 'pi pi-calendar-plus', route: '/alimentacion/consumo' }
      ]
    },
    { label: 'Salud', icon: 'pi pi-heart', route: '/salud' },
    { label: 'Alertas', icon: 'pi pi-bell', route: '/alertas' },
    { label: 'Reportes', icon: 'pi pi-file', route: '/reportes' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/configuracion' }
  ];

  toggleMenu(label: string): void {
    this.expandedMenus[label] = !this.expandedMenus[label];
  }
}
