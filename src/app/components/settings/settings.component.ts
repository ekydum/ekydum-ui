import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { map, Subject, takeUntil, tap } from 'rxjs';
import { I18nService } from '../../i18n/services/i18n.service';
import { LANG_CODE } from '../../i18n/models/lang-code.enum';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../i18n/models/dict.models';
import { dict } from '../../i18n/dict/main.dict';

@Component({
  selector: 'app-settings',
  standalone: false,
  template: `
    <div class="container">
      <h2 class="mb-4 page-title text-no-select" style="margin-left: 48px;">
        <i class="fas fa-cog me-2"></i>
        {{ i18nStrings['pageTitle'] }}
      </h2>

      <div class="card settings-card mb-4">
        <div class="card-header">
          <h5 class="mb-0 text-no-select">{{ i18nStrings['serverConfig'] }}</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label text-no-select">{{ i18nStrings['serverUrl'] }}</label>
            <input
              type="text"
              class="form-control settings-input"
              [(ngModel)]="serverUrl"
              placeholder="http://localhost:3000">
            <small class="form-text text-muted-custom text-no-select">{{ i18nStrings['serverUrlHint'] }}</small>
          </div>

          <div class="mb-3">
            <label class="form-label text-no-select">{{ i18nStrings['accountToken'] }}</label>
            <input
              type="password"
              class="form-control settings-input"
              [(ngModel)]="accountToken"
              [placeholder]="i18nStrings['accountTokenPlaceholder']">
            <small class="form-text text-muted-custom text-no-select">{{ i18nStrings['accountTokenHint'] }}</small>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-blue-glass" (click)="saveConnection()" [disabled]="saving">
              <i class="fas fa-save me-2"></i>
              {{ saving ? i18nStrings['btnSaving'] : i18nStrings['btnSaveConnect'] }}
            </button>
            <button
              class="btn btn-red-glass"
              (click)="disconnect()"
              [disabled]="!isConnected">
              <i class="fas fa-sign-out-alt me-2"></i>
              {{ i18nStrings['btnDisconnect'] }}
            </button>
          </div>

          <div class="alert-custom alert-success-custom mt-3" *ngIf="accountInfo">
            <i class="fas fa-check-circle me-2"></i>
            {{ i18nStrings['connectedAs'] }} <strong>{{ accountInfo.name }}</strong>
          </div>

          <!-- Quick Connect link -->
          <div class="text-center mt-3" *ngIf="hasQuickConnect">
            <a class="link-glass" routerLink="/quick-connect">
              <i class="fas fa-rocket me-1"></i>
              Quick Connect
            </a>
          </div>
        </div>
      </div>

      <div class="card settings-card" *ngIf="isConnected">
        <div class="card-header">
          <h5 class="mb-0 text-no-select">{{ i18nStrings['userPreferences'] }}</h5>
        </div>
        <div class="card-body">
          <div *ngIf="loadingSettings" class="text-center py-3">
            <div class="spinner-border spinner-custom" role="status"></div>
          </div>

          <div *ngIf="!loadingSettings">
            <div class="mb-3">
              <label class="form-label text-no-select">{{ i18nStrings['defaultQuality'] }}</label>
              <select class="form-select settings-select" [(ngModel)]="defaultQuality" (change)="updateQuality()">
                <option value="min">{{ i18nStrings['qualityMinimum'] }}</option>
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">{{ i18nStrings['qualityRecommended'] }}</option>
                <option value="1080p">1080p</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
                <option value="max">{{ i18nStrings['qualityMaximum'] }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">{{ i18nStrings['pageSize'] }}</label>
              <select class="form-select settings-select" [(ngModel)]="pageSize" (change)="updatePageSize()">
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="30">30</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
                <option [value]="200">200</option>
                <option [value]="300">300</option>
                <option [value]="500">500</option>
              </select>
              <small class="form-text text-muted-custom text-no-select">{{ i18nStrings['pageSizeHint'] }}</small>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">Relay: Proxy Thumbnails</label>
              <select class="form-select settings-select" [(ngModel)]="relayProxyThumbnails"
                      (change)="updateRelayProxyThumbnails()">
                <option [value]="1">Yes</option>
                <option [value]="0">No</option>
              </select>
              <small class="form-text text-muted-custom text-no-select">Enable if you experience any issues loading
                channels/videos thumbnails</small>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">Sprache | Language | Idioma | Langue | Bahasa | Lingua | 言語 |
                언어 | Taal | Język | Idioma | Язык | Dil | Мова | Ngôn ngữ | 语言</label>
              <select class="form-select settings-select" [(ngModel)]="lang" (change)="updateLang()">
                <option [value]="LANG_CODE.de">Deutsch (DE)</option>
                <option [value]="LANG_CODE.en">English (EN)</option>
                <option [value]="LANG_CODE.es">Español (ES)</option>
                <option [value]="LANG_CODE.fr">Français (FR)</option>
                <option [value]="LANG_CODE.id">Indonesia (ID)</option>
                <option [value]="LANG_CODE.it">Italiano (IT)</option>
                <option [value]="LANG_CODE.ja">日本語 (JA)</option>
                <option [value]="LANG_CODE.ko">한국어 (KO)</option>
                <option [value]="LANG_CODE.nl">Nederlands (NL)</option>
                <option [value]="LANG_CODE.pl">Polski (PL)</option>
                <option [value]="LANG_CODE.pt">Português (PT)</option>
                <option [value]="LANG_CODE.ru">Русский (RU)</option>
                <option [value]="LANG_CODE.tr">Türkçe (TR)</option>
                <option [value]="LANG_CODE.ua">Українська (UA)</option>
                <option [value]="LANG_CODE.vi">Tiếng Việt (VI)</option>
                <option [value]="LANG_CODE.zh">中文 (ZH)</option>
              </select>
            </div>

          </div>
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

    .settings-card {
      background: rgba(26, 26, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      overflow: hidden;
    }

    .settings-card .card-header {
      background: rgba(13, 110, 253, 0.1);
      border-bottom: 1px solid rgba(13, 110, 253, 0.2);
      padding: 16px 20px;
    }

    .settings-card .card-header h5 {
      color: white;
      font-weight: 600;
    }

    .settings-card .card-body {
      background: transparent;
      padding: 20px;
    }

    .form-label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      margin-bottom: 8px;
    }

    .settings-input,
    .settings-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 10px 14px;
      transition: all 0.2s ease;
    }

    .settings-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .settings-input:focus,
    .settings-select:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      outline: 0;
    }

    .settings-select option {
      background: #1a1a1a;
      color: white;
    }

    .text-muted-custom {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
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

    .btn-red-glass:hover:not(:disabled) {
      background: rgba(198, 17, 32, 0.25);
      border-color: rgba(198, 17, 32, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(198, 17, 32, 0.4);
    }

    .btn-red-glass:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    }

    .alert-success-custom {
      color: rgba(25, 135, 84, 1);
      border-color: rgba(25, 135, 84, 0.3);
      background: rgba(25, 135, 84, 0.1);
    }

    .link-glass {
      color: rgba(13, 110, 253, 0.9);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .link-glass:hover {
      color: rgba(13, 110, 253, 1);
      text-decoration: underline;
    }
  `]
})
export class SettingsComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['settings'];
  i18nStrings: I18nLocalized = {};

  readonly LANG_CODE = LANG_CODE;

  serverUrl = 'http://localhost:3000';
  accountToken = '';
  isConnected = false;
  saving = false;
  accountInfo: any = null;
  hasQuickConnect = false;

  loadingSettings = false;
  defaultQuality = '720p';
  pageSize = 40;
  lang: LANG_CODE = LANG_CODE.en;
  relayProxyThumbnails = 0;

  private alive$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private i18nService: I18nService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

    // Check if Quick Connect is available
    await this.checkQuickConnect();

    var savedUrl = this.auth.getServerUrl();
    var savedToken = this.auth.getAccountToken();

    if (savedUrl) {
      this.serverUrl = savedUrl;
    }

    if (savedToken) {
      this.accountToken = savedToken;
      this.isConnected = true;
      this.loadAccountInfo();
      this.loadSettings();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  async checkQuickConnect(): Promise<void> {
    try {
      const response = await fetch('/config/servers.json');
      const data = await response.json();
      this.hasQuickConnect = !!(data.servers && data.servers.length > 0);
    } catch {
      this.hasQuickConnect = false;
    }
  }

  saveConnection(): void {
    if (!this.serverUrl || !this.accountToken) {
      this.toast.error(this.i18nStrings['toastFillFields'] || 'Please fill in all fields');
      return;
    }

    this.saving = true;
    this.auth.setServerUrl(this.serverUrl);
    this.auth.setAccountToken(this.accountToken);

    this.api.getMe().subscribe({
      next: (data) => {
        this.accountInfo = data;
        this.isConnected = true;
        this.saving = false;
        this.toast.success(this.i18nStrings['toastConnectedSuccess'] || 'Connected successfully');
        this.loadSettings();
      },
      error: () => {
        this.saving = false;
        this.isConnected = false;
      }
    });
  }

  disconnect(): void {
    this.auth.clearAccountToken();
    this.accountToken = '';
    this.isConnected = false;
    this.accountInfo = null;
    this.toast.info(this.i18nStrings['toastDisconnected'] || 'Disconnected');
  }

  loadAccountInfo(): void {
    this.api.getMe().subscribe({
      next: (data) => {
        this.accountInfo = data;
      }
    });
  }

  loadSettings(): void {
    this.loadingSettings = true;
    this.api.getSettings().pipe(
      map((r) => r.settings)
    ).subscribe({
      next: (data) => {
        var qualitySetting = data.find((s: any) => s.key === 'DEFAULT_QUALITY');
        var pageSizeSetting = data.find((s: any) => s.key === 'PAGE_SIZE');
        var langSetting = data.find((s: any) => s.key === 'LANG');
        var relayProxyThumbnailsSetting = data.find((s: any) => s.key === 'RELAY_PROXY_THUMBNAILS');

        if (qualitySetting) {
          this.defaultQuality = qualitySetting.value;
        }
        if (pageSizeSetting) {
          this.pageSize = parseInt(pageSizeSetting.value);
        }
        if (langSetting) {
          var langValue = (langSetting.value + '').toLowerCase();
          if (Object.values(LANG_CODE).includes(langValue as LANG_CODE)) {
            this.lang = langValue as LANG_CODE;
          } else {
            this.lang = LANG_CODE.en;
          }
        }
        if (relayProxyThumbnailsSetting) {
          this.relayProxyThumbnails = +relayProxyThumbnailsSetting.value || 0;
        }

        this.loadingSettings = false;
      },
      error: () => {
        this.loadingSettings = false;
      }
    });
  }

  updateQuality(): void {
    this.api.updateSetting('DEFAULT_QUALITY', this.defaultQuality).subscribe({
      next: () => {
        this.toast.success(this.i18nStrings['toastQualityUpdated'] || 'Quality updated');
      }
    });
  }

  updatePageSize(): void {
    this.api.updateSetting('PAGE_SIZE', this.pageSize).subscribe({
      next: () => {
        this.toast.success(this.i18nStrings['toastPageSizeUpdated'] || 'Page size updated');
      }
    });
  }

  updateLang(): void {
    if (this.lang) {
      this.i18nService.setLang(this.lang);
      setTimeout(() => {
        this.api.updateSetting('LANG', this.lang).subscribe({
          next: () => {
            this.toast.success(this.i18nStrings['toastLanguageUpdated'] || 'Language updated');
          }
        });
      }, 500);
    }
  }

  updateRelayProxyThumbnails(): void {
    setTimeout(() => {
      this.api.updateSetting('RELAY_PROXY_THUMBNAILS', this.relayProxyThumbnails).subscribe({
        next: () => {
          this.toast.success(this.i18nStrings['toastRelaySettingsUpdated'] || 'Relay settings updated');
        }
      });
    }, 500);
  }
}
