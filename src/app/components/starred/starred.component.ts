import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-starred',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div class="d-flex align-items-center mb-4">
        <h2 class="mb-0 text-no-select" style="margin-left: 48px;">
          <i class="fas fa-star me-2"></i>
          Starred Videos
        </h2>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div *ngIf="!loading && videos.length === 0" class="alert alert-info text-center">
        <i class="fas fa-info-circle me-2"></i>
        No starred videos yet. Click the star icon on any video to add it here!
      </div>

      <div class="row" *ngIf="!loading && videos.length > 0">
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
          <div class="card video-card h-100 text-no-select">
            <div class="video-thumbnail" (click)="watchVideo(video.yt_video_id)">
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
              <h6 class="card-title" (click)="watchVideo(video.yt_video_id)">{{ video.title }}</h6>
              <p class="card-text text-muted small" *ngIf="video.channel_name">
                <i class="fas fa-user me-1"></i>
                {{ video.channel_name }}
              </p>
              <p class="card-text text-muted small" *ngIf="video.duration">
                <i class="fas fa-clock me-1"></i>
                {{ formatDuration(video.duration) }}
              </p>
              <button class="btn btn-sm btn-outline-danger w-100 mt-2" (click)="removeStar(video.yt_video_id)">
                <i class="fas fa-star me-1"></i>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-card {
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

    .card-title:hover {
      color: #0d6efd;
    }
  `]
})
export class StarredComponent implements OnInit {
  videos: any[] = [];
  loading = false;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadStarred();
  }

  loadStarred(): void {
    this.loading = true;
    this.api.getStarred().subscribe({
      next: (data) => {
        this.videos = data?.videos || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  watchVideo(videoId: string): void {
    this.router.navigate(['/watch', videoId]);
  }

  removeStar(videoId: string): void {
    this.api.removeStarred(videoId).subscribe({
      next: () => {
        this.videos = this.videos.filter(v => v.yt_video_id !== videoId);
      }
    });
  }

  addToWatchLater(event: Event, video: any): void {
    event.stopPropagation();
    this.api.addWatchLater(
      video.yt_video_id,
      video.title,
      video.thumbnail,
      video.duration,
      video.channel_id,
      video.channel_name
    ).subscribe();
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
}
