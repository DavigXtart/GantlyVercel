import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PsychService } from '../../core/services/psych.service';
import { TaskService } from '../../core/services/task.service';
import { TestService } from '../../core/services/test.service';
import { CalendarService } from '../../core/services/calendar.service';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { User, Patient, Task, AssignedTest, Test, Appointment, ChatMessage, CalendarSlot } from '../../core/models';

@Component({
  selector: 'app-psych-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent],
  template: `
    <app-header [isAuthenticated]="true" [userName]="me?.name || ''" />

    <div class="pt-16 flex min-h-screen bg-cream">
      <app-sidebar
        [items]="sidebarItems"
        [activeTab]="tab"
        [title]="'Panel Psicólogo'"
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
                <div class="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="size-28 md:size-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-sage/20 flex items-center justify-center shrink-0">
                      @if (me?.avatarUrl) {
                        <img [src]="me!.avatarUrl" class="w-full h-full object-cover" alt="avatar">
                      } @else {
                        <span class="text-4xl text-forest font-semibold">{{ me?.name?.charAt(0)?.toUpperCase() || 'P' }}</span>
                      }
                    </div>
                    <div class="text-center md:text-left">
                      <h1 class="text-4xl md:text-5xl font-normal mb-2">
                        Hola, <span class="serif-font italic text-sage">{{ me?.name || 'profesional' }}.</span>
                      </h1>
                      <p class="text-sage/70 font-light mb-1">{{ me?.email }} &bull; Miembro desde {{ me?.createdAt | date:dateFmtFull }}</p>
                    </div>
                  </div>
                  <!-- Toggle accepting -->
                  <div class="flex flex-col items-center gap-1 px-5 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-sage/20">
                    <div class="flex items-center gap-3">
                      <span class="text-sm text-forest font-medium">Aceptando nuevos pacientes</span>
                      <button (click)="toggleAccepting()"
                              class="w-12 h-6 rounded-full transition-all relative cursor-pointer border-0"
                              [class]="!isFull ? 'bg-green-400' : 'bg-red-400'">
                        <div class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                             [class]="!isFull ? 'left-6' : 'left-0.5'"></div>
                      </button>
                    </div>
                    <span class="text-xs text-sage/50">En recomendaciones</span>
                  </div>
                </div>
              </header>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left 2/3 -->
                <div class="lg:col-span-2 space-y-8">
                  <!-- Rating + Action buttons -->
                  <div class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow">
                    @if (myRating) {
                      <div class="flex items-center gap-2 mb-4">
                        @for (s of [1,2,3,4,5]; track s) {
                          <span class="text-lg" [class]="s <= myRating! ? 'text-amber-400' : 'text-gray-300'">&#9733;</span>
                        }
                        <span class="text-sm font-bold text-forest ml-1">{{ myRating.toFixed(1) }} ({{ totalRatings }} valoraciones)</span>
                      </div>
                    }
                    <div class="flex gap-3">
                      <button class="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition-all bg-transparent cursor-pointer">
                        Editar Perfil Profesional
                      </button>
                      <button class="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition-all bg-transparent cursor-pointer">
                        Invitar Paciente
                      </button>
                    </div>
                  </div>

                  <!-- Stats grid -->
                  <div class="grid grid-cols-3 gap-6">
                    <div class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow">
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Pacientes asignados</span>
                      <div class="text-5xl serif-font italic text-primary mt-2">{{ patients.length }}</div>
                    </div>
                    <div class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow">
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Tareas creadas</span>
                      <div class="text-5xl serif-font italic text-primary mt-2">{{ allTasks.length }}</div>
                    </div>
                    <div class="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow">
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Citas por confirmar</span>
                      <div class="text-5xl serif-font italic text-primary mt-2">{{ pendingAppointmentsCount }}</div>
                    </div>
                  </div>
                </div>

                <!-- Right 1/3: Próxima cita -->
                <div>
                  <div class="bg-white p-10 rounded-[4rem] border border-sage/10 soft-shadow">
                    <div class="flex items-center gap-2 mb-4">
                      <span class="material-symbols-outlined text-amber-500 text-sm">alarm</span>
                      <span class="text-[10px] uppercase tracking-widest font-bold text-sage/40">Próxima cita</span>
                    </div>
                    @if (nextAppointment) {
                      <h4 class="text-2xl font-normal mb-3">{{ nextAppointment.startTime | date:'EEE, d MMM' }}</h4>
                      <div class="flex items-center gap-2 text-sage text-sm mb-2">
                        <span class="material-symbols-outlined text-base">schedule</span>
                        <span class="font-light">{{ nextAppointment.startTime | date:'HH:mm' }}</span>
                      </div>
                      @if (nextAppointment.patient) {
                        <div class="flex items-center gap-2 text-sage text-sm mb-4">
                          <span class="material-symbols-outlined text-base">person</span>
                          <span class="font-light">{{ nextAppointment.patient.name }}</span>
                        </div>
                      }
                      <p class="text-amber-600 text-sm italic mb-4">Podrás iniciar la videollamada 1 hora antes</p>
                      <button class="w-full py-3 bg-forest text-white font-medium rounded-full border-0 cursor-pointer text-sm hover:bg-forest/90 transition-colors">
                        Join Call
                      </button>
                      <div class="text-center mt-3">
                        <button (click)="tab = 'citas-pasadas'; loadTabData()" class="text-sage text-sm underline bg-transparent border-0 cursor-pointer">Ver todas</button>
                      </div>
                    } @else {
                      <div class="text-center py-4">
                        <p class="text-sage/70 text-sm font-light">Sin citas próximas</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- PACIENTES -->
          @if (tab === 'pacientes') {
            <div class="animate-fade-in">
              <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 class="text-2xl font-bold text-primary">Mis Pacientes</h2>
                  <button (click)="loadPatients()" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium border-0 cursor-pointer hover:bg-primary/90">
                    Refrescar
                  </button>
                </div>

                <!-- Search + filters -->
                <div class="flex flex-col sm:flex-row gap-3 mb-6">
                  <input type="text"
                         [(ngModel)]="patientSearch"
                         placeholder="Buscar por nombre o email..."
                         class="form-input !mb-0 flex-1">
                  <select [(ngModel)]="patientGenderFilter" class="form-input !mb-0 !w-auto">
                    <option value="">Todos los géneros</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                  <select [(ngModel)]="patientVisitFilter" class="form-input !mb-0 !w-auto">
                    <option value="">Todas las visitas</option>
                    <option value="recent">Visita reciente</option>
                    <option value="none">Sin visitas</option>
                  </select>
                </div>

                <h3 class="font-semibold text-forest mb-4">Pacientes Activos ({{ filteredPatients.length }})</h3>

                @if (filteredPatients.length === 0) {
                  <div class="text-center py-12">
                    <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">group</span>
                    <h4 class="font-bold text-forest mb-2">Sin pacientes</h4>
                    <p class="text-sm text-forest/60">No tienes pacientes asignados todavía.</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    @for (patient of filteredPatients; track patient.id) {
                      <div class="border border-sage/10 rounded-2xl p-4 hover:-translate-y-1 transition-transform">
                        <div class="flex items-center gap-3 mb-3">
                          <div class="size-10 rounded-full bg-sage/20 border border-sage/30 flex items-center justify-center overflow-hidden shrink-0">
                            @if (patient.avatarUrl) {
                              <img [src]="patient.avatarUrl" class="w-full h-full object-cover" alt="">
                            } @else {
                              <span class="material-symbols-outlined text-sage text-lg">person</span>
                            }
                          </div>
                          <div class="min-w-0">
                            <h4 class="font-bold text-forest text-sm truncate">{{ patient.name }}</h4>
                            <p class="text-xs text-forest/50 truncate">{{ patient.email }}</p>
                          </div>
                        </div>
                        <p class="text-xs text-primary mb-3">
                          {{ patient.lastVisit ? 'Última visita: ' + (patient.lastVisit | date:'d MMM yyyy') : 'Sin visitas registradas' }}
                        </p>
                        <button (click)="openPatientChat(patient)"
                                class="w-full py-2 bg-primary text-white rounded-xl text-sm font-medium border-0 cursor-pointer hover:bg-primary/90 flex items-center justify-center gap-2">
                          <span class="size-2 bg-green-300 rounded-full inline-block"></span>
                          Abrir Chat
                        </button>
                        @if (patient.status !== 'DISCHARGED') {
                          <button (click)="dischargePatient(patient.id)"
                                  class="w-full py-2 mt-2 bg-transparent border border-sage/20 rounded-xl text-sm text-forest/60 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                            Dar de Alta
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAREAS -->
          @if (tab === 'tareas') {
            <div class="animate-fade-in">
              <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold text-primary">Tareas por Paciente</h2>
                  <button (click)="showTaskForm = !showTaskForm"
                          class="px-4 py-2 bg-primary/80 text-white rounded-xl text-sm font-medium border-0 cursor-pointer hover:bg-primary">
                    {{ showTaskForm ? 'Cancelar' : '+ Nueva Tarea' }}
                  </button>
                </div>

                @if (showTaskForm) {
                  <div class="bg-sage/5 rounded-2xl p-6 mb-6 animate-fade-in">
                    <h3 class="font-bold text-forest mb-4">Crear tarea</h3>
                    <form [formGroup]="taskForm" (ngSubmit)="createTask()">
                      <div class="form-group">
                        <label class="form-label">Paciente</label>
                        <select formControlName="userId" class="form-input">
                          <option value="">Seleccionar paciente</option>
                          @for (p of patients; track p.id) {
                            <option [value]="p.id">{{ p.name }}</option>
                          }
                        </select>
                        @if (taskForm.get('userId')?.invalid && taskForm.get('userId')?.touched) {
                          <div class="form-error">Selecciona un paciente</div>
                        }
                      </div>
                      <div class="form-group">
                        <label class="form-label">Título</label>
                        <input type="text" formControlName="title" class="form-input" placeholder="Título de la tarea">
                        @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
                          <div class="form-error">El título es obligatorio</div>
                        }
                      </div>
                      <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea formControlName="description" class="form-input" rows="3" placeholder="Descripción opcional"></textarea>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Fecha límite</label>
                        <input type="date" formControlName="dueDate" class="form-input">
                      </div>
                      <button type="submit" class="btn btn-primary" [disabled]="creatingTask">
                        {{ creatingTask ? 'Creando...' : 'Crear tarea' }}
                      </button>
                    </form>
                  </div>
                }

                <!-- Patient cards with task counts -->
                @if (tasksByPatient.length === 0) {
                  <div class="text-center py-12">
                    <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">task_alt</span>
                    <h4 class="font-bold text-forest mb-2">Sin tareas</h4>
                    <p class="text-sm text-forest/60">Crea tareas para tus pacientes.</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (pt of tasksByPatient; track pt.patientId) {
                      <div class="bg-sage/5 rounded-2xl p-4 border border-dashed border-sage/20 flex items-center gap-3 cursor-pointer hover:bg-sage/10 transition-colors"
                           (click)="showPatientTasks(pt.patientId)">
                        <div class="size-10 rounded-full bg-sage/20 border border-sage/30 flex items-center justify-center overflow-hidden shrink-0">
                          @if (pt.avatarUrl) {
                            <img [src]="pt.avatarUrl" class="w-full h-full object-cover" alt="">
                          } @else {
                            <span class="material-symbols-outlined text-sage text-lg">person</span>
                          }
                        </div>
                        <div>
                          <h4 class="font-bold text-forest text-sm">{{ pt.patientName }}</h4>
                          <p class="text-xs text-sage">{{ pt.taskCount }} {{ pt.taskCount === 1 ? 'tarea' : 'tareas' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- TESTS ASIGNADOS -->
          @if (tab === 'tests') {
            <div class="animate-fade-in">
              <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold text-primary">Tests Asignados</h2>
                  <button (click)="showAssignTestForm = !showAssignTestForm"
                          class="px-4 py-2 bg-primary/80 text-white rounded-xl text-sm font-medium border-0 cursor-pointer hover:bg-primary">
                    {{ showAssignTestForm ? 'Cancelar' : 'Asignar Test' }}
                  </button>
                </div>

                @if (showAssignTestForm) {
                  <div class="bg-sage/5 rounded-2xl p-6 mb-6 animate-fade-in">
                    <h3 class="font-bold text-forest mb-4">Asignar test a paciente</h3>
                    <form [formGroup]="assignTestForm" (ngSubmit)="assignTest()">
                      <div class="form-group">
                        <label class="form-label">Paciente</label>
                        <select formControlName="userId" class="form-input">
                          <option value="">Seleccionar paciente</option>
                          @for (p of patients; track p.id) {
                            <option [value]="p.id">{{ p.name }}</option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Test</label>
                        <select formControlName="testId" class="form-input">
                          <option value="">Seleccionar test</option>
                          @for (t of availableTests; track t.id) {
                            <option [value]="t.id">{{ t.title }}</option>
                          }
                        </select>
                      </div>
                      <button type="submit" class="btn btn-primary">Asignar</button>
                    </form>
                  </div>
                }

                @if (testsByPatient.length === 0) {
                  <div class="text-center py-12">
                    <span class="material-symbols-outlined text-5xl text-sage/30 mb-3">assignment</span>
                    <h4 class="font-bold text-forest mb-2">Sin tests asignados</h4>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (pt of testsByPatient; track pt.patientId) {
                      <div class="bg-white rounded-2xl p-4 border border-sage/10 flex items-center gap-4 soft-shadow">
                        <div class="size-10 rounded-full bg-sage/20 border border-sage/30 flex items-center justify-center overflow-hidden shrink-0">
                          @if (pt.avatarUrl) {
                            <img [src]="pt.avatarUrl" class="w-full h-full object-cover" alt="">
                          } @else {
                            <span class="material-symbols-outlined text-sage text-lg">person</span>
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-forest">{{ pt.patientName }}</h4>
                          <p class="text-xs text-forest/50">{{ pt.email }}</p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <span class="text-sm text-forest/60">{{ pt.totalTests }} {{ pt.totalTests === 1 ? 'test' : 'tests' }}</span>
                          @if (pt.completedCount > 0) {
                            <span class="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-bold">{{ pt.completedCount }} completado{{ pt.completedCount > 1 ? 's' : '' }}</span>
                          }
                          @if (pt.pendingCount > 0) {
                            <span class="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">{{ pt.pendingCount }} pendiente{{ pt.pendingCount > 1 ? 's' : '' }}</span>
                          }
                          <span class="material-symbols-outlined text-sage/30">chevron_right</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- CALENDARIO -->
          @if (tab === 'calendario') {
            <div class="animate-fade-in">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold text-forest">Calendario</h2>
                <button (click)="showSlotForm = !showSlotForm"
                        class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium border-0 cursor-pointer hover:bg-primary/90">
                  {{ showSlotForm ? 'Cancelar' : '+ Crear Slot' }}
                </button>
              </div>

              @if (showSlotForm) {
                <div class="bg-white rounded-2xl p-6 mb-6 soft-shadow border border-sage/10 animate-fade-in">
                  <h3 class="font-bold text-forest mb-4">Nuevo slot de disponibilidad</h3>
                  <form [formGroup]="slotForm" (ngSubmit)="createSlot()">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="form-group">
                        <label class="form-label">Inicio</label>
                        <input type="datetime-local" formControlName="start" class="form-input">
                      </div>
                      <div class="form-group">
                        <label class="form-label">Fin</label>
                        <input type="datetime-local" formControlName="end" class="form-input">
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Precio (€)</label>
                      <input type="number" formControlName="price" class="form-input" placeholder="50">
                    </div>
                    <button type="submit" class="btn btn-primary">Crear slot</button>
                  </form>
                </div>
              }

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
                  <thead>
                    <tr>
                      <th class="p-3 text-xs text-forest/50 font-medium border-b border-sage/10 w-16 text-left">HORA</th>
                      @for (day of psychCalendarDays; track day.date) {
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
                    @for (hour of [8,9,10,11,12,13,14,15,16,17,18,19,20]; track hour) {
                      <tr class="border-b border-sage/5">
                        <td class="p-2 text-xs text-forest/40 font-medium align-top w-16">{{ hour }}:00</td>
                        @for (day of psychCalendarDays; track day.date) {
                          <td class="p-1 align-top border-l border-sage/5 h-16 relative">
                            @for (slot of getPsychSlotsForCell(day.date, hour); track slot.id) {
                              @if (slot.status === 'BOOKED' || slot.status === 'CONFIRMED') {
                                <div class="bg-amber-100 border-2 border-amber-400 rounded-xl p-2 text-xs mb-1">
                                  <div class="font-medium">{{ slot.startTime | date:'HH:mm' }} - {{ slot.endTime | date:'HH:mm' }}</div>
                                  @if (slot.patientName) {
                                    <div class="text-forest/60">&#128100; {{ slot.patientName }}</div>
                                  }
                                  <div class="text-primary text-[10px]">Reservada</div>
                                </div>
                              } @else {
                                <div class="bg-blue-100 border-2 border-blue-400 rounded-xl p-2 text-xs mb-1">
                                  <div class="font-medium">{{ slot.startTime | date:'HH:mm' }} - {{ slot.endTime | date:'HH:mm' }}</div>
                                  <div class="text-forest/60">Disponible</div>
                                  @if (slot.price) {
                                    <div class="text-[10px] text-forest/50">{{ slot.price }}€</div>
                                  }
                                  <button (click)="deleteSlot(slot.id)"
                                          class="mt-1 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-lg font-bold border-0 cursor-pointer hover:bg-red-600">
                                    Eliminar
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

          <!-- CHAT -->
          @if (tab === 'chat') {
            <div class="max-w-5xl animate-fade-in">
              <h2 class="text-2xl font-bold text-forest mb-6">Chat</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
                <!-- Patient list -->
                <div class="card p-3 overflow-y-auto">
                  <h3 class="font-bold text-forest text-sm mb-3 px-2">Pacientes</h3>
                  @for (p of patients; track p.id) {
                    <button (click)="selectChatPatient(p)"
                            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left border-0 cursor-pointer transition-all"
                            [class]="chatPatient?.id === p.id ? 'bg-primary text-white' : 'hover:bg-mint/50 bg-transparent text-forest'">
                      <div class="w-8 h-8 rounded-full bg-gentle-mint flex items-center justify-center text-sm shrink-0"
                           [class]="chatPatient?.id === p.id ? 'bg-white/20' : ''">&#128100;</div>
                      <span class="text-sm truncate">{{ p.name }}</span>
                    </button>
                  }
                </div>

                <!-- Conversation -->
                <div class="md:col-span-2 flex flex-col">
                  @if (chatPatient) {
                    <div class="bg-primary text-white rounded-t-xl px-4 py-3">
                      <div class="font-medium text-sm">{{ chatPatient.name }}</div>
                    </div>
                    <div class="flex-1 overflow-y-auto bg-white p-4 space-y-3">
                      @for (msg of chatMessages; track msg.timestamp) {
                        <div class="flex" [class]="msg.senderId === me?.id ? 'justify-end' : 'justify-start'">
                          <div class="max-w-xs px-4 py-2 rounded-2xl text-sm"
                               [class]="msg.senderId === me?.id
                                 ? 'bg-purple-600 text-white rounded-br-none'
                                 : 'bg-gray-100 text-forest rounded-bl-none'">
                            <p>{{ msg.content }}</p>
                            <p class="text-xs mt-1 opacity-60">{{ msg.timestamp | date:'HH:mm' }}</p>
                          </div>
                        </div>
                      }
                    </div>
                    <div class="bg-white border-t rounded-b-xl p-3 flex gap-2">
                      <input type="text" [(ngModel)]="chatInput" (keyup.enter)="sendChatMessage()"
                             placeholder="Escribe un mensaje..." class="form-input flex-1 !mb-0">
                      <button (click)="sendChatMessage()" class="btn btn-primary px-4">Enviar</button>
                    </div>
                  } @else {
                    <div class="flex-1 flex items-center justify-center text-forest/40 bg-white rounded-xl">
                      Selecciona un paciente para chatear
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- CITAS PASADAS -->
          @if (tab === 'citas-pasadas') {
            <div class="animate-fade-in">
              <div class="bg-white rounded-[3rem] p-8 lg:p-10 soft-shadow border border-sage/10">
                <h2 class="text-2xl font-bold text-forest mb-2">Mis Citas Pasadas</h2>
                @if (myRating) {
                  <div class="flex items-center gap-2 mb-6">
                    @for (s of [1,2,3,4,5]; track s) {
                      <span class="text-lg" [class]="s <= myRating! ? 'text-amber-400' : 'text-gray-300'">&#9733;</span>
                    }
                    <span class="text-sm font-bold text-forest ml-1">{{ myRating.toFixed(1) }} de 5.0 ({{ totalRatings }} valoraciones)</span>
                  </div>
                }
                @if (pastAppointments.length === 0) {
                  <div class="text-center py-12">
                    <p class="text-forest/50">Sin citas pasadas</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (apt of pastAppointments; track apt.id) {
                      <div class="bg-sage/10 rounded-3xl px-6 py-4 flex items-center justify-between">
                        <div>
                          <h4 class="font-semibold text-forest">Cita con {{ apt.patient?.name || 'Paciente' }}</h4>
                          <p class="text-sage text-sm">{{ apt.startTime | date:dateFmtDay }}</p>
                          <p class="text-forest/60 text-sm">{{ apt.startTime | date:'HH:mm' }} -{{ apt.endTime | date:'HH:mm' }}</p>
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
              </div>
            </div>
          }

        }
      </main>
    </div>
  `
})
export class PsychDashboardComponent implements OnInit {
  tab = 'perfil';
  loading = true;
  me: User | null = null;
  patients: Patient[] = [];
  allTasks: Task[] = [];
  assignedTests: AssignedTest[] = [];
  availableTests: Test[] = [];
  slots: CalendarSlot[] = [];
  pastAppointments: Appointment[] = [];
  chatMessages: ChatMessage[] = [];
  chatPatient: Patient | null = null;
  chatInput = '';
  isFull = false;
  myRating: number | null = null;
  totalRatings = 0;

  dateFmtFull = "d 'de' MMMM 'de' yyyy";
  dateFmtDay = "EEEE, d 'de' MMMM 'de' yyyy";
  dateFmtWeekRange = "d 'de' MMMM";
  dateFmtWeekEnd = "d 'de' MMMM 'de' yyyy";
  nextAppointment: Appointment | null = null;
  patientSearch = '';
  patientGenderFilter = '';
  patientVisitFilter = '';
  showTaskForm = false;
  showAssignTestForm = false;
  showSlotForm = false;
  creatingTask = false;

  weekStart = new Date();
  weekEnd = new Date();
  psychCalendarDays: { date: string; label: string; dayNum: number; isToday: boolean }[] = [];

  taskForm: FormGroup;
  assignTestForm: FormGroup;
  slotForm: FormGroup;

  sidebarItems: SidebarItem[] = [
    { key: 'perfil', label: 'Perfil', icon: 'person' },
    { key: 'pacientes', label: 'Pacientes', icon: 'group' },
    { key: 'tareas', label: 'Tareas', icon: 'task_alt' },
    { key: 'tests', label: 'Tests', icon: 'assignment' },
    { key: 'calendario', label: 'Calendario', icon: 'calendar_today' },
    { key: 'chat', label: 'Chat', icon: 'chat' },
    { key: 'citas-pasadas', label: 'Citas', icon: 'event' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private psychService: PsychService,
    private taskService: TaskService,
    private testService: TestService,
    private calendarService: CalendarService,
    private chatService: ChatService,
    private toast: ToastService,
    private router: Router
  ) {
    this.taskForm = this.fb.group({
      userId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      dueDate: ['']
    });
    this.assignTestForm = this.fb.group({
      userId: ['', Validators.required],
      testId: ['', Validators.required]
    });
    this.slotForm = this.fb.group({
      start: ['', Validators.required],
      end: ['', Validators.required],
      price: [50]
    });
  }

  ngOnInit(): void {
    this.initWeek();
    this.loadProfile();
  }

  get filteredPatients(): Patient[] {
    let list = this.patients;
    if (this.patientSearch.trim()) {
      const q = this.patientSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    if (this.patientGenderFilter) {
      list = list.filter(p => p.gender === this.patientGenderFilter);
    }
    if (this.patientVisitFilter === 'recent') {
      list = list.filter(p => p.lastVisit);
    } else if (this.patientVisitFilter === 'none') {
      list = list.filter(p => !p.lastVisit);
    }
    return list;
  }

  get pendingAppointmentsCount(): number {
    return this.slots.filter(s => s.status === 'BOOKED').length;
  }

  get tasksByPatient(): { patientId: number; patientName: string; avatarUrl?: string; taskCount: number }[] {
    const map = new Map<number, { patientId: number; patientName: string; avatarUrl?: string; taskCount: number }>();
    for (const task of this.allTasks) {
      if (task.userId) {
        if (!map.has(task.userId)) {
          const patient = this.patients.find(p => p.id === task.userId);
          map.set(task.userId, {
            patientId: task.userId,
            patientName: task.userName || patient?.name || 'Paciente',
            avatarUrl: patient?.avatarUrl,
            taskCount: 0
          });
        }
        map.get(task.userId)!.taskCount++;
      }
    }
    return Array.from(map.values());
  }

  get testsByPatient(): { patientId: number; patientName: string; email: string; avatarUrl?: string; totalTests: number; completedCount: number; pendingCount: number }[] {
    const map = new Map<number, { patientId: number; patientName: string; email: string; avatarUrl?: string; totalTests: number; completedCount: number; pendingCount: number }>();
    for (const at of this.assignedTests) {
      if (at.userId) {
        if (!map.has(at.userId)) {
          const patient = this.patients.find(p => p.id === at.userId);
          map.set(at.userId, {
            patientId: at.userId,
            patientName: at.userName || patient?.name || 'Paciente',
            email: at.userEmail || patient?.email || '',
            avatarUrl: patient?.avatarUrl || at.userAvatarUrl,
            totalTests: 0,
            completedCount: 0,
            pendingCount: 0
          });
        }
        const entry = map.get(at.userId)!;
        entry.totalTests++;
        if (at.status === 'COMPLETED') entry.completedCount++;
        else entry.pendingCount++;
      }
    }
    return Array.from(map.values());
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
    this.buildPsychCalendarDays();
  }

  buildPsychCalendarDays(): void {
    const dayLabels = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.psychCalendarDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStart);
      d.setDate(this.weekStart.getDate() + i);
      this.psychCalendarDays.push({
        date: d.toISOString().split('T')[0],
        label: dayLabels[i],
        dayNum: d.getDate(),
        isToday: d.getTime() === today.getTime()
      });
    }
  }

  getPsychSlotsForCell(dateStr: string, hour: number): CalendarSlot[] {
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
    this.buildPsychCalendarDays();
    this.loadSlots();
  }

  loadProfile(): void {
    this.profileService.me().subscribe({
      next: (user) => {
        this.me = user;
        this.authService.setUser(user);
        this.loading = false;
        this.loadPatients();
        this.loadEagerData();
        this.loadTabData();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Error al cargar perfil');
      }
    });
  }

  loadEagerData(): void {
    this.taskService.list().subscribe({ next: (data) => this.allTasks = data, error: () => {} });
    this.testService.listAssigned().subscribe({ next: (data) => this.assignedTests = data, error: () => {} });
    this.calendarService.getPsychologistPastAppointments().subscribe({
      next: (data) => {
        this.pastAppointments = data;
        const rated = data.filter((a: Appointment) => a.rating);
        if (rated.length > 0) {
          this.totalRatings = rated.length;
          this.myRating = rated.reduce((sum: number, a: Appointment) => sum + (a.rating || 0), 0) / rated.length;
        }
      },
      error: () => {}
    });
    this.loadSlots();
  }

  showPatientTasks(patientId: number): void {
    // Could navigate to a detail view - for now just log
  }

  loadPatients(): void {
    this.psychService.patients().subscribe({
      next: (data) => this.patients = data,
      error: () => {}
    });
  }

  loadTabData(): void {
    switch (this.tab) {
      case 'tareas':
        this.taskService.list().subscribe(data => this.allTasks = data);
        break;
      case 'tests':
        this.testService.listAssigned().subscribe(data => this.assignedTests = data);
        this.testService.list().subscribe(data => this.availableTests = data);
        break;
      case 'calendario':
        this.loadSlots();
        break;
      case 'citas-pasadas':
        this.calendarService.getPsychologistPastAppointments().subscribe(data => this.pastAppointments = data);
        break;
      case 'chat':
        this.chatService.connect();
        break;
    }
  }

  loadSlots(): void {
    const from = this.weekStart.toISOString();
    const to = this.weekEnd.toISOString();
    this.calendarService.mySlots(from, to).subscribe({
      next: (data) => this.slots = data,
      error: () => {}
    });
  }

  toggleAccepting(): void {
    this.isFull = !this.isFull;
    this.psychService.updateIsFull(this.isFull).subscribe({
      next: () => this.toast.success(this.isFull ? 'Ya no aceptas pacientes' : 'Ahora aceptas pacientes'),
      error: () => { this.isFull = !this.isFull; }
    });
  }

  createTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    this.creatingTask = true;
    const val = this.taskForm.value;
    this.taskService.create({
      userId: +val.userId,
      psychologistId: this.me!.id,
      title: val.title,
      description: val.description,
      dueDate: val.dueDate || undefined
    }).subscribe({
      next: (task) => {
        this.allTasks.unshift(task);
        this.taskForm.reset();
        this.showTaskForm = false;
        this.creatingTask = false;
        this.toast.success('Tarea creada');
      },
      error: () => {
        this.creatingTask = false;
        this.toast.error('Error al crear tarea');
      }
    });
  }

  assignTest(): void {
    if (this.assignTestForm.invalid) return;
    const { userId, testId } = this.assignTestForm.value;
    this.testService.assign(+userId, +testId).subscribe({
      next: (at) => {
        this.assignedTests.unshift(at);
        this.assignTestForm.reset();
        this.showAssignTestForm = false;
        this.toast.success('Test asignado');
      },
      error: () => this.toast.error('Error al asignar test')
    });
  }

  createSlot(): void {
    if (this.slotForm.invalid) return;
    const { start, end, price } = this.slotForm.value;
    this.calendarService.createSlot(new Date(start).toISOString(), new Date(end).toISOString(), price).subscribe({
      next: () => {
        this.slotForm.reset({ price: 50 });
        this.showSlotForm = false;
        this.loadSlots();
        this.toast.success('Slot creado');
      },
      error: () => this.toast.error('Error al crear slot')
    });
  }

  deleteSlot(slotId: number): void {
    this.calendarService.deleteSlot(slotId).subscribe({
      next: () => {
        this.slots = this.slots.filter(s => s.id !== slotId);
        this.toast.success('Slot eliminado');
      },
      error: () => this.toast.error('Error al eliminar')
    });
  }

  openPatientChat(patient: Patient): void {
    this.tab = 'chat';
    this.selectChatPatient(patient);
  }

  selectChatPatient(patient: Patient): void {
    this.chatPatient = patient;
    this.chatMessages = [];
    this.chatService.getHistory(patient.id).subscribe({
      next: (msgs) => this.chatMessages = msgs,
      error: () => {}
    });
  }

  sendChatMessage(): void {
    if (!this.chatInput.trim() || !this.chatPatient) return;
    const content = this.chatInput.trim();
    this.chatInput = '';

    this.chatMessages.push({
      senderId: this.me!.id,
      receiverId: this.chatPatient.id,
      content,
      timestamp: new Date().toISOString()
    });

    this.chatService.sendMessage(this.chatPatient.id, content).subscribe({
      error: () => this.toast.error('Error al enviar')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  dischargePatient(patientId: number): void {
    this.psychService.updatePatientStatus(patientId, 'DISCHARGED').subscribe({
      next: () => {
        this.patients = this.patients.map(p => p.id === patientId ? { ...p, status: 'DISCHARGED' } : p);
        this.toast.success('Paciente dado de alta');
      },
      error: () => this.toast.error('Error')
    });
  }
}
