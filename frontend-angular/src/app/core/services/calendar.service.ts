import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, CalendarSlot, Rating } from '../models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createSlot(start: string, end: string, price?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/slots`, { start, end, price });
  }

  mySlots(from: string, to: string): Observable<CalendarSlot[]> {
    return this.http.get<CalendarSlot[]>(`${this.apiUrl}/calendar/slots`, { params: { from, to } });
  }

  availability(from: string, to: string): Observable<CalendarSlot[]> {
    return this.http.get<CalendarSlot[]>(`${this.apiUrl}/calendar/availability`, { params: { from, to } });
  }

  book(appointmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/book/${appointmentId}`, {});
  }

  myAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/calendar/my-appointments`);
  }

  confirmAppointment(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/confirm/${requestId}`, {});
  }

  cancelAppointment(appointmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/cancel/${appointmentId}`, {});
  }

  deleteSlot(appointmentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/calendar/slots/${appointmentId}`);
  }

  updateSlot(appointmentId: number, updates: { price?: number; startTime?: string; endTime?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/calendar/slots/${appointmentId}`, updates);
  }

  createForPatient(userId: number, start: string, end: string, price?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/create-for-patient`, { userId, start, end, price });
  }

  getPastAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/calendar/past-appointments`);
  }

  rateAppointment(appointmentId: number, rating: number, comment?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar/appointments/${appointmentId}/rate`, { rating, comment });
  }

  getPsychologistRatings(psychologistId: number): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.apiUrl}/calendar/psychologist/${psychologistId}/ratings`);
  }

  getPsychologistPastAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/calendar/psychologist/past-appointments`);
  }

  getPendingRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendar/requests/pending`);
  }
}
