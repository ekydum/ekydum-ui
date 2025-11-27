import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import Hls, { ErrorData, HlsConfig } from 'hls.js';
import { YtVideo_Format, YtVideo_Chapter, YtVideo } from '../../../models/protocol/yt-video.model';
import { UserPreference } from '../../../models/user-preference.model';
import { Ekydum_SourceFormat, Ekydum_SourceKind } from './models';
import { Subject, takeUntil, tap, debounceTime } from 'rxjs';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../../i18n/models/dict.models';
import { I18nService } from '../../../i18n/services/i18n.service';
import { dict } from '../../../i18n/dict/main.dict';

@Component({
  selector: 'app-ekydum-player',
  templateUrl: './ekydum-player.component.html',
  styleUrls: ['./ekydum-player.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EkydumPlayerComponent implements AfterViewInit, OnDestroy, I18nMultilingual {
  @Input() video!: YtVideo;
  @Input() preferences!: UserPreference[];
  @Input() showCustomControls = true;
  @ViewChild('videoEl', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  @Output() channelClick = new EventEmitter<string>();

  readonly i18nDict: I18nDict = dict['player'];
  i18nStrings: I18nLocalized = {};

  private readonly FALLBACK_CONTENT_LANG = 'en';
  private readonly SERVER_URL: string;

  private PREF_AUTOPLAY = true;
  private PREF_DEFAULT_QUALITY = 'max';
  private PREF_DEFAULT_CONTENT_LANG = 'en';

  private CAP_HAS_NATIVE_HLS_SUPPORT = false;
  private CAP_HAS_HLS_PLAYER_SUPPORT = false;

  posterUrl = '';

  availableLanguages: YtVideo_Format['language'][] = [];
  selectedLanguage: YtVideo_Format['language'] = 'en';

  private combinedFormats: Ekydum_SourceFormat[] = [];
  localizedFormats: Ekydum_SourceFormat[] = [];
  selectedFormat: Ekydum_SourceFormat | null = null;
  sourceManifestUrl = '';

  private hls!: Hls;
  private isFirstLoad = true;
  get player(): HTMLVideoElement { return this.videoElementRef.nativeElement; }

  // Quality selection strategy
  qssStrategyMax = true;
  qssStrategyMin = false;
  qssStrategyClosest = 720;
  qssAvoidNonHls = true;

  // Subscription state
  isSubscribed = false;
  subscriptionLoading = false;
  private subscriptionId: number | null = null;

  private readonly hlsPlayerOptions: Readonly<Partial<HlsConfig>> = {
    debug: false,
    enableWorker: true,
  };

  private readonly alive$ = new Subject<void>();
  private readonly render$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private i18nService: I18nService,
    private api: ApiService,
  ) {
    this.SERVER_URL = this.auth.getServerUrl() || 'http://localhost:3000';
  }

  ngAfterViewInit() {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => {
        this.i18nStrings = localized;
        this.render$.next();
      })
    ).subscribe();

    this.discoverRuntimeCapabilities();
    this.setupRenderer();
    if (this.preferences) {
      this.applyPreferences();
    }
    if (this.video) {
      this.posterUrl = this.video?.thumbnail || '';
      this.parseFormats();
      this.setSelectedSource(this.getDefaultSourceToPlay());
      if (this.CAP_HAS_HLS_PLAYER_SUPPORT) {
        this.initHlsPlayer();
      }
      this.loadSelectedSource();

      // Check subscription status
      if (this.video.channel_id) {
        this.checkSubscription();
      }
    }
    this.render$.next();
  }

  ngOnDestroy() {
    this.alive$.next();
    this.alive$.complete();
    if (this.hls) {
      this.hls.destroy();
    }
  }

  play() {
    this.player.play().catch((err) => {
      console.error('Playback Error:', err);
    });
  }

  pause() {
    this.player.pause();
  }

  goToChapter(ch: YtVideo_Chapter): void {
    this.player.currentTime = ch.start_time;
    this.render$.next();
  }

  changeSource(f: Ekydum_SourceFormat | null): void {
    if (f) {
      this.setSelectedSource(f);
      this.loadSelectedSource();
    }
  }

  changeLang(lang: YtVideo_Format['language']): void {
    this.selectedLanguage = lang;
    this.localizedFormats = this.getLocalizedFormats(this.combinedFormats);
    this.changeSource(this.getDefaultSourceToPlay());
  }

  // ===== CHANNEL & SUBSCRIPTION =====

  onChannelClick(): void {
    if (this.video?.channel_id) {
      this.channelClick.emit(this.video.channel_id);
    }
  }

  checkSubscription(): void {
    if (!this.video?.channel_id) return;

    var channelId = this.video.channel_id;
    this.api.checkSubscription(channelId).subscribe({
      next: (data) => {
        if (this.video?.channel_id === channelId) {
          this.isSubscribed = data?.subscribed || false;
          this.subscriptionId = data?.subscription_id || null;
          this.render$.next();
        }
      },
      error: () => {
        this.isSubscribed = false;
        this.render$.next();
      }
    });
  }

  toggleSubscription(event: Event): void {
    event.stopPropagation();
    if (!this.video?.channel_id) return;

    var channelId = this.video.channel_id;
    this.subscriptionLoading = true;
    this.render$.next();

    if (this.isSubscribed && this.subscriptionId) {
      this.api.unsubscribe(this.subscriptionId).subscribe({
        next: () => {
          if (this.video?.channel_id === channelId) {
            this.isSubscribed = false;
            this.subscriptionId = null;
          }
          this.subscriptionLoading = false;
          this.render$.next();
        },
        error: () => {
          this.subscriptionLoading = false;
          this.render$.next();
        }
      });
    } else {
      this.api.subscribe(channelId).subscribe({
        next: (data) => {
          if (this.video?.channel_id === channelId) {
            this.isSubscribed = true;
            this.subscriptionId = data?.id || null;
          }
          this.subscriptionLoading = false;
          this.render$.next();
        },
        error: () => {
          this.subscriptionLoading = false;
          this.render$.next();
        }
      });
    }
  }

  // ===== HELPER METHODS =====

  formatTime(seconds: number): string {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // trackBy functions
  trackFormat(index: number, format: Ekydum_SourceFormat): string {
    return format.format_id;
  }

  trackLang(index: number, lang: any): string {
    return lang;
  }

  trackChapter(index: number, chapter: YtVideo_Chapter): number {
    return chapter.start_time;
  }

  // ===== PRIVATE METHODS =====

  private setSelectedSource(f: Ekydum_SourceFormat | null): void {
    if (f) {
      f.ekydum_isCurrent = true;
      this.localizedFormats.forEach((lf) => {
        if (f.format_id === lf.format_id) {
          if (!lf.ekydum_isCurrent) {
            lf.ekydum_isCurrent = true;
          }
        } else if (lf.ekydum_isCurrent) {
          lf.ekydum_isCurrent = false;
        }
      });
      this.selectedFormat = f;
    }
  }

  private loadSelectedSource(): void {
    var f = this.selectedFormat;
    if (f) {
      this.sourceManifestUrl = this.getProxiedManifestUrl(f.url);
      var playerState = this.capturePlayerState();

      if (this.hls) {
        this.hls.loadSource(this.sourceManifestUrl);
        this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
          console.log('Manifest loaded');
          playerState.restore();
        });
      } else if (this.CAP_HAS_NATIVE_HLS_SUPPORT) {
        this.player.src = this.sourceManifestUrl;
        playerState.restore();
      }

      if (f.language && (!this.selectedLanguage || !f.language.startsWith(this.selectedLanguage))) {
        this.selectedLanguage = f.language;
      }

      this.render$.next();
    }
  }

  private applyPreferences(): void {
    var prefArr = this.preferences;
    if (Array.isArray(prefArr)) {
      var dqPref = prefArr.find((p) => p.key === 'DEFAULT_QUALITY');
      if (dqPref) {
        this.PREF_DEFAULT_QUALITY = dqPref.value;
        if (this.PREF_DEFAULT_QUALITY === 'max') {
          this.qssStrategyMax = true;
          this.qssStrategyMin = false;
        } else if (this.PREF_DEFAULT_QUALITY === 'min') {
          this.qssStrategyMax = false;
          this.qssStrategyMin = true;
        } else if (/^\d+p$/.test(this.PREF_DEFAULT_QUALITY + '')) {
          var closestQuality = ~~+this.PREF_DEFAULT_QUALITY.replace('p', '');
          if (closestQuality > 100 && closestQuality < 100_000) {
            this.qssStrategyMax = false;
            this.qssStrategyMin = false;
            this.qssStrategyClosest = closestQuality;
          }
        }
      }

      var langPref = prefArr.find((p) => p.key === 'LANG');
      if (langPref) {
        this.PREF_DEFAULT_CONTENT_LANG = (langPref.value + '').toLowerCase();
        this.selectedLanguage = this.PREF_DEFAULT_CONTENT_LANG;
      }

      var autoPlayPref = prefArr.find((p) => p.key === 'AUTO_PLAY');
      if (autoPlayPref) {
        this.PREF_AUTOPLAY = !!(+autoPlayPref.value);
      }
    }
  }

  private initHlsPlayer(): void {
    this.hls = new Hls(this.hlsPlayerOptions);
    this.hls.attachMedia(this.player);
    this.hls.on(Hls.Events.ERROR, (_ev, data) => this.handleHlsError(data));
  }

  private parseFormats(): void {
    var formats = this.video!.formats;
    this.availableLanguages = this.extractAvailableLanguages(formats);
    this.combinedFormats = this.sortFormatsByHeight(
      this.getCombinedFormats(formats)
    );
    this.localizedFormats = this.getLocalizedFormats(this.combinedFormats);
  }

  private getDefaultSourceToPlay(): Ekydum_SourceFormat | null {
    var formats = this.localizedFormats;
    return (
      (this.qssStrategyMax && this.qssGetMaxQuality(formats)) ||
      (this.qssStrategyMin && this.qssGetMinQuality(formats)) ||
      (this.qssStrategyClosest && this.qssGetClosestQuality(formats, this.qssStrategyClosest)) ||
      (formats[0])
    );
  }

  private extractAvailableLanguages<F extends YtVideo_Format>(formats: F[]): F['language'][] {
    return Array.from(
      new Set(
        formats.map((f) => f.language).filter((l) => !!l)
      )
    );
  }

  private getCombinedFormats(formats: YtVideo_Format[]): Ekydum_SourceFormat[] {
    return formats.filter(
      (f) => (f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
    ).map(
      (f) => {
        var p = ((f?.protocol || '') + ''),
          isHls = p.includes('m3u8'),
          l = (f.height + 'p');
        return Object.assign({}, f, <Omit<Ekydum_SourceFormat, keyof YtVideo_Format>>{
          ekydum_sourceKind: Ekydum_SourceKind.COMBINED,
          ekydum_isCurrent: false,
          ekydum_isHls: isHls,
          ekydum_label: l,
        });
      }
    ).filter(
      (f) => f.ekydum_isHls
    );
  }

  private sortFormatsByHeight<F extends YtVideo_Format>(formats: F[]): F[] {
    return formats.sort((a, b) => (b.height || 0) - (a.height || 0));
  }

  private getLocalizedFormats(formats: Ekydum_SourceFormat[]): Ekydum_SourceFormat[] {
    var currentLang = this.selectedLanguage,
      fallbackLang = this.FALLBACK_CONTENT_LANG;
    var found = formats.filter((f) => f.language === currentLang);
    if (found.length === 0 && fallbackLang !== currentLang) {
      found = formats.filter((f) => f.language === fallbackLang);
    }
    if (found.length === 0) {
      found = formats;
    }
    return found;
  }

  private getProxiedManifestUrl(url: string): string {
    return `${this.SERVER_URL}/relay/hls/manifest?url=${encodeURIComponent(url)}&token=${this.auth.getAccountToken()}`;
  }

  private capturePlayerState() {
    var player = this.player;
    return {
      currentTime: player.currentTime,
      wasPlaying: !player.paused,
      self: this,
      restore() {
        player.currentTime = this.currentTime;
        var self = this.self;
        if (self.isFirstLoad) {
          self.isFirstLoad = false;
          if (self.PREF_AUTOPLAY) {
            self.play();
          }
        } else if (this.wasPlaying) {
          self.play();
        }
      }
    };
  }

  private handleHlsError(errData: ErrorData): void {
    if (errData.fatal) {
      var t = errData.type;
      if (t === Hls.ErrorTypes.NETWORK_ERROR) {
        console.log('Network error, trying to recover...');
        this.hls.startLoad();
      } else if (t === Hls.ErrorTypes.MEDIA_ERROR) {
        console.log('Media error, trying to recover...');
        this.hls.recoverMediaError();
      } else {
        console.log('Fatal error, destroying player...');
        this.hls.destroy();
      }
      this.render$.next();
    }
  }

  private discoverRuntimeCapabilities(): void {
    this.CAP_HAS_NATIVE_HLS_SUPPORT = !!this.player.canPlayType('application/vnd.apple.mpegurl');
    this.CAP_HAS_HLS_PLAYER_SUPPORT = Hls.isSupported();
  }

  private setupRenderer(): void {
    this.render$.pipe(
      takeUntil(this.alive$),
      debounceTime(200),
      tap(() => this.cdr.detectChanges()),
    ).subscribe();
  }

  private qssGetMaxQuality(formats: Ekydum_SourceFormat[]): Ekydum_SourceFormat | null {
    var maxHeight = 0,
      maxQualityItem: Ekydum_SourceFormat | null = null,
      avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true) && f.height && (f.height > maxHeight)) {
        maxHeight = f.height;
        maxQualityItem = f;
      }
    });
    return maxQualityItem;
  }

  private qssGetMinQuality(formats: Ekydum_SourceFormat[]): Ekydum_SourceFormat | null {
    var minHeight = Number.MAX_SAFE_INTEGER,
      minQualityItem: Ekydum_SourceFormat | null = null,
      avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true) && f.height && (f.height < minHeight)) {
        minHeight = f.height;
        minQualityItem = f;
      }
    });
    return minQualityItem;
  }

  private qssGetClosestQuality(formats: Ekydum_SourceFormat[], h: number): Ekydum_SourceFormat | null {
    var minDelta = Number.MAX_SAFE_INTEGER,
      minDeltaItem: Ekydum_SourceFormat | null = null,
      avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true) && f.height) {
        var delta = Math.abs(f.height - h);
        if (delta < minDelta) {
          minDelta = delta;
          minDeltaItem = f;
        }
      }
    });
    return minDeltaItem;
  }
}
