import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

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
        <div class="flex items-center space-x-4">
          <button pButton type="button" icon="pi pi-bell" class="p-button-rounded p-button-text"></button>
          <button pButton type="button" icon="pi pi-user" class="p-button-rounded p-button-text" 
                  [label]="userName"></button>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent {
  userName = 'Admin';
  @Output() toggleSidebar = new EventEmitter<void>();
}