import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { TaskService } from '../../core/services/task.service';
import { TestService } from '../../core/services/test.service';
import { CalendarService } from '../../core/services/calendar.service';
import { ChatService } from '../../core/services/chat.service';
import { QuotesService, Quote } from '../../core/services/quotes.service';
import { ToastService } from '../../core/services/toast.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { User, Task, AssignedTest, Appointment, PsychologistAssignment, ChatMessage } from '../../core/models';
import { TestFlowComponent } from './test-flow/test-flow.component';
import { AgendaPersonalComponent } from './agenda-personal/agenda-personal.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent, TestFlowComponent, AgendaPersonalComponent],
  template: `
    <app-header [isAuthenticated]="true" [userName]="me?.name || ''" />

    <div class="pt-16 flex min-h-screen bg-cream">
      <app-sidebar
        [items]="sidebarItems"
        [activeTab]="tab"
        [title]="'Mi Panel'"
        (tabChange)="tab = $event; loadTabData()"
        (logoutClicked)="logout()" />

      <main class="flex-1 p-8 lg:p-12 pb-20 md:pb-8 overflow-y-auto">
        @if (loading) {
          <app-loading-spinner />
        } @else {

          <!-- PERFIL -->
          @if (tab === 'perfil') {
            <div class="animate-fade-in">
              <!-- Hero header -->
              <header class="bg-sage/10 rounded-[4rem] p-8 lg:p-12 mb-10 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-20">
                  <svg class="w-full h-full" viewBox="0 0 200 200">
                    <path class="line-art" d="M150 40 Q180 80 160 120 T100 160 T40 100 Q60 40 150 40"/>
                    <circle cx="100" cy="100" r="2" fill="#8da693"/>
                  </svg>
                </div>
                <div class="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div class="size-28 md:size-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-sage/20 flex items-center justify-center shrink-0">
                    @if (me?.avatarUrl) {
                      <img [src]="me!.avatarUrl" class="w-full h-full object-cover" alt="avatar">
                    } @else {
                      <span class="text-4xl text-forest font-semibold">{{ me?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
                    }
                  </div>
                  <div class="text-center md:text-left">
                    <h1 class="text-4xl md:text-5xl font-normal mb-2">
                      Hola, <span class="serif-font italic text-sage">{{ me?.name || 'tu espacio' }}.</span>
                    </h1>
                    <p class="text-sage/70 font-light mb-1">{{ me?.email }}</p>
                    <p class="text-sage/50 font-light text-sm mb-4">Miembro desde {{ me?.createdAt | date:dateFmtFull }}</p>
                    <button (click)="tab = 'editar-perfil'"
                            class="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition-all">
                      Editar perfil y contraseña
                    </button>
                  </div>
                </div>
              </header>

              <!-- Dashboard grid -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left 2/3 -->
                <div class="lg:col-span-2 space-y-8">
                  <!-- Quick access cards -->
                  <div class="grid md:grid-cols-3 gap-6">
                    <button (click)="tab = 'mi-psicologo'; loadTabData()"
                            class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group">
                      <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-6xl text-sage">psychology</span>
                      </div>
                      <div class="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                        <span class="material-symbols-outlined">medical_services</span>
                      </div>
                      <h3 class="text-xl font-normal mb-1">Mi psicólogo</h3>
                      <p class="text-sm text-sage/60 font-light">Tu profesional asignado</p>
                    </button>
                    <button (click)="tab = 'calendario'; loadTabData()"
                            class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group">
                      <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-6xl text-sage">calendar_today</span>
                      </div>
                      <div class="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                        <span class="material-symbols-outlined">calendar_today</span>
                      </div>
                      <h3 class="text-xl font-normal mb-1">Calendario</h3>
                      <p class="text-sm text-sage/60 font-light">Reserva tu próxima cita</p>
                    </button>
                    <button (click)="tab = 'agenda'; loadTabData()"
                            class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group">
                      <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-6xl text-sage">book</span>
                      </div>
                      <div class="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                        <span class="material-symbols-outlined">book</span>
                      </div>
                      <h3 class="text-xl font-normal mb-1">Agenda personal</h3>
                      <p class="text-sm text-sage/60 font-light">Tu diario de bienestar</p>
                    </button>
                  </div>

                  <!-- Counter cards -->
                  <div class="grid md:grid-cols-2 gap-6">
                    <button (click)="tab = 'tareas'; loadTabData()"
                            class="bg-white p-10 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left">
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Tareas pendientes</span>
                      <div class="flex items-baseline gap-2 mt-4">
                        <span class="text-5xl serif-font italic">{{ pendingTasksCount }}</span>
                        <span class="text-sage font-light">pendiente(s)</span>
                      </div>
                    </button>
                    <button (click)="tab = 'tests'; loadTabData()"
                            class="bg-white p-10 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left">
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Tests pendientes</span>
                      <div class="flex items-baseline gap-2 mt-4">
                        <span class="text-5xl serif-font italic">{{ pendingTestsCount }}</span>
                        <span class="text-sage font-light">pendiente(s)</span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Right 1/3 -->
                <div class="space-y-6">
                  <!-- Próxima cita -->
                  <div class="bg-white p-10 rounded-[4rem] border border-sage/10 soft-shadow">
                    <div class="flex items-center gap-2 mb-4">
                      <span class="material-symbols-outlined text-amber-500 text-sm">alarm</span>
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Próxima cita</span>
                    </div>
                    @if (upcomingAppointment) {
                      <h4 class="text-2xl font-normal mb-3">{{ upcomingAppointment.startTime | date:'EEE, d MMM' }}</h4>
                      <div class="flex items-center gap-2 text-sage text-sm mb-2">
                        <span class="material-symbols-outlined text-base">schedule</span>
                        <span class="font-light">{{ upcomingAppointment.startTime | date:'HH:mm' }}</span>
                      </div>
                      @if (upcomingAppointment.psychologist) {
                        <div class="flex items-center gap-2 text-sage text-sm mb-4">
                          <span class="material-symbols-outlined text-base">location_on</span>
                          <span class="font-light">Sesión con {{ upcomingAppointment.psychologist.name }}</span>
                        </div>
                      }
                      <p class="text-amber-600 text-sm italic mb-4">Podrás iniciar la videollamada 1 hora antes</p>
                      <button class="w-full py-3 bg-forest text-white font-medium rounded-full border-0 cursor-pointer text-sm hover:bg-forest/90 transition-colors">
                        Join Call
                      </button>
                      <div class="text-center mt-3">
                        <button (click)="tab = 'citas'; loadTabData()" class="text-sage text-sm underline bg-transparent border-0 cursor-pointer">Ver todas</button>
                      </div>
                    } @else {
                      <div class="text-center py-4">
                        <p class="text-sage/70 text-sm font-light">Sin citas próximas</p>
                        <button (click)="tab = 'calendario'; loadTabData()" class="text-xs text-sage underline mt-2 bg-transparent border-0 cursor-pointer">Ir al calendario</button>
                      </div>
                    }
                  </div>

                  <!-- Daily Quote -->
                  @if (dailyQuote) {
                    <div class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow bg-gradient-to-br from-gentle-mint/20 to-white">
                      <p class="text-sm italic text-forest/70 serif-font leading-relaxed">"{{ dailyQuote.text }}"</p>
                      <p class="text-xs text-sage mt-3">— {{ dailyQuote.author }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- EDITAR PERFIL -->
          @if (tab === 'editar-perfil') {
            <div class="max-w-lg animate-fade-in">
              <h2 class="text-2xl font-bold text-forest mb-6">Editar perfil</h2>
              <div class="card p-6">
                <form [formGroup]="editForm" (ngSubmit)="saveProfile()">
                  <div class="form-group">
                    <label class="form-label">Nombre</label>
                    <input type="text" formControlName="name" class="form-input">
                    @if (editForm.get('name')?.invalid && editForm.get('name')?.touched) {
                      <div class="form-error">El nombre es obligatorio</div>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Género</label>
                    <select formControlName="gender" class="form-input">
                      <option value="">Sin especificar</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de nacimiento</label>
                    <input type="date" formControlName="birthDate" class="form-input">
                  </div>
                  <div class="flex gap-3">
                    <button type="submit" class="btn btn-primary" [disabled]="savingProfile">
                      {{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}
                    </button>
                    <button type="button" (click)="tab = 'perfil'" class="btn btn-ghost">Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- MI PSICÓLOGO -->
          @if (tab === 'mi-psicologo') {
            <div class="animate-fade-in">
              @if (psychAssignment?.status === 'ASSIGNED' && psychAssignment?.psychologist) {
                <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10 mb-6">
                  <div class="flex items-center gap-5 mb-4">
                    <div class="size-16 rounded-full bg-sage/20 border-2 border-sage/30 flex items-center justify-center overflow-hidden shrink-0">
                      @if (psychAssignment!.psychologist!.avatarUrl) {
                        <img [src]="psychAssignment!.psychologist!.avatarUrl" class="w-full h-full object-cover" alt="avatar">
                      } @else {
                        <span class="material-symbols-outlined text-2xl text-sage">person</span>
                      }
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-forest">{{ psychAssignment!.psychologist!.name }}</h3>
                      <p class="text-sm text-primary">{{ psychAssignment!.psychologist!.email }}</p>
                    </div>
                  </div>
                  <button (click)="showPsychProfile = !showPsychProfile"
                          class="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition-all bg-transparent cursor-pointer">
                    Ver perfil completo
                  </button>
                </div>

                <!-- Mis citas pasadas -->
                <h3 class="text-xl font-bold text-forest mb-4">Mis citas pasadas</h3>
                @if (pastAppointments.length === 0) {
                  <p class="text-sm text-forest/50">No tienes citas pasadas todavía.</p>
                } @else {
                  <div class="space-y-3">
                    @for (apt of pastAppointments; track apt.id) {
                      <div class="bg-sage/10 rounded-3xl px-6 py-4 flex items-center justify-between">
                        <div>
                          <p class="text-sage text-sm">{{ apt.startTime | date:dateFmtDay }}</p>
                          <p class="font-semibold text-forest">{{ apt.startTime | date:'HH:mm' }} - {{ apt.endTime | date:'HH:mm' }}</p>
                        </div>
                        <div class="flex items-center gap-1 shrink-0 ml-4">
                          @if (apt.rating) {
                            @for (s of [1,2,3,4,5]; track s) {
                              <span class="text-lg" [class]="s <= apt.rating! ? 'text-amber-400' : 'text-gray-300'">&#9733;</span>
                            }
                            @if (apt.comment) {
                              <span class="text-xs text-forest/50 italic ml-2">"{{ apt.comment }}"</span>
                            }
                          } @else {
                            <span class="text-sm text-sage/50 italic">Sin valorar</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              } @else {
                <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10 text-center">
                  <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">search</span>
                  <h3 class="font-bold text-forest mb-2">Sin psicólogo asignado</h3>
                  <p class="text-sm text-forest/60">Aún no tienes un psicólogo asignado. Contacta con el administrador.</p>
                </div>
              }
            </div>
          }

          <!-- TAREAS -->
          @if (tab === 'tareas') {
            <div class="animate-fade-in">
              <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                <h2 class="text-2xl font-bold text-forest mb-2">Mis Tareas</h2>
                <h3 class="text-lg font-semibold text-forest mb-6">Tareas pendientes</h3>
                @if (tasks.length === 0) {
                  <div class="text-center py-12">
                    <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">task_alt</span>
                    <h4 class="font-bold text-forest mb-2">Sin tareas pendientes</h4>
                    <p class="text-sm text-forest/60">Tu psicólogo no te ha asignado tareas todavía.</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (task of tasks; track task.id) {
                      <div class="bg-sage/10 rounded-3xl px-6 py-4 flex items-center justify-between">
                        <div>
                          <p class="text-sage text-sm">{{ task.title }}</p>
                          @if (task.description) {
                            <p class="font-semibold text-forest">{{ task.description }}</p>
                          }
                          @if (task.dueDate) {
                            <p class="text-xs text-forest/40 mt-1">Fecha límite: {{ task.dueDate | date:dateFmtDay }}</p>
                          }
                        </div>
                        <span class="text-sage/60 italic text-sm shrink-0 ml-4">
                          {{ task.completed ? 'Completada' : 'Asignada' }}
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- TESTS PENDIENTES -->
          @if (tab === 'tests') {
            @if (showingTestFlow && activeTestId) {
              <app-test-flow
                [testId]="activeTestId"
                [assignedTestId]="0"
                (back)="showingTestFlow = false"
                (completed)="onTestCompleted()" />
            } @else {
              <div class="animate-fade-in">
                <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                  <h2 class="text-2xl font-bold text-forest mb-6">Tests Pendientes</h2>

                  <!-- Search & filter (requisito asignatura) -->
                  <div class="flex gap-3 mb-6">
                    <input type="text" [(ngModel)]="testSearch" placeholder="Buscar tests..."
                           class="form-input !mb-0 flex-1">
                    <select [(ngModel)]="testFilter" class="form-input !mb-0 !w-auto">
                      <option value="">Todos</option>
                      <option value="PENDING">Pendientes</option>
                      <option value="COMPLETED">Completados</option>
                    </select>
                  </div>

                  @if (filteredTests.length === 0 && assignedTests.length === 0) {
                    <div class="text-center py-12">
                      <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">assignment</span>
                      <h4 class="font-bold text-forest mb-2">Sin tests asignados</h4>
                      <p class="text-sm text-forest/60">No tienes tests asignados por el momento.</p>
                    </div>
                  } @else if (filteredTests.length === 0) {
                    <div class="text-center py-8">
                      <p class="text-sm text-forest/50">No se encontraron tests con ese filtro</p>
                    </div>
                  } @else {
                    <div class="space-y-3">
                      @for (test of filteredTests; track test.id) {
                        <div class="bg-sage/10 rounded-3xl px-6 py-4 flex items-center justify-between">
                          <div>
                            <p class="text-sage text-sm">{{ test.testTitle }}</p>
                            <p class="font-semibold text-forest">Asignado: {{ test.assignedAt | date:dateFmtDay }}</p>
                          </div>
                          <div class="flex items-center gap-3 shrink-0 ml-4">
                            <span class="text-sage/60 italic text-sm">
                              {{ test.status === 'COMPLETED' ? 'Completado' : 'Pendiente' }}
                            </span>
                            @if (test.status !== 'COMPLETED') {
                              <button (click)="startTest(test)" class="btn btn-primary text-xs px-4 py-2">
                                Realizar
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }

          <!-- CALENDARIO -->
          @if (tab === 'calendario') {
            <div class="animate-fade-in">
              <h2 class="text-2xl font-bold text-forest mb-6">Calendario</h2>

              <!-- Week navigation header -->
              <div class="bg-primary text-white rounded-2xl px-6 py-4 flex items-center justify-between mb-4">
                <button (click)="changeWeek(-1)" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium border-0 cursor-pointer transition-colors">
                  &larr; Semana anterior
                </button>
                <span class="font-medium text-center">{{ weekStart | date:dateFmtWeekRange }} - {{ weekEnd | date:dateFmtWeekEnd }}</span>
                <button (click)="changeWeek(1)" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium border-0 cursor-pointer transition-colors">
                  Semana siguiente &rarr;
                </button>
              </div>

              <!-- Weekly grid -->
              <div class="bg-white rounded-2xl soft-shadow border border-sage/10 overflow-x-auto">
                <table class="w-full border-collapse min-w-[800px]">
                  <!-- Day headers -->
                  <thead>
                    <tr>
                      <th class="p-3 text-xs text-forest/50 font-medium border-b border-sage/10 w-16 text-left">HORA</th>
                      @for (day of calendarDays; track day.date) {
                        <th class="p-3 text-center border-b border-sage/10"
                            [class]="day.isToday ? 'text-primary' : 'text-forest'">
                          <div class="text-xs font-bold uppercase">{{ day.label }}</div>
                          <div class="text-xl font-bold">{{ day.dayNum }}</div>
                          @if (day.isToday) {
                            <div class="text-[10px] text-primary font-medium">HOY</div>
                          }
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (hour of calendarHours; track hour) {
                      <tr class="border-b border-sage/5">
                        <td class="p-2 text-xs text-forest/40 font-medium align-top w-16">{{ hour }}:00</td>
                        @for (day of calendarDays; track day.date) {
                          <td class="p-1 align-top border-l border-sage/5 h-16 relative">
                            @for (slot of getSlotsForCell(day.date, hour); track slot.id) {
                              @if (slot.status === 'BOOKED' || slot.status === 'CONFIRMED') {
                                <div class="bg-amber-100 border-2 border-amber-400 rounded-xl p-2 text-xs mb-1">
                                  <div class="font-medium">{{ slot.startTime | date:'HH:mm' }} - {{ slot.endTime | date:'HH:mm' }}</div>
                                  @if (slot.patientName) {
                                    <div class="text-forest/60">&#128100; {{ slot.patientName }}</div>
                                  }
                                  <div class="text-primary">&#9989; Confirmada</div>
                                  <div class="text-xs text-forest/50 italic">Mi cita</div>
                                </div>
                              } @else {
                                <div class="bg-blue-100 border-2 border-blue-400 rounded-xl p-2 text-xs mb-1">
                                  <div class="font-medium">{{ slot.startTime | date:'HH:mm' }} - {{ slot.endTime | date:'HH:mm' }}</div>
                                  <div class="text-forest/60">Disponible</div>
                                  <button (click)="bookSlot(slot.id)"
                                          class="mt-1 px-2 py-1 bg-primary text-white text-[10px] rounded-lg font-bold border-0 cursor-pointer hover:bg-primary/80">
                                    Reservar {{ slot.price ? slot.price + '€' : '' }}
                                  </button>
                                </div>
                              }
                            }
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- MIS CITAS -->
          @if (tab === 'citas') {
            <div class="animate-fade-in">
              <div class="flex items-center gap-2 mb-6">
                <span class="material-symbols-outlined text-forest">calendar_today</span>
                <h2 class="text-xl font-bold text-forest">Mis citas</h2>
              </div>

              @if (appointments.length === 0) {
                <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10 text-center">
                  <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">event</span>
                  <h3 class="font-bold text-forest mb-2">Sin citas</h3>
                  <p class="text-sm text-forest/60">No tienes citas programadas. Ve al calendario para reservar.</p>
                </div>
              } @else {
                <!-- Upcoming appointments -->
                @if (upcomingAppointments.length > 0) {
                  <div class="grid md:grid-cols-2 gap-4 mb-8">
                    @for (apt of upcomingAppointments; track apt.id) {
                      <div class="bg-white rounded-3xl p-6 border border-sage/10 soft-shadow">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Próxima cita</span>
                          <span class="material-symbols-outlined text-sage/30">location_on</span>
                        </div>
                        <h4 class="text-xl font-normal mb-1">{{ apt.startTime | date:'EEE, d MMM' }}</h4>
                        <p class="text-sage text-sm mb-3">{{ apt.startTime | date:'HH:mm' }} - {{ apt.endTime | date:'HH:mm' }}</p>
                        @if (apt.psychologist) {
                          <p class="text-sage text-sm">{{ apt.psychologist.name }}</p>
                        }
                        <div class="flex items-center justify-between mt-3">
                          <span class="px-3 py-1 rounded-full text-xs font-medium border"
                                [class]="apt.status === 'CONFIRMED' ? 'bg-gentle-mint text-primary border-primary/20' : 'bg-amber-50 text-amber-600 border-amber-200'">
                            {{ apt.status === 'CONFIRMED' ? 'Confirmada' : apt.status }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Past appointments & Ver historial -->
                <div class="text-right">
                  <button (click)="tab = 'mi-psicologo'; loadTabData()" class="text-sage text-sm bg-transparent border-0 cursor-pointer hover:underline">
                    <span class="material-symbols-outlined text-sm align-middle">history</span>
                    Ver historial completo
                  </button>
                </div>
              }
            </div>
          }

          <!-- AGENDA PERSONAL -->
          @if (tab === 'agenda') {
            <app-agenda-personal />
          }

          <!-- CHAT -->
          @if (tab === 'chat') {
            <div class="max-w-3xl animate-fade-in h-[calc(100vh-8rem)]">
              <div class="flex flex-col h-full">
                <!-- Chat header -->
                <div class="bg-primary text-white rounded-t-2xl px-4 py-3 flex items-center gap-3">
                  <div class="size-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                    @if (psychAssignment?.psychologist?.avatarUrl) {
                      <img [src]="psychAssignment!.psychologist!.avatarUrl" class="w-full h-full object-cover" alt="">
                    } @else {
                      <span class="material-symbols-outlined text-white/60">person</span>
                    }
                  </div>
                  <div>
                    <div class="font-medium text-sm">{{ psychAssignment?.psychologist?.name || 'Chat' }}</div>
                    <div class="text-xs text-white/70 flex items-center gap-1">
                      @if (chatConnected) {
                        <span class="size-2 bg-green-300 rounded-full inline-block"></span>
                      }
                      {{ chatConnected ? 'En línea' : 'Conectando...' }}
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div class="flex-1 overflow-y-auto bg-white p-4 space-y-4" #chatContainer>
                  @if (chatMessages.length === 0) {
                    <div class="text-center py-12 text-forest/40 text-sm">
                      No hay mensajes aún. ¡Escribe el primero!
                    </div>
                  }
                  @for (msg of chatMessages; track msg.timestamp) {
                    <div class="flex items-end gap-2" [class]="msg.senderId === me?.id ? 'flex-row-reverse' : 'flex-row'">
                      <div class="size-8 rounded-full bg-sage/20 border border-sage/30 flex items-center justify-center overflow-hidden shrink-0">
                        @if (msg.senderId === me?.id) {
                          @if (me?.avatarUrl) {
                            <img [src]="me!.avatarUrl" class="w-full h-full object-cover" alt="">
                          } @else {
                            <span class="text-xs text-forest font-bold">{{ me?.name?.charAt(0) }}</span>
                          }
                        } @else {
                          @if (psychAssignment?.psychologist?.avatarUrl) {
                            <img [src]="psychAssignment!.psychologist!.avatarUrl" class="w-full h-full object-cover" alt="">
                          } @else {
                            <span class="material-symbols-outlined text-sage text-sm">person</span>
                          }
                        }
                      </div>
                      <div>
                        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm"
                             [class]="msg.senderId === me?.id
                               ? 'bg-primary text-white rounded-br-none'
                               : 'bg-gray-100 text-forest rounded-bl-none'">
                          <p>{{ msg.content }}</p>
                        </div>
                        <p class="text-[10px] mt-1 text-forest/30" [class]="msg.senderId === me?.id ? 'text-right' : 'text-left'">
                          {{ msg.timestamp | date:'d/M HH:mm' }}
                        </p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Input -->
                <div class="bg-white border-t border-gray-200 rounded-b-2xl p-3 flex gap-2">
                  <input type="text"
                         [(ngModel)]="chatInput"
                         (keyup.enter)="sendMessage()"
                         placeholder="Escribe un mensaje..."
                         class="form-input flex-1 !mb-0">
                  <button (click)="sendMessage()" class="btn btn-primary px-4" [disabled]="!chatInput.trim()">Enviar</button>
                </div>
              </div>
            </div>
          }

        }
      </main>
    </div>
  `
})
export class UserDashboardComponent implements OnInit {
  // State
  tab = 'perfil';
  loading = true;
  me: User | null = null;
  psychAssignment: PsychologistAssignment | null = null;
  tasks: Task[] = [];
  assignedTests: AssignedTest[] = [];
  appointments: Appointment[] = [];
  slots: any[] = [];
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  chatConnected = false;
  dailyQuote: Quote | null = null;
  savingProfile = false;
  upcomingAppointment: Appointment | null = null;
  showPsychProfile = false;
  showingTestFlow = false;
  activeTestId: number | null = null;
  testSearch = '';
  testFilter = '';

  // Date format strings (can't escape single quotes in Angular templates)
  dateFmtFull = "d 'de' MMMM 'de' yyyy";
  dateFmtDay = "EEEE, d 'de' MMMM 'de' yyyy";
  dateFmtWeekRange = "d 'de' MMMM";
  dateFmtWeekEnd = "d 'de' MMMM 'de' yyyy";

  // Calendar
  weekStart = new Date();
  weekEnd = new Date();
  calendarHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  calendarDays: { date: string; label: string; dayNum: number; isToday: boolean }[] = [];

  // Forms
  editForm: FormGroup;

  // Sidebar items
  sidebarItems: SidebarItem[] = [
    { key: 'perfil', label: 'Perfil', icon: 'person' },
    { key: 'mi-psicologo', label: 'Psicólogo', icon: 'medical_services' },
    { key: 'tareas', label: 'Tareas', icon: 'task_alt' },
    { key: 'tests', label: 'Tests', icon: 'assignment' },
    { key: 'calendario', label: 'Calendario', icon: 'calendar_today' },
    { key: 'citas', label: 'Citas', icon: 'event' },
    { key: 'agenda', label: 'Agenda', icon: 'book' },
    { key: 'chat', label: 'Chat', icon: 'chat' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private taskService: TaskService,
    private testService: TestService,
    private calendarService: CalendarService,
    private chatService: ChatService,
    private quotesService: QuotesService,
    private toast: ToastService,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      gender: [''],
      birthDate: ['']
    });
  }

  get pendingTasksCount(): number {
    return this.tasks.filter(t => !t.completed).length;
  }

  get pendingTestsCount(): number {
    return this.assignedTests.filter(t => t.status !== 'COMPLETED').length;
  }

  get pastAppointments(): Appointment[] {
    const now = new Date();
    return this.appointments
      .filter(a => new Date(a.startTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date();
    return this.appointments
      .filter(a => new Date(a.startTime) >= now && (a.status === 'CONFIRMED' || a.status === 'BOOKED'))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  get filteredTests(): AssignedTest[] {
    let list = this.assignedTests;
    if (this.testFilter === 'PENDING') {
      list = list.filter(t => t.status !== 'COMPLETED');
    } else if (this.testFilter === 'COMPLETED') {
      list = list.filter(t => t.status === 'COMPLETED');
    }
    if (this.testSearch.trim()) {
      const q = this.testSearch.toLowerCase();
      list = list.filter(t => t.testTitle.toLowerCase().includes(q));
    }
    return list;
  }

  ngOnInit(): void {
    this.initWeek();
    this.loadProfile();
    this.quotesService.getRandomQuote().subscribe(q => this.dailyQuote = q);
    this.loadEagerData();
  }

  loadEagerData(): void {
    this.taskService.list().subscribe({ next: (data) => this.tasks = data, error: () => {} });
    this.testService.listAssigned().subscribe({ next: (data) => this.assignedTests = data, error: () => {} });
    this.calendarService.myAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        const now = new Date();
        this.upcomingAppointment = data
          .filter((a: Appointment) => new Date(a.startTime) > now && (a.status === 'CONFIRMED' || a.status === 'BOOKED'))
          .sort((a: Appointment, b: Appointment) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] || null;
      },
      error: () => {}
    });
    this.profileService.myPsychologist().subscribe({ next: (data) => this.psychAssignment = data, error: () => {} });
  }

  initWeek(): void {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    this.weekStart = monday;
    this.weekEnd = new Date(monday);
    this.weekEnd.setDate(monday.getDate() + 6);
    this.buildCalendarDays();
  }

  buildCalendarDays(): void {
    const dayLabels = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.calendarDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStart);
      d.setDate(this.weekStart.getDate() + i);
      this.calendarDays.push({
        date: d.toISOString().split('T')[0],
        label: dayLabels[i],
        dayNum: d.getDate(),
        isToday: d.getTime() === today.getTime()
      });
    }
  }

  getSlotsForCell(dateStr: string, hour: number): any[] {
    return this.slots.filter(s => {
      const d = new Date(s.startTime);
      const slotDate = d.toISOString().split('T')[0];
      const slotHour = d.getHours();
      return slotDate === dateStr && slotHour === hour;
    });
  }

  changeWeek(delta: number): void {
    this.weekStart = new Date(this.weekStart);
    this.weekStart.setDate(this.weekStart.getDate() + delta * 7);
    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate() + 6);
    this.buildCalendarDays();
    this.loadSlots();
  }

  loadProfile(): void {
    this.profileService.me().subscribe({
      next: (user) => {
        this.me = user;
        this.authService.setUser(user);
        this.editForm.patchValue({
          name: user.name,
          gender: user.gender || '',
          birthDate: user.birthDate || ''
        });
        this.loading = false;
        this.loadTabData();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Error al cargar el perfil');
      }
    });
  }

  loadTabData(): void {
    switch (this.tab) {
      case 'mi-psicologo':
        this.profileService.myPsychologist().subscribe({
          next: (data) => this.psychAssignment = data,
          error: () => {}
        });
        break;
      case 'tareas':
        this.taskService.list().subscribe({
          next: (data) => this.tasks = data,
          error: () => this.toast.error('Error al cargar tareas')
        });
        break;
      case 'tests':
        this.testService.listAssigned().subscribe({
          next: (data) => this.assignedTests = data,
          error: () => this.toast.error('Error al cargar tests')
        });
        break;
      case 'calendario':
        this.loadSlots();
        break;
      case 'citas':
        this.calendarService.myAppointments().subscribe({
          next: (data) => this.appointments = data,
          error: () => this.toast.error('Error al cargar citas')
        });
        break;
      case 'chat':
        this.initChat();
        break;
    }
  }

  loadSlots(): void {
    const from = this.weekStart.toISOString();
    const to = this.weekEnd.toISOString();
    this.calendarService.availability(from, to).subscribe({
      next: (data) => this.slots = data,
      error: () => {}
    });
  }

  bookSlot(slotId: number): void {
    this.calendarService.book(slotId).subscribe({
      next: () => {
        this.toast.success('Cita reservada correctamente');
        this.loadSlots();
      },
      error: () => this.toast.error('Error al reservar la cita')
    });
  }

  completeTask(taskId: number): void {
    this.taskService.complete(taskId).subscribe({
      next: () => {
        this.toast.success('Tarea completada');
        this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, completed: true, status: 'COMPLETED' } : t);
      },
      error: () => this.toast.error('Error al completar la tarea')
    });
  }

  saveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.savingProfile = true;
    this.profileService.update(this.editForm.value).subscribe({
      next: () => {
        this.toast.success('Perfil actualizado');
        this.me = { ...this.me!, ...this.editForm.value };
        this.savingProfile = false;
        this.tab = 'perfil';
      },
      error: () => {
        this.toast.error('Error al guardar');
        this.savingProfile = false;
      }
    });
  }

  initChat(): void {
    if (!this.psychAssignment?.psychologist) {
      this.profileService.myPsychologist().subscribe({
        next: (data) => {
          this.psychAssignment = data;
          if (data.psychologist) {
            this.loadChatHistory(data.psychologist.id);
          }
        }
      });
    } else {
      this.loadChatHistory(this.psychAssignment.psychologist.id);
    }
    this.chatService.connect();
    this.chatService.isConnected.subscribe(c => this.chatConnected = c);
    this.chatService.messages.subscribe(msgs => {
      if (msgs.length > 0) {
        this.chatMessages = [...this.chatMessages, ...msgs.filter(m =>
          !this.chatMessages.find(cm => cm.timestamp === m.timestamp && cm.content === m.content)
        )];
      }
    });
  }

  loadChatHistory(psychId: number): void {
    this.chatService.getHistory(psychId).subscribe({
      next: (msgs) => this.chatMessages = msgs,
      error: () => {}
    });
  }

  startTest(test: AssignedTest): void {
    this.activeTestId = test.testId;
    this.showingTestFlow = true;
  }

  onTestCompleted(): void {
    this.showingTestFlow = false;
    this.activeTestId = null;
    this.testService.listAssigned().subscribe({
      next: (data) => this.assignedTests = data,
      error: () => {}
    });
  }

  logout(): void {
    this.authService.logout();
  }

  sendMessage(): void {
    if (!this.chatInput.trim() || !this.psychAssignment?.psychologist) return;
    const content = this.chatInput.trim();
    this.chatInput = '';
    const receiverId = this.psychAssignment.psychologist.id;

    this.chatMessages.push({
      senderId: this.me!.id,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      senderName: this.me!.name
    });

    this.chatService.sendMessage(receiverId, content).subscribe({
      error: () => this.toast.error('Error al enviar mensaje')
    });
  }
}
