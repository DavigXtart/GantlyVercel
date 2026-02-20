import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen flex items-center justify-center px-4 py-8" style="background: linear-gradient(135deg, #e8ece9 0%, #d4e0d8 50%, #e0e8e3 100%)">
      <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

        <!-- Left panel - Info -->
        <div class="hidden md:block bg-white/90 p-10 lg:p-12 border border-sage/20" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(90,146,112,0.15)">
          <div class="mb-2">
            <span class="text-primary font-bold text-2xl" style="font-family: 'Nunito', sans-serif">Gantly</span>
          </div>
          <h1 class="text-3xl lg:text-4xl font-bold text-forest mb-3" style="font-family: 'Nunito', sans-serif">
            Bienvenido de nuevo
          </h1>
          <p class="text-forest/60 text-base leading-relaxed mb-8">
            Conecta con tu espacio de bienestar emocional.
            Accede a tus evaluaciones, seguimiento personalizado y sesiones con profesionales de la psicología.
          </p>
          <ul class="space-y-4">
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Evaluaciones personalizadas
            </li>
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Seguimiento emocional confidencial
            </li>
            <li class="flex items-center gap-3 text-sm text-forest/70">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs" style="background: #d4e0d8">&#10003;</span>
              Planes adaptados a ti
            </li>
          </ul>
          <div class="border-t border-sage/20 mt-8 pt-6 text-sm text-forest/50">
            ¿No tienes cuenta? <a routerLink="/register" class="text-primary hover:underline no-underline font-medium">Crear cuenta</a>
          </div>
        </div>

        <!-- Right panel - Form -->
        <div class="bg-white/95 p-8 sm:p-10 border border-sage/20" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(90,146,112,0.15)">
          <h2 class="text-xl font-bold text-forest mb-1">Iniciar sesión</h2>
          <p class="text-sm text-forest/60 mb-6">Ingresa tus datos para acceder a tu espacio personal.</p>

          @if (formError) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              {{ formError }}
            </div>
          }

          <!-- Google OAuth (top, like React) -->
          <a [href]="googleLoginUrl"
             class="w-full py-3 rounded-full border border-gray-200 flex items-center justify-center gap-3 no-underline text-forest hover:bg-gray-50 transition-colors mb-4 text-sm font-medium"
             style="display: flex">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </a>

          <div class="relative flex items-center my-4">
            <div class="flex-1 border-t border-gray-200"></div>
            <span class="px-3 text-xs text-gray-400">o</span>
            <div class="flex-1 border-t border-gray-200"></div>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Email -->
            <div class="form-group">
              <label class="text-sm font-medium text-forest" for="email">Email <span class="text-red-400">*</span></label>
              <input id="email"
                     type="email"
                     formControlName="email"
                     class="w-full mt-1 px-4 py-3 rounded-xl border-0 text-sm"
                     style="background: #edf3f0"
                     placeholder="tu@email.com">
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <div class="form-error">
                  @if (loginForm.get('email')?.errors?.['required']) {
                    El correo es obligatorio
                  } @else if (loginForm.get('email')?.errors?.['email']) {
                    Introduce un correo válido
                  }
                </div>
              }
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="text-sm font-medium text-forest" for="password">Contraseña <span class="text-red-400">*</span></label>
              <input id="password"
                     type="password"
                     formControlName="password"
                     class="w-full mt-1 px-4 py-3 rounded-xl border-0 text-sm"
                     style="background: #edf3f0"
                     placeholder="Tu contraseña">
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <div class="form-error">
                  @if (loginForm.get('password')?.errors?.['required']) {
                    La contraseña es obligatoria
                  } @else if (loginForm.get('password')?.errors?.['minlength']) {
                    Mínimo 6 caracteres
                  }
                </div>
              }
            </div>

            <!-- Links above button -->
            <div class="flex flex-col gap-1 mb-4 text-sm">
              <a routerLink="/register" class="text-primary hover:underline no-underline">Soy empresa</a>
              <a routerLink="/forgot-password" class="text-primary hover:underline no-underline">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit"
                    class="w-full py-3 text-white font-semibold cursor-pointer border-0"
                    style="border-radius: 24px; background: #5a9270; font-size: 16px; box-shadow: 0 4px 12px rgba(90,146,112,0.3)"
                    [disabled]="loading"
                    [style.opacity]="loading ? 0.7 : 1">
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>
        </div>
      </div>
    </main>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  formError = '';
  googleLoginUrl: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.googleLoginUrl = this.authService.getOAuth2LoginUrl('google');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.formError = '';

    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.authService.me().subscribe({
          next: (user) => {
            this.toast.success('Sesión iniciada correctamente');
            switch (user.role) {
              case 'PSYCHOLOGIST':
                this.router.navigate(['/psych']);
                break;
              case 'ADMIN':
                this.router.navigate(['/admin']);
                break;
              default:
                this.router.navigate(['/dashboard']);
            }
          },
          error: () => {
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.formError = 'Credenciales incorrectas. Revisa tu email y contraseña.';
        } else {
          this.formError = 'Error al conectar con el servidor. Inténtalo de nuevo.';
        }
      }
    });
  }
}
