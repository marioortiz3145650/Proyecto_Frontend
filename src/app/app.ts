import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  template: `
    <router-outlet></router-outlet>
    <p-toast position="top-right" [baseZIndex]="5000"></p-toast>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('laying-hens-frontend');
}