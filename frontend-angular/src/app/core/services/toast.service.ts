import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  private counter = 0;

  get toasts() {
    return this.toasts$.asObservable();
  }

  success(message: string) {
    this.show('success', message);
  }

  error(message: string) {
    this.show('error', message);
  }

  warning(message: string) {
    this.show('warning', message);
  }

  info(message: string) {
    this.show('info', message);
  }

  private show(type: ToastMessage['type'], message: string) {
    const id = ++this.counter;
    const toast: ToastMessage = { id, type, message };
    this.toasts$.next([...this.toasts$.value, toast]);

    setTimeout(() => this.remove(id), 5000);
  }

  remove(id: number) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
