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
          </div>
          <div class="d-flex flex-row flex-grow-1"></div>
          <button class="btn btn-outline-secondary me-3" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <ul class="nav nav-tabs mb-4 text-no-select" style="margin-left: 48px;">
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'videos'" (click)="switchTab('videos')">
              <i class="fas fa-video me-2"></i>
              Videos
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'playlists'" (click)="switchTab('playlists')">
              <i class="fas fa-list me-2"></i>
              Playlists
            </a>
          </li>
        </ul>

        <div *ngIf="activeTab === 'videos'">
          <div *ngIf="loadingVideos" class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div *ngIf="!loadingVideos && videos.length === 0" class="alert alert-info">
            No videos found for this channel.
          </div>

          <div class="row" *ngIf="!loadingVideos && videos.length > 0">
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
                  <p class="card-text text-muted small" *ngIf="video.duration">
                    <i class="fas fa-clock me-1"></i>
                    {{ formatDuration(video.duration) }}
                    <i class="fas fa-eye me-1 ms-2"></i>
                    {{ video.view_count }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-4" *ngIf="videos.length > 0 && !loadingVideos">
            <button class="btn btn-primary" (click)="loadMoreVideos()" [disabled]="loadingMore">
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

        <div *ngIf="activeTab === 'playlists'">
          <div *ngIf="loadingPlaylists" class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div *ngIf="!loadingPlaylists && playlists.length === 0" class="alert alert-info">
            No playlists found for this channel.
          </div>

          <div class="row" *ngIf="!loadingPlaylists && playlists.length > 0">
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let playlist of playlists">
              <div class="card playlist-card h-100 text-no-select" (click)="openPlaylist(playlist.yt_id, playlist.title)">
                <div class="playlist-thumbnail">
                  <img [src]="playlist.thumbnail" [alt]="playlist.title" *ngIf="playlist.thumbnail">
                  <div class="playlist-badge">
                    <i class="fas fa-list me-1"></i>
                    {{ playlist.video_count }} videos
                  </div>
                </div>
                <div class="card-body">
                  <h6 class="card-title">{{ playlist.title }}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-link {
      cursor: pointer;
    }

    .video-card, .playlist-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .video-card:hover, .playlist-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .video-thumbnail, .playlist-thumbnail {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #f0f0f0;
    }

    .video-thumbnail img, .playlist-thumbnail img {
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

    .playlist-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
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
export class ChannelComponent implements OnInit {
  channelId = '';
  channel: any = null;
  activeTab = 'videos';

  videos: any[] = [];
  loading = false;
  loadingVideos = false;
  loadingMore = false;
  currentPage = 1;

  playlists: any[] = [];
  loadingPlaylists = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';

    this.route.queryParams.subscribe(params => {
      this.activeTab = params['tab'] || 'videos';
    });

    if (this.channelId) {
      this.loadChannel();
      this.loadVideos();
      this.loadPlaylists();
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge'
    });
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

  loadMoreVideos(): void {
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

  loadPlaylists(): void {
    this.loadingPlaylists = true;
    this.api.getChannelPlaylists(this.channelId).subscribe({
      next: (data) => {
        this.playlists = data?.playlists || [];
        this.loadingPlaylists = false;
      },
      error: () => {
        this.loadingPlaylists = false;
      }
    });
  }

  openPlaylist(playlistId: string, playlistTitle: string): void {
    this.router.navigate(['/playlist', playlistId], {
      state: { title: playlistTitle }
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
      this.channelId,
      this.channel?.name
    ).subscribe();
  }

  goBack(): void {
    history.back();
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
