import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-playlist',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div *ngIf="!loading">
        <div class="d-flex align-items-center mb-4">
          <h2 class="mb-0" style="margin-left: 48px;">
            <i class="fas fa-list me-2"></i>
            {{ playlistTitle || 'Playlist' }}
          </h2>
          <div class="d-flex flex-row flex-grow-1"></div>
          <button class="btn btn-outline-secondary me-3" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <div *ngIf="videos.length === 0 && !loading" class="alert alert-info">
          No videos found in this playlist.
        </div>

        <div class="row" *ngIf="videos.length > 0">
          <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
            <div class="card video-card h-100 text-no-select">
              <div class="video-thumbnail" (click)="watchVideo(video.yt_id)">
                <img [src]="video.thumbnail" [alt]="video.title" *ngIf="video.thumbnail">
                <button
                  class="btn btn-sm btn-primary video-action-btn"
                  (click)="addToWatchLater($event, video)"
                  title="Add to Watch Later"
                >
                  <i class="fas fa-clock"></i>
                </button>
              </div>
              <div class="card-body">
                <h6 class="card-title" (click)="watchVideo(video.yt_id)">{{ video.title }}</h6>
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
      cursor: pointer;
    }

    .video-thumbnail img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-action-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    }

    .video-card:hover .video-action-btn {
      opacity: 1;
    }

    .card-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-weight: 600;
      margin-bottom: 0.5rem;
      cursor: pointer;
    }
  `]
})
export class PlaylistComponent implements OnInit {
  playlistId = '';
  playlistTitle = '';
  videos: any[] = [];
  loading = false;
  loadingMore = false;
  currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {
    var navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.playlistTitle = navigation.extras.state['title'] || '';
    }
  }

  ngOnInit(): void {
    this.playlistId = this.route.snapshot.paramMap.get('id') || '';
    if (this.playlistId) {
      this.loadVideos();
    }
  }

  loadVideos(): void {
    this.loading = true;
    this.api.getPlaylistVideos(this.playlistId, this.currentPage).subscribe({
      next: (data) => {
        this.videos = data?.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.currentPage++;
    this.api.getPlaylistVideos(this.playlistId, this.currentPage).subscribe({
      next: (data) => {
        this.videos = [...this.videos, ...data.items];
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
      }
    });
  }

  watchVideo(videoId: string): void {
    this.router.navigate(['/watch', videoId]);
  }

  addToWatchLater(event: Event, video: any): void {
    event.stopPropagation();
    this.api.addWatchLater(
      video.yt_id,
      video.title,
      video.thumbnail,
      video.duration,
      video.channel_id,
      video.channel_name
    ).subscribe();
  }

  goBack(): void {
    window.history.back();
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
}
