import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ProfileUpdate, PsychologistAssignment } from '../models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
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

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      map(user => ({ ...user, avatarUrl: this.resolveAssetUrl(user.avatarUrl) }))
    );
  }

  update(updates: ProfileUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile`, updates);
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/profile/avatar`, form).pipe(
      map(res => ({ avatarUrl: this.resolveAssetUrl(res.avatarUrl) || '' }))
    );
  }

  myPsychologist(): Observable<PsychologistAssignment> {
    return this.http.get<PsychologistAssignment>(`${this.apiUrl}/profile/my-psychologist`).pipe(
      map(result => {
        if (result.psychologist?.avatarUrl) {
          result.psychologist.avatarUrl = this.resolveAssetUrl(result.psychologist.avatarUrl);
        }
        return result;
      })
    );
  }

  getPsychologistProfile(psychologistId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/psychologist/${psychologistId}`);
  }

  selectPsychologist(psychologistId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/select-psychologist`, { psychologistId });
  }
}
