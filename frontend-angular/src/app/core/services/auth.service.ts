import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUser$ = new BehaviorSubject<User | null>(null);

  user$ = this.currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): User | null {
    return this.currentUser$.value;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: LoginRequest): Observable<string> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map(res => {
        const token = res.accessToken || res.token || '';
        if (token) {
          localStorage.setItem('token', token);
          if (res.refreshToken) {
            localStorage.setItem('refreshToken', res.refreshToken);
          }
        }
        return token;
      })
    );
  }

  register(data: RegisterRequest): Observable<string> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      map(res => {
        const token = res.accessToken || res.token || '';
        if (token) {
          localStorage.setItem('token', token);
          if (res.refreshToken) {
            localStorage.setItem('refreshToken', res.refreshToken);
          }
        }
        return token;
      })
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => this.currentUser$.next(user))
    );
  }

  forgotPassword(email: string): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword });
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  getOAuth2LoginUrl(provider: string = 'google'): string {
    return `${environment.apiBaseUrl}/oauth2/authorization/${provider}`;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  setUser(user: User): void {
    this.currentUser$.next(user);
  }
}
