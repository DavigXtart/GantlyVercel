import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from '../../../core/services/test.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Question, Answer, SubmitAnswerPayload } from '../../../core/models';

@Component({
  selector: 'app-test-flow',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <!-- Background image -->
    <img src="assets/Adobe Express - file (1).png"
         alt="background"
         style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none" />

    @if (loading) {
      <div style="position: relative; z-index: 1">
        <app-loading-spinner />
      </div>
    } @else if (test) {
      <div class="max-w-2xl mx-auto animate-fade-in" style="position: relative; z-index: 1">
        <!-- Back button -->
        <button (click)="back.emit()" class="flex items-center gap-2 text-sage hover:text-forest mb-6 bg-transparent border-0 cursor-pointer text-sm">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          Volver a mis tests
        </button>

        <!-- Test header -->
        <div class="bg-sage/10 rounded-[3rem] p-8 mb-6">
          <h2 class="text-2xl font-bold text-forest mb-2">{{ test.title }}</h2>
          @if (test.description) {
            <p class="text-sm text-forest/60">{{ test.description }}</p>
          }
        </div>

        <!-- Progress bar -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-forest/50 mb-2">
            <span>Pregunta {{ currentIndex + 1 }} de {{ totalQuestions }}</span>
            <span>{{ answeredCount }} respondidas</span>
          </div>
          <div class="w-full bg-mint rounded-full h-2">
            <div class="bg-primary rounded-full h-2 transition-all duration-300"
                 [style.width.%]="progress"></div>
          </div>
        </div>

        <!-- Question card -->
        @if (currentQuestion) {
          <div class="bg-white rounded-[3rem] p-8 soft-shadow border border-sage/10 mb-6 animate-fade-in">
            <p class="text-lg font-medium text-forest mb-6">{{ currentQuestion.text }}</p>

            <!-- SINGLE / MULTIPLE CHOICE -->
            @if (currentQuestion.type === 'SINGLE' || currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'MULTI') {
              <div class="space-y-3">
                @for (answer of currentQuestion.answers; track answer.id) {
                  <button
                    (click)="selectAnswer(currentQuestion.id, answer.id)"
                    class="w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer bg-transparent"
                    [class]="answers[currentQuestion.id]?.answerId === answer.id
                      ? 'border-primary bg-gentle-mint text-forest'
                      : 'border-gray-200 hover:border-sage/50 text-forest/80'">
                    {{ answer.text }}
                  </button>
                }
              </div>
            }

            <!-- SCALE (numeric 1-10) -->
            @if (currentQuestion.type === 'SCALE' || currentQuestion.type === 'NUMERIC') {
              <div class="flex gap-2 flex-wrap justify-center">
                @for (n of scaleValues; track n) {
                  <button
                    (click)="selectNumeric(currentQuestion.id, n)"
                    class="w-12 h-12 rounded-2xl border-2 font-bold transition-all cursor-pointer"
                    [class]="answers[currentQuestion.id]?.numericValue === n
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 hover:border-primary text-forest bg-white'">
                    {{ n }}
                  </button>
                }
              </div>
            }

            <!-- TEXT -->
            @if (currentQuestion.type === 'TEXT') {
              <textarea
                class="form-input"
                rows="3"
                placeholder="Escribe tu respuesta..."
                [value]="answers[currentQuestion.id]?.textValue || ''"
                (input)="selectText(currentQuestion.id, $any($event.target).value)">
              </textarea>
            }
          </div>
        }

        <!-- Navigation -->
        <div class="flex justify-between items-center">
          <button (click)="previous()" [disabled]="currentIndex === 0"
                  class="btn btn-ghost text-sm" [class.opacity-50]="currentIndex === 0">
            <span class="material-symbols-outlined text-base">chevron_left</span>
            Anterior
          </button>

          @if (currentIndex < totalQuestions - 1) {
            <button (click)="next()" class="btn btn-primary text-sm">
              Siguiente
              <span class="material-symbols-outlined text-base">chevron_right</span>
            </button>
          } @else {
            <button (click)="submit()" [disabled]="submitting || !allAnswered"
                    class="btn btn-primary text-sm" [class.opacity-50]="!allAnswered">
              {{ submitting ? 'Enviando...' : 'Enviar test' }}
            </button>
          }
        </div>
      </div>
    }
  `
})
export class TestFlowComponent implements OnInit {
  @Input() testId!: number;
  @Input() assignedTestId!: number;
  @Output() back = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  test: any = null;
  currentIndex = 0;
  answers: Record<number, { answerId?: number; numericValue?: number; textValue?: string }> = {};
  loading = true;
  submitting = false;
  scaleValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(
    private testService: TestService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.testService.get(this.testId).subscribe({
      next: (data) => {
        if (data.questions) {
          data.questions.sort((a: Question, b: Question) => a.position - b.position);
          data.questions.forEach((q: Question) => {
            if (q.answers) {
              q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
            }
          });
        }
        this.test = data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al cargar el test');
        this.back.emit();
      }
    });
  }

  get currentQuestion(): Question | null {
    return this.test?.questions?.[this.currentIndex] || null;
  }

  get totalQuestions(): number {
    return this.test?.questions?.length || 0;
  }

  get progress(): number {
    return this.totalQuestions ? ((this.currentIndex + 1) / this.totalQuestions) * 100 : 0;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get allAnswered(): boolean {
    return this.totalQuestions > 0 && this.answeredCount >= this.totalQuestions;
  }

  selectAnswer(questionId: number, answerId: number): void {
    this.answers = { ...this.answers, [questionId]: { answerId } };
    setTimeout(() => {
      if (this.currentIndex < this.totalQuestions - 1) {
        this.currentIndex++;
      }
    }, 400);
  }

  selectNumeric(questionId: number, value: number): void {
    this.answers = { ...this.answers, [questionId]: { numericValue: value } };
  }

  selectText(questionId: number, text: string): void {
    this.answers = { ...this.answers, [questionId]: { textValue: text } };
  }

  next(): void {
    if (this.currentIndex < this.totalQuestions - 1) this.currentIndex++;
  }

  previous(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  submit(): void {
    if (!this.allAnswered) {
      this.toast.error(`Faltan ${this.totalQuestions - this.answeredCount} pregunta(s) por responder`);
      return;
    }
    this.submitting = true;
    const payload: SubmitAnswerPayload[] = this.test.questions.map((q: Question) => ({
      questionId: q.id,
      answerId: this.answers[q.id]?.answerId,
      numericValue: this.answers[q.id]?.numericValue,
      textValue: this.answers[q.id]?.textValue
    }));

    this.testService.submitAnswers(this.testId, payload).subscribe({
      next: () => {
        this.toast.success('Test completado correctamente');
        this.completed.emit();
      },
      error: () => {
        this.toast.error('Error al enviar las respuestas');
        this.submitting = false;
      }
    });
  }
}
