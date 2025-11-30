import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { YtVideoListItem } from '../../models/protocol/yt-video-list-item.model';
import { Subject, takeUntil, tap } from 'rxjs';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../i18n/models/dict.models';
import { I18nService } from '../../i18n/services/i18n.service';
import { YtPlaylist } from '../../models/protocol/yt-playlist.model';
import { channelDict } from '../../i18n/dict/channel.dict';

@Component({
  selector: 'app-channel',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border spinner-custom" role="status"></div>
      </div>

      <div *ngIf="!loading && channel">
        <div class="d-flex align-items-center mb-4">
          <div>
            <h2 class="mb-0 channel-title" style="margin-left: 48px;">
              <i class="fas fa-tv me-2"></i>
              {{ channel.name }}
            </h2>
          </div>
          <div class="d-flex flex-row flex-grow-1"></div>

          <!-- Subscribe button -->
          <button
            class="btn me-3"
            [class.btn-subscribe]="!isSubscribed"
            [class.btn-subscribed]="isSubscribed"
            (click)="toggleSubscription()"
            [disabled]="subscriptionLoading"
          >
            <span *ngIf="subscriptionLoading">
              <span class="spinner-border spinner-border-sm me-2"></span>
            </span>
            <span *ngIf="!subscriptionLoading && !isSubscribed">
              <i class="fas fa-plus me-2"></i>
              {{ i18nStrings['btnSubscribe'] }}
            </span>
            <span *ngIf="!subscriptionLoading && isSubscribed">
              <i class="fas fa-check me-2"></i>
              {{ i18nStrings['btnSubscribed'] }}
            </span>
          </button>

          <button class="btn btn-glass me-3" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <ul class="nav nav-tabs-custom mb-4 text-no-select" style="margin-left: 48px;">
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'videos'" (click)="switchTab('videos')">
              <i class="fas fa-video me-2"></i>
              {{ i18nStrings['tabVideos'] }}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'playlists'" (click)="switchTab('playlists')">
              <i class="fas fa-list me-2"></i>
              {{ i18nStrings['tabPlaylists'] }}
            </a>
          </li>
        </ul>

        <div *ngIf="activeTab === 'videos'">
          <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="!loadingVideos && videos.length > 0">
            <p class="text-info mb-0">
              <i class="fas fa-video me-2"></i>
              {{ videos.length }} {{ i18nStrings['videosCount'] }}
            </p>
            <button class="btn btn-blue-glass me-3" (click)="playAllVideos()">
              <i class="fas fa-play me-2"></i>
              {{ i18nStrings['playAll'] }}
            </button>
          </div>

          <div *ngIf="loadingVideos" class="text-center py-3">
            <div class="spinner-border spinner-custom" role="status"></div>
          </div>

          <div *ngIf="!loadingVideos && videos.length === 0" class="alert-custom alert-info-custom">
            <i class="fas fa-info-circle me-2"></i>
            {{ i18nStrings['noVideos'] }}
          </div>

          <div class="row" *ngIf="!loadingVideos && videos.length > 0">
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos; trackBy: trackByFn_Video">
              <app-video-item
                [video]="video"
                [showMetadata]="true"
                [showWatchLaterButton]="true"
                [showStarredButton]="true"
                [showQueueButton]="true"
                (videoClick)="watchVideo(video)"
                (addToQueue)="addToQueue(video)"
                (toggleWatchLater)="toggleWatchLater($event)"
                (toggleStarred)="toggleStarred($event)"
              ></app-video-item>
            </div>
          </div>

          <div class="text-center mt-4" *ngIf="videos.length > 0 && !loadingVideos">
            <button class="btn btn-blue-glass" (click)="loadMoreVideos()" [disabled]="loadingMore">
              <span *ngIf="!loadingMore">
                <i class="fas fa-chevron-down me-2"></i>
                {{ i18nStrings['loadMore'] }}
              </span>
              <span *ngIf="loadingMore">
                <span class="spinner-border spinner-border-sm me-2"></span>
                {{ i18nStrings['loading'] }}
              </span>
            </button>
          </div>
        </div>

        <div *ngIf="activeTab === 'playlists'">
          <div *ngIf="loadingPlaylists" class="text-center py-3">
            <div class="spinner-border spinner-custom" role="status"></div>
          </div>

          <div *ngIf="!loadingPlaylists && playlists.length === 0" class="alert-custom alert-info-custom">
            <i class="fas fa-info-circle me-2"></i>
            {{ i18nStrings['noPlaylists'] }}
          </div>

          <div class="row" *ngIf="!loadingPlaylists && playlists.length > 0">
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let playlist of playlists; trackBy: trackByFn_Playlist">
              <div class="card playlist-card h-100 text-no-select" (click)="openPlaylist(playlist.yt_id, playlist.title)">
                <div class="playlist-thumbnail">
                  <img [src]="playlist.thumbnail" [alt]="playlist.title" *ngIf="playlist.thumbnail">
                  <div class="playlist-badge">
                    <i class="fas fa-list me-1"></i>
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
    .channel-title {
      color: white;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .nav-tabs-custom {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-tabs-custom .nav-link {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.6);
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px 8px 0 0;
      padding: 12px 20px;
      transition: all 0.2s ease;
    }

    .nav-tabs-custom .nav-link:hover {
      color: white;
      background: rgba(13, 110, 253, 0.1);
      border-color: rgba(13, 110, 253, 0.2);
    }

    .nav-tabs-custom .nav-link.active {
      color: white;
      background: rgba(13, 110, 253, 0.15);
      border: 1px solid rgba(13, 110, 253, 0.3);
      border-bottom-color: transparent;
      font-weight: 600;
      box-shadow: 0 -2px 8px rgba(13, 110, 253, 0.2);
    }

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

    .btn-subscribe {
      background: rgba(198, 17, 32, 0.15);
      border: 1px solid rgba(198, 17, 32, 0.4);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      padding: 8px 20px;
    }

    .btn-subscribe:hover:not(:disabled) {
      background: rgba(198, 17, 32, 0.3);
      border-color: rgba(198, 17, 32, 0.6);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(198, 17, 32, 0.4);
    }

    .btn-subscribe:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-subscribed {
      background: rgba(25, 135, 84, 0.15);
      border: 1px solid rgba(25, 135, 84, 0.4);
      color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      padding: 8px 20px;
    }

    .btn-subscribed:hover:not(:disabled) {
      background: rgba(220, 53, 69, 0.2);
      border-color: rgba(220, 53, 69, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
    }

    .btn-subscribed:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-custom {
      color: rgba(13, 110, 253, 0.8);
    }

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

    .text-info {
      color: rgba(255, 255, 255, 0.7) !important;
    }

    .playlist-card {
      cursor: pointer;
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .playlist-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .playlist-thumbnail {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #1a1a1a;
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
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(10px);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .playlist-card .card-body {
      background: transparent;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .playlist-card .card-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: white;
      line-height: 1.3;
    }
  `]
})
export class ChannelComponent implements I18nMultilingual, OnInit, OnDestroy {
  channelId = '';
  channel: any = null;
  activeTab = 'videos';

  readonly i18nDict: I18nDict = channelDict;
  i18nStrings: I18nLocalized = {};

  videos: YtVideoListItem[] = [];
  loading = false;
  loadingVideos = false;
  loadingMore = false;
  currentPage = 1;

  playlists: YtPlaylist[] = [];
  loadingPlaylists = false;

  isSubscribed = false;
  subscriptionId: string | null = null;
  subscriptionLoading = false;

  private alive$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService,
    private i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

    this.channelId = this.route.snapshot.paramMap.get('id') || '';

    this.route.queryParams.pipe(
      takeUntil(this.alive$),
      tap((params) => { this.activeTab = params['tab'] || 'videos' })
    ).subscribe();

    if (this.channelId) {
      this.loadChannel();
      this.loadVideos();
      this.loadPlaylists();
      this.checkSubscriptionStatus();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  checkSubscriptionStatus(): void {
    this.api.checkSubscription(this.channelId).pipe(
      takeUntil(this.alive$)
    ).subscribe({
      next: (data) => {
        this.isSubscribed = data.subscribed;
        this.subscriptionId = data.subscription_id || null;
      },
      error: () => {
        this.isSubscribed = false;
        this.subscriptionId = null;
      }
    });
  }

  toggleSubscription(): void {
    if (this.subscriptionLoading) return;

    this.subscriptionLoading = true;

    if (this.isSubscribed && this.subscriptionId) {
      this.api.unsubscribe(this.subscriptionId).pipe(
        takeUntil(this.alive$)
      ).subscribe({
        next: () => {
          this.isSubscribed = false;
          this.subscriptionId = null;
          this.subscriptionLoading = false;
        },
        error: () => {
          this.subscriptionLoading = false;
        }
      });
    } else {
      this.api.subscribe(this.channelId).pipe(
        takeUntil(this.alive$)
      ).subscribe({
        next: (data) => {
          this.isSubscribed = true;
          this.subscriptionId = data?.subscription?.id || data?.id || null;
          this.subscriptionLoading = false;
        },
        error: () => {
          this.subscriptionLoading = false;
        }
      });
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

  watchVideo(video: YtVideoListItem): void {
    this.playerService.playVideo(video);
  }

  toggleWatchLater(video: YtVideoListItem): void {
    if (video.is_watch_later) {
      this.api.removeWatchLater(video.yt_id).subscribe({
        next: () => { video.is_watch_later = false; }
      });
    } else {
      this.api.addWatchLater(
        video.yt_id,
        video.title,
        video.thumbnail_src,
        video.duration,
        video.channel_id,
        video.channel_name
      ).subscribe({
        next: () => { video.is_watch_later = true; }
      });
    }
  }

  toggleStarred(video: YtVideoListItem): void {
    if (video.is_starred) {
      this.api.removeStarred(video.yt_id).subscribe({
        next: () => { video.is_starred = false; }
      });
    } else {
      this.api.addStarred(
        video.yt_id,
        video.title,
        video.thumbnail_src,
        video.duration,
        video.channel_id,
        video.channel_name
      ).subscribe({
        next: () => { video.is_starred = true; }
      });
    }
  }

  playAllVideos(): void {
    this.playerService.queueSet(this.videos);
  }

  addToQueue(video: YtVideoListItem): void {
    this.playerService.queueAdd(video);
  }

  goBack(): void {
    history.back();
  }

  trackByFn_Playlist = function (_i: number, pl: YtPlaylist): string {
    return pl.yt_id;
  }

  trackByFn_Video = function (_i: number, v: YtVideoListItem): string {
    return v.yt_id;
  }

  private mapToVideoItemData(video: any): YtVideoListItem {
    return {
      yt_id: video.yt_id,
      title: video.title,
      thumbnail: video.thumbnail,
      thumbnail_src: video.thumbnail_src,
      duration: video.duration,
      view_count: video.view_count,
      channel_name: this.channel?.name,
      channel_id: this.channelId,
      upload_date: video.upload_date,
      is_watch_later: video.is_watch_later || false,
      is_starred: video.is_starred || false
    };
  }
}
