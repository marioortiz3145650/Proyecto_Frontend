import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

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
        <ng-container *ngFor="let item of visibleMenuItems">
          <div *ngIf="item.children" class="mt-4">
            <button 
              (click)="toggleMenu(item.label)"
              [class.bg-green-700]="isSectionActive(item)"
              class="flex items-center w-full px-4 py-2 rounded hover:bg-green-700 transition-colors bg-transparent border-0 text-white cursor-pointer">
              <i class="{{ item.icon }} mr-3"></i>
              <span class="flex-1 text-left">{{ item.label }}</span>
              <i class="pi {{ expandedMenus[item.label] ? 'pi-chevron-down' : 'pi-chevron-right' }}"></i>
            </button>
            <div *ngIf="expandedMenus[item.label]" class="ml-6 mt-1 space-y-1">
              <a *ngFor="let child of item.children"
                 [routerLink]="child.route"
                 routerLinkActive="bg-green-700"
                 (click)="onChildClick(item.label)"
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
export class SidebarComponent implements OnInit {
  expandedMenus: { [key: string]: boolean } = {};
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
  auth = inject(AuthService);
  private router = inject(Router);
  private currentParentSection: string | null = null;

  allMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    {
      label: 'Gallinas',
      icon: 'pi pi-box',
      children: [
        { label: 'Lotes', icon: 'pi pi-list', route: '/gallinas/lotes' },
        { label: 'Galpones', icon: 'pi pi-box', route: '/gallinas/galpones' }
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

  get visibleMenuItems(): MenuItem[] {
    if (this.auth.isVisitante()) {
      return this.allMenuItems.filter(item => item.label !== 'Configuración');
    }
    return this.allMenuItems;
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateExpandedMenus();
    });
    this.updateExpandedMenus();
  }

  private getActiveParentSection(): string | null {
    const url = this.router.url;
    const segments = url.split('/');
    const firstSegment = segments[1];
    
    // Encontrar el menú padre que coincide con el primer segmento
    for (const item of this.allMenuItems) {
      if (item.children) {
        const childRoutes = item.children.map(c => c.route?.split('/')[1]).filter(Boolean);
        if (childRoutes.includes(firstSegment)) {
          return item.label.toLowerCase();
        }
      }
      if (item.route?.split('/')[1] === firstSegment) {
        return null; // No es hijo de un menú
      }
    }
    return null;
  }

  isSectionActive(item: MenuItem): boolean {
    if (!item.children) return false;
    const childRoutes = item.children.map(c => c.route?.split('/')[1]).filter(Boolean);
    const currentParent = this.getActiveParentSection();
    return item.label.toLowerCase() === currentParent;
  }

  onChildClick(parentLabel: string): void {
    this.currentParentSection = parentLabel.toLowerCase();
  }

  updateExpandedMenus(): void {
    const currentParent = this.getActiveParentSection();
    this.allMenuItems.forEach(item => {
      if (item.children) {
        this.expandedMenus[item.label] = item.label.toLowerCase() === currentParent;
      }
    });
  }

  toggleMenu(label: string): void {
    this.expandedMenus[label] = !this.expandedMenus[label];
  }
}
