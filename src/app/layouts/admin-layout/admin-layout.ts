import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="flex flex-col h-screen">
      <app-navbar (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-navbar>
      <div class="flex flex-1 overflow-hidden relative">
        <app-sidebar [isOpen]="sidebarOpen" (closeSidebar)="sidebarOpen = false"></app-sidebar>
        <!-- Dim overlay backdrop on mobile when sidebar is open -->
        <div *ngIf="sidebarOpen" (click)="sidebarOpen = false" class="md:hidden fixed inset-0 bg-black/50 z-20"></div>
        <main class="flex-1 overflow-auto bg-gray-100 p-4 md:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AdminLayoutComponent {
  sidebarOpen = false;
}