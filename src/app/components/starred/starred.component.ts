import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { VideoItemData } from '../../models/video-item.model';

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
        <div class="d-flex flex-row flex-grow-1"></div>
        <button
          class="btn btn-primary me-3"
          (click)="playAll()"
          [disabled]="videos.length === 0"
        >
          <i class="fas fa-play me-2"></i>
          Play All
        </button>
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
          <app-video-item
            [video]="video"
            [showWatchLaterButton]="true"
            [showQueueButton]="true"
            (videoClick)="playVideo($event)"
            (addToQueue)="addToQueue($event)"
            (addToWatchLater)="addToWatchLater($event)"
          >
            <button class="btn btn-sm btn-outline-danger w-100 mt-2" (click)="removeStar(video.yt_video_id!)">
              <i class="fas fa-star me-1"></i>
              Remove
            </button>
          </app-video-item>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StarredComponent implements OnInit {
  videos: VideoItemData[] = [];
  loading = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService
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

  playVideo(video: VideoItemData): void {
    // this.playerService.playVideoInFloatingMode({
    //   yt_video_id: video.yt_video_id || video.yt_id || '',
    //   title: video.title,
    //   thumbnail: video.thumbnail || '',
    //   duration: video.duration,
    //   channel_id: video.channel_id,
    //   channel_name: video.channel_name
    // });
  }

  addToQueue(video: VideoItemData): void {
    // this.api.addToQueue(
    //   video.yt_video_id || video.yt_id || '',
    //   video.title,
    //   video.thumbnail || '',
    //   video.duration,
    //   video.channel_id,
    //   video.channel_name
    // ).subscribe();
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

  playAll(): void {
    // this.api.playAll(this.videos).subscribe({
    //   next: () => {
    //     setTimeout(() => {
    //       this.playerService.openFloatingPlayer();
    //     }, 500);
    //   }
    // });
  }

  removeStar(videoId: string): void {
    this.api.removeStarred(videoId).subscribe({
      next: () => {
        this.videos = this.videos.filter(v => v.yt_video_id !== videoId);
      }
    });
  }
}
