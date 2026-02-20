import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Desktop/Tablet Sidebar - w-24, icon + label stacked -->
    <aside class="hidden md:flex flex-col w-24 bg-white border-r border-sage/10 h-screen sticky top-0 items-center py-10 z-40">
      <nav class="flex flex-col gap-3 w-full px-3 pt-2">
        @for (item of items; track item.key) {
          <button
            (click)="selectTab(item.key)"
            class="sidebar-item"
            [class.active]="item.key === activeTab"
            [class.disabled]="item.disabled"
            [title]="item.label">
            <span class="material-symbols-outlined font-light text-xl">{{ item.icon }}</span>
            <span class="text-[10px] font-medium uppercase tracking-tighter leading-tight">{{ item.label }}</span>
          </button>
        }
      </nav>
      <div class="mt-auto px-3 w-full">
        <button (click)="logoutClicked.emit()" class="sidebar-item text-sage/40 hover:!text-red-400 hover:!bg-red-50" title="Cerrar sesión">
          <span class="material-symbols-outlined font-light text-xl">logout</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Bottom Nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sage/10 z-30 px-2 py-1 flex justify-around">
      @for (item of items.slice(0, 5); track item.key) {
        <button (click)="selectTab(item.key)"
                class="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-xs border-0 cursor-pointer"
                [class]="item.key === activeTab ? 'text-forest bg-gentle-mint' : 'text-forest/50 bg-transparent'">
          <span class="material-symbols-outlined text-lg font-light">{{ item.icon }}</span>
          <span class="truncate max-w-12 uppercase text-[9px] tracking-tighter">{{ item.label }}</span>
        </button>
      }
      @if (items.length > 5) {
        <button (click)="showMore = !showMore"
                class="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-xs border-0 cursor-pointer text-forest/50 bg-transparent">
          <span class="material-symbols-outlined text-lg font-light">more_horiz</span>
          <span class="uppercase text-[9px] tracking-tighter">Más</span>
        </button>
      }
    </nav>

    <!-- Mobile "More" drawer -->
    @if (showMore) {
      <div class="md:hidden fixed inset-0 bg-black/30 z-40" (click)="showMore = false">
        <div class="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl p-4 animate-slide-in"
             (click)="$event.stopPropagation()">
          @for (item of items.slice(5); track item.key) {
            <button (click)="selectTab(item.key); showMore = false"
                    class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium border-0 cursor-pointer"
                    [class]="item.key === activeTab ? 'bg-primary text-white' : 'text-forest/70 hover:bg-mint/50 bg-transparent'">
              <span class="material-symbols-outlined text-lg font-light">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </button>
          }
        </div>
      </div>
    }
  `
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() activeTab = '';
  @Input() title = '';
  @Output() tabChange = new EventEmitter<string>();
  @Output() logoutClicked = new EventEmitter<void>();

  showMore = false;

  selectTab(key: string): void {
    this.tabChange.emit(key);
  }
}
