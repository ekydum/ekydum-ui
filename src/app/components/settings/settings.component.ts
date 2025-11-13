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
          <h2 class="mb-4" style="margin-left: 48px;">
              <i class="fas fa-cog me-2"></i>
              Settings
          </h2>

          <div class="card mb-4">
              <div class="card-header">
                  <h5 class="mb-0">Server Configuration</h5>
              </div>
              <div class="card-body">
                  <div class="mb-3">
                      <label class="form-label">Server URL</label>
                      <input
                              type="text"
                              class="form-control"
                              [(ngModel)]="serverUrl"
                              placeholder="http://localhost:3000">
                      <small class="form-text text-muted">Ekydum server URL</small>
                  </div>

                  <div class="mb-3">
                      <label class="form-label">Account Token</label>
                      <input
                              type="password"
                              class="form-control"
                              [(ngModel)]="accountToken"
                              placeholder="Enter your account token">
                      <small class="form-text text-muted">Token from server admin</small>
                  </div>

                  <div class="d-flex gap-2">
                      <button class="btn btn-primary" (click)="saveConnection()" [disabled]="saving">
                          <i class="fas fa-save me-2"></i>
                          {{ saving ? 'Saving...' : 'Save & Connect' }}
                      </button>
                      <button
                              class="btn btn-danger"
                              (click)="disconnect()"
                              [disabled]="!isConnected">
                          <i class="fas fa-sign-out-alt me-2"></i>
                          Disconnect
                      </button>
                  </div>

                  <div class="alert alert-success mt-3" *ngIf="accountInfo">
                      <i class="fas fa-check-circle me-2"></i>
                      Connected as: <strong>{{ accountInfo.name }}</strong>
                  </div>
              </div>
          </div>

          <div class="card" *ngIf="isConnected">
              <div class="card-header">
                  <h5 class="mb-0">User Preferences</h5>
              </div>
              <div class="card-body">
                  <div *ngIf="loadingSettings" class="text-center py-3">
                      <div class="spinner-border text-primary" role="status"></div>
                  </div>

                  <div *ngIf="!loadingSettings">
                      <div class="mb-3">
                          <label class="form-label">Default Quality</label>
                          <select class="form-select" [(ngModel)]="defaultQuality" (change)="updateQuality()">
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
                          <label class="form-label">Page Size</label>
                          <select class="form-select" [(ngModel)]="pageSize" (change)="updatePageSize()">
                              <option [value]="10">10</option>
                              <option [value]="20">20</option>
                              <option [value]="30">30</option>
                              <option [value]="50">50</option>
                              <option [value]="100">100</option>
                              <option [value]="200">200</option>
                              <option [value]="300">300</option>
                              <option [value]="500">500</option>
                          </select>
                          <small class="form-text text-muted">Number of videos per page</small>
                      </div>

                    <div class="mb-3">
                      <label class="form-label">Content Language</label>
                      <input type="text" maxlength="2" minlength="2" class="form-control" [(ngModel)]="lang" (change)="updateLang()"/>
                      <small class="form-text text-muted">Language code, for eg. "en", "de"</small>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Play video automatically</label>
                      <select class="form-select" [(ngModel)]="autoPlay" (change)="updateAutoPlay()">
                        <option [value]="1">Yes</option>
                        <option [value]="0">No</option>
                      </select>
                    </div>
                  </div>
              </div>
          </div>
      </div>
  `
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
