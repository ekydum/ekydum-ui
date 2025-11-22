import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../i18n/models/dict.models';
import { I18nService } from '../../i18n/services/i18n.service';
import { dict } from '../../i18n/dict/main.dict';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-subscriptions',
  standalone: false,
  template: `
    <div class="container-fluid">
      <h2 class="mb-4 page-title text-no-select" style="margin-left: 48px;">
        <i class="fas fa-users me-2"></i>
        {{ i18nStrings['pageTitle'] }}
      </h2>

      <div class="mb-4">
        <div class="input-group search-group">
          <input
            type="text"
            class="form-control search-input"
            [placeholder]="i18nStrings['searchPlaceholder']"
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchChannels()">
          <button class="btn btn-blue-glass" (click)="searchChannels()" [disabled]="!searchQuery || searching">
            <i class="fas fa-search me-1"></i>
            {{ i18nStrings['btnSearch'] }}
          </button>
        </div>
      </div>

      <div *ngIf="!isAuthenticated" class="alert-custom alert-warning-custom">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ i18nStrings['configureWarning'] }} <a routerLink="/settings" class="alert-link">{{ i18nStrings['linkSettings'] }}</a>.
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border spinner-custom" role="status"></div>
      </div>

      <div *ngIf="!loading && subscriptions.length === 0" class="alert-custom alert-info-custom">
        <i class="fas fa-info-circle me-2"></i>
        {{ i18nStrings['noSubscriptions'] }}
      </div>

      <div class="row" *ngIf="!loading && subscriptions.length > 0">
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let sub of subscriptions">
          <div class="card channel-card h-100 text-no-select" (click)="openChannel(sub.yt_channel_id)">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-tv me-2"></i>
                {{ sub.yt_channel_name || i18nStrings['channelDefault'] }}
              </h5>
              <p class="card-text channel-meta small">
                <i class="fas fa-calendar me-1"></i>
                {{ i18nStrings['subscribedLabel'] }} {{ sub.created_at | date:'short' }}
              </p>
              <button
                class="btn btn-sm btn-red-glass"
                (click)="unsubscribe(sub.id, $event)">
                <i class="fas fa-times me-1"></i>
                {{ i18nStrings['btnUnsubscribe'] }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="search-overlay" *ngIf="showSearchResults" (click)="closeSearch()">
        <div class="search-results" (click)="$event.stopPropagation()">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="text-white">
              <i class="fas fa-search me-2"></i>
              {{ i18nStrings['searchResultsTitle'] }}
            </h4>
            <button class="btn btn-sm btn-glass" (click)="closeSearch()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div *ngIf="searching" class="text-center py-3">
            <div class="spinner-border spinner-custom" role="status"></div>
          </div>

          <div *ngIf="!searching && searchResults.length === 0" class="alert-custom alert-info-custom">
            <i class="fas fa-info-circle me-2"></i>
            {{ i18nStrings['noChannelsFound'] }} "{{ searchQuery }}"
          </div>

          <div class="results-list" *ngIf="!searching && searchResults.length > 0">
            <div class="result-item" *ngFor="let channel of searchResults">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1 text-white">{{ channel.name }}</h6>
                  <small class="text-muted-custom">{{ channel.yt_id }}</small>
                </div>
                <button
                  class="btn btn-sm btn-blue-glass"
                  (click)="subscribeToChannel(channel.yt_id)"
                  [disabled]="isSubscribed(channel.yt_id)">
                  <i class="fas" [class.fa-check]="isSubscribed(channel.yt_id)"
                     [class.fa-plus]="!isSubscribed(channel.yt_id)"></i>
                  {{ isSubscribed(channel.yt_id) ? i18nStrings['btnSubscribed'] : i18nStrings['btnSubscribe'] }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      color: white;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    /* Search Input Group */
    .search-group {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .search-input {
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(20px);
      border-radius: 8px 0 0 8px;
      transition: all 0.2s ease;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .search-input:focus {
      background: rgba(26, 26, 26, 0.9);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      outline: 0;
    }

    /* Buttons */
    .btn-glass {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .btn-blue-glass {
      background: rgba(13, 110, 253, 0.15);
      border: 1px solid rgba(13, 110, 253, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      font-weight: 600;
      border-radius: 0 8px 8px 0;
    }

    .btn-blue-glass:hover:not(:disabled) {
      background: rgba(13, 110, 253, 0.25);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(13, 110, 253, 0.4);
    }

    .btn-blue-glass:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-red-glass {
      background: rgba(198, 17, 32, 0.15);
      border: 1px solid rgba(198, 17, 32, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-red-glass:hover {
      background: rgba(198, 17, 32, 0.25);
      border-color: rgba(198, 17, 32, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(198, 17, 32, 0.4);
    }

    /* Channel Cards */
    .channel-card {
      cursor: pointer;
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .channel-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .channel-card .card-body {
      background: transparent;
    }

    .channel-card .card-title {
      color: white;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .channel-meta {
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 1rem;
    }

    /* Search Overlay */
    .search-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .search-results {
      background: rgba(26, 26, 26, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(30px);
      border-radius: 16px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .result-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateX(4px);
    }

    .text-muted-custom {
      color: rgba(255, 255, 255, 0.5);
    }

    /* Spinner */
    .spinner-custom {
      color: rgba(13, 110, 253, 0.8);
    }

    /* Alerts */
    .alert-custom {
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .alert-info-custom {
      color: rgba(13, 202, 240, 0.9);
      border-color: rgba(13, 202, 240, 0.3);
      background: rgba(13, 202, 240, 0.1);
    }

    .alert-warning-custom {
      color: rgba(255, 193, 7, 0.9);
      border-color: rgba(255, 193, 7, 0.3);
      background: rgba(255, 193, 7, 0.1);
    }

    .alert-link {
      color: rgba(255, 193, 7, 1);
      text-decoration: underline;
      font-weight: 600;
    }

    .alert-link:hover {
      color: rgba(255, 193, 7, 0.8);
    }
  `]
})
export class SubscriptionsComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['subscriptions'];
  i18nStrings: I18nLocalized = {};

  subscriptions: any[] = [];
  searchResults: any[] = [];
  searchQuery = '';
  loading = false;
  searching = false;
  showSearchResults = false;
  isAuthenticated = false;

  private alive$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

    this.isAuthenticated = this.auth.isAuthenticated();
    if (this.isAuthenticated) {
      this.loadSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
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
        this.toast.success(this.i18nStrings['toastSubscribed']);
        this.loadSubscriptions();
      }
    });
  }

  unsubscribe(id: number, event: Event): void {
    event.stopPropagation();
    this.api.unsubscribe(id).subscribe({
      next: () => {
        this.toast.success(this.i18nStrings['toastUnsubscribed']);
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
