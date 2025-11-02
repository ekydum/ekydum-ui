import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-vidstack-custom-controls',
  templateUrl: './vidstack-player.component.html',
  styleUrls: ['./vidstack-player.component.scss'],
  standalone: false,
})
export class VidstackPlayerComponent implements AfterViewInit {
  @Input() video?: any;

  combinedFormats: any[] = [];
  videoFormats: any[] = [];
  audioFormats: any[] = [];

  selectedFormat: string | null = null;
  selectedVideoFormat: string | null = null;
  selectedAudioFormat: string | null = null;

  currentVideoUrl = '';

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngAfterViewInit(): void {
    if (this.video) {
      this.parseFormats(this.video);
      this.selectDefaultFormat();
      this.cdr.detectChanges();
    }
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
      tbr: f.tbr
    }))
    .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

    this.videoFormats = data.formats
    .filter((f: any) => f.vcodec && f.vcodec !== 'none' && (!f.acodec || f.acodec === 'none'))
    .map((f: any) => ({
      format_id: f.format_id,
      quality: f.format_note || (f.height ? `${f.height}p` : f.format_id),
      height: f.height,
      vcodec: f.vcodec,
      url: f.url,
      filesize: f.filesize
    }))
    .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

    this.audioFormats = data.formats
    .filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
    .map((f: any) => ({
      format_id: f.format_id,
      language: f.language || 'unknown',
      acodec: f.acodec,
      url: f.url,
      bitrate: Math.round(f.abr || f.tbr || 0)
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

  changeQuality(): void {
    var serverUrl = this.auth.getServerUrl() || 'http://localhost:3000';
    var accountToken = this.auth.getAccountToken();

    if (this.selectedFormat) {
      var format = this.combinedFormats.find((f: any) => f.format_id === this.selectedFormat);
      if (format) {
        this.currentVideoUrl = `${serverUrl}/hls/m3u8?url=${encodeURIComponent(format.url)}&token=${accountToken}`;
      }
    } else if (this.selectedVideoFormat) {
      var videoFormat = this.videoFormats.find((f: any) => f.format_id === this.selectedVideoFormat);
      if (videoFormat) {
        this.currentVideoUrl = `${serverUrl}/hls/m3u8?url=${encodeURIComponent(videoFormat.url)}&token=${accountToken}`;
      }
    }
  }
}
