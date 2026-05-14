import { Component, signal } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';

@Component({
  selector: 'app-root',
  imports: [HttpClientModule, ButtonModule, CardModule, AdminLayoutComponent],
  template: `<app-admin-layout></app-admin-layout>`,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('laying-hens-frontend');
}
