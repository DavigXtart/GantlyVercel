import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminStatistics, Test, Question, Answer } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Tests
  listTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/admin/tests`);
  }

  getTest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/tests/${id}`);
  }

  createTest(code: string, title: string, description: string): Observable<Test> {
    return this.http.post<Test>(`${this.apiUrl}/admin/tests`, { code, title, description });
  }

  updateTest(id: number, updates: { code?: string; title?: string; description?: string; active?: boolean; category?: string; topic?: string }): Observable<Test> {
    return this.http.put<Test>(`${this.apiUrl}/admin/tests/${id}`, updates);
  }

  deleteTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/tests/${id}`);
  }

  // Questions
  getQuestions(testId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/admin/tests/${testId}/questions`);
  }

  createQuestion(testId: number, text: string, type: string, position: number, answers?: { text: string; value: number; position: number }[], subfactorId?: number): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/admin/questions`, { testId, text, type, position, answers, subfactorId });
  }

  updateQuestion(id: number, updates: { text?: string; type?: string; position?: number; subfactorId?: number }): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/admin/questions/${id}`, updates);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/questions/${id}`);
  }

  // Answers
  getAnswers(questionId: number): Observable<Answer[]> {
    return this.http.get<Answer[]>(`${this.apiUrl}/admin/questions/${questionId}/answers`);
  }

  createAnswer(questionId: number, text: string, value: number, position: number): Observable<Answer> {
    return this.http.post<Answer>(`${this.apiUrl}/admin/answers`, { questionId, text, value, position });
  }

  updateAnswer(answerId: number, updates: { text?: string; value?: number; position?: number }): Observable<Answer> {
    return this.http.put<Answer>(`${this.apiUrl}/admin/answers/${answerId}`, updates);
  }

  deleteAnswer(answerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/answers/${answerId}`);
  }

  // Users
  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/admin/users`);
  }

  setUserRole(userId: number, role: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/users/role`, { userId, role });
  }

  listPsychologists(): Observable<{ id: number; name: string; email: string }[]> {
    return this.http.get<{ id: number; name: string; email: string }[]>(`${this.apiUrl}/admin/users/psychologists`);
  }

  assignPsychologist(userId: number, psychologistId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/users/assign`, { userId, psychologistId });
  }

  unassignPsychologist(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/assign/${userId}`);
  }

  // Evaluation Tests
  listEvaluationTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/admin/evaluation-tests`);
  }

  createEvaluationTest(testData: { code: string; title: string; description?: string; category: string; topic: string; active?: boolean }): Observable<Test> {
    return this.http.post<Test>(`${this.apiUrl}/admin/evaluation-tests`, testData);
  }

  updateEvaluationTest(id: number, updates: { code?: string; title?: string; description?: string; category?: string; topic?: string; active?: boolean }): Observable<Test> {
    return this.http.put<Test>(`${this.apiUrl}/admin/evaluation-tests/${id}`, updates);
  }

  deleteEvaluationTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/evaluation-tests/${id}`);
  }

  // Statistics
  getStatistics(): Observable<AdminStatistics> {
    return this.http.get<AdminStatistics>(`${this.apiUrl}/admin/statistics`);
  }

  // Structure
  getTestStructure(testId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/tests/${testId}/structure`);
  }

  initDefaultStructure(testId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/tests/${testId}/init-structure`, {});
  }

  createFactor(testId: number, code: string, name: string, description?: string, position?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/factors`, { testId, code, name, description, position });
  }

  createSubfactor(testId: number, code: string, name: string, description?: string, factorId?: number, position?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/subfactors`, { testId, code, name, description, factorId, position });
  }
}
