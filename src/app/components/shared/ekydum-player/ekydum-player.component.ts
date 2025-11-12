import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import Hls from 'hls.js';
import { YtDlpSourceFormat, YtDlpVideoChapter, YtDlpVideoInfo } from '../../../models/yt-dlp-video-info.interface';
import { UserPreference } from '../../../models/settings';

@Component({
  selector: 'app-ekydum-player',
  templateUrl: './ekydum-player.component.html',
  styleUrls: ['./ekydum-player.component.scss'],
  standalone: false,
})
export class EkydumPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() video!: YtDlpVideoInfo;
  @Input() preferences!: UserPreference[];

  @ViewChild('videoEl', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  availableLanguages: YtDlpSourceFormat['language'][] = [];
  selectedLanguage: YtDlpSourceFormat['language'] = 'en';
  private fallbackLanguage = 'en';

  combinedFormats: YtDlpSourceFormat[] = [];
  // videoFormats: YtDlpSourceFormat[] = [];
  // audioFormats: YtDlpSourceFormat[] = [];

  selectedFormat: YtDlpSourceFormat | null = null;
  // selectedVideoFormat: YtDlpSourceFormat | null = null;
  // selectedAudioFormat: YtDlpSourceFormat | null = null;

  sourceManifestUrl = '';
  posterUrl = '';

  private hls!: Hls;
  private isFirstLoad = true;

  private autoPlay = true;

  private get player(): HTMLVideoElement {
    return this.videoElementRef.nativeElement;
  }

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngAfterViewInit() {
    if (this.preferences) {
      this.applyPreferences();
    }
    if (this.video) {
      this.parseFormats();
      this.initPlayer();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.hls) {
      this.hls.destroy();
    }
  }

  private applyPreferences(): void {
    if (Array.isArray(this.preferences)) {
      var langPref = this.preferences.find((p) => p.key === 'LANG');
      if (langPref) { this.selectedLanguage = (langPref.value + '').toLowerCase(); }

      var autoPlayPref = this.preferences.find((p) => p.key === 'AUTO_PLAY');
      if (autoPlayPref) { this.autoPlay = +autoPlayPref.value !== 0 }
    }
  }

  private async initPlayer() {
    var player = this.player;

    if (Hls.isSupported()) {
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
      });

      this.selectDefaultFormat();
      this.hls.attachMedia(player);
      this.posterUrl = this.video?.thumbnail || '';

      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // console.log('Manifest loaded', event, data);
        // this.qualities = this.hls.levels;
        // console.log('Available qualities:', this.hls.levels);

        // auto-play
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          if (this.autoPlay) {
            this.play();
          }
        }
      });

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

      // player.addEventListener('play', () => {
      //   console.log('Playing');
      // });

      // player.addEventListener('pause', () => {
      //   console.log('Paused');
      // });

    }
    // TODO: platforms w/ native HLS support
    // else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    //   player.src = 'https://your-proxy.com/manifest.m3u8';
    // }
  }

  play() {
    this.player.play().catch((err) => {
      console.error('Playback Error:', err);
    });
  }

  pause() {
    this.player.pause();
  }

  parseFormats(): void {
    var formats = this.video!.formats;

    this.availableLanguages = Array.from(
      new Set(
        formats.map(
          (f) => f.language
        ).filter(
          (l) => !!l
        )
      )
    );

    // todo: rework this
    // try lang from preferences
    this.combinedFormats = formats
      .filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
      .filter((f) => (f.language + '').startsWith(this.selectedLanguage + ''))
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    // try fallback lang (en/en-XX)
    if (this.combinedFormats.length === 0 && this.selectedLanguage !== this.fallbackLanguage) {
      this.selectedLanguage = this.fallbackLanguage;
      this.combinedFormats = formats
        .filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
        .filter((f) => (f.language + '').startsWith(this.fallbackLanguage))
        .sort((a, b) => (b.height || 0) - (a.height || 0));
    }
    // use any lang
    if (this.combinedFormats.length === 0) {
      this.combinedFormats = formats
        .filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
        .sort((a, b) => (b.height || 0) - (a.height || 0));
    }
    console.log('combined formats: ', this.combinedFormats);

    // this.videoFormats = formats
    //   .filter((f: any) => f.vcodec && f.vcodec !== 'none' && (!f.acodec || f.acodec === 'none'))
    //   .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

    // this.audioFormats = formats
    //   .filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
  }

  selectDefaultFormat(): void {
    if (this.combinedFormats.length > 0) {
      var bestFormat = this.combinedFormats.find((f: any) => f.height === 720) ||
        this.combinedFormats.find((f: any) => f.height === 480) ||
        this.combinedFormats[0];
      this.changeQuality(bestFormat);
    }
  }

  changeLang(lng: YtDlpSourceFormat['language']): void {
    this.selectedLanguage = lng;
  }

  changeQuality(f: YtDlpSourceFormat): void {
    console.log('set source: ', f);
    this.selectedFormat = f;

    var serverUrl = this.auth.getServerUrl() || 'http://localhost:3000';
    var accountToken = this.auth.getAccountToken();

    this.sourceManifestUrl = `${serverUrl}/hls/m3u8?url=${encodeURIComponent(f.url)}&token=${accountToken}`;

    if (this.hls) {
      var player = this.player;

      var currentTime = player.currentTime;
      var wasPlaying = !player.paused;

      this.hls.loadSource(this.sourceManifestUrl);

      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        player.currentTime = currentTime;
        if (wasPlaying && !this.isFirstLoad) {
          this.play();
        }
      });
    }
  }

  formatFormatLabel(f: YtDlpSourceFormat, markCurrent = false): string {
    var p = f?.protocol + '';
    var isHls = p && p.includes('m3u8');
    var isCurrent = markCurrent && f && this.selectedFormat && (f.format_id == this.selectedFormat.format_id);
    return f ? f.height + 'p' + (isHls ? '' : ' ' + p.toUpperCase()) + (isCurrent ? '*' : '') : '-';
  }

  formatLangLabel(lng: YtDlpSourceFormat['language'], markCurrent = false): string {
    var isCurrent = markCurrent && this.selectedLanguage && (this.selectedLanguage === lng);
    return lng + (isCurrent ? '*' : '');
  }

  goToChapter(ch: YtDlpVideoChapter): void {
    this.player.currentTime = ch.start_time;
  }
}
