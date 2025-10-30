import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastId = 0;
  toasts$ = new Subject<Toast[]>();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    var toast: Toast = {
      id: this.toastId++,
      message,
      type
    };
    
    this.toasts.push(toast);
    this.toasts$.next([...this.toasts]);

    setTimeout(() => {
      this.remove(toast.id);
    }, 5000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next([...this.toasts]);
  }

  clear(): void {
    this.toasts = [];
    this.toasts$.next([]);
  }
}
