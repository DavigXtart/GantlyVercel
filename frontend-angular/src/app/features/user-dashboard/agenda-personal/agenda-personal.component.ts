import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgendaService } from '../../../core/services/agenda.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AgendaEntry } from '../../../core/models';

@Component({
  selector: 'app-agenda-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    @if (loading) {
      <app-loading-spinner />
    } @else {

      <!-- FORM STATE: Create new entry -->
      @if (showForm) {
        <div class="max-w-2xl animate-fade-in">
          <div class="flex items-center gap-3 mb-6">
            <button (click)="showForm = false" class="text-sage hover:text-forest bg-transparent border-0 cursor-pointer">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 class="text-2xl font-bold text-forest">Nueva entrada</h2>
          </div>

          <div class="bg-sage/10 rounded-[4rem] p-8 mb-6">
            <h3 class="text-xl font-bold text-forest mb-2">¿Cómo te sientes hoy?</h3>
            <p class="text-sm text-forest/60">Registra tu estado de ánimo diario</p>
          </div>

          <form [formGroup]="entryForm" (ngSubmit)="saveEntry()">
            <!-- Step 1: Mood selection -->
            @if (step === 1) {
              <div class="bg-white rounded-[3rem] p-8 soft-shadow border border-sage/10 mb-6">
                <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-6">Estado de ánimo</p>
                @if (entryForm.get('moodRating')?.invalid && entryForm.get('moodRating')?.touched) {
                  <div class="form-error mb-4">Selecciona cómo te sientes</div>
                }
                <div class="flex justify-around">
                  @for (mood of moods; track mood.value) {
                    <button type="button" (click)="selectMood(mood.value)"
                            class="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-0 cursor-pointer"
                            [class]="entryForm.get('moodRating')?.value === mood.value
                              ? 'bg-gentle-mint scale-110'
                              : 'bg-transparent hover:bg-cream'">
                      <span class="text-4xl">{{ mood.emoji }}</span>
                      <span class="text-[10px] text-forest/60 font-medium">{{ mood.label }}</span>
                    </button>
                  }
                </div>
                @if (entryForm.get('moodRating')?.value > 0) {
                  <button type="button" (click)="step = 2" class="btn btn-primary w-full mt-6">
                    Continuar
                  </button>
                }
              </div>
            }

            <!-- Step 2: Emotions, activities, notes -->
            @if (step === 2) {
              <div class="bg-white rounded-[3rem] p-8 soft-shadow border border-sage/10 mb-6 animate-fade-in">
                <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-4">¿Qué emociones sientes?</p>
                <div class="flex flex-wrap gap-2 mb-6">
                  @for (emotion of availableEmotions; track emotion) {
                    <button type="button" (click)="toggleEmotion(emotion)"
                            class="px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer"
                            [class]="selectedEmotions.includes(emotion)
                              ? 'bg-primary text-white border-primary'
                              : 'border-sage/30 text-forest/70 hover:border-sage bg-transparent'">
                      {{ emotion }}
                    </button>
                  }
                </div>

                <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-4">¿Qué has hecho hoy?</p>
                <div class="flex flex-wrap gap-2 mb-6">
                  @for (activity of availableActivities; track activity) {
                    <button type="button" (click)="toggleActivity(activity)"
                            class="px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer"
                            [class]="selectedActivities.includes(activity)
                              ? 'bg-primary text-white border-primary'
                              : 'border-sage/30 text-forest/70 hover:border-sage bg-transparent'">
                      {{ activity }}
                    </button>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label">Notas adicionales</label>
                  <textarea formControlName="notes" class="form-input" rows="3"
                            placeholder="¿Algo que quieras recordar de hoy? (opcional)"></textarea>
                </div>

                <div class="flex gap-3 mt-4">
                  <button type="button" (click)="step = 1" class="btn btn-ghost">
                    <span class="material-symbols-outlined text-base">chevron_left</span>
                    Atrás
                  </button>
                  <button type="submit" class="btn btn-primary flex-1" [disabled]="saving">
                    {{ saving ? 'Guardando...' : 'Guardar entrada' }}
                  </button>
                </div>
              </div>
            }
          </form>
        </div>
      }

      <!-- CALENDAR STATE -->
      @if (!showForm) {
        <div class="animate-fade-in">
          <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
            <!-- Title + view toggles -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 class="text-2xl font-bold text-forest">
                {{ viewMode === 'week' ? 'Mi Agenda Semanal' : 'Mi Agenda Mensual' }}
              </h2>
              <div class="flex items-center gap-2">
                <div class="flex bg-sage/10 rounded-full p-1">
                  <button (click)="viewMode = 'week'; buildWeekDays()"
                          class="px-4 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer transition-all"
                          [class]="viewMode === 'week' ? 'bg-forest text-white' : 'bg-transparent text-forest/60 hover:text-forest'">
                    Semana
                  </button>
                  <button (click)="viewMode = 'month'; buildMonthDays()"
                          class="px-4 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer transition-all"
                          [class]="viewMode === 'month' ? 'bg-forest text-white' : 'bg-transparent text-forest/60 hover:text-forest'">
                    Mes
                  </button>
                  <button (click)="goToToday()"
                          class="px-4 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer bg-transparent text-forest/60 hover:text-forest transition-all">
                    Hoy
                  </button>
                </div>
                <button (click)="showForm = true; step = 1; resetForm()"
                        class="px-4 py-2 bg-forest text-white rounded-full text-sm font-medium border-0 cursor-pointer hover:bg-forest/90 transition-colors">
                  + Nueva Entrada
                </button>
              </div>
            </div>

            <!-- Week navigation -->
            @if (viewMode === 'week') {
              <div class="flex items-center justify-between bg-sage/5 rounded-2xl px-4 py-3 mb-6">
                <button (click)="changeWeek(-1)"
                        class="px-4 py-1.5 rounded-full border border-sage/30 text-sm text-forest bg-transparent cursor-pointer hover:bg-sage/10 transition-colors">
                  &larr; Anterior
                </button>
                <span class="font-medium text-forest text-sm">
                  {{ weekStart | date:dateFmtWeekRange }} - {{ weekEnd | date:dateFmtWeekEnd }}
                </span>
                <button (click)="changeWeek(1)"
                        class="px-4 py-1.5 rounded-full border border-sage/30 text-sm text-forest bg-transparent cursor-pointer hover:bg-sage/10 transition-colors">
                  Siguiente &rarr;
                </button>
              </div>

              <!-- Weekly cards -->
              <div class="grid grid-cols-7 gap-3">
                @for (day of weekDays; track day.dateStr) {
                  <button (click)="day.entry ? selectEntry(day.entry) : openNewEntry(day.dateStr)"
                          class="flex flex-col items-center p-4 rounded-2xl transition-all border-2 cursor-pointer min-h-[140px]"
                          [class]="day.entry
                            ? (day.isToday ? 'bg-primary border-amber-400 text-white' : 'bg-primary border-primary text-white')
                            : (day.isToday ? 'bg-sage/5 border-dashed border-sage/30' : (day.isPast ? 'bg-sage/5 border-dashed border-sage/20' : 'bg-gray-50 border border-sage/10'))">
                    <span class="text-[10px] font-bold uppercase tracking-wide"
                          [class]="day.entry ? 'text-white/80' : 'text-forest/40'">{{ day.label }}</span>
                    <span class="text-2xl font-bold my-2"
                          [class]="day.entry ? 'text-white' : 'text-forest'">{{ day.dayNum }}</span>
                    @if (day.entry) {
                      <span class="text-2xl mt-auto">{{ getMoodEmoji(day.entry.moodRating) }}</span>
                    } @else if (day.isPast || day.isToday) {
                      <span class="text-xs mt-auto text-center" [class]="day.entry ? 'text-white/70' : 'text-forest/30'">
                        Clic para crear
                      </span>
                    } @else {
                      <span class="text-xs mt-auto text-forest/20">Sin registro</span>
                    }
                  </button>
                }
              </div>
            }

            <!-- Month view -->
            @if (viewMode === 'month') {
              <div class="flex items-center justify-between bg-sage/5 rounded-2xl px-4 py-3 mb-6">
                <button (click)="changeMonth(-1)"
                        class="px-4 py-1.5 rounded-full border border-sage/30 text-sm text-forest bg-transparent cursor-pointer hover:bg-sage/10 transition-colors">
                  &larr; Anterior
                </button>
                <span class="font-medium text-forest text-sm">
                  {{ monthLabel }}
                </span>
                <button (click)="changeMonth(1)"
                        class="px-4 py-1.5 rounded-full border border-sage/30 text-sm text-forest bg-transparent cursor-pointer hover:bg-sage/10 transition-colors">
                  Siguiente &rarr;
                </button>
              </div>

              <!-- Day headers -->
              <div class="grid grid-cols-7 gap-1 mb-1">
                @for (label of ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; track label) {
                  <div class="text-center text-xs font-bold text-forest/50 uppercase py-2 bg-sage/5 rounded-lg">{{ label }}</div>
                }
              </div>

              <!-- Month grid -->
              <div class="grid grid-cols-7 gap-1">
                @for (cell of monthDays; track cell.dateStr) {
                  <button (click)="cell.entry ? selectEntry(cell.entry) : (cell.isCurrentMonth ? openNewEntry(cell.dateStr) : null)"
                          class="flex flex-col items-center justify-center p-2 rounded-xl min-h-[80px] border-2 transition-all"
                          [class]="cell.entry
                            ? (cell.isToday ? 'bg-primary border-amber-400 text-white cursor-pointer' : 'bg-primary border-primary text-white cursor-pointer')
                            : (cell.isToday ? 'bg-sage/5 border-dashed border-sage/30 cursor-pointer' : (cell.isCurrentMonth ? 'bg-white border-sage/10 cursor-pointer hover:bg-sage/5' : 'bg-gray-50 border-transparent text-forest/30'))">
                    <span class="text-sm font-bold" [class]="cell.entry ? 'text-white' : ''">{{ cell.dayNum }}</span>
                    @if (cell.entry) {
                      <span class="text-lg">{{ getMoodEmoji(cell.entry.moodRating) }}</span>
                    } @else if (cell.isToday && cell.isCurrentMonth) {
                      <span class="text-[10px] text-forest/30">+</span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Entry detail -->
          @if (selectedEntry) {
            <div class="bg-white rounded-[3rem] p-8 soft-shadow border border-sage/10 animate-fade-in mt-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-1">
                    {{ selectedEntry.entryDate | date:dateFmtEntryDay }}
                  </p>
                  <div class="flex items-center gap-3">
                    <span class="text-4xl">{{ getMoodEmoji(selectedEntry.moodRating) }}</span>
                    <span class="text-lg font-normal text-forest">{{ getMoodLabel(selectedEntry.moodRating) }}</span>
                  </div>
                </div>
                <button (click)="selectedEntry = null" class="text-sage/40 hover:text-forest bg-transparent border-0 cursor-pointer">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              @if (getEmotions(selectedEntry).length > 0) {
                <div class="mt-4">
                  <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-2">Emociones</p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (e of getEmotions(selectedEntry); track e) {
                      <span class="badge badge-info text-xs">{{ e }}</span>
                    }
                  </div>
                </div>
              }

              @if (getActivities(selectedEntry).length > 0) {
                <div class="mt-4">
                  <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-2">Actividades</p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (a of getActivities(selectedEntry); track a) {
                      <span class="badge badge-success text-xs">{{ a }}</span>
                    }
                  </div>
                </div>
              }

              @if (selectedEntry.notes) {
                <div class="mt-4">
                  <p class="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-2">Notas</p>
                  <p class="text-sm text-forest/70 p-4 bg-cream rounded-2xl">{{ selectedEntry.notes }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    }
  `
})
export class AgendaPersonalComponent implements OnInit {
  loading = true;
  saving = false;
  step = 1;
  showForm = false;
  viewMode: 'week' | 'month' = 'week';
  todayEntry: AgendaEntry | null = null;
  entries: AgendaEntry[] = [];
  selectedEntry: AgendaEntry | null = null;

  weekStart = new Date();
  weekEnd = new Date();
  weekDays: { label: string; dayNum: number; dateStr: string; entry: AgendaEntry | null; isToday: boolean; isPast: boolean }[] = [];

  // Month view
  currentMonth = new Date();
  monthLabel = '';
  monthDays: { dayNum: number; dateStr: string; entry: AgendaEntry | null; isToday: boolean; isCurrentMonth: boolean }[] = [];

  entryForm: FormGroup;

  selectedEmotions: string[] = [];
  selectedActivities: string[] = [];

  dateFmtWeekRange = "d 'de' MMMM";
  dateFmtWeekEnd = "d 'de' MMMM 'de' yyyy";
  dateFmtEntryDay = "EEEE d 'de' MMMM 'de' yyyy";

  moods = [
    { value: 1, emoji: '\u{1F622}', label: 'Muy mal' },
    { value: 2, emoji: '\u{1F615}', label: 'Mal' },
    { value: 3, emoji: '\u{1F610}', label: 'Regular' },
    { value: 4, emoji: '\u{1F60A}', label: 'Bien' },
    { value: 5, emoji: '\u{1F604}', label: 'Muy bien' }
  ];

  availableEmotions = [
    'Alegría', 'Tristeza', 'Ansiedad', 'Calma', 'Enfado',
    'Gratitud', 'Esperanza', 'Frustración', 'Amor', 'Soledad',
    'Motivación', 'Miedo', 'Orgullo', 'Culpa'
  ];

  availableActivities = [
    'Ejercicio', 'Lectura', 'Meditación', 'Trabajo', 'Estudiar',
    'Socializar', 'Cocinar', 'Pasear', 'Música', 'Descanso',
    'Terapia', 'Hobbies', 'Familia', 'Deporte'
  ];

  constructor(
    private fb: FormBuilder,
    private agendaService: AgendaService,
    private toast: ToastService
  ) {
    this.entryForm = this.fb.group({
      moodRating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.initWeek();
    this.currentMonth = new Date();
    this.loadToday();
  }

  initWeek(): void {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    this.weekStart = sunday;
    this.weekEnd = new Date(sunday);
    this.weekEnd.setDate(sunday.getDate() + 6);
  }

  changeWeek(delta: number): void {
    this.weekStart = new Date(this.weekStart);
    this.weekStart.setDate(this.weekStart.getDate() + delta * 7);
    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate() + 6);
    this.buildWeekDays();
    this.selectedEntry = null;
  }

  changeMonth(delta: number): void {
    this.currentMonth = new Date(this.currentMonth);
    this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
    this.buildMonthDays();
    this.selectedEntry = null;
  }

  goToToday(): void {
    this.initWeek();
    this.currentMonth = new Date();
    if (this.viewMode === 'week') {
      this.buildWeekDays();
    } else {
      this.buildMonthDays();
    }
    this.selectedEntry = null;
  }

  loadToday(): void {
    this.agendaService.getTodayEntry().subscribe({
      next: (res) => {
        this.todayEntry = res?.entry || null;
        this.loading = false;
        this.loadEntries();
      },
      error: () => {
        this.loading = false;
        this.loadEntries();
      }
    });
  }

  loadEntries(): void {
    this.agendaService.getEntries().subscribe({
      next: (res) => {
        this.entries = res?.entries || [];
        this.buildWeekDays();
        this.buildMonthDays();
      },
      error: () => {}
    });
  }

  buildWeekDays(): void {
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStart);
      d.setDate(this.weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      const entry = this.entries.find(e => e.entryDate === dateStr) || null;
      this.weekDays.push({
        label: dayLabels[i],
        dayNum: d.getDate(),
        dateStr,
        entry,
        isToday: d.getTime() === today.getTime(),
        isPast: d.getTime() < today.getTime()
      });
    }
  }

  buildMonthDays(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    this.monthLabel = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.monthDays = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = d.toISOString().split('T')[0];
      this.monthDays.push({
        dayNum: d.getDate(),
        dateStr,
        entry: this.entries.find(e => e.entryDate === dateStr) || null,
        isToday: false,
        isCurrentMonth: false
      });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      this.monthDays.push({
        dayNum: day,
        dateStr,
        entry: this.entries.find(e => e.entryDate === dateStr) || null,
        isToday: d.getTime() === today.getTime(),
        isCurrentMonth: true
      });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remaining = 42 - this.monthDays.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      this.monthDays.push({
        dayNum: i,
        dateStr,
        entry: this.entries.find(e => e.entryDate === dateStr) || null,
        isToday: false,
        isCurrentMonth: false
      });
    }
  }

  selectMood(value: number): void {
    this.entryForm.patchValue({ moodRating: value });
  }

  toggleEmotion(emotion: string): void {
    const idx = this.selectedEmotions.indexOf(emotion);
    if (idx >= 0) {
      this.selectedEmotions.splice(idx, 1);
    } else {
      this.selectedEmotions.push(emotion);
    }
  }

  toggleActivity(activity: string): void {
    const idx = this.selectedActivities.indexOf(activity);
    if (idx >= 0) {
      this.selectedActivities.splice(idx, 1);
    } else {
      this.selectedActivities.push(activity);
    }
  }

  saveEntry(): void {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const today = new Date().toISOString().split('T')[0];
    const payload: Partial<AgendaEntry> = {
      entryDate: today,
      moodRating: this.entryForm.value.moodRating,
      emotions: JSON.stringify(this.selectedEmotions),
      activities: JSON.stringify(this.selectedActivities),
      notes: this.entryForm.value.notes || ''
    };

    this.agendaService.saveEntry(payload).subscribe({
      next: (res) => {
        this.toast.success('Entrada guardada');
        this.todayEntry = res?.entry || res;
        this.saving = false;
        this.showForm = false;
        this.loadEntries();
      },
      error: () => {
        this.toast.error('Error al guardar la entrada');
        this.saving = false;
      }
    });
  }

  openNewEntry(dateStr: string): void {
    this.showForm = true;
    this.step = 1;
    this.resetForm();
  }

  resetForm(): void {
    this.entryForm.reset({ moodRating: 0, notes: '' });
    this.selectedEmotions = [];
    this.selectedActivities = [];
    this.step = 1;
  }

  selectEntry(entry: AgendaEntry): void {
    this.selectedEntry = entry;
  }

  getMoodEmoji(rating: number): string {
    return this.moods.find(m => m.value === rating)?.emoji || '\u{1F610}';
  }

  getMoodLabel(rating: number): string {
    return this.moods.find(m => m.value === rating)?.label || 'Regular';
  }

  getEmotions(entry: AgendaEntry): string[] {
    if (!entry.emotions) return [];
    try { return JSON.parse(entry.emotions); } catch { return []; }
  }

  getActivities(entry: AgendaEntry): string[] {
    if (!entry.activities) return [];
    try { return JSON.parse(entry.activities); } catch { return []; }
  }
}
