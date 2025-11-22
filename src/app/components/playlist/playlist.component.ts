import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { VideoItemData } from '../../models/video-item.model';

@Component({
  selector: 'app-playlist',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div *ngIf="!loading">
        <div class="d-flex align-items-center mb-4">
          <h2 class="mb-0" style="margin-left: 48px;">
            <i class="fas fa-list me-2"></i>
            {{ playlistTitle || 'Playlist' }}
          </h2>
          <div class="d-flex flex-row flex-grow-1"></div>
          <button
            class="btn btn-primary me-2"
            (click)="playAllVideos()"
            [disabled]="videos.length === 0"
          >
            <i class="fas fa-play me-2"></i>
            Play All
          </button>
          <button class="btn btn-outline-secondary me-3" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <div *ngIf="videos.length === 0 && !loading" class="alert alert-info">
          No videos found in this playlist.
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
  `,
  styles: []
})
export class PlaylistComponent implements OnInit {
  playlistId = '';
  playlistTitle = '';
  videos: VideoItemData[] = [];
  loading = false;
  loadingMore = false;
  currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private playerService: PlayerService
  ) {
    var navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.playlistTitle = navigation.extras.state['title'] || '';
    }
  }

  ngOnInit(): void {
    this.playlistId = this.route.snapshot.paramMap.get('id') || '';
    if (this.playlistId) {
      this.loadVideos();
    }
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
    window.history.back();
  }

  private mapToVideoItemData(video: any): VideoItemData {
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
