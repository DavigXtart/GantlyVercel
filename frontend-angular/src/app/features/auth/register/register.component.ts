import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen flex items-center justify-center px-4 py-8" style="background: linear-gradient(135deg, #e8ece9 0%, #d4e0d8 50%, #e0e8e3 100%)">
      <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

        <!-- Left panel -->
        <div class="hidden md:block bg-white/90 p-10 lg:p-12 border border-sage/20" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(90,146,112,0.15)">
          <div class="mb-2">
            <span class="text-primary font-bold text-2xl" style="font-family: 'Nunito', sans-serif">Gantly</span>
          </div>
          <h1 class="text-3xl lg:text-4xl font-bold text-forest mb-3" style="font-family: 'Nunito', sans-serif">
            Comienza tu camino
          </h1>
          <p class="text-forest/60 text-base leading-relaxed mb-8">
            Crea tu cuenta y empieza tu camino hacia el bienestar emocional.
          </p>
          <ul class="space-y-4">
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Evaluaciones basadas en ciencia
            </li>
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Sesiones con profesionales especializados
            </li>
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Planes personalizados para ti
            </li>
          </ul>
          <div class="border-t border-sage/20 mt-8 pt-6 text-sm text-forest/50">
            ¿Ya tienes cuenta? <a routerLink="/login" class="text-primary hover:underline no-underline font-medium">Iniciar sesión</a>
          </div>
        </div>

        <!-- Right panel - Form -->
        <div class="bg-white/95 p-8 sm:p-10 border border-sage/20" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(90,146,112,0.15)">
          <h2 class="text-xl font-bold text-forest mb-6">Crear cuenta</h2>

          @if (formError) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              {{ formError }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label" for="name">Nombre completo</label>
              <input id="name" type="text" formControlName="name" class="form-input" placeholder="Tu nombre">
              @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
                <div class="form-error">
                  @if (registerForm.get('name')?.errors?.['required']) {
                    El nombre es obligatorio
                  } @else if (registerForm.get('name')?.errors?.['minlength']) {
                    Mínimo 2 caracteres
                  }
                </div>
              }
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label" for="reg-email">Correo electrónico</label>
              <input id="reg-email" type="email" formControlName="email" class="form-input" placeholder="tu@email.com">
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <div class="form-error">
                  @if (registerForm.get('email')?.errors?.['required']) {
                    El correo es obligatorio
                  } @else if (registerForm.get('email')?.errors?.['email']) {
                    Introduce un correo válido
                  }
                </div>
              }
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="form-label" for="reg-password">Contraseña</label>
              <input id="reg-password" type="password" formControlName="password" class="form-input" placeholder="Mínimo 6 caracteres">
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <div class="form-error">
                  @if (registerForm.get('password')?.errors?.['required']) {
                    La contraseña es obligatoria
                  } @else if (registerForm.get('password')?.errors?.['minlength']) {
                    Mínimo 6 caracteres
                  }
                </div>
              }
            </div>

            <!-- Birth Date -->
            <div class="form-group">
              <label class="form-label" for="birthDate">Fecha de nacimiento <span class="text-forest/40 font-normal">(opcional)</span></label>
              <input id="birthDate" type="date" formControlName="birthDate" class="form-input">
            </div>

            <button type="submit"
                    class="w-full mt-2 py-3 text-white font-semibold cursor-pointer border-0"
                    style="border-radius: 24px; background: #5a9270; font-size: 16px; box-shadow: 0 4px 12px rgba(90,146,112,0.3)"
                    [disabled]="loading"
                    [style.opacity]="loading ? 0.7 : 1">
              {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <div class="mt-4 text-center text-sm text-forest/50">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-primary hover:underline no-underline font-medium">Inicia sesión</a>
          </div>
        </div>
      </div>
    </main>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  formError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      birthDate: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.formError = '';

    const { name, email, password, birthDate } = this.registerForm.value;
    this.authService.register({ name, email, password, birthDate: birthDate || undefined }).subscribe({
      next: () => {
        this.toast.success('Cuenta creada correctamente');
        this.authService.me().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/dashboard'])
        });
      },
      error: (err) => {
        this.loading = false;
        this.formError = err.error?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
      }
    });
  }
}
