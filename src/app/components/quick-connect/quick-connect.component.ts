import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { I18nService } from '../../i18n/services/i18n.service';
import { LANG_CODE } from '../../i18n/models/lang-code.enum';
import { interval, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../i18n/models/dict.models';
import { dict } from '../../i18n/dict/main.dict';

// Fun animal names for generating random account names (like Google Docs)
const ANIMAL_NAMES = [
  'tiger', 'lion', 'dolphin', 'eagle', 'wolf', 'fox', 'bear', 'shark',
  'falcon', 'hawk', 'owl', 'panther', 'jaguar', 'cheetah', 'leopard',
  'raven', 'phoenix', 'dragon', 'griffin', 'unicorn', 'pegasus',
  'cobra', 'python', 'viper', 'mamba', 'anaconda',
  'octopus', 'whale', 'orca', 'seal', 'penguin', 'panda',
  'koala', 'kangaroo', 'gazelle', 'zebra', 'giraffe', 'rhino',
  'elephant', 'buffalo', 'bison', 'moose', 'elk', 'deer',
  'rabbit', 'hare', 'squirrel', 'beaver', 'otter', 'badger'
];

const ADJECTIVES = [
  'swift', 'brave', 'wild', 'wise', 'noble', 'fierce', 'silent', 'agile',
  'mighty', 'clever', 'bold', 'quick', 'strong', 'gentle',
  'curious', 'playful', 'fearless', 'cunning', 'loyal', 'proud',
  'majestic', 'elegant', 'graceful', 'powerful', 'stealthy', 'mysterious',
  'brilliant', 'daring', 'valiant', 'witty', 'charming', 'spirited'
];

@Component({
  selector: 'app-quick-connect',
  standalone: false,
  template: `
    <div class="quick-connect-container">
      <div class="quick-connect-card">
        <div class="card-header">
          <div class="logo-section">
            <i class="fas fa-rocket me-2"></i>
            <h2 class="mb-0">{{ i18nStrings['pageTitle'] }}</h2>
          </div>
          <p class="subtitle">{{ i18nStrings['subtitle'] }}</p>

          <!-- Language selector -->
          <div class="language-selector mt-3">
            <select class="form-select lang-select" [(ngModel)]="lang" (change)="updateLang()">
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
            <!-- All languages label (static, multilingual) -->
            <div class="lang-label mt-2">
              Sprache | Language | Idioma | Langue | Bahasa | Lingua | 言語 | 언어 | Taal | Język | Idioma | Язык | Dil | Мова | Ngôn ngữ | 语言
            </div>
          </div>
        </div>

        <div class="card-body">
          <!-- Waiting for approval state -->
          <div *ngIf="waitingForApproval" class="waiting-section">
            <div class="waiting-animation">
              <i class="fas fa-hourglass-half fa-3x mb-3"></i>
            </div>
            <h4 class="text-center mb-3">{{ i18nStrings['waitingTitle'] }}</h4>
            <p class="text-center text-muted-custom mb-4" [innerHTML]="i18nStrings['waitingMessage']"></p>

            <div class="account-info-box">
              <div class="info-row">
                <span class="info-label">{{ i18nStrings['labelServer'] }}</span>
                <span class="info-value">{{ selectedServer }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ i18nStrings['labelAccountName'] }}:</span>
                <span class="info-value">{{ accountName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ i18nStrings['labelStatus'] }}</span>
                <span class="status-badge status-inactive">
                  <i class="fas fa-clock me-1"></i>
                  {{ i18nStrings['statusPending'] }}
                </span>
              </div>
            </div>

            <div class="d-flex gap-2 justify-content-center mt-4">
              <button class="btn btn-glass" (click)="checkStatusNow()">
                <i class="fas fa-sync me-2"></i>
                {{ i18nStrings['btnCheckNow'] }}
              </button>
              <button class="btn btn-red-glass" (click)="cancelWaiting()">
                <i class="fas fa-times me-2"></i>
                {{ i18nStrings['btnCancel'] }}
              </button>
            </div>

            <div class="polling-indicator mt-3 text-center">
              <small class="text-muted-custom">
                <i class="fas fa-circle-notch fa-spin me-1"></i>
                {{ i18nStrings['autoChecking'] }}
              </small>
            </div>
          </div>

          <!-- Connection form -->
          <div *ngIf="!waitingForApproval">
            <!-- Tabs -->
            <ul class="nav nav-tabs-glass mb-4">
              <li class="nav-item">
                <a class="nav-link" [class.active]="activeTab === 'new'" (click)="activeTab = 'new'">
                  <i class="fas fa-plus-circle me-2"></i>
                  {{ i18nStrings['tabNewAccount'] }}
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" [class.active]="activeTab === 'existing'" (click)="activeTab = 'existing'">
                  <i class="fas fa-sign-in-alt me-2"></i>
                  {{ i18nStrings['tabExistingAccount'] }}
                </a>
              </li>
            </ul>

            <!-- Server selection (common for both tabs) -->
            <div class="mb-4">
              <label class="form-label">
                <i class="fas fa-server me-2"></i>
                {{ i18nStrings['labelServerUrl'] }}
              </label>

              <!-- Server Select Dropdown -->
              <div *ngIf="servers.length > 0" class="server-select-wrapper mb-2">
                <select
                  class="form-select server-select"
                  [(ngModel)]="selectedServer"
                  [disabled]="connecting"
                  (change)="onServerSelectChange()">
                  <option value="">{{ i18nStrings['selectFromList'] }}</option>
                  <option *ngFor="let server of servers" [value]="server">
                    {{ server }}
                  </option>
                </select>
                <i class="fas fa-chevron-down select-icon"></i>
              </div>

              <!-- Server Text Input -->
              <input
                type="text"
                class="form-control quick-input"
                [(ngModel)]="selectedServer"
                placeholder="http://localhost:3000"
                [disabled]="connecting">
              <small class="form-text text-muted-custom">
                {{ i18nStrings['serverUrlHint'] }}
              </small>
            </div>

            <!-- Tab: New Account -->
            <div *ngIf="activeTab === 'new'">
              <div class="mb-4">
                <label class="form-label">
                  <i class="fas fa-user me-2"></i>
                  {{ i18nStrings['labelAccountName'] }}
                </label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control quick-input"
                    [(ngModel)]="accountName"
                    [placeholder]="i18nStrings['placeholderAccountName']"
                    [disabled]="connecting"
                    (keyup.enter)="connectNewAccount()"
                    pattern="[a-z0-9]+"
                    maxlength="32">
                  <button
                    class="btn btn-glass-outline"
                    (click)="generateRandomName()"
                    [disabled]="connecting"
                    type="button"
                    [title]="i18nStrings['titleGenerateRandom']">
                    <i class="fas fa-dice"></i>
                  </button>
                </div>
                <small class="form-text text-muted-custom">
                  {{ getAccountNameHint() }}
                </small>
              </div>

              <button
                class="btn btn-primary-glass btn-lg w-100 mb-3"
                (click)="connectNewAccount()"
                [disabled]="!canConnect() || connecting">
                <i class="fas fa-plug me-2"></i>
                {{ connecting ? i18nStrings['btnConnecting'] : i18nStrings['btnConnect'] }}
              </button>
            </div>

            <!-- Tab: Existing Account -->
            <div *ngIf="activeTab === 'existing'">
              <div class="mb-4">
                <label class="form-label">
                  <i class="fas fa-user me-2"></i>
                  {{ i18nStrings['labelAccountName'] }}
                </label>
                <input
                  type="text"
                  class="form-control quick-input"
                  [(ngModel)]="accountName"
                  [placeholder]="i18nStrings['placeholderAccountName']"
                  [disabled]="connecting"
                  (keyup.enter)="requestLogin()">
                <small class="form-text text-muted-custom">
                  {{ getAccountNameHint() }}
                </small>
              </div>

              <button
                class="btn btn-primary-glass btn-lg w-100 mb-3"
                (click)="requestLogin()"
                [disabled]="!canConnect() || connecting">
                <i class="fas fa-sign-in-alt me-2"></i>
                {{ connecting ? i18nStrings['btnRequesting'] : i18nStrings['btnRequestLogin'] }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-connect-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

    .quick-connect-card {
      max-width: 500px;
      width: 100%;
      background: rgba(26, 26, 26, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      overflow: hidden;
    }

    .card-header {
      padding: 32px;
      text-align: center;
      background: rgba(13, 110, 253, 0.05);
      border-bottom: 1px solid rgba(13, 110, 253, 0.1);
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .logo-section i {
      font-size: 32px;
      color: #4299e1;
    }

    .logo-section h2 {
      color: white;
      font-weight: 700;
      font-size: 28px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0;
      font-size: 14px;
    }

    .language-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    .lang-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      border-radius: 8px;
      padding: 8px 12px;
      max-width: 250px;
      backdrop-filter: blur(10px);
    }

    .lang-select:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
    }

    .lang-select option {
      background: #1a1a1a;
      color: white;
    }

    .lang-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;
      max-width: 100%;
      word-wrap: break-word;
      line-height: 1.4;
    }

    .card-body {
      padding: 32px;
    }

    .nav-tabs-glass {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
      display: flex;
      gap: 0;
    }

    .nav-tabs-glass .nav-item {
      flex: 1;
    }

    .nav-tabs-glass .nav-link {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: rgba(255, 255, 255, 0.6);
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-tabs-glass .nav-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-tabs-glass .nav-link.active {
      color: #4299e1;
      border-bottom-color: #4299e1;
      background: rgba(13, 110, 253, 0.1);
    }

    .form-label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      margin-bottom: 8px;
      display: block;
    }

    .quick-input, .server-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 12px 16px;
      transition: all 0.2s ease;
    }

    .quick-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .quick-input:focus, .server-select:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      outline: 0;
    }

    .quick-input:disabled, .server-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .server-select-wrapper {
      position: relative;
    }

    .select-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.5);
      pointer-events: none;
    }

    .server-select {
      appearance: none;
      padding-right: 40px;
      width: 100%;
    }

    .server-select option {
      background: #1a1a1a;
      color: white;
    }

    .input-group {
      display: flex;
      gap: 8px;
    }

    .input-group .quick-input {
      flex: 1;
    }

    .btn-glass-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 12px 16px;
      transition: all 0.2s ease;
    }

    .btn-glass-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
    }

    .btn-glass-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .text-muted-custom {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    .btn-primary-glass {
      background: rgba(13, 110, 253, 0.2);
      border: 1px solid rgba(13, 110, 253, 0.4);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 14px 24px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-primary-glass:hover:not(:disabled) {
      background: rgba(13, 110, 253, 0.3);
      border-color: rgba(13, 110, 253, 0.6);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(13, 110, 253, 0.4);
    }

    .btn-primary-glass:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .waiting-section {
      text-align: center;
    }

    .waiting-animation {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .waiting-animation i {
      color: #4299e1;
      animation: hourglass-rotate 2s infinite;
    }

    @keyframes hourglass-rotate {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
    }

    .waiting-section h4 {
      color: white;
      font-weight: 600;
    }

    .account-info-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }

    .info-value {
      color: white;
      font-weight: 500;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
    }

    .status-inactive {
      background: rgba(255, 193, 7, 0.15);
      color: #ffc107;
      border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .btn-glass {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
    }

    .btn-red-glass {
      background: rgba(198, 17, 32, 0.15);
      border: 1px solid rgba(198, 17, 32, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-red-glass:hover {
      background: rgba(198, 17, 32, 0.25);
      border-color: rgba(198, 17, 32, 0.5);
      color: white;
      transform: translateY(-2px);
    }

    .polling-indicator {
      color: rgba(255, 255, 255, 0.5);
    }

    .polling-indicator i {
      color: #4299e1;
    }
  `]
})
export class QuickConnectComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['quickConnect'];
  i18nStrings: I18nLocalized = {};

  readonly LANG_CODE = LANG_CODE;

  activeTab: 'new' | 'existing' = 'new';
  selectedServer = '';
  accountName = '';
  connecting = false;
  waitingForApproval = false;
  exampleName = '';
  lang: LANG_CODE = LANG_CODE.en;

  servers: string[] = [];
  loginRequestId?: string;

  private statusCheckSubscription?: Subscription;
  private alive$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.alive$),
      tap((localized) => {
        this.lang = this.i18nService.lang;
        this.i18nStrings = localized;
      })
    ).subscribe();

    // Get current language
    this.lang = this.i18nService.lang;

    this.exampleName = this.generateName();
    this.accountName = this.generateName();
    this.loadServers();

    // Check if user is already waiting for approval
    if (this.auth.isWaitingForApproval()) {
      const savedServer = this.auth.getServerUrl();
      const savedToken = this.auth.getAccountToken();

      if (savedServer && savedToken) {
        this.selectedServer = savedServer;
        this.waitingForApproval = true;

        // Try to get account info to retrieve account name
        this.api.getMe().subscribe({
          next: (data) => {
            this.accountName = data.name || '';
            this.startStatusPolling();
          },
          error: () => {
            this.accountName = '';
            this.startStatusPolling();
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.stopStatusPolling();
    this.alive$.next();
    this.alive$.complete();
  }

  async loadServers(): Promise<void> {
    try {
      const response = await fetch('/config/servers.json');
      const data = await response.json();
      this.servers = data.servers || [];

      // Select default server if not already set
      if (!this.selectedServer) {
        this.selectedServer = this.selectDefaultServer();
      }
    } catch (error) {
      console.log('No servers config found');
      this.servers = [];
    }
  }

  selectDefaultServer(): string {
    const nonLocalhost = this.servers.find(s => !s.includes('localhost'));
    return nonLocalhost || this.servers[0] || '';
  }

  onServerSelectChange(): void {
    // Server select changed, value is already updated via ngModel
  }

  generateName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${adjective}${animal}${number}`;
  }

  generateRandomName(): void {
    this.accountName = this.generateName();
  }

  canConnect(): boolean {
    return !!(
      this.selectedServer &&
      this.accountName &&
      /^[a-z0-9]+$/.test(this.accountName)
    );
  }

  getAccountNameHint(): string {
    const hint = this.i18nStrings['accountNameHint'] || 'Lowercase letters and numbers only (e.g., {name})';
    return hint.replace('{name}', this.exampleName);
  }

  connectNewAccount(): void {
    if (!this.canConnect()) {
      this.toast.error(this.i18nStrings['toastFillFields'] || 'Please fill in all fields correctly');
      return;
    }

    this.connecting = true;
    this.auth.setServerUrl(this.selectedServer);

    this.api.quickConnect(this.selectedServer, this.accountName).subscribe({
      next: (data) => {
        this.auth.setAccountToken(data.token);
        this.auth.setWaitingForApproval();

        this.connecting = false;
        this.waitingForApproval = true;

        this.toast.success(this.i18nStrings['toastConnectionSent'] || 'Connection request sent!');
        this.startStatusPolling();
      },
      error: () => {
        this.connecting = false;
      }
    });
  }

  requestLogin(): void {
    if (!this.canConnect()) {
      this.toast.error(this.i18nStrings['toastFillFields'] || 'Please fill in all fields correctly');
      return;
    }

    this.connecting = true;
    this.auth.setServerUrl(this.selectedServer);

    this.api.createLoginRequest(this.selectedServer, this.accountName).subscribe({
      next: (data) => {
        this.loginRequestId = data.request_id;
        this.connecting = false;
        this.waitingForApproval = true;

        this.toast.success(this.i18nStrings['toastLoginSent'] || 'Login request sent!');
        this.startLoginRequestPolling();
      },
      error: () => {
        this.connecting = false;
      }
    });
  }

  startStatusPolling(): void {
    this.stopStatusPolling();

    // Poll every 5 seconds for account status
    this.statusCheckSubscription = interval(5000)
    .pipe(
      takeUntil(this.alive$),
      switchMap(() => this.api.getMe())
    )
    .subscribe({
      next: (data) => {
        if (data.status === 2) {
          this.auth.clearWaitingForApproval();
          this.stopStatusPolling();
          this.toast.success(this.i18nStrings['toastApproved'] || 'Account approved! Welcome to Ekydum!');
          this.router.navigate(['/subscriptions']);
        } else if (data.status === 3) {
          this.auth.clearWaitingForApproval();
          this.auth.clearAccountToken();
          this.stopStatusPolling();
          this.waitingForApproval = false;
          this.toast.error(this.i18nStrings['toastBlocked'] || 'Your account has been blocked by administrator');
        }
      },
      error: () => {
        // Continue polling on error
      }
    });
  }

  startLoginRequestPolling(): void {
    this.stopStatusPolling();

    if (!this.loginRequestId) return;

    // Poll every 5 seconds for login request status
    this.statusCheckSubscription = interval(5000)
    .pipe(
      takeUntil(this.alive$),
      switchMap(() => this.api.getLoginRequestStatus(this.loginRequestId!))
    )
    .subscribe({
      next: (data) => {
        if (data.status === 'approved' && data.token) {
          this.auth.setAccountToken(data.token);
          this.stopStatusPolling();
          this.toast.success(this.i18nStrings['toastLoginApproved'] || 'Login approved! Welcome to Ekydum!');
          this.router.navigate(['/subscriptions']);
        } else if (data.status === 'denied') {
          this.stopStatusPolling();
          this.waitingForApproval = false;
          this.loginRequestId = undefined;
          this.toast.error(this.i18nStrings['toastLoginDenied'] || 'Login request was denied by administrator');
        }
      },
      error: () => {
        // Continue polling on error
      }
    });
  }

  stopStatusPolling(): void {
    if (this.statusCheckSubscription) {
      this.statusCheckSubscription.unsubscribe();
      this.statusCheckSubscription = undefined;
    }
  }

  checkStatusNow(): void {
    if (this.loginRequestId) {
      // Check login request status
      this.api.getLoginRequestStatus(this.loginRequestId).subscribe({
        next: (data) => {
          if (data.status === 'approved' && data.token) {
            this.auth.setAccountToken(data.token);
            this.stopStatusPolling();
            this.toast.success(this.i18nStrings['toastLoginApproved'] || 'Login approved! Welcome to Ekydum!');
            this.router.navigate(['/subscriptions']);
          } else if (data.status === 'denied') {
            this.stopStatusPolling();
            this.waitingForApproval = false;
            this.loginRequestId = undefined;
            this.toast.error(this.i18nStrings['toastLoginDeniedShort'] || 'Login request was denied');
          } else {
            this.toast.info(this.i18nStrings['toastStillWaiting'] || 'Still waiting for approval...');
          }
        }
      });
    } else {
      // Check account status
      this.api.getMe().subscribe({
        next: (data) => {
          if (data.status === 2) {
            this.auth.clearWaitingForApproval();
            this.stopStatusPolling();
            this.toast.success(this.i18nStrings['toastApproved'] || 'Account approved! Welcome to Ekydum!');
            this.router.navigate(['/subscriptions']);
          } else if (data.status === 3) {
            this.auth.clearWaitingForApproval();
            this.auth.clearAccountToken();
            this.stopStatusPolling();
            this.waitingForApproval = false;
            this.toast.error(this.i18nStrings['toastAccountBlocked'] || 'Your account has been blocked');
          } else {
            this.toast.info(this.i18nStrings['toastStillWaiting'] || 'Still waiting for approval...');
          }
        }
      });
    }
  }

  cancelWaiting(): void {
    this.stopStatusPolling();
    this.auth.clearWaitingForApproval();
    this.auth.clearAccountToken();
    this.waitingForApproval = false;
    this.loginRequestId = undefined;
    this.toast.info(this.i18nStrings['toastCancelled'] || 'Connection cancelled');
  }

  updateLang(): void {
    if (this.lang) {
      this.i18nService.setLang(this.lang);
      this.toast.success(this.i18nStrings['toastLanguageUpdated'] || 'Language updated');
    }
  }
}
