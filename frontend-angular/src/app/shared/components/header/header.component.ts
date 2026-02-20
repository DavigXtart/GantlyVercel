import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <a routerLink="/" class="text-2xl font-bold text-primary no-underline" style="font-family: var(--font-heading)">
            Gantly
          </a>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-2">
            @if (!isAuthenticated) {
              <a routerLink="/about" routerLinkActive="text-primary"
                 class="px-4 py-2 rounded-lg text-sm font-medium text-forest/70 hover:text-forest hover:bg-mint/50 no-underline transition-all">
                Sobre nosotros
              </a>
              <a routerLink="/soy-profesional" routerLinkActive="text-primary"
                 class="px-4 py-2 rounded-lg text-sm font-medium text-forest/70 hover:text-forest hover:bg-mint/50 no-underline transition-all">
                Soy profesional
              </a>
              <a routerLink="/login"
                 class="btn btn-primary text-sm no-underline ml-2">
                Iniciar sesión
              </a>
            } @else {
              <span class="text-sm text-forest/60 mr-2">{{ userName }}</span>
              <button (click)="logout()" class="btn btn-secondary text-sm">
                Cerrar sesión
              </button>
            }
          </div>

          <!-- Mobile hamburger -->
          <button (click)="menuOpen = !menuOpen" class="md:hidden p-2 rounded-lg hover:bg-mint/50">
            <svg class="w-6 h-6 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (!menuOpen) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              }
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (menuOpen) {
          <div class="md:hidden py-3 border-t border-gray-200/50 animate-fade-in">
            @if (!isAuthenticated) {
              <a routerLink="/about" (click)="menuOpen = false"
                 class="block px-4 py-3 text-sm font-medium text-forest/70 hover:bg-mint/50 rounded-lg no-underline">
                Sobre nosotros
              </a>
              <a routerLink="/soy-profesional" (click)="menuOpen = false"
                 class="block px-4 py-3 text-sm font-medium text-forest/70 hover:bg-mint/50 rounded-lg no-underline">
                Soy profesional
              </a>
              <a routerLink="/login" (click)="menuOpen = false"
                 class="block px-4 py-3 text-sm font-medium text-primary hover:bg-mint/50 rounded-lg no-underline">
                Iniciar sesión
              </a>
            } @else {
              <span class="block px-4 py-2 text-sm text-forest/60">{{ userName }}</span>
              <button (click)="logout(); menuOpen = false"
                      class="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                Cerrar sesión
              </button>
            }
          </div>
        }
      </div>
    </nav>
  `
})
export class HeaderComponent {
  @Input() isAuthenticated = false;
  @Input() userName = '';
  menuOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
  }
}
