import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface Quote {
  text: string;
  author: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class QuotesService {
  // API REST externa pública - ZenQuotes (proxied to avoid CORS)
  private zenQuotesUrl = '/zenquotes';

  constructor(private http: HttpClient) {}

  getRandomQuote(): Observable<Quote> {
    return this.http.get<any[]>(`${this.zenQuotesUrl}/random`).pipe(
      map(data => ({
        text: data[0]?.q || 'La salud mental es tan importante como la salud física.',
        author: data[0]?.a || 'Anónimo',
        category: 'inspirational'
      })),
      catchError(() => of({
        text: 'El bienestar emocional es la base de una vida plena.',
        author: 'Gantly',
        category: 'wellness'
      }))
    );
  }

  getTodayQuote(): Observable<Quote> {
    return this.http.get<any[]>(`${this.zenQuotesUrl}/today`).pipe(
      map(data => ({
        text: data[0]?.q || 'Cada día es una nueva oportunidad para cuidar de ti.',
        author: data[0]?.a || 'Anónimo',
        category: 'daily'
      })),
      catchError(() => of({
        text: 'Cada día es una nueva oportunidad para cuidar de ti.',
        author: 'Gantly',
        category: 'daily'
      }))
    );
  }

  getMultipleQuotes(): Observable<Quote[]> {
    return this.http.get<any[]>(`${this.zenQuotesUrl}/quotes`).pipe(
      map(data => data.map(q => ({
        text: q.q,
        author: q.a,
        category: 'inspirational'
      }))),
      catchError(() => of([
        { text: 'La paciencia es la compañera de la sabiduría.', author: 'San Agustín', category: 'wisdom' },
        { text: 'Conócete a ti mismo.', author: 'Sócrates', category: 'self' },
        { text: 'El que tiene un porqué puede soportar cualquier cómo.', author: 'Nietzsche', category: 'purpose' }
      ]))
    );
  }
}
