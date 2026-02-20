import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient } from '../models';

@Injectable({ providedIn: 'root' })
export class PsychService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private resolveAssetUrl(value?: string | null): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const base = environment.apiBaseUrl;
    return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  patients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/psych/patients`).pipe(
      map(list => list.map(p => ({ ...p, avatarUrl: this.resolveAssetUrl(p.avatarUrl) })))
    );
  }

  getPatientDetails(patientId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/psych/patients/${patientId}`);
  }

  getPatientTestAnswers(patientId: number, testId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/psych/patients/${patientId}/tests/${testId}/answers`);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/psych/profile`);
  }

  updateProfile(profile: {
    bio?: string; education?: string; certifications?: string;
    interests?: string; specializations?: string; experience?: string;
    languages?: string; linkedinUrl?: string; website?: string; sessionPrices?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/psych/profile`, profile);
  }

  updateIsFull(isFull: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/psych/is-full`, { isFull });
  }

  updatePatientStatus(patientId: number, status: 'ACTIVE' | 'DISCHARGED'): Observable<any> {
    return this.http.put(`${this.apiUrl}/psych/patients/${patientId}/status`, { status });
  }

  getReferralUrl(): Observable<{ referralCode: string; fullUrl: string }> {
    return this.http.get<{ referralCode: string; fullUrl: string }>(`${this.apiUrl}/psych/referral-url`);
  }
}
