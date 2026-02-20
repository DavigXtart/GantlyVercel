import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen pt-16 bg-cream flex items-center justify-center px-4">
      <div class="card p-6 sm:p-8 w-full max-w-md">
        <h2 class="text-xl font-bold text-forest mb-6">Nueva contraseña</h2>

        @if (success) {
          <div class="bg-gentle-mint border border-sage/30 text-forest rounded-xl px-4 py-3 text-sm mb-4">
            Contraseña actualizada correctamente.
          </div>
          <a routerLink="/login" class="btn btn-primary w-full no-underline text-center">Ir al login</a>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="rp-password">Nueva contraseña</label>
              <input id="rp-password" type="password" formControlName="password" class="form-input" placeholder="Mínimo 6 caracteres">
              @if (resetForm.get('password')?.invalid && resetForm.get('password')?.touched) {
                <div class="form-error">Mínimo 6 caracteres</div>
              }
            </div>
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading">
              {{ loading ? 'Guardando...' : 'Restablecer contraseña' }}
            </button>
          </form>
        }
      </div>
    </main>
  `
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  success = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.authService.resetPassword(this.token, this.resetForm.value.password).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al restablecer la contraseña');
        this.loading = false;
      }
    });
  }
}
