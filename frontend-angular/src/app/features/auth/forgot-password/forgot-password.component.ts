import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen pt-16 bg-cream flex items-center justify-center px-4">
      <div class="card p-6 sm:p-8 w-full max-w-md">
        <h2 class="text-xl font-bold text-forest mb-2">Recuperar contraseña</h2>
        <p class="text-sm text-forest/60 mb-6">Te enviaremos un enlace para restablecer tu contraseña.</p>

        @if (sent) {
          <div class="bg-gentle-mint border border-sage/30 text-forest rounded-xl px-4 py-3 text-sm">
            Se ha enviado un correo de recuperación a <strong>{{ forgotForm.value.email }}</strong>.
            Revisa tu bandeja de entrada.
          </div>
        } @else {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="fp-email">Correo electrónico</label>
              <input id="fp-email" type="email" formControlName="email" class="form-input" placeholder="tu@email.com">
              @if (forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched) {
                <div class="form-error">Introduce un correo válido</div>
              }
            </div>
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
              {{ loading ? 'Enviando...' : 'Enviar enlace' }}
            </button>
          </form>
        }

        <div class="mt-4 text-center">
          <a routerLink="/login" class="text-sm text-primary hover:underline no-underline">Volver al login</a>
        </div>
      </div>
    </main>
  `
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  sent = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private toast: ToastService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al enviar el correo');
        this.loading = false;
      }
    });
  }
}
