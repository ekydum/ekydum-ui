import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-search',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div class="d-flex align-items-center mb-4">
        <h2 class="mb-0" style="margin-left: 48px;">
          <i class="fas fa-search me-2"></i>
          Search Videos
        </h2>
      </div>

      <div class="row mb-4">
        <div class="col-md-8 col-lg-6 mx-auto">
          <div class="input-group input-group-lg">
            <input
              type="text"
              class="form-control"
              placeholder="Search for videos..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="search()"
              [disabled]="loading"
            >
            <button
              class="btn btn-primary"
              type="button"
              (click)="search()"
              [disabled]="loading || !searchQuery.trim()"
            >
              <i class="fas fa-search me-2"></i>
              Search
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">Searching...</p>
      </div>

      <div *ngIf="!loading && searched && videos.length === 0" class="alert alert-info text-center">
        <i class="fas fa-info-circle me-2"></i>
        No videos found for "{{ lastSearchQuery }}". Try a different search term.
      </div>

      <div class="row" *ngIf="!loading && videos.length > 0">
        <div class="col-12 mb-3">
          <p class="text-muted">
            <i class="fas fa-video me-2"></i>
            Found {{ videos.length }} videos for "{{ lastSearchQuery }}"
          </p>
        </div>

        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
          <div class="card video-card h-100" (click)="watchVideo(video.yt_id)">
            <div class="video-thumbnail">
              <img [src]="video.thumbnail" [alt]="video.title" *ngIf="video.thumbnail">
            </div>
            <div class="card-body">
              <h6 class="card-title">{{ video.title }}</h6>
              <p class="card-text text-muted small">
                <i class="fas fa-user me-1"></i>
                {{ video.channel_name }}
              </p>
              <p class="card-text text-muted small" *ngIf="video.duration">
                <i class="fas fa-clock me-1"></i>
                {{ formatDuration(video.duration) }}
                <span *ngIf="video.view_count" class="ms-2">
                  <i class="fas fa-eye me-1"></i>
                  {{ formatViewCount(video.view_count) }}
                </span>
              </p>
              <p class="card-text text-muted small" *ngIf="video.upload_date">
                <i class="fas fa-calendar me-1"></i>
                {{ formatDate(video.upload_date) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-4" *ngIf="videos.length > 0 && !loading">
        <button class="btn btn-primary" (click)="loadMore()" [disabled]="loadingMore">
          <span *ngIf="!loadingMore">
            <i class="fas fa-chevron-down me-2"></i>
            Load More
          </span>
          <span *ngIf="loadingMore">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Loading...
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .video-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .video-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .video-thumbnail {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #f0f0f0;
    }

    .video-thumbnail img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  `]
})
export class SearchComponent {
  searchQuery = '';
  lastSearchQuery = '';
  videos: any[] = [];
  loading = false;
  loadingMore = false;
  searched = false;
  currentOffset = 0;
  pageSize = 20;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  search(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.loading = true;
    this.lastSearchQuery = this.searchQuery;
    this.currentOffset = 0;

    this.api.searchVideos(this.searchQuery, 0, this.pageSize).subscribe({
      next: (data) => {
        this.videos = data?.videos || [];
        this.loading = false;
        this.searched = true;
      },
      error: () => {
        this.loading = false;
        this.searched = true;
        this.videos = [];
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.currentOffset += this.pageSize;

    this.api.searchVideos(this.lastSearchQuery, this.currentOffset, this.pageSize).subscribe({
      next: (data) => {
        var newVideos = data?.videos || [];
        this.videos = [...this.videos, ...newVideos];
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.currentOffset -= this.pageSize;
      }
    });
  }

  watchVideo(videoId: string): void {
    this.router.navigate(['/watch', videoId]);
  }

  formatDuration(seconds: number): string {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatViewCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  formatDate(dateString: string): string {
    var date = new Date(dateString);
    var now = new Date();
    var diff = now.getTime() - date.getTime();
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days} days ago`;
    }
    if (days < 30) {
      return `${Math.floor(days / 7)} weeks ago`;
    }
    if (days < 365) {
      return `${Math.floor(days / 30)} months ago`;
    }
    return `${Math.floor(days / 365)} years ago`;
  }
}
