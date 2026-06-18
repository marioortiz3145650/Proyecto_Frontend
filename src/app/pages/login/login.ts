import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    MessageModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  guestLoading = false;
  errorMsg = '';
  showPassword = false;

  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  onSubmit(): void {
    if (this.loading) return;
    if (!this.username.trim() || !this.password) {
      this.errorMsg = 'Completa usuario y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.access_token);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.password = '';
        this.errorMsg = err.status === 401
          ? 'Credenciales incorrectas.'
          : 'Error de conexión. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  loginAsGuest(): void {
    if (this.guestLoading) return;

    this.guestLoading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.auth.loginAsGuest().subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.access_token);
        this.guestLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.guestLoading = false;
        this.errorMsg = err.status === 401
          ? 'No hay usuario visitante configurado.'
          : 'Error de conexión. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}
