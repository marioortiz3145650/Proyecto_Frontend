import { Component, Output, EventEmitter, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertaService } from '../../services/alerta';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <nav class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <button
            (click)="toggleSidebar.emit()"
            class="md:hidden p-2 mr-2 text-gray-600 hover:text-gray-900 focus:outline-none bg-transparent border-0 cursor-pointer">
            <i class="pi pi-bars text-xl"></i>
          </button>
          <span class="text-xl font-bold text-gray-800">Laying Hens</span>
        </div>
        <div class="flex items-center space-x-4 relative">
          <button
            (click)="irAAlertas()"
            class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none bg-transparent border-0 cursor-pointer relative flex items-center">
            <i class="pi pi-bell text-xl"></i>
            <span
              *ngIf="alertasCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[16px] h-[16px]">
              {{ alertasCount }}
            </span>
          </button>
          <button
            pButton
            type="button"
            icon="pi pi-user"
            class="p-button-rounded p-button-text"
            [label]="userName"
            (click)="toggleUserMenu()">
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
              <div class="flex items-center gap-2 text-xs text-gray-500 px-1">
                <i class="pi pi-id-card"></i>
                <span>ID: {{ userId }}</span>
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

    <!-- Backdrop to close menu -->
    <div *ngIf="showUserMenu" class="fixed inset-0 z-40" (click)="showUserMenu = false"></div>
  `,
  styles: []
})
export class NavbarComponent implements OnInit {
  userName = '';
  userRole = '';
  userId: number | string = '';
  showUserMenu = false;
  alertasCount = 0;

  @Output() toggleSidebar = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);
  private alertaService = inject(AlertaService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user) {
      this.userName = user.username;
      this.userRole = user.rol || 'Usuario';
      this.userId = user.id;
    }
    this.cargarAlertasCount();
    this.alertaService.refreshCount$.subscribe(() => {
      this.cargarAlertasCount();
    });
  }

cargarAlertasCount(): void {
    // Mostrar alertas pendientes (no leídas = leida: false)
    this.alertaService.getAlertas({ leida: false, limit: 1 }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.alertasCount = res.meta?.total || 0;
          setTimeout(() => this.cdr.detectChanges(), 0);
        });
      },
      error: () => {
        this.ngZone.run(() => {
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
