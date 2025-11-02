import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-channel',
  standalone: false,
  template: `
      <div class="container-fluid">
          <div *ngIf="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div *ngIf="!loading && channel">
              <div class="d-flex align-items-center mb-4">
                  <div>
                      <h2 class="mb-0" style="margin-left: 48px;">
                          <i class="fas fa-tv me-2"></i>
                          {{ channel.name }}
                      </h2>
                      <!--            <small class="text-muted">{{ channel.yt_id }}</small>-->
                  </div>
                  <div class="d-flex flex-row flex-grow-1"></div>
                  <button class="btn btn-outline-secondary me-3" (click)="goBack()">
                      <i class="fas fa-arrow-left"></i>
                  </button>
              </div>

              <div *ngIf="loadingVideos" class="text-center py-3">
                  <div class="spinner-border text-primary" role="status"></div>
              </div>

              <div *ngIf="!loadingVideos && videos.length === 0" class="alert alert-info">
                  No videos found for this channel.
              </div>

              <div class="row" *ngIf="!loadingVideos && videos.length > 0">
                  <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
                      <div class="card video-card h-100" (click)="watchVideo(video.yt_id)">
                          <div class="video-thumbnail">
                              <img [src]="video.thumbnail" [alt]="video.title" *ngIf="video.thumbnail">
                          </div>
                          <div class="card-body">
                              <h6 class="card-title">{{ video.title }}</h6>
                              <p class="card-text text-muted small" *ngIf="video.duration">
                                  <i class="fas fa-clock me-1"></i>
                                  {{ formatDuration(video.duration) }}
                                  <i class="fas fa-eye me-1"></i>
                                  {{ video.view_count }}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="text-center mt-4" *ngIf="videos.length > 0 && !loadingVideos">
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
  `
})
export class ChannelComponent implements OnInit {
  channelId = '';
  channel: any = null;
  videos: any[] = [];
  loading = false;
  loadingVideos = false;
  loadingMore = false;
  currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';
    if (this.channelId) {
      this.loadChannel();
      this.loadVideos();
    }
  }

  loadChannel(): void {
    this.loading = true;
    this.api.getChannel(this.channelId).subscribe({
      next: (data) => {
        this.channel = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadVideos(): void {
    this.loadingVideos = true;
    this.api.getChannelVideos(this.channelId, this.currentPage).subscribe({
      next: (data) => {
        this.videos = data?.items || [];
        this.loadingVideos = false;
      },
      error: () => {
        this.loadingVideos = false;
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.currentPage++;
    this.api.getChannelVideos(this.channelId, this.currentPage).subscribe({
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

  goBack(): void {
    this.router.navigate(['/subscriptions']);
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
