import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { QuotesService, Quote } from '../../core/services/quotes.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  template: `
    <app-header />

    <!-- Hero -->
    <section class="pb-24 px-8 max-w-7xl mx-auto overflow-hidden" style="padding-top: 120px">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <div class="relative z-10">
          <span class="inline-block px-4 py-1.5 bg-mint rounded-full text-xs font-medium tracking-widest uppercase mb-8"
                style="color: var(--color-primary)">
            Matching psicol&oacute;gico con cuidado humano
          </span>
          <h1 class="text-5xl lg:text-7xl font-normal leading-[0.9] mb-8 text-forest">
            Encuentra al <span class="italic text-sage serif-font">psic&oacute;logo ideal</span> para ti.
          </h1>
          <p class="text-lg text-forest/80 mb-10 max-w-xl leading-relaxed font-light">
            Te acompa&ntilde;amos desde el primer test hasta la primera sesi&oacute;n. Menos fricci&oacute;n, m&aacute;s tiempo para tu bienestar
            emocional.
          </p>
          <div class="flex flex-wrap gap-4">
            <a routerLink="/register"
               class="bg-forest text-cream px-8 py-3 rounded-full font-medium text-base hover:shadow-xl transition-all no-underline">
              Comenzar ahora
            </a>
            <a href="#care"
               class="group border border-sage/30 px-8 py-3 rounded-full font-medium text-base hover:bg-mint/40 transition-all flex items-center gap-2 no-underline text-forest">
              C&oacute;mo funciona
              <span class="material-symbols-outlined text-sage group-hover:translate-x-1 transition-transform text-base">
                arrow_forward
              </span>
            </a>
          </div>
        </div>
        <div class="relative hidden lg:block">
          <div class="absolute inset-0 bg-mint/30 rounded-full -z-10 blur-3xl opacity-60"></div>
          <img src="assets/7442f63c-5cbb-4d4f-bef4-7209cc3f4880_removalai_preview.png"
               alt="Gantly"
               class="mx-auto"
               style="width: 139%; max-width: none; height: auto; margin-left: -100px" />
        </div>
      </div>
    </section>

    <!-- Mini features strip -->
    <div class="px-8 py-16 bg-mint/20 border-y border-mint/40">
      <div class="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-10" style="color: var(--color-primary)">
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
          <span class="material-symbols-outlined text-base" style="color: var(--color-primary)">psychology</span>
          Matching inteligente
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
          <span class="material-symbols-outlined text-base" style="color: var(--color-primary)">self_improvement</span>
          Test inicial guiado
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
          <span class="material-symbols-outlined text-base" style="color: var(--color-primary)">calendar_today</span>
          Agenda online
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
          <span class="material-symbols-outlined text-base" style="color: var(--color-primary)">chat</span>
          Chat y videollamadas seguras
        </div>
      </div>
    </div>

    <!-- Daily Quote (External API - ZenQuotes) -->
    @if (dailyQuote) {
      <section class="py-10 bg-cream">
        <div class="max-w-3xl mx-auto px-8 text-center">
          <p class="text-xl italic text-forest/80 serif-font leading-relaxed">&ldquo;{{ dailyQuote.text }}&rdquo;</p>
          <p class="text-sm text-sage font-medium mt-3">&mdash; {{ dailyQuote.author }}</p>
          <p class="text-xs text-forest/30 mt-1">Frase del d&iacute;a &middot; Powered by ZenQuotes API</p>
        </div>
      </section>
    }

    <!-- Philosophy -->
    <section class="py-24 px-8 bg-cream">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 class="text-4xl lg:text-6xl font-normal mb-6 leading-tight text-forest">
            Un espacio tranquilo para<span class="italic text-sage serif-font"> tomar decisiones con calma.</span>
          </h2>
          <p class="text-forest/80 text-base leading-relaxed mb-8 font-light">
            Gantly no es solo un directorio de psic&oacute;logos. Es una experiencia completa: test inicial, matching
            avanzado y un panel sencillo donde puedes gestionar tus sesiones, tareas y evoluci&oacute;n emocional.
          </p>
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
              <span class="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">spa</span>
            </div>
            <div class="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
              <span class="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">potted_plant</span>
            </div>
            <div class="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
              <span class="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">air</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div class="p-8 rounded-[3rem] bg-white soft-shadow border border-sage/10 hover:-translate-y-2 transition-transform duration-500">
            <div class="w-12 h-12 bg-mint/50 rounded-2xl flex items-center justify-center text-sage mb-4">
              <span class="material-symbols-outlined">person_search</span>
            </div>
            <h3 class="text-2xl font-normal mb-2 text-forest">Matching cl&iacute;nico</h3>
            <p class="text-sm text-sage/70 leading-relaxed font-light">
              Un test que tiene en cuenta tu historia, preferencias y nivel de malestar para proponerte perfiles
              adecuados.
            </p>
          </div>
          <div class="p-8 rounded-[3rem] bg-white soft-shadow border border-sage/10 translate-y-8 hover:-translate-y-2 transition-transform duration-500">
            <div class="w-12 h-12 bg-mint/50 rounded-2xl flex items-center justify-center text-sage mb-4">
              <span class="material-symbols-outlined">event_available</span>
            </div>
            <h3 class="text-2xl font-normal mb-2 text-forest">Todo en un solo lugar</h3>
            <p class="text-sm text-sage/70 leading-relaxed font-light">
              Citas, pagos, tareas, tests y seguimiento de tu estado de &aacute;nimo integrados en un panel sencillo.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Care paths -->
    <section id="care" class="py-24 bg-mint/10">
      <div class="max-w-7xl mx-auto px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl lg:text-5xl font-normal mb-4 text-forest">
            C&oacute;mo funciona <span class="italic text-sage serif-font">Gantly</span>
          </h2>
          <p class="text-forest/80 max-w-xl mx-auto font-light">
            Tres formas de conectar con tu psic&oacute;logo y seguir tu proceso terap&eacute;utico.
          </p>
        </div>
        <div class="grid md:grid-cols-3 gap-10">
          <!-- Test inicial -->
          <div class="group">
            <div class="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
              <img src="assets/Gemini_Generated_Image_2xvx8k2xvx8k2xvx.png"
                   alt="Evaluaci&oacute;n inicial"
                   class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                   style="object-position: center top" />
              <div class="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent"></div>
            </div>
            <h3 class="text-3xl font-normal mb-2 flex items-center justify-between px-1 text-forest">
              1. Test inicial
              <span class="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                arrow_outward
              </span>
            </h3>
            <p class="text-forest/80 px-1 text-sm font-light">
              Responde a un test dise&ntilde;ado por psic&oacute;logos cl&iacute;nicos para entender mejor tu situaci&oacute;n actual.
            </p>
          </div>
          <!-- Matching -->
          <div class="group">
            <div class="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl9XHOnef7e4cMADy1MLQXH3lijmCTkFM07ejnr1nlvV_EpLJswahIRm8490KjTB89daBx6g1sV4PMEJpIxS3uFf-1PeYlyFCo8Y260LhBkN9n3Ed7PhcbqwmDV6UUCmdIinacdzHCLXKKwq2n3T4dCpkZXfQRGT33izjg2l1_De-IaU5rY8Aj2wHhzCusx3hR6d_zrT7mjSfXhZkKSCSa9rEYjM9Jf4CqA0Sxg7bqlZvs21ng8FJ5pSQRv4JjHYb114tv4WEI-K-_"
                   alt="Matching"
                   class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent"></div>
            </div>
            <h3 class="text-3xl font-normal mb-2 flex items-center justify-between px-1 text-forest">
              2. Matching
              <span class="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                arrow_outward
              </span>
            </h3>
            <p class="text-forest/80 px-1 text-sm font-light">
              Te mostramos psic&oacute;logos compatibles contigo, con informaci&oacute;n clara sobre su enfoque y experiencia.
            </p>
          </div>
          <!-- Sesiones -->
          <div class="group">
            <div class="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2YWC_tBvBTOttAXPFkZO-27_xC3xjDp_Wp_7M7yFODVyIk5u8NycdrvLyRt3z7Vfs8CpjKGGXQsI2RG2IHqIGBmiF8shOONg-fyue_vdcBH-GvfMe041v_WbCHVUqT0-r89tuNtJFzEn0RvkiChKd2Mi0rDBMX6hXTP-MWtSwE8x62UwGqCWrZJmkt9ITKg6jf1QOYxRYSHw4NwKcV7iofmhdpdwKnH0qXMh1Km7LjIqesuz7_frVuZCuTa6wJFnzUGsxxUdgkaW4"
                   alt="Sesiones online"
                   class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent"></div>
            </div>
            <h3 class="text-3xl font-normal mb-2 flex items-center justify-between px-1 text-forest">
              3. Sesiones y seguimiento
              <span class="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                arrow_outward
              </span>
            </h3>
            <p class="text-forest/80 px-1 text-sm font-light">
              Agenda online, chat seguro, videollamadas y herramientas de seguimiento de tu evoluci&oacute;n.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-32 px-8">
      <div class="max-w-7xl mx-auto bg-forest rounded-[4rem] p-10 lg:p-20 text-center relative overflow-hidden text-cream">
        <div class="absolute -top-1/2 -left-1/4 w-[500px] h-[500px] bg-sage/20 rounded-full blur-[100px] opacity-40"></div>
        <div class="relative z-10">
          <h2 class="text-4xl lg:text-6xl font-normal mb-8 max-w-3xl mx-auto leading-none" style="color: white">
            Da un paso tranquilo hacia tu pr&oacute;xima sesi&oacute;n.
          </h2>
          <p class="text-mint text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
            Empieza con un test gratuito y descubre qu&eacute; profesional encaja mejor contigo.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/register"
               class="bg-cream text-forest px-10 py-4 rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300 no-underline">
              Comenzar evaluaci&oacute;n
            </a>
            <a routerLink="/login"
               class="bg-transparent text-cream px-10 py-4 rounded-full font-medium text-lg hover:bg-white/5 transition-all border border-cream/30 no-underline">
              Iniciar sesi&oacute;n
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-cream py-12 px-8 border-t border-sage/10">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-xs uppercase tracking-widest" style="color: var(--color-primary)">
          &copy; 2026 Gantly. Todos los derechos reservados.
        </p>
        <div class="flex gap-4 text-xs" style="color: var(--color-primary)">
          <a routerLink="/about" class="hover:text-forest transition-colors no-underline" style="color: var(--color-primary)">
            Sobre nosotros
          </a>
          <a routerLink="/soy-profesional" class="hover:text-forest transition-colors no-underline" style="color: var(--color-primary)">
            Soy profesional
          </a>
        </div>
      </div>
    </footer>
  `
})
export class LandingComponent implements OnInit {
  dailyQuote: Quote | null = null;

  constructor(private quotesService: QuotesService) {}

  ngOnInit(): void {
    this.quotesService.getTodayQuote().subscribe(quote => {
      this.dailyQuote = quote;
    });
  }
}
