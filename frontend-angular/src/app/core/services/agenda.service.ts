import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendaEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveEntry(data: Partial<AgendaEntry>): Observable<any> {
    return this.http.post(`${this.apiUrl}/personal-agenda/entry`, data);
  }

  getTodayEntry(): Observable<any> {
    return this.http.get(`${this.apiUrl}/personal-agenda/entry/today`);
  }

  getEntries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/personal-agenda/entries`);
  }

  getStatistics(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/personal-agenda/statistics?days=${days}`);
  }
}
