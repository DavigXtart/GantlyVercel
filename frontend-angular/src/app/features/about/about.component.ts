import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  template: `
    <app-header />
    <main class="min-h-screen bg-cream text-forest" style="padding-top: 80px">

      <!-- Hero: photo + bio -->
      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-16 items-center">
          <!-- Photo -->
          <div class="relative rounded-3xl overflow-hidden soft-shadow border-2 border-sage/20 bg-white">
            <img src="assets/chumte.jpeg"
                 alt="&Aacute;lvaro Garc&iacute;a-Alonso"
                 class="w-full h-auto object-cover block" />
            <div class="absolute bottom-0 left-0 right-0 p-5"
                 style="background: linear-gradient(to top, rgba(26,46,34,0.9), transparent)">
              <p class="text-xl font-semibold text-white m-0">&Aacute;lvaro Garc&iacute;a-Alonso</p>
              <p class="text-sm text-white/90 mt-1 m-0">Licenciado en Psicolog&iacute;a &bull; Fundaci&oacute;n Gantly</p>
            </div>
          </div>

          <!-- Text + cards -->
          <div class="flex flex-col gap-7">
            <span class="text-xs tracking-widest uppercase font-semibold" style="color: var(--color-primary)">
              Visi&oacute;n ejecutiva del bienestar mental
            </span>
            <h1 class="text-4xl lg:text-6xl font-normal leading-[0.95] text-forest m-0">
              Psicolog&iacute;a estrat&eacute;gica para profesionales y organizaciones
            </h1>
            <p class="text-lg leading-relaxed text-forest/80">
              &Aacute;lvaro combina formaci&oacute;n acad&eacute;mica en psicolog&iacute;a con experiencia en evaluaci&oacute;n psicoemocional orientada a resultados. Su enfoque integra
              herramientas cl&iacute;nicas y metodolog&iacute;as de acompa&ntilde;amiento ejecutivo para ofrecer un servicio confidencial, medible y adaptado a cada etapa
              profesional.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
              @for (item of expertise; track item.title) {
                <div class="bg-white border-2 border-sage/20 rounded-2xl p-6 soft-shadow hover:-translate-y-1 hover:border-sage/40 transition-all duration-300">
                  <h3 class="text-base font-semibold text-forest mb-2">{{ item.title }}</h3>
                  <p class="text-sm leading-relaxed text-forest/60 m-0">{{ item.detail }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Methodology -->
      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="bg-white border-2 border-sage/15 rounded-3xl p-12 grid grid-cols-1 md:grid-cols-3 gap-10 soft-shadow">
          @for (item of methodology; track item.heading) {
            <div class="flex flex-col gap-4">
              <h3 class="text-xl font-semibold text-forest m-0">{{ item.heading }}</h3>
              <p class="text-base leading-relaxed text-forest/70 m-0">{{ item.body }}</p>
            </div>
          }
        </div>
      </section>

      <!-- CTA -->
      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="rounded-3xl p-14 text-center relative overflow-hidden"
             style="background: linear-gradient(135deg, var(--color-primary) 0%, #5b8fa8 100%)">
          <div class="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-white/10 blur-[40px]"></div>
          <div class="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white/8 blur-[40px]"></div>
          <div class="relative z-10">
            <h2 class="text-3xl lg:text-5xl font-bold mb-5 text-white">
              Descubre c&oacute;mo potenciar tu bienestar y liderazgo
            </h2>
            <p class="text-lg leading-relaxed max-w-2xl mx-auto text-white/90 mb-9">
              Agenda una reuni&oacute;n para explorar planes individuales y corporativos. Construimos procesos discretos y orientados a objetivos.
            </p>
            <a routerLink="/register"
               class="inline-block px-11 py-4 rounded-full bg-white font-semibold text-lg hover:-translate-y-0.5 hover:shadow-xl transition-all no-underline"
               style="color: var(--color-primary)">
              Coordinar una reuni&oacute;n
            </a>
          </div>
        </div>
      </section>
    </main>
  `
})
export class AboutComponent {
  expertise = [
    { title: 'Experiencia cl\u00ednica', detail: 'Evaluaci\u00f3n y seguimiento individual, enfoque integrativo.' },
    { title: 'Acompa\u00f1amiento ejecutivo', detail: 'Procesos de alto rendimiento y gesti\u00f3n emocional.' },
    { title: 'Mentor\u00eda estrat\u00e9gica', detail: 'Programas a medida para equipos directivos y founders.' }
  ];

  methodology = [
    {
      heading: 'Formaci\u00f3n continua',
      body: 'Programas de especializaci\u00f3n en psicolog\u00eda cl\u00ednica, salud mental y acompa\u00f1amiento empresarial. Colegiado y en supervisi\u00f3n permanente.'
    },
    {
      heading: 'Metodolog\u00eda',
      body: 'An\u00e1lisis cuantitativo y cualitativo, sesiones orientadas a objetivos y sistemas de seguimiento seguros para profesionales y equipos.'
    },
    {
      heading: 'Confidencialidad',
      body: 'Entorno protegido, protocolos GDPR y acuerdos de confidencialidad para procesos individuales y corporativos.'
    }
  ];
}
