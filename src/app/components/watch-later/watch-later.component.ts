import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { VideoItemData } from '../../models/video-item.model';

@Component({
  selector: 'app-watch-later',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div class="d-flex align-items-center mb-4">
        <h2 class="mb-0 page-title text-no-select" style="margin-left: 48px;">
          <i class="fas fa-clock me-2"></i>
          Watch Later
        </h2>
        <div class="d-flex flex-row flex-grow-1"></div>
        <button
          class="btn btn-blue-glass me-3"
          (click)="playAllVideos()"
          [disabled]="videos.length === 0"
        >
          <i class="fas fa-play me-2"></i>
          Play All
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border spinner-custom" role="status"></div>
      </div>

      <div *ngIf="!loading && videos.length === 0" class="alert-custom alert-info-custom text-center">
        <i class="fas fa-info-circle me-2"></i>
        No videos in Watch Later yet. Click the clock icon on any video to add it here!
      </div>

      <div class="row" *ngIf="!loading && videos.length > 0">
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of videos">
          <app-video-item
            [video]="video"
            [showWatchLaterButton]="false"
            [showQueueButton]="true"
            (videoClick)="watchVideo($event)"
            (addToQueue)="addToQueue($event)"
          >
            <button class="btn btn-sm btn-red-glass w-100 mt-2" (click)="remove(video.yt_video_id!)">
              <i class="fas fa-clock me-1"></i>
              Remove
            </button>
          </app-video-item>
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

    .btn-red-glass {
      background: rgba(198, 17, 32, 0.15);
      border: 1px solid rgba(198, 17, 32, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-red-glass:hover {
      background: rgba(198, 17, 32, 0.25);
      border-color: rgba(198, 17, 32, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(198, 17, 32, 0.4);
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
  `]
})
export class WatchLaterComponent implements OnInit {
  videos: VideoItemData[] = [];
  loading = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.loadWatchLater();
  }

  loadWatchLater(): void {
    this.loading = true;
    this.api.getWatchLater().subscribe({
      next: (data) => {
        this.videos = data?.videos || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  watchVideo(video: VideoItemData): void {
    this.playerService.playVideo(video);
  }

  playAllVideos(): void {
    this.playerService.queueSet(this.videos);
  }

  addToQueue(video: VideoItemData): void {
    this.playerService.queueAdd(video);
  }

  remove(videoId: string): void {
    this.api.removeWatchLater(videoId).subscribe({
      next: () => {
        this.videos = this.videos.filter(v => v.yt_video_id !== videoId);
      }
    });
  }
}
