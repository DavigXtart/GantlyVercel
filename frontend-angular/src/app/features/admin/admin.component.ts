import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { QuotesService, Quote } from '../../core/services/quotes.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { AdminStatistics, AdminUser, Test, Question, Answer } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-header [isAuthenticated]="true" [userName]="'Admin'" />

    <div class="pt-16 min-h-screen bg-cream">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <!-- Tabs -->
        <div class="admin-tabs mb-6">
          @for (t of tabs; track t.key) {
            <button class="admin-tab" [class.active]="tab === t.key" (click)="tab = t.key; loadTabData()">
              {{ t.label }}
            </button>
          }
        </div>

        <!-- ESTADÍSTICAS -->
        @if (tab === 'stats') {
          <div class="animate-fade-in">
            <h2 class="text-2xl font-bold text-forest mb-6">Estadísticas generales</h2>
            @if (!stats) {
              <app-loading-spinner />
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                @for (card of statsCards; track card.label) {
                  <div class="card p-5 text-center card-hover">
                    <div class="text-3xl font-bold text-primary">{{ card.value }}</div>
                    <div class="text-sm text-forest/60 mt-1">{{ card.label }}</div>
                  </div>
                }
              </div>

              <!-- Motivational Quotes (External API) -->
              @if (quotes.length > 0) {
                <div class="mt-8">
                  <h3 class="text-lg font-bold text-forest mb-4">Frases motivacionales <span class="text-xs font-normal text-forest/40">(API externa: ZenQuotes)</span></h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    @for (q of quotes.slice(0, 3); track q.text) {
                      <div class="card p-4 bg-gradient-to-br from-gentle-mint/30 to-white">
                        <p class="text-sm italic text-forest/80 serif-font mb-2">"{{ q.text }}"</p>
                        <p class="text-xs text-sage">— {{ q.author }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }

        <!-- USUARIOS / ROLES -->
        @if (tab === 'users') {
          <div class="animate-fade-in">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 class="text-2xl font-bold text-forest">Gestión de usuarios</h2>
              <input type="text" [(ngModel)]="userSearch" placeholder="Buscar usuarios..."
                     class="form-input !w-auto !mb-0 min-w-48">
            </div>

            @if (loading) {
              <app-loading-spinner />
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full bg-white rounded-xl overflow-hidden shadow-sm">
                  <thead>
                    <tr class="bg-forest text-white text-sm text-left">
                      <th class="p-3">ID</th>
                      <th class="p-3">Nombre</th>
                      <th class="p-3">Email</th>
                      <th class="p-3">Rol</th>
                      <th class="p-3">Psicólogo</th>
                      <th class="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of filteredUsers; track user.id) {
                      <tr class="border-t border-gray-100 hover:bg-gentle-mint/20 transition-colors">
                        <td class="p-3 text-sm text-forest/60">{{ user.id }}</td>
                        <td class="p-3 text-sm font-medium text-forest">{{ user.name }}</td>
                        <td class="p-3 text-sm text-forest/60">{{ user.email }}</td>
                        <td class="p-3">
                          <select [value]="user.role" (change)="changeUserRole(user.id, $event)"
                                  class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                            <option value="USER">USER</option>
                            <option value="PSYCHOLOGIST">PSYCHOLOGIST</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td class="p-3">
                          @if (user.role === 'USER') {
                            <select [value]="user.psychologistId || ''" (change)="assignPsych(user.id, $event)"
                                    class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                              <option value="">Sin asignar</option>
                              @for (p of psychList; track p.id) {
                                <option [value]="p.id">{{ p.name }}</option>
                              }
                            </select>
                          } @else {
                            <span class="text-xs text-forest/40">—</span>
                          }
                        </td>
                        <td class="p-3">
                          @if (user.psychologistId) {
                            <button (click)="unassignPsych(user.id)" class="text-xs text-danger hover:underline cursor-pointer bg-transparent border-0">
                              Desasignar
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- TESTS -->
        @if (tab === 'tests') {
          <div class="animate-fade-in">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 class="text-2xl font-bold text-forest">Gestión de tests</h2>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="testSearch" placeholder="Buscar tests..."
                       class="form-input !w-auto !mb-0 min-w-40">
                <button (click)="showTestForm = !showTestForm" class="btn btn-primary text-sm">
                  {{ showTestForm ? 'Cancelar' : '+ Nuevo Test' }}
                </button>
              </div>
            </div>

            <!-- Create/Edit Form -->
            @if (showTestForm) {
              <div class="card p-6 mb-6 animate-fade-in">
                <h3 class="font-bold text-forest mb-4">{{ editingTest ? 'Editar test' : 'Crear nuevo test' }}</h3>
                <form [formGroup]="testForm" (ngSubmit)="saveTest()">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">Código</label>
                      <input type="text" formControlName="code" class="form-input" placeholder="TEST_001">
                      @if (testForm.get('code')?.invalid && testForm.get('code')?.touched) {
                        <div class="form-error">El código es obligatorio</div>
                      }
                    </div>
                    <div class="form-group">
                      <label class="form-label">Categoría</label>
                      <select formControlName="category" class="form-input">
                        <option value="">Sin categoría</option>
                        <option value="EVALUATION">Evaluación</option>
                        <option value="DISCOVERY">Descubrimiento</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Título</label>
                    <input type="text" formControlName="title" class="form-input" placeholder="Título del test">
                    @if (testForm.get('title')?.invalid && testForm.get('title')?.touched) {
                      <div class="form-error">El título es obligatorio</div>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea formControlName="description" class="form-input" rows="3" placeholder="Descripción del test"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tema</label>
                    <input type="text" formControlName="topic" class="form-input" placeholder="ansiedad, depresión...">
                  </div>
                  <div class="flex gap-3">
                    <button type="submit" class="btn btn-primary" [disabled]="savingTest">
                      {{ savingTest ? 'Guardando...' : (editingTest ? 'Actualizar' : 'Crear') }}
                    </button>
                    @if (editingTest) {
                      <button type="button" (click)="cancelEditTest()" class="btn btn-ghost">Cancelar edición</button>
                    }
                  </div>
                </form>
              </div>
            }

            <!-- Test List -->
            @if (filteredTests.length === 0) {
              <div class="card p-8 text-center">
                <div class="text-5xl mb-3">&#128203;</div>
                <h3 class="font-bold text-forest mb-2">Sin tests</h3>
                <p class="text-sm text-forest/60">Crea tu primer test.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (test of filteredTests; track test.id) {
                  <div class="card p-4 card-hover">
                    <div class="flex justify-between items-start mb-3">
                      <div>
                        <h4 class="font-bold text-forest text-sm">{{ test.title }}</h4>
                        <p class="text-xs text-forest/40 font-mono">{{ test.code }}</p>
                      </div>
                      <span class="badge" [class]="test.active ? 'badge-success' : 'badge-danger'">
                        {{ test.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>
                    @if (test.description) {
                      <p class="text-xs text-forest/60 mb-3 line-clamp-2">{{ test.description }}</p>
                    }
                    <div class="flex gap-1 flex-wrap mb-3">
                      @if (test.category) {
                        <span class="badge badge-info text-xs">{{ test.category }}</span>
                      }
                      @if (test.topic) {
                        <span class="badge badge-warning text-xs">{{ test.topic }}</span>
                      }
                    </div>
                    <div class="flex gap-2">
                      <button (click)="editTest(test)" class="btn btn-secondary text-xs px-3 py-1.5 flex-1">Editar</button>
                      <button (click)="selectTestForDetail(test)" class="btn btn-ghost text-xs px-3 py-1.5">Gestionar</button>
                      <button (click)="toggleTestActive(test)" class="text-xs px-2 py-1 rounded-lg cursor-pointer border-0"
                              [class]="test.active ? 'bg-red-50 text-danger' : 'bg-gentle-mint text-primary'">
                        {{ test.active ? 'Desactivar' : 'Activar' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Test Detail / Questions -->
            @if (selectedTest) {
              <div class="mt-8 animate-fade-in">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-bold text-forest">
                    Preguntas: {{ selectedTest.title }}
                  </h3>
                  <button (click)="selectedTest = null" class="btn btn-ghost text-sm">Cerrar</button>
                </div>

                <!-- Add Question Form -->
                <div class="card p-6 mb-6">
                  <h4 class="font-bold text-forest mb-4">Añadir pregunta</h4>
                  <form [formGroup]="questionForm" (ngSubmit)="addQuestion()">
                    <div class="form-group">
                      <label class="form-label">Texto de la pregunta</label>
                      <input type="text" formControlName="text" class="form-input" placeholder="¿Cómo te sientes...?">
                      @if (questionForm.get('text')?.invalid && questionForm.get('text')?.touched) {
                        <div class="form-error">El texto es obligatorio</div>
                      }
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select formControlName="type" class="form-input">
                          <option value="RADIO">Radio (opciones)</option>
                          <option value="NUMERIC">Numérico</option>
                          <option value="TEXT">Texto libre</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Posición</label>
                        <input type="number" formControlName="position" class="form-input">
                      </div>
                    </div>
                    <button type="submit" class="btn btn-primary text-sm">Añadir pregunta</button>
                  </form>
                </div>

                <!-- Questions List -->
                @if (questions.length === 0) {
                  <div class="card p-6 text-center text-forest/50">Sin preguntas aún</div>
                } @else {
                  <div class="space-y-3">
                    @for (q of questions; track q.id; let i = $index) {
                      <div class="card p-4">
                        <div class="flex items-start gap-3">
                          <div class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {{ i + 1 }}
                          </div>
                          <div class="flex-1">
                            <p class="text-sm font-medium text-forest">{{ q.text }}</p>
                            <div class="flex gap-2 mt-1">
                              <span class="badge badge-info text-xs">{{ q.type }}</span>
                              @if (q.subfactorName) {
                                <span class="badge badge-warning text-xs">{{ q.subfactorName }}</span>
                              }
                            </div>
                            @if (q.answers && q.answers.length > 0) {
                              <div class="mt-2 pl-2 border-l-2 border-gray-200">
                                @for (a of q.answers; track a.id) {
                                  <div class="text-xs text-forest/60 py-0.5">
                                    {{ a.text }} <span class="text-forest/30">(valor: {{ a.value }})</span>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                          <button (click)="deleteQuestion(q.id)" class="text-danger text-sm hover:underline cursor-pointer bg-transparent border-0">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- PACIENTES -->
        @if (tab === 'patients') {
          <div class="animate-fade-in">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-forest">Pacientes</h2>
              <input type="text" [(ngModel)]="patientSearch" placeholder="Buscar..."
                     class="form-input !w-auto !mb-0 min-w-40">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (u of filteredPatientUsers; track u.id) {
                <div class="card p-4 card-hover">
                  <div class="w-12 h-12 rounded-full bg-gentle-mint flex items-center justify-center text-xl mx-auto mb-3">
                    &#128100;
                  </div>
                  <h4 class="font-medium text-forest text-sm text-center">{{ u.name }}</h4>
                  <p class="text-xs text-forest/50 text-center">{{ u.email }}</p>
                  @if (u.createdAt) {
                    <p class="text-xs text-forest/40 text-center mt-1">Registro: {{ u.createdAt | date:'dd/MM/yyyy' }}</p>
                  }
                  @if (u.psychologistName) {
                    <p class="text-xs text-primary text-center mt-1">Psicólogo: {{ u.psychologistName }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- PSICÓLOGOS -->
        @if (tab === 'psychologists') {
          <div class="animate-fade-in">
            <h2 class="text-2xl font-bold text-forest mb-6">Psicólogos</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (p of psychList; track p.id) {
                <div class="card p-4 card-hover">
                  <div class="w-12 h-12 rounded-full bg-gentle-mint flex items-center justify-center text-xl mx-auto mb-3">
                    &#129489;&#8205;&#9877;&#65039;
                  </div>
                  <h4 class="font-medium text-forest text-sm text-center">{{ p.name }}</h4>
                  <p class="text-xs text-forest/50 text-center">{{ p.email }}</p>
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  tab = 'stats';
  loading = false;
  stats: AdminStatistics | null = null;
  users: AdminUser[] = [];
  tests: Test[] = [];
  psychList: { id: number; name: string; email: string }[] = [];
  quotes: Quote[] = [];
  questions: Question[] = [];
  selectedTest: Test | null = null;
  editingTest: Test | null = null;
  showTestForm = false;
  savingTest = false;

  userSearch = '';
  testSearch = '';
  patientSearch = '';

  testForm: FormGroup;
  questionForm: FormGroup;

  tabs = [
    { key: 'stats', label: 'Estadísticas' },
    { key: 'users', label: 'Roles' },
    { key: 'tests', label: 'Tests' },
    { key: 'patients', label: 'Pacientes' },
    { key: 'psychologists', label: 'Psicólogos' }
  ];

  get statsCards() {
    if (!this.stats) return [];
    return [
      { label: 'Usuarios totales', value: this.stats.totalUsers },
      { label: 'Pacientes', value: this.stats.users },
      { label: 'Psicólogos', value: this.stats.psychologists },
      { label: 'Administradores', value: this.stats.admins },
      { label: 'Tests totales', value: this.stats.totalTests },
      { label: 'Tests evaluación', value: this.stats.evaluationTests },
      { label: 'Citas totales', value: this.stats.totalAppointments },
      { label: 'Citas reservadas', value: this.stats.bookedAppointments },
      { label: 'Respuestas', value: this.stats.totalUserAnswers },
      { label: 'Asignaciones', value: this.stats.assignedRelations },
      { label: 'Verificados', value: this.stats.verifiedUsers }
    ];
  }

  get filteredUsers(): AdminUser[] {
    if (!this.userSearch.trim()) return this.users;
    const q = this.userSearch.toLowerCase();
    return this.users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  get filteredTests(): Test[] {
    let list = this.tests.filter(t => !t.code?.startsWith('SECTION_PLACEHOLDER_'));
    if (this.testSearch.trim()) {
      const q = this.testSearch.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }
    return list;
  }

  get filteredPatientUsers(): AdminUser[] {
    let list = this.users.filter(u => u.role === 'USER');
    if (this.patientSearch.trim()) {
      const q = this.patientSearch.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private quotesService: QuotesService,
    private toast: ToastService
  ) {
    this.testForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      category: [''],
      topic: ['']
    });
    this.questionForm = this.fb.group({
      text: ['', Validators.required],
      type: ['RADIO'],
      position: [1]
    });
  }

  ngOnInit(): void {
    this.loadTabData();
  }

  loadTabData(): void {
    switch (this.tab) {
      case 'stats':
        this.adminService.getStatistics().subscribe(s => this.stats = s);
        this.quotesService.getMultipleQuotes().subscribe(q => this.quotes = q);
        break;
      case 'users':
      case 'patients':
        this.loading = true;
        this.adminService.listUsers().subscribe({
          next: (u) => { this.users = u; this.loading = false; },
          error: () => this.loading = false
        });
        this.adminService.listPsychologists().subscribe(p => this.psychList = p);
        break;
      case 'tests':
        this.adminService.listTests().subscribe(t => this.tests = t);
        break;
      case 'psychologists':
        this.adminService.listPsychologists().subscribe(p => this.psychList = p);
        break;
    }
  }

  // User management
  changeUserRole(userId: number, event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    this.adminService.setUserRole(userId, role).subscribe({
      next: () => {
        this.users = this.users.map(u => u.id === userId ? { ...u, role } : u);
        this.toast.success('Rol actualizado');
      },
      error: () => this.toast.error('Error al cambiar rol')
    });
  }

  assignPsych(userId: number, event: Event): void {
    const psychId = +(event.target as HTMLSelectElement).value;
    if (!psychId) return;
    this.adminService.assignPsychologist(userId, psychId).subscribe({
      next: () => {
        this.users = this.users.map(u => u.id === userId ? { ...u, psychologistId: psychId } : u);
        this.toast.success('Psicólogo asignado');
      },
      error: () => this.toast.error('Error')
    });
  }

  unassignPsych(userId: number): void {
    this.adminService.unassignPsychologist(userId).subscribe({
      next: () => {
        this.users = this.users.map(u => u.id === userId ? { ...u, psychologistId: undefined, psychologistName: undefined } : u);
        this.toast.success('Psicólogo desasignado');
      },
      error: () => this.toast.error('Error')
    });
  }

  // Test CRUD
  saveTest(): void {
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      return;
    }
    this.savingTest = true;
    const val = this.testForm.value;

    if (this.editingTest) {
      this.adminService.updateTest(this.editingTest.id, val).subscribe({
        next: (updated) => {
          this.tests = this.tests.map(t => t.id === this.editingTest!.id ? { ...t, ...val } : t);
          this.cancelEditTest();
          this.savingTest = false;
          this.toast.success('Test actualizado');
        },
        error: () => { this.savingTest = false; this.toast.error('Error'); }
      });
    } else {
      this.adminService.createTest(val.code, val.title, val.description).subscribe({
        next: (test) => {
          this.tests.unshift(test);
          this.testForm.reset();
          this.showTestForm = false;
          this.savingTest = false;
          this.toast.success('Test creado');
        },
        error: () => { this.savingTest = false; this.toast.error('Error'); }
      });
    }
  }

  editTest(test: Test): void {
    this.editingTest = test;
    this.showTestForm = true;
    this.testForm.patchValue({
      code: test.code,
      title: test.title,
      description: test.description || '',
      category: test.category || '',
      topic: test.topic || ''
    });
  }

  cancelEditTest(): void {
    this.editingTest = null;
    this.testForm.reset();
    this.showTestForm = false;
  }

  toggleTestActive(test: Test): void {
    this.adminService.updateTest(test.id, { active: !test.active }).subscribe({
      next: () => {
        this.tests = this.tests.map(t => t.id === test.id ? { ...t, active: !test.active } : t);
        this.toast.success(test.active ? 'Test desactivado' : 'Test activado');
      },
      error: () => this.toast.error('Error')
    });
  }

  selectTestForDetail(test: Test): void {
    this.selectedTest = test;
    this.questions = [];
    this.adminService.getQuestions(test.id).subscribe({
      next: (qs) => this.questions = qs,
      error: () => this.toast.error('Error al cargar preguntas')
    });
  }

  addQuestion(): void {
    if (this.questionForm.invalid || !this.selectedTest) {
      this.questionForm.markAllAsTouched();
      return;
    }
    const { text, type, position } = this.questionForm.value;
    this.adminService.createQuestion(this.selectedTest.id, text, type, position).subscribe({
      next: (q) => {
        this.questions.push(q);
        this.questionForm.reset({ type: 'RADIO', position: this.questions.length + 1 });
        this.toast.success('Pregunta añadida');
      },
      error: () => this.toast.error('Error')
    });
  }

  deleteQuestion(questionId: number): void {
    this.adminService.deleteQuestion(questionId).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== questionId);
        this.toast.success('Pregunta eliminada');
      },
      error: () => this.toast.error('Error')
    });
  }
}
