import { Component } from '@angular/core';
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
}