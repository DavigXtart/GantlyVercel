import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskComment, TaskFile } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  get(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${taskId}`);
  }

  create(payload: { userId: number; psychologistId: number; title: string; description?: string; dueDate?: string }): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, payload);
  }

  complete(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${taskId}/complete`, {});
  }

  getFiles(taskId: number): Observable<TaskFile[]> {
    return this.http.get<TaskFile[]>(`${this.apiUrl}/tasks/${taskId}/files`);
  }

  uploadFile(taskId: number, file: File): Observable<TaskFile> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<TaskFile>(`${this.apiUrl}/tasks/${taskId}/files`, form);
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  addComment(taskId: number, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content });
  }
}
