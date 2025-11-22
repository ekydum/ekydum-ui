import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { VideoItemData } from '../../models/video-item.model';
import { Subject, takeUntil, tap } from 'rxjs';

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
          <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="!loadingVideos && videos.length > 0">
            <p class="text-muted mb-0">
              <i class="fas fa-video me-2"></i>
              {{ videos.length }} videos
            </p>
            <button class="btn btn-primary me-3" (click)="playAllVideos()">
              <i class="fas fa-play me-2"></i>
              Play All
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
              <app-video-item
                [video]="video"
                [showMetadata]="true"
                (videoClick)="watchVideo(video)"
                (addToQueue)="addToQueue(video)"
                (addToWatchLater)="addToWatchLater(video)"
              ></app-video-item>
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

    .playlist-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .playlist-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .playlist-thumbnail {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #f0f0f0;
    }

    .playlist-thumbnail img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
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

    .playlist-card .card-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  `]
})
export class ChannelComponent implements OnInit, OnDestroy {
  channelId = '';
  channel: any = null;
  activeTab = 'videos';

  videos: VideoItemData[] = [];
  loading = false;
  loadingVideos = false;
  loadingMore = false;
  currentPage = 1;

  playlists: any[] = [];
  loadingPlaylists = false;

  private alive$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';

    this.route.queryParams.pipe(
      takeUntil(this.alive$),
      tap((params) => { this.activeTab = params['tab'] || 'videos' })
    ).subscribe();

    if (this.channelId) {
      this.loadChannel();
      this.loadVideos();
      this.loadPlaylists();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
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
        this.videos = (data?.items || []).map((v: any) => this.mapToVideoItemData(v));
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
        var newVideos = (data?.items || []).map((v: any) => this.mapToVideoItemData(v));
        this.videos = [...this.videos, ...newVideos];
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

  watchVideo(video: VideoItemData): void {
    this.playerService.playVideo(video);
  }

  addToWatchLater(video: VideoItemData): void {
    this.api.addWatchLater(
      video.yt_video_id || video.yt_id || '',
      video.title,
      video.thumbnail || '',
      video.duration,
      video.channel_id,
      video.channel_name
    ).subscribe();
  }

  playAllVideos(): void {
    this.playerService.queueSet(this.videos);
  }

  addToQueue(video: VideoItemData): void {
    this.playerService.queueAdd(video);
  }

  goBack(): void {
    history.back();
  }

  private mapToVideoItemData(video: any): VideoItemData {
    return {
      yt_id: video.yt_id,
      yt_video_id: video.yt_id,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      view_count: video.view_count,
      channel_name: this.channel?.name,
      channel_id: this.channelId,
      upload_date: video.upload_date
    };
  }
}
