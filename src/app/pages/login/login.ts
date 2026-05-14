import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, ButtonModule],
  template: `
    <div>
      <h2 class="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Usuario</label>
          <input pInputText type="text" [(ngModel)]="username" name="username" 
                 class="w-full" placeholder="Ingrese su usuario" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Contraseña</label>
          <p-password [(ngModel)]="password" [feedback]="false" 
                      name="password" placeholder="Ingrese su contraseña" 
                      class="w-full" [toggleMask]="true" required />
        </div>
        <button pButton type="submit" label="Ingresar" 
                class="w-full" [loading]="loading"></button>
      </form>
    </div>
  `,
  styles: []
})
export class LoginPage {
  username = '';
  password = '';
  loading = false;

  onSubmit(): void {
    this.loading = true;
    // TODO: Implementar autenticación
    setTimeout(() => this.loading = false, 1000);
  }
}