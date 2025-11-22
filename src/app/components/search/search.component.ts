import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { VideoItemData } from '../../models/video-item.model';
import { SearchStateService } from '../../services/search-state.service';

@Component({
  selector: 'app-search',
  standalone: false,
  template: `
    <div class="container-fluid">
      <div class="d-flex align-items-center mb-4">
        <h2 class="mb-0 text-no-select" style="margin-left: 48px;">
          <i class="fas fa-search me-2"></i>
          Search Videos
        </h2>
      </div>

      <div class="row mb-4">
        <div class="col-md-8 col-lg-6 mx-auto">
          <div class="input-group input-group-lg">
            <input
              type="text"
              class="form-control"
              placeholder="Search for videos..."
              [(ngModel)]="st.searchQuery"
              (keyup.enter)="search()"
              [disabled]="loading"
            >
            <button
              class="btn btn-primary"
              type="button"
              (click)="search()"
              [disabled]="loading || !st.searchQuery.trim()"
            >
              <i class="fas fa-search me-2"></i>
              Search
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">Searching...</p>
      </div>

      <div *ngIf="!loading && st.searched && st.videos.length === 0" class="alert alert-info text-center">
        <i class="fas fa-info-circle me-2"></i>
        No videos found for "{{ st.lastSearchQuery }}". Try a different search term.
      </div>

      <div class="row" *ngIf="!loading && st.videos.length > 0">
        <div class="col-12 mb-3 d-flex justify-content-between align-items-center">
          <p class="text-muted mb-0">
            <i class="fas fa-video me-2"></i>
            Found {{ st.videos.length }} videos for "{{ st.lastSearchQuery }}"
          </p>
          <button class="btn btn-primary" (click)="playAllVideos()">
            <i class="fas fa-play me-2"></i>
            Play All
          </button>
        </div>

        <div class="col-md-6 col-lg-4 col-xl-3 mb-4" *ngFor="let video of st.videos">
          <app-video-item
            [video]="video"
            [showMetadata]="true"
            (videoClick)="watchVideo($event)"
            (addToQueue)="addToQueue($event)"
            (addToWatchLater)="addToWatchLater($event)"
          ></app-video-item>
        </div>
      </div>

      <div class="text-center mt-4" *ngIf="st.videos.length > 0 && !loading">
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
  `,
  styles: []
})
export class SearchComponent {
  loading = false;
  loadingMore = false;

  constructor(
    private api: ApiService,
    public st: SearchStateService,
    private playerService: PlayerService,
  ) {}

  search(): void {
    if (!this.st.searchQuery.trim()) return;

    this.loading = true;
    this.st.lastSearchQuery = this.st.searchQuery;
    this.st.currentOffset = 0;

    this.api.searchVideos(this.st.searchQuery, 0, this.st.pageSize).subscribe({
      next: (data) => {
        this.st.videos = data?.videos || [];
        this.loading = false;
        this.st.searched = true;
      },
      error: () => {
        this.loading = false;
        this.st.searched = true;
        this.st.videos = [];
      }
    });
  }

  loadMore(): void {
    this.loadingMore = true;
    this.st.currentOffset += this.st.pageSize;

    this.api.searchVideos(this.st.lastSearchQuery, this.st.currentOffset, this.st.pageSize).subscribe({
      next: (data) => {
        var newVideos = data?.videos || [];
        this.st.videos = [...this.st.videos, ...newVideos];
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.st.currentOffset -= this.st.pageSize;
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
    this.playerService.queueSet(this.st.videos);
  }

  addToQueue(video: VideoItemData): void {
    this.playerService.queueAdd(video);
  }
}
