import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { YtVideoListItem } from '../../../models/protocol/yt-video-list-item.model';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../../i18n/models/dict.models';
import { I18nService } from '../../../i18n/services/i18n.service';
import { dict } from '../../../i18n/dict/main.dict';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-video-item',
  standalone: false,
  template: `
    <div class="card video-card h-100 text-no-select" [class.list-mode]="mode === 'list'">
      <div class="video-thumbnail" (click)="onVideoClick()">
        <img [src]="video.thumbnail" [alt]="video.title" *ngIf="video.thumbnail">

        <!-- Action buttons overlay -->
        <div class="video-actions" *ngIf="showActions">
          <button
            class="btn btn-sm video-action-btn video-action-queue"
            (click)="onAddToQueue($event)"
            [title]="i18nStrings['btnAddToQueue']"
            *ngIf="showQueueButton"
          >
            <i class="fas fa-plus"></i>
          </button>
          <button
            class="btn btn-sm video-action-btn video-action-later ms-1"
            (click)="onAddToWatchLater($event)"
            [title]="i18nStrings['btnAddToWatchLater']"
            *ngIf="showWatchLaterButton"
          >
            <i class="fas fa-clock"></i>
          </button>
        </div>

        <!-- Duration badge -->
        <div class="duration-badge" *ngIf="video.duration">
          {{ formatDuration(video.duration) }}
        </div>
      </div>

      <div class="card-body" [class.p-2]="mode === 'list'">
        <h6 class="card-title" (click)="onVideoClick()">{{ video.title }}</h6>

        <p class="card-text video-channel small mb-1" *ngIf="video.channel_name">
          <i class="fas fa-user me-1"></i>
          <a
            *ngIf="video.channel_id"
            [routerLink]="['/channel', video.channel_id]"
            class="channel-link"
            (click)="$event.stopPropagation()"
          >
            {{ video.channel_name }}
          </a>
          <span *ngIf="!video.channel_id">{{ video.channel_name }}</span>
        </p>

        <p class="card-text video-meta small mb-0" *ngIf="showMetadata">
          <span *ngIf="video.view_count">
            <i class="fas fa-eye me-1"></i>
            {{ formatViewCount(video.view_count) }}
          </span>
          <span *ngIf="video.view_count && video.upload_date" class="mx-1">•</span>
          <span *ngIf="video.upload_date">
            <i class="fas fa-calendar me-1"></i>
            {{ formatDate(video.upload_date) }}
          </span>
        </p>

        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .video-card {
      cursor: pointer;
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .video-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .video-card.list-mode {
      display: flex;
      flex-direction: row;
    }

    .video-card.list-mode .video-thumbnail {
      width: 200px;
      padding-top: 0;
      height: 112px;
      flex-shrink: 0;
    }

    .video-card.list-mode .card-body {
      flex: 1;
    }

    .video-thumbnail {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #1a1a1a;
      cursor: pointer;
    }

    .video-thumbnail img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .video-card:hover .video-thumbnail img {
      transform: scale(1.05);
    }

    .video-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
      display: flex;
      gap: 4px;
    }

    .video-card:hover .video-actions {
      opacity: 1;
    }

    .video-action-btn {
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .video-action-queue:hover {
      background: rgba(198, 17, 32, 0.9);
      border-color: rgba(198, 17, 32, 0.5);
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(198, 17, 32, 0.6);
    }

    .video-action-later:hover {
      background: rgba(13, 110, 253, 0.9);
      border-color: rgba(13, 110, 253, 0.5);
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(13, 110, 253, 0.6);
    }

    .duration-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(10px);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .card-body {
      background: transparent;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .card-title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-weight: 600;
      margin-bottom: 0.5rem;
      cursor: pointer;
      color: white;
      line-height: 1.3;
      transition: color 0.2s ease;
      min-height: 2.6em; /* 2 lines * 1.3 line-height */
    }

    .card-title:hover {
      color: rgb(66, 153, 225);
    }

    .video-channel {
      color: rgba(255, 255, 255, 0.6);
    }

    .channel-link {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .channel-link:hover {
      color: rgb(66, 153, 225);
      text-decoration: none;
    }

    .video-meta {
      color: rgba(255, 255, 255, 0.5);
    }

    .video-meta i {
      opacity: 0.7;
    }
  `]
})
export class VideoItemComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['player'];
  i18nStrings: I18nLocalized = {};

  @Input() video!: YtVideoListItem;
  @Input() mode: 'thumbnail' | 'list' = 'thumbnail';
  @Input() showActions = true;
  @Input() showQueueButton = true;
  @Input() showWatchLaterButton = true;
  @Input() showMetadata = true;

  @Output() videoClick = new EventEmitter<YtVideoListItem>();
  @Output() addToQueue = new EventEmitter<YtVideoListItem>();
  @Output() addToWatchLater = new EventEmitter<YtVideoListItem>();

  private alive$ = new Subject<void>();

  constructor(private i18nService: I18nService) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  onVideoClick(): void {
    this.videoClick.emit(this.video);
  }

  onAddToQueue(event: Event): void {
    event.stopPropagation();
    this.addToQueue.emit(this.video);
  }

  onAddToWatchLater(event: Event): void {
    event.stopPropagation();
    this.addToWatchLater.emit(this.video);
  }

  formatDuration(seconds: number): string {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;
    var result = hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
    return result;
  }

  formatViewCount(count: string): string {
    var result = count || '';
    return result;
  }

  formatDate(dateString: string): string {
    var result = '';

    if (dateString) {
      var date = new Date(dateString);
      var now = new Date();
      var diffMs = now.getTime() - date.getTime();
      var diffMinutes = Math.floor(diffMs / (1000 * 60));
      var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      var diffWeeks = Math.floor(diffDays / 7);
      var diffMonths = Math.floor(diffDays / 30);
      var diffYears = Math.floor(diffDays / 365);

      result = diffMinutes < 1
        ? (this.i18nStrings['dateJustNow'] || 'Just now')
        : diffMinutes < 60
          ? `${diffMinutes} ${this.i18nStrings['dateMinutesAgo'] || 'min ago'}`
          : diffHours < 24
            ? `${diffHours} ${this.i18nStrings['dateHoursAgo'] || 'hours ago'}`
            : diffDays === 1
              ? (this.i18nStrings['dateYesterday'] || 'Yesterday')
              : diffDays < 7
                ? `${diffDays} ${this.i18nStrings['dateDaysAgo'] || 'days ago'}`
                : diffDays < 30
                  ? `${diffWeeks} ${this.i18nStrings['dateWeeksAgo'] || 'weeks ago'}`
                  : diffDays < 365
                    ? `${diffMonths} ${this.i18nStrings['dateMonthsAgo'] || 'months ago'}`
                    : `${diffYears} ${this.i18nStrings['dateYearsAgo'] || 'years ago'}`;
    }

    return result;
  }
}
