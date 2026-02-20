import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-soy-profesional',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen pt-20 bg-cream">
      <!-- Hero -->
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="badge badge-success mb-4">Para profesionales</div>
            <h1 class="text-4xl sm:text-5xl font-bold text-forest mb-4" style="font-family: var(--font-heading)">
              Únete como <span class="text-primary serif-font italic">psicólogo</span>
            </h1>
            <p class="text-lg text-forest/60 mb-6 leading-relaxed">
              Amplía tu consulta, gestiona pacientes y ofrece terapia online con las mejores herramientas.
            </p>
            <a routerLink="/register" class="btn btn-primary text-base px-8 py-3 no-underline">
              Registrarme como profesional
            </a>
          </div>
          <div class="hidden lg:block">
            <div class="grid grid-cols-3 gap-3">
              @for (img of geminiImages; track img.src) {
                <div class="aspect-square rounded-full overflow-hidden bg-gradient-to-br from-gentle-mint to-mint">
                  <img [src]="img.src" [alt]="img.alt"
                       class="w-full h-full object-cover" />
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Professional Image Section -->
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-2xl font-bold text-forest mb-4">Tu consulta, potenciada</h2>
            <p class="text-forest/60 leading-relaxed mb-4">
              Con Gantly tendrás todas las herramientas que necesitas para gestionar tus pacientes,
              sesiones y evaluaciones desde una sola plataforma.
            </p>
            <ul class="space-y-3 text-sm text-forest/70">
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                Panel de control con vista completa de pacientes
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                Asignación y seguimiento de tests psicológicos
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                Chat seguro y cifrado con cada paciente
              </li>
            </ul>
          </div>
          <div class="rounded-3xl overflow-hidden" style="aspect-ratio: 4/5; background: var(--color-mint)">
            <img src="assets/imagenProfesional.jpg"
                 alt="Profesional de psicología"
                 class="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <!-- Steps -->
      <section class="py-16 px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-2xl font-bold text-forest text-center mb-10">¿Cómo empezar?</h2>
          <div class="space-y-6">
            @for (step of steps; track step.num; let i = $index) {
              <div class="flex gap-4 items-start">
                <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                  {{ step.num }}
                </div>
                <div>
                  <h3 class="font-bold text-forest">{{ step.title }}</h3>
                  <p class="text-sm text-forest/60">{{ step.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="py-16 bg-forest text-white px-4">
        <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          @for (stat of stats; track stat.label) {
            <div>
              <div class="text-3xl font-bold" style="color: white">{{ stat.value }}</div>
              <div class="text-sm text-white/60 mt-1">{{ stat.label }}</div>
            </div>
          }
        </div>
      </section>
    </main>
  `
})
export class SoyProfesionalComponent {
  geminiImages = [
    { src: 'assets/Gemini_Generated_Image_gvn6grgvn6grgvn6.png', alt: 'Psicólogo 1' },
    { src: 'assets/Gemini_Generated_Image_9ho60t9ho60t9ho6.png', alt: 'Psicólogo 2' },
    { src: 'assets/Gemini_Generated_Image_pg3gfvpg3gfvpg3g.png', alt: 'Psicólogo 3' },
    { src: 'assets/Gemini_Generated_Image_kng45nkng45nkng4.png', alt: 'Psicólogo 4' },
    { src: 'assets/Gemini_Generated_Image_xta9abxta9abxta9.png', alt: 'Psicólogo 5' },
    { src: 'assets/Gemini_Generated_Image_wqpn45wqpn45wqpn.png', alt: 'Psicólogo 6' },
  ];

  steps = [
    { num: 1, title: 'Regístrate', description: 'Crea tu cuenta como profesional en menos de 2 minutos.' },
    { num: 2, title: 'Completa tu perfil', description: 'Añade tu formación, especialización y precios.' },
    { num: 3, title: 'Recibe pacientes', description: 'Nuestro sistema de matching te conectará con pacientes compatibles.' },
    { num: 4, title: 'Empieza a trabajar', description: 'Gestiona citas, tareas, tests y sesiones desde tu dashboard.' }
  ];

  stats = [
    { value: '200+', label: 'Psicólogos' },
    { value: '1.500+', label: 'Pacientes' },
    { value: '10.000+', label: 'Sesiones' },
    { value: '4.8/5', label: 'Valoración media' }
  ];
}
