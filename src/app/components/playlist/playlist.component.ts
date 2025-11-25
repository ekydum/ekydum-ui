import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { YtVideoListItem } from '../../models/protocol/yt-video-list-item.model';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../i18n/models/dict.models';
import { I18nService } from '../../i18n/services/i18n.service';
import { dict } from '../../i18n/dict/main.dict';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-playlist',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border spinner-custom" role="status"></div>
      </div>

      <div *ngIf="!loading">
        <div class="d-flex align-items-center mb-4">
          <h2 class="mb-0 page-title" style="margin-left: 48px;">
            <i class="fas fa-list me-2"></i>
            {{ playlistTitle || i18nStrings['defaultTitle'] }}
          </h2>
          <div class="d-flex flex-row flex-grow-1"></div>
          <button
            class="btn btn-blue-glass me-2"
            (click)="playAllVideos()"
            [disabled]="videos.length === 0"
          >
            <i class="fas fa-play me-2"></i>
            {{ i18nStrings['playAll'] }}
          </button>
          <button class="btn btn-glass me-3" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <div *ngIf="videos.length === 0 && !loading" class="alert-custom alert-info-custom">
          <i class="fas fa-info-circle me-2"></i>
          {{ i18nStrings['noVideos'] }}
        </div>

        <div class="row" *ngIf="videos.length > 0">
          <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
            <app-video-item
              [video]="video"
              [showMetadata]="true"
              (videoClick)="watchVideo($event)"
              (addToQueue)="addToQueue($event)"
              (addToWatchLater)="addToWatchLater($event)"
            ></app-video-item>
          </div>
        </div>

        <div class="text-center mt-4" *ngIf="videos.length > 0 && !loading">
          <button class="btn btn-blue-glass" (click)="loadMore()" [disabled]="loadingMore">
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
    </div>
  `,
  styles: [`
    .page-title {
      color: white;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    /* Buttons - Glass */
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
  `]
})
export class PlaylistComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['playlist'];
  i18nStrings: I18nLocalized = {};

  playlistId = '';
  playlistTitle = '';
  videos: YtVideoListItem[] = [];
  loading = false;
  loadingMore = false;
  currentPage = 1;

  private alive$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService,
    private i18nService: I18nService,
  ) {
    var navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.playlistTitle = navigation.extras.state['title'] || '';
    }
  }

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

    this.playlistId = this.route.snapshot.paramMap.get('id') || '';
    if (this.playlistId) {
      this.loadVideos();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  loadVideos(): void {
    this.loading = true;
    this.api.getPlaylistVideos(this.playlistId, this.currentPage).subscribe({
      next: (data) => {
        this.videos = (data?.items || []).map((v: any) => this.mapToVideoItemData(v));
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

  watchVideo(video: YtVideoListItem): void {
    this.playerService.playVideo(video);
  }

  addToWatchLater(video: YtVideoListItem): void {
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

  addToQueue(video: YtVideoListItem): void {
    this.playerService.queueAdd(video);
  }

  goBack(): void {
    window.history.back();
  }

  private mapToVideoItemData(video: any): YtVideoListItem {
    return {
      yt_id: video.yt_id,
      yt_video_id: video.yt_id,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      view_count: video.view_count,
      channel_name: video.channel_name,
      channel_id: video.channel_id,
      upload_date: video.upload_date
    };
  }
}
