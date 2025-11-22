import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: false,
  template: `
    <div class="container">
      <h2 class="mb-4 page-title text-no-select" style="margin-left: 48px;">
        <i class="fas fa-cog me-2"></i>
        Settings
      </h2>

      <div class="card settings-card mb-4">
        <div class="card-header">
          <h5 class="mb-0 text-no-select">Server Configuration</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label text-no-select">Server URL</label>
            <input
              type="text"
              class="form-control settings-input"
              [(ngModel)]="serverUrl"
              placeholder="http://localhost:3000">
            <small class="form-text text-muted-custom text-no-select">Ekydum server URL</small>
          </div>

          <div class="mb-3">
            <label class="form-label text-no-select">Account Token</label>
            <input
              type="password"
              class="form-control settings-input"
              [(ngModel)]="accountToken"
              placeholder="Enter your account token">
            <small class="form-text text-muted-custom text-no-select">Token from server admin</small>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-blue-glass" (click)="saveConnection()" [disabled]="saving">
              <i class="fas fa-save me-2"></i>
              {{ saving ? 'Saving...' : 'Save & Connect' }}
            </button>
            <button
              class="btn btn-red-glass"
              (click)="disconnect()"
              [disabled]="!isConnected">
              <i class="fas fa-sign-out-alt me-2"></i>
              Disconnect
            </button>
          </div>

          <div class="alert-custom alert-success-custom mt-3" *ngIf="accountInfo">
            <i class="fas fa-check-circle me-2"></i>
            Connected as: <strong>{{ accountInfo.name }}</strong>
          </div>
        </div>
      </div>

      <div class="card settings-card" *ngIf="isConnected">
        <div class="card-header">
          <h5 class="mb-0 text-no-select">User Preferences</h5>
        </div>
        <div class="card-body">
          <div *ngIf="loadingSettings" class="text-center py-3">
            <div class="spinner-border spinner-custom" role="status"></div>
          </div>

          <div *ngIf="!loadingSettings">
            <div class="mb-3">
              <label class="form-label text-no-select">Default Quality</label>
              <select class="form-select settings-select" [(ngModel)]="defaultQuality" (change)="updateQuality()">
                <option value="min">Minimum</option>
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p (Recommended)</option>
                <option value="1080p">1080p</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">Page Size</label>
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
              <small class="form-text text-muted-custom text-no-select">Number of videos per page</small>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">Content Language</label>
              <input type="text" maxlength="2" minlength="2" class="form-control settings-input" [(ngModel)]="lang" (change)="updateLang()"/>
              <small class="form-text text-muted-custom text-no-select">Language code, for eg. "en", "de"</small>
            </div>

            <div class="mb-3">
              <label class="form-label text-no-select">Play video automatically</label>
              <select class="form-select settings-select" [(ngModel)]="autoPlay" (change)="updateAutoPlay()">
                <option [value]="1">Yes</option>
                <option [value]="0">No</option>
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

    /* Settings Card */
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

    /* Form Controls */
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

    /* Buttons */
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

    /* Spinner */
    .spinner-custom {
      color: rgba(13, 110, 253, 0.8);
    }

    /* Alerts */
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
  `]
})
export class SettingsComponent implements OnInit {
  serverUrl = 'http://localhost:3000';
  accountToken = '';
  isConnected = false;
  saving = false;
  accountInfo: any = null;

  loadingSettings = false;
  defaultQuality = '720p';
  pageSize = 40;
  lang = 'en';
  autoPlay = 1;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
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

  saveConnection(): void {
    if (!this.serverUrl || !this.accountToken) {
      this.toast.error('Please fill in all fields');
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
        this.toast.success('Connected successfully');
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
    this.toast.info('Disconnected');
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
        var lang = data.find((s: any) => s.key === 'LANG');
        var autoPlay = data.find((s: any) => s.key === 'AUTO_PLAY');

        if (qualitySetting) {
          this.defaultQuality = qualitySetting.value;
        }
        if (pageSizeSetting) {
          this.pageSize = parseInt(pageSizeSetting.value);
        }
        if (lang) {
          this.lang = lang.value;
        }
        if (autoPlay) {
          this.autoPlay = +autoPlay.value || 0;
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
        this.toast.success('Quality updated');
      }
    });
  }

  updatePageSize(): void {
    this.api.updateSetting('PAGE_SIZE', this.pageSize).subscribe({
      next: () => {
        this.toast.success('Page size updated');
      }
    });
  }

  updateLang(): void {
    if (this.lang && this.lang.length === 2) {
      this.api.updateSetting('LANG', this.lang).subscribe({
        next: () => {
          this.toast.success('Language updated');
        }
      });
    }
  }

  updateAutoPlay(): void {
    this.api.updateSetting('AUTO_PLAY', this.autoPlay).subscribe({
      next: () => {
        this.toast.success('Auto-play updated');
      }
    });
  }
}
