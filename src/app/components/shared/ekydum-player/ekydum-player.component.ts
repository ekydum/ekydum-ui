import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import Hls from 'hls.js';
import { YtDlpVideoInfo } from '../../../models/yt-dlp-video-info.interface';

@Component({
  selector: 'app-ekydum-player',
  templateUrl: './ekydum-player.component.html',
  styleUrls: ['./ekydum-player.component.scss'],
  standalone: false,
})
export class EkydumPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() video?: YtDlpVideoInfo;
  @ViewChild('video', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  combinedFormats: any[] = [];
  videoFormats: any[] = [];
  audioFormats: any[] = [];

  selectedFormat: string | null = null;
  selectedVideoFormat: string | null = null;
  selectedAudioFormat: string | null = null;

  sourceManifestUrl = '';
  posterUrl = '';

  qualities: any[] = [];

  private hls!: Hls;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngAfterViewInit() {
    if (this.video) {
      this.parseFormats(this.video);
      this.selectDefaultFormat();

      this.initPlayer();

      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.hls) {
      this.hls.destroy();
    }
  }

  private async initPlayer() {
    var video = this.videoElementRef.nativeElement;

    if (Hls.isSupported()) {
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
      });

      this.hls.loadSource(this.sourceManifestUrl);
      this.hls.attachMedia(video);
      this.posterUrl = this.video?.thumbnail || '';

      // Когда манифест загружен
      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('Manifest loaded', event, data);
        this.qualities = this.hls.levels;
        console.log('Available qualities:', this.qualities);
      });

      // Обработка ошибок
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              this.hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying player...');
              this.hls.destroy();
              break;
          }
        }
      });

      // События видео
      video.addEventListener('play', () => {
        console.log('Playing');
      });

      video.addEventListener('pause', () => {
        console.log('Paused');
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS нативная поддержка HLS
      video.src = 'https://your-proxy.com/manifest.m3u8';
    }
  }

  play() {
    this.videoElementRef.nativeElement.play();
  }

  pause() {
    this.videoElementRef.nativeElement.pause();
  }

  parseFormats(data: any): void {
    if (!data.formats) return;

    this.combinedFormats = data.formats
      .filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
      .map((f: any) => ({
        format_id: f.format_id,
        quality: f.format_note || (f.height ? `${f.height}p` : f.format_id),
        height: f.height,
        ext: f.ext,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url,
        filesize: f.filesize,
        tbr: f.tbr,
        container: f.container,
      }))
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
    console.log('combined format: ', this.combinedFormats);

    this.videoFormats = data.formats
      .filter((f: any) => f.vcodec && f.vcodec !== 'none' && (!f.acodec || f.acodec === 'none'))
      .map((f: any) => ({
        format_id: f.format_id,
        quality: f.format_note || (f.height ? `${f.height}p` : f.format_id),
        height: f.height,
        vcodec: f.vcodec,
        url: f.url,
        filesize: f.filesize,
        container: f.container,
      }))
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

    this.audioFormats = data.formats
      .filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      .map((f: any) => ({
        format_id: f.format_id,
        language: f.language || 'unknown',
        acodec: f.acodec,
        url: f.url,
        bitrate: Math.round(f.abr || f.tbr || 0),
        container: f.container,
      }));
  }

  selectDefaultFormat(): void {
    if (this.combinedFormats.length > 0) {
      var bestFormat = this.combinedFormats.find((f: any) => f.height === 720) ||
        this.combinedFormats.find((f: any) => f.height === 480) ||
        this.combinedFormats[0];
      this.selectedFormat = bestFormat.format_id;
      this.changeQuality();
    } else if (this.videoFormats.length > 0) {
      var bestVideo = this.videoFormats.find((f: any) => f.height === 720) ||
        this.videoFormats.find((f: any) => f.height === 480) ||
        this.videoFormats[0];
      this.selectedVideoFormat = bestVideo.format_id;
      if (this.audioFormats.length > 0) {
        this.selectedAudioFormat = this.audioFormats[0].format_id;
      }
      this.changeQuality();
    }
  }

  changeQuality(event?: any): void {
    if (event) {
      var levelIndex = parseInt(event.target.value);
      this.hls.currentLevel = levelIndex;
      console.log('Quality changed to:', this.qualities[levelIndex]);
    }
    // TODO ^^

    var serverUrl = this.auth.getServerUrl() || 'http://localhost:3000';
    var accountToken = this.auth.getAccountToken();

    if (this.selectedFormat) {
      var format = this.combinedFormats.find((f: any) => f.format_id === this.selectedFormat);
      if (format) {
        this.sourceManifestUrl = `${serverUrl}/hls/m3u8?url=${encodeURIComponent(format.url)}&token=${accountToken}`;
      }
    } else if (this.selectedVideoFormat) {
      var videoFormat = this.videoFormats.find((f: any) => f.format_id === this.selectedVideoFormat);
      if (videoFormat) {
        this.sourceManifestUrl = `${serverUrl}/hls/m3u8?url=${encodeURIComponent(videoFormat.url)}&token=${accountToken}`;
      }
    }
  }
}
