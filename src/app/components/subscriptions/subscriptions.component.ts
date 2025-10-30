import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <h2 class="mb-4" style="margin-left: 48px;">
        <i class="fas fa-star me-2"></i>
        Subscriptions
      </h2>

      <div class="mb-4">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search channels..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchChannels()">
          <button class="btn btn-primary" (click)="searchChannels()" [disabled]="!searchQuery || searching">
            <i class="fas fa-search me-1"></i>
            Search
          </button>
        </div>
      </div>

      <div *ngIf="!isAuthenticated" class="alert alert-warning">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Please configure your server settings first. Go to <a routerLink="/settings">Settings</a>.
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div *ngIf="!loading && subscriptions.length === 0" class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No subscriptions yet. Search for channels to subscribe!
      </div>

      <div class="row" *ngIf="!loading && subscriptions.length > 0">
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let sub of subscriptions">
          <div class="card channel-card h-100" (click)="openChannel(sub.yt_channel_id)">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-tv me-2"></i>
                {{ sub.yt_channel_name || 'Channel' }}
              </h5>
              <p class="card-text text-muted small">
                <i class="fas fa-calendar me-1"></i>
                Subscribed: {{ sub.created_at | date:'short' }}
              </p>
              <button 
                class="btn btn-sm btn-danger"
                (click)="unsubscribe(sub.id, $event)">
                <i class="fas fa-times me-1"></i>
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="search-overlay" *ngIf="showSearchResults" (click)="closeSearch()">
        <div class="search-results" (click)="$event.stopPropagation()">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>
              <i class="fas fa-search me-2"></i>
              Search Results
            </h4>
            <button class="btn btn-sm btn-secondary" (click)="closeSearch()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div *ngIf="searching" class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div *ngIf="!searching && searchResults.length === 0" class="alert alert-info">
            No channels found for "{{ searchQuery }}"
          </div>

          <div class="list-group" *ngIf="!searching">
            <div class="list-group-item" *ngFor="let channel of searchResults">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">{{ channel.name }}</h6>
                  <small class="text-muted">{{ channel.yt_id }}</small>
                </div>
                <button 
                  class="btn btn-sm btn-primary"
                  (click)="subscribeToChannel(channel.yt_id)"
                  [disabled]="isSubscribed(channel.yt_id)">
                  <i class="fas" [class.fa-check]="isSubscribed(channel.yt_id)" [class.fa-plus]="!isSubscribed(channel.yt_id)"></i>
                  {{ isSubscribed(channel.yt_id) ? 'Subscribed' : 'Subscribe' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: any[] = [];
  searchResults: any[] = [];
  searchQuery = '';
  loading = false;
  searching = false;
  showSearchResults = false;
  isAuthenticated = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.auth.isAuthenticated();
    if (this.isAuthenticated) {
      this.loadSubscriptions();
    }
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.api.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions = data?.subscriptions || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  searchChannels(): void {
    if (!this.searchQuery.trim()) return;

    this.searching = true;
    this.showSearchResults = true;
    this.searchResults = [];

    this.api.searchChannels(this.searchQuery).subscribe({
      next: (data) => {
        this.searchResults = data?.channels || [];
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }

  subscribeToChannel(channelId: string): void {
    this.api.subscribe(channelId).subscribe({
      next: () => {
        this.toast.success('Subscribed successfully');
        this.loadSubscriptions();
      }
    });
  }

  unsubscribe(id: number, event: Event): void {
    event.stopPropagation();
    this.api.unsubscribe(id).subscribe({
      next: () => {
        this.toast.success('Unsubscribed successfully');
        this.loadSubscriptions();
      }
    });
  }

  isSubscribed(channelId: string): boolean {
    return this.subscriptions.some(sub => sub.yt_channel_id === channelId);
  }

  openChannel(channelId: string): void {
    this.router.navigate(['/channel', channelId]);
  }

  closeSearch(): void {
    this.showSearchResults = false;
    this.searchResults = [];
    this.searchQuery = '';
  }
}
