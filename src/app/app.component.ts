import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  sidebarCollapsed = false;
  toasts: Toast[] = [];

  constructor(
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });

    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
