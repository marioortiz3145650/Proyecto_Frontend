import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div>
      <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <p-card header="Galpones" styleClass="shadow-sm">
          <div class="text-3xl font-bold text-blue-600">12</div>
          <p class="text-gray-600">Activos</p>
        </p-card>
        <p-card header="Gallinas" styleClass="shadow-sm">
          <div class="text-3xl font-bold text-green-600">1,240</div>
          <p class="text-gray-600">En producción</p>
        </p-card>
        <p-card header="Huevos Hoy" styleClass="shadow-sm">
          <div class="text-3xl font-bold text-yellow-600">845</div>
          <p class="text-gray-600">Unidades</p>
        </p-card>
        <p-card header="Alimento" styleClass="shadow-sm">
          <div class="text-3xl font-bold text-red-600">45kg</div>
          <p class="text-gray-600">Consumo diario</p>
        </p-card>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardPage { }