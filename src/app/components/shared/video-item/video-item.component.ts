import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VideoItemData } from '../../../models/video-item.model';

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
            class="btn btn-sm btn-primary video-action-btn"
            (click)="onAddToQueue($event)"
            title="Add to Queue"
            *ngIf="showQueueButton"
          >
            <i class="fas fa-plus"></i>
          </button>
          <button
            class="btn btn-sm btn-primary video-action-btn ms-1"
            (click)="onAddToWatchLater($event)"
            title="Add to Watch Later"
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

        <p class="card-text text-muted small mb-1" *ngIf="video.channel_name">
          <i class="fas fa-user me-1"></i>
          {{ video.channel_name }}
        </p>

        <p class="card-text text-muted small mb-0" *ngIf="showMetadata">
          <span *ngIf="video.view_count">
            <i class="fas fa-eye me-1"></i>
            {{ formatViewCount(video.view_count) }}
          </span>
          <span *ngIf="video.upload_date" class="ms-2">
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
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .video-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

    .video-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
      display: flex;
    }

    .video-card:hover .video-actions {
      opacity: 1;
    }

    .video-action-btn {
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .duration-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
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
export class VideoItemComponent {
  @Input() video!: VideoItemData;
  @Input() mode: 'thumbnail' | 'list' = 'thumbnail';
  @Input() showActions = true;
  @Input() showQueueButton = true;
  @Input() showWatchLaterButton = true;
  @Input() showMetadata = true;

  @Output() videoClick = new EventEmitter<VideoItemData>();
  @Output() addToQueue = new EventEmitter<VideoItemData>();
  @Output() addToWatchLater = new EventEmitter<VideoItemData>();

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
    if (!dateString) return '';

    // Handle YYYY-MM-DD format
    if (dateString.includes('-')) {
      var date = new Date(dateString);
      var now = new Date();
      var diff = now.getTime() - date.getTime();
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      if (days < 365) return `${Math.floor(days / 30)} months ago`;
      return `${Math.floor(days / 365)} years ago`;
    }

    return dateString;
  }
}
