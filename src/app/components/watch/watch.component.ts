import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import Plyr from 'plyr';
import Hls from 'hls.js';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule],
  template: `
      <div class="container-fluid">
          <div *ngIf="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div *ngIf="!loading && video">
              <button class="btn btn-outline-secondary mb-3" (click)="goBack()"  style="margin-left: 48px;">
                  <i class="fas fa-arrow-left me-2"></i>
                  Back
              </button>

              <div class="video-player-container mb-3">
                  <video #videoPlayer playsinline controls></video>
              </div>

              <h3>{{ video.title }}</h3>
              <p class="text-muted">
                  <i class="fas fa-tv me-2"></i>
                  {{ video.channel_name || 'Unknown Channel' }}
              </p>
              <p class="text-muted">
                  <i class="fas fa-calendar me-2"></i>
                  {{ video.upload_date | date:'fullDate' }}
              </p>
              <div *ngIf="video.description" class="border rounded p-3 bg-light">
                  <h6>Description</h6>
                  <p class="mb-0" style="white-space: pre-wrap;">{{ video.description }}</p>
              </div>
          </div>
      </div>
  `,
  styles: [`
      .video-player-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
      }
      .video-player-container video {
          width: 100%;
          height: auto;
          display: block;
      }
  `]
})
export class WatchComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  videoId = '';
  video: any = null;
  loading = false;
  player: Plyr | null = null;
  hls: Hls | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.videoId) {
      this.loadVideo();
    }
  }

  ngAfterViewInit(): void {
    if (this.videoElement) {
      this.initPlayer();
    }
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }

  loadVideo(): void {
    this.loading = true;
    this.api.getVideo(this.videoId).subscribe({
      next: (data) => {
        this.video = data;
        this.loading = false;
        this.loadVideoStream();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadVideoStream(): void {
    this.api.getVideoStream(this.videoId).subscribe({
      next: (data) => {
        if (data.url) {
          this.setupVideoSource(data.url);
        }
      }
    });
  }

  initPlayer(): void {
    if (!this.videoElement) return;

    this.player = new Plyr(this.videoElement.nativeElement, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
      settings: ['quality', 'speed'],
      quality: {
        default: 720,
        options: [360, 480, 720, 1080]
      }
    });
  }

  setupVideoSource(url: string): void {
    if (!this.videoElement) return;

    var video = this.videoElement.nativeElement;

    if (url.includes('m3u8')) {
      if (Hls.isSupported()) {
        this.destroyHls();
        this.hls = new Hls();
        this.hls.loadSource(url);
        this.hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      }
    } else {
      video.src = url;
    }
  }

  destroyHls(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  destroyPlayer(): void {
    this.destroyHls();
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }

  goBack(): void {
    this.router.navigate(['/subscriptions']);
  }
}
