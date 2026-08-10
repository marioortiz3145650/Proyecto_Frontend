import { Component, Output, EventEmitter, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertaService } from '../../services/alerta';
import { ToastService } from '../../services/toast.service';

interface NavSearchResult {
  label: string;
  route: string;
  category: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
    <nav class="shadow-md px-4 py-3 text-white" style="background-color: #2e6f40; border-bottom: 1px solid #245732;">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button
            (click)="toggleSidebar.emit()"
            class="md:hidden p-2 text-white hover:text-green-100 focus:outline-none bg-transparent border-0 cursor-pointer">
            <i class="pi pi-bars text-xl"></i>
          </button>
          <span class="text-xl font-bold text-white tracking-wide">Laying Hens</span>
        </div>

        <!-- Global Search Bar in Navbar -->
        <div class="flex-1 max-w-xl mx-4 relative hidden sm:block">
          <div class="relative w-full">
            <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-green-200 text-sm"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (focus)="showSearchResults = true"
              placeholder="Buscar vista o módulo en el sistema (ej: lotes, salud, alertas)..."
              class="w-full bg-[#204d2c] text-white placeholder-green-200 text-sm rounded-full pl-10 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 border border-green-700 transition-all shadow-inner"
            />
            <button
              *ngIf="searchQuery"
              (click)="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-green-200 hover:text-white bg-transparent border-0 cursor-pointer p-0.5">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <!-- Quick Results Dropdown -->
          <div
            *ngIf="showSearchResults && filteredNavItems.length > 0"
            class="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-gray-800"
            (click)="$event.stopPropagation()">
            <div class="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Vistas coincidentes ({{ filteredNavItems.length }})
            </div>
            <ul class="max-h-60 overflow-y-auto m-0 p-0 list-none">
              <li *ngFor="let item of filteredNavItems">
                <button
                  (click)="navigateItem(item.route)"
                  class="w-full text-left px-4 py-2.5 hover:bg-green-50 flex items-center justify-between transition-colors border-0 bg-transparent cursor-pointer border-b border-gray-50 last:border-0">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                      <i [class]="'pi ' + item.icon"></i>
                    </div>
                    <div>
                      <div class="font-medium text-sm text-gray-900">{{ item.label }}</div>
                      <div class="text-xs text-gray-500">{{ item.category }}</div>
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-xs text-gray-400"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex items-center space-x-4 relative">
          <button
            (click)="irAAlertas()"
            class="p-2 text-white hover:text-green-100 focus:outline-none bg-transparent border-0 cursor-pointer relative flex items-center"
            title="Centro de Alertas">
            <i class="pi pi-bell text-xl"></i>
            <span
              *ngIf="alertasCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[16px] h-[16px]">
              {{ alertasCount }}
            </span>
          </button>
          <button
            (click)="toggleUserMenu()"
            class="w-10 h-10 rounded-full bg-white text-[#2e6f40] hover:bg-green-50 flex items-center justify-center border-0 cursor-pointer shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
            title="Perfil de usuario ({{ userName }})">
            <i class="pi pi-user text-xl font-bold"></i>
          </button>

          <!-- User info modal -->
          <div
            *ngIf="showUserMenu"
            class="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
            (click)="$event.stopPropagation()">
            <div class="flex flex-col items-center mb-4">
              <div class="w-14 h-14 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center mb-2">
                <i class="pi pi-user text-2xl text-green-700"></i>
              </div>
              <span class="font-semibold text-gray-800 text-sm">{{ userName }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full mt-1"
                    [class.bg-blue-100]="userRole === 'Administrador'"
                    [class.text-blue-700]="userRole === 'Administrador'"
                    [class.bg-amber-100]="userRole === 'Aprendiz'"
                    [class.text-amber-700]="userRole === 'Aprendiz'"
                    [class.bg-gray-100]="userRole === 'Visitante'"
                    [class.text-gray-600]="userRole === 'Visitante'">
                {{ userRole }}
              </span>
            </div>
            <div class="border-t border-gray-100 pt-3 space-y-1">
              <div class="flex items-center gap-2 text-xs text-gray-500 px-1" *ngIf="userNombre">
                <i class="pi pi-id-card"></i>
                <span>Nombre: {{ userNombre }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500 px-1" *ngIf="userCorreo">
                <i class="pi pi-envelope"></i>
                <span>Correo: {{ userCorreo }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500 px-1" *ngIf="userName">
                <i class="pi pi-user"></i>
                <span>Usuario: {{ userName }}</span>
              </div>
            </div>
            <div class="border-t border-gray-100 mt-3 pt-3">
              <button
                (click)="logout()"
                class="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-colors border-0 cursor-pointer">
                <i class="pi pi-sign-out"></i>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Backdrop to close dropdowns -->
    <div *ngIf="showUserMenu || showSearchResults" class="fixed inset-0 z-40" (click)="closeDropdowns()"></div>
  `,
  styles: []
})
export class NavbarComponent implements OnInit {
  userName = '';
  userRole = '';
  userId: number | string = '';
  userNombre = '';
  userCorreo = '';
  showUserMenu = false;
  alertasCount = 0;

  searchQuery = '';
  showSearchResults = false;
  filteredNavItems: NavSearchResult[] = [];

  navModules: NavSearchResult[] = [
    { label: 'Dashboard', route: '/dashboard', category: 'General', icon: 'pi-home' },
    { label: 'Lotes de Gallinas', route: '/gallinas/lotes', category: 'Gestión de Gallinas', icon: 'pi-list' },
    { label: 'Galpones', route: '/gallinas/galpones', category: 'Gestión de Gallinas', icon: 'pi-box' },
    { label: 'Razas', route: '/gallinas/razas', category: 'Gestión de Gallinas', icon: 'pi-book' },
    { label: 'Producción Manual', route: '/produccion/manual', category: 'Producción', icon: 'pi-pencil' },
    { label: 'Detección Automática (Cámara)', route: '/produccion/automatica', category: 'Producción', icon: 'pi-camera' },
    { label: 'Alimentos e Insumos', route: '/alimentacion/alimentos', category: 'Alimentación', icon: 'pi-shopping-bag' },
    { label: 'Consumo de Alimentos', route: '/alimentacion/consumo', category: 'Alimentación', icon: 'pi-chart-line' },
    { label: 'Salud y Control Veterinario', route: '/salud', category: 'Sanidad', icon: 'pi-heart-fill' },
    { label: 'Centro de Alertas', route: '/alertas', category: 'Monitoreo', icon: 'pi-bell' },
    { label: 'Reportes y Estadísticas', route: '/reportes', category: 'Analítica', icon: 'pi-chart-bar' },
    { label: 'Configuración del Sistema', route: '/configuracion', category: 'Administración', icon: 'pi-cog' },
    { label: 'Usuarios del Sistema', route: '/usuarios', category: 'Administración', icon: 'pi-users' },
  ];

  @Output() toggleSidebar = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);
  private alertaService = inject(AlertaService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private toast = inject(ToastService);

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user) {
      this.userName = user.username;
      this.userRole = user.rol || 'Usuario';
      this.userId = user.id;
      this.userNombre = user.nombre || '';
      this.userCorreo = user.correo || '';
    }
    this.cargarAlertasCount();
    this.alertaService.refreshCount$.subscribe(() => {
      this.cargarAlertasCount();
    });
  }

  onSearchInput(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredNavItems = [];
      this.showSearchResults = false;
      return;
    }
    this.filteredNavItems = this.navModules.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.route.toLowerCase().includes(q)
    );
    this.showSearchResults = true;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredNavItems = [];
    this.showSearchResults = false;
  }

  navigateItem(route: string): void {
    this.clearSearch();
    this.router.navigate([route]);
  }

  closeDropdowns(): void {
    this.showUserMenu = false;
    this.showSearchResults = false;
  }

  cargarAlertasCount(): void {
    this.alertaService.getAlertas({ leida: false, limit: 1 }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.alertasCount = res.meta?.total || 0;
          setTimeout(() => this.cdr.detectChanges(), 0);
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toast.error('No se pudo cargar el contador de alertas.', 'Error');
          this.alertasCount = 0;
          setTimeout(() => this.cdr.detectChanges(), 0);
        });
      }
    });
  }

  irAAlertas(): void {
    this.router.navigate(['/alertas']);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.showUserMenu = false;
    this.auth.logout();
  }
}

