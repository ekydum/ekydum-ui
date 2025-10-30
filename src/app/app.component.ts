import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastService, Toast } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">
      <button class="navbar-toggle" [class.sidebar-collapsed]="sidebarCollapsed" (click)="toggleSidebar()">
        <i class="fas" [class.fa-bars]="sidebarCollapsed" [class.fa-times]="!sidebarCollapsed"></i>
      </button>

      <nav class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <i class="fas fa-play-circle me-2"></i>
          Ekydum
        </div>
        <ul class="sidebar-menu">
          <li>
            <a routerLink="/subscriptions" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-star"></i>
              Subscriptions
            </a>
          </li>
          <li>
            <a routerLink="/settings" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-cog"></i>
              Settings
            </a>
          </li>
          <li>
            <a routerLink="/manage" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-users-cog"></i>
              Manage
            </a>
          </li>
        </ul>
      </nav>

      <main class="main-content" [class.expanded]="sidebarCollapsed">
        <router-outlet></router-outlet>
      </main>

      <div class="toast-container">
        <div *ngFor="let toast of toasts" 
             class="toast show mb-2" 
             role="alert" 
             [class.bg-success]="toast.type === 'success'"
             [class.bg-danger]="toast.type === 'error'"
             [class.bg-warning]="toast.type === 'warning'"
             [class.bg-info]="toast.type === 'info'">
          <div class="toast-header">
            <strong class="me-auto text-white">
              <i class="fas" 
                 [class.fa-check-circle]="toast.type === 'success'"
                 [class.fa-exclamation-circle]="toast.type === 'error'"
                 [class.fa-exclamation-triangle]="toast.type === 'warning'"
                 [class.fa-info-circle]="toast.type === 'info'"></i>
              {{ toast.type | titlecase }}
            </strong>
            <button type="button" class="btn-close btn-close-white" (click)="removeToast(toast.id)"></button>
          </div>
          <div class="toast-body text-white">
            {{ toast.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-header {
      background: transparent;
      border: none;
      color: white;
    }
  `]
})
export class AppComponent implements OnInit {
  sidebarCollapsed = false;
  toasts: Toast[] = [];

  constructor(
    private toastService: ToastService,
    private router: Router
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
