import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import Hls, { ErrorData, HlsConfig } from 'hls.js';
import { YtDlpSourceFormat, YtDlpVideoChapter, YtDlpVideoInfo } from '../../../models/yt-dlp-video-info.interface';
import { UserPreference } from '../../../models/user-preference.model';
import { Ekydum_SourceFormat, Ekydum_SourceKind } from './models';
import { Subject, takeUntil, tap, throttleTime } from 'rxjs';
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
  @Input() video!: YtDlpVideoInfo;
  @Input() preferences!: UserPreference[];
  @Input() showCustomControls = true;
  @ViewChild('videoEl', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

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

  availableLanguages: YtDlpSourceFormat['language'][] = [];
  selectedLanguage: YtDlpSourceFormat['language'] = 'en';

  private combinedFormats: Ekydum_SourceFormat[] = [];
  localizedFormats: Ekydum_SourceFormat[] = [];
  selectedFormat: Ekydum_SourceFormat | null = null;
  sourceManifestUrl = '';

  private hls!: Hls;
  private isFirstLoad = true;
  private get player(): HTMLVideoElement { return this.videoElementRef.nativeElement; }

  // quality selection strategy
  qssStrategyMax = true;
  qssStrategyMin = false;
  qssStrategyClosest = 720;
  qssAvoidNonHls = true;

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

  goToChapter(ch: YtDlpVideoChapter): void {
    this.player.currentTime = ch.start_time;
    this.render$.next();
  }

  changeSource(f: Ekydum_SourceFormat|null): void {
    if (f) {
      this.setSelectedSource(f);
      this.loadSelectedSource();
    }
  }

  changeLang(lang: YtDlpSourceFormat['language']): void {
    this.selectedLanguage = lang;
    this.localizedFormats = this.getLocalizedFormats(this.combinedFormats);
    this.changeSource(this.getDefaultSourceToPlay());
  }

  private setSelectedSource(f: Ekydum_SourceFormat|null): void {
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

      if (f.language && ( !this.selectedLanguage || !f.language.startsWith(this.selectedLanguage))) {
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

  private getDefaultSourceToPlay(): Ekydum_SourceFormat|null {
    var formats = this.localizedFormats;
    return (
      (this.qssStrategyMax && this.qssGetMaxQuality(formats)) ||
      (this.qssStrategyMin && this.qssGetMinQuality(formats)) ||
      (this.qssStrategyClosest && this.qssGetClosestQuality(formats, this.qssStrategyClosest)) ||
      (formats[0])
    );
  }

  private extractAvailableLanguages<F extends YtDlpSourceFormat>(formats: F[]): F['language'][] {
    return Array.from(
      new Set(
        formats.map((f) => f.language).filter((l) => !!l)
      )
    );
  }

  private getCombinedFormats(formats:YtDlpSourceFormat[] ): Ekydum_SourceFormat[] {
    return formats.filter(
      (f) => (f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
    ).map(
      (f) => {
        var p = ((f?.protocol || '') + ''),
            isHls = p.includes('m3u8'),
            l = (f.height + 'p' + (isHls ? ' HLS' : (' ' + p.toUpperCase())));
        return Object.assign({}, f, <Omit<Ekydum_SourceFormat, keyof YtDlpSourceFormat>>{
          ekydum_sourceKind: Ekydum_SourceKind.COMBINED,
          ekydum_isCurrent: false,
          ekydum_isHls: isHls,
          ekydum_label: l,
        });
      }
    );
  }

  private sortFormatsByHeight<F extends YtDlpSourceFormat>(formats: F[] ): F[] {
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
    return `${this.SERVER_URL}/hls/m3u8?url=${encodeURIComponent(url)}&token=${this.auth.getAccountToken()}`;
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
    this.CAP_HAS_NATIVE_HLS_SUPPORT = !!this.player.canPlayType('application/vnd.apple.mpegurl'); // "" | "maybe" | "probably"
    this.CAP_HAS_HLS_PLAYER_SUPPORT = Hls.isSupported();
  }

  private setupRenderer(): void {
    this.render$.pipe(
      takeUntil(this.alive$),
      throttleTime(100),
      tap(() => this.cdr.detectChanges()),
    ).subscribe();
  }

  private qssGetMaxQuality(formats: Ekydum_SourceFormat[]): Ekydum_SourceFormat|null {
    var maxHeight = 0,
        maxQualityItem: Ekydum_SourceFormat|null = null,
        avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true) && f.height && (f.height > maxHeight)) {
        maxHeight = f.height;
        maxQualityItem = f;
      }
    });
    return maxQualityItem;
  }

  private qssGetMinQuality(formats: Ekydum_SourceFormat[]): Ekydum_SourceFormat|null {
    var minHeight = Number.MAX_SAFE_INTEGER,
      minQualityItem: Ekydum_SourceFormat|null = null,
      avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true) && f.height && (f.height < minHeight)) {
        minHeight = f.height;
        minQualityItem = f;
      }
    });
    return minQualityItem;
  }

  private qssGetClosestQuality(formats: Ekydum_SourceFormat[], h: number): Ekydum_SourceFormat|null {
    var minDelta = Number.MAX_SAFE_INTEGER,
      minDeltaItem: Ekydum_SourceFormat|null = null,
      avoidNonHls = this.qssAvoidNonHls;
    formats.forEach((f) => {
      if ((avoidNonHls ? f.ekydum_isHls : true)  && f.height) {
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
