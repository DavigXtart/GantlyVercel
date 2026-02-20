import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Test, AssignedTest, SubmitAnswerPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class TestService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/tests`);
  }

  get(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tests/${id}`);
  }

  submitAnswers(testId: number, answers: SubmitAnswerPayload[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/flow/submit`, { answers, testId });
  }

  // Assigned tests
  listAssigned(): Observable<AssignedTest[]> {
    return this.http.get<AssignedTest[]>(`${this.apiUrl}/assigned-tests`);
  }

  assign(userId: number, testId: number): Observable<AssignedTest> {
    return this.http.post<AssignedTest>(`${this.apiUrl}/assigned-tests`, { userId, testId });
  }

  unassign(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assigned-tests/${id}`);
  }

  // Results
  getMyResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/results/my-results`);
  }

  getUserTestResults(userId: number, testId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/user/${userId}/test/${testId}`);
  }
}
