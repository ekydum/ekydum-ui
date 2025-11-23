import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { I18nService } from '../../i18n/services/i18n.service';
import { LANG_CODE } from '../../i18n/models/lang-code.enum';
import { interval, Subject, Subscription, switchMap, takeUntil } from 'rxjs';

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
            <h2 class="mb-0">Quick Connect</h2>
          </div>
          <p class="subtitle">Connect to Ekydum server in seconds</p>

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
            <!-- All languages label -->
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
            <h4 class="text-center mb-3">Waiting for Administrator Approval</h4>
            <p class="text-center text-muted-custom mb-4">
              Your connection request has been sent.<br>
              An administrator needs to approve your account.
            </p>

            <div class="account-info-box">
              <div class="info-row">
                <span class="info-label">Server:</span>
                <span class="info-value">{{ selectedServer }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Name:</span>
                <span class="info-value">{{ accountName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="status-badge status-inactive">
                  <i class="fas fa-clock me-1"></i>
                  Pending Approval
                </span>
              </div>
            </div>

            <div class="d-flex gap-2 justify-content-center mt-4">
              <button class="btn btn-glass" (click)="checkStatusNow()">
                <i class="fas fa-sync me-2"></i>
                Check Now
              </button>
              <button class="btn btn-red-glass" (click)="cancelWaiting()">
                <i class="fas fa-times me-2"></i>
                Cancel
              </button>
            </div>

            <div class="polling-indicator mt-3 text-center">
              <small class="text-muted-custom">
                <i class="fas fa-circle-notch fa-spin me-1"></i>
                Auto-checking every 5 seconds...
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
                  New Account
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" [class.active]="activeTab === 'existing'" (click)="activeTab = 'existing'">
                  <i class="fas fa-sign-in-alt me-2"></i>
                  Existing Account
                </a>
              </li>
            </ul>

            <!-- Server selection (common for both tabs) -->
            <div class="mb-4">
              <label class="form-label">
                <i class="fas fa-server me-2"></i>
                Select or Enter Server URL
              </label>

              <!-- Server Select Dropdown -->
              <div *ngIf="servers.length > 0" class="server-select-wrapper mb-2">
                <select
                  class="form-select server-select"
                  [(ngModel)]="selectedServer"
                  [disabled]="connecting"
                  (change)="onServerSelectChange()">
                  <option value="">-- Select from list --</option>
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
                Choose from list or enter server URL manually
              </small>
            </div>

            <!-- Tab: New Account -->
            <div *ngIf="activeTab === 'new'">
              <div class="mb-4">
                <label class="form-label">
                  <i class="fas fa-user me-2"></i>
                  Account Name
                </label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control quick-input"
                    [(ngModel)]="accountName"
                    placeholder="Enter account name"
                    [disabled]="connecting"
                    (keyup.enter)="connectNewAccount()"
                    pattern="[a-z0-9]+"
                    maxlength="32">
                  <button
                    class="btn btn-glass-outline"
                    (click)="generateRandomName()"
                    [disabled]="connecting"
                    type="button"
                    title="Generate random name">
                    <i class="fas fa-dice"></i>
                  </button>
                </div>
                <small class="form-text text-muted-custom">
                  Lowercase letters and numbers only (e.g., {{ exampleName }})
                </small>
              </div>

              <button
                class="btn btn-primary-glass btn-lg w-100 mb-3"
                (click)="connectNewAccount()"
                [disabled]="!canConnect() || connecting">
                <i class="fas fa-plug me-2"></i>
                {{ connecting ? 'Connecting...' : 'Connect' }}
              </button>
            </div>

            <!-- Tab: Existing Account -->
            <div *ngIf="activeTab === 'existing'">
              <div class="mb-4">
                <label class="form-label">
                  <i class="fas fa-user me-2"></i>
                  Account Name
                </label>
                <input
                  type="text"
                  class="form-control quick-input"
                  [(ngModel)]="accountName"
                  placeholder="Enter your account name"
                  [disabled]="connecting"
                  (keyup.enter)="requestLogin()"
                  pattern="[a-z0-9]+"
                  maxlength="32">
                <small class="form-text text-muted-custom">
                  Enter the account name you want to access
                </small>
              </div>

              <button
                class="btn btn-primary-glass btn-lg w-100 mb-3"
                (click)="requestLogin()"
                [disabled]="!canConnect() || connecting">
                <i class="fas fa-key me-2"></i>
                {{ connecting ? 'Requesting...' : 'Request Access' }}
              </button>

              <div class="info-box">
                <div class="info-box-header">
                  <i class="fas fa-info-circle me-2"></i>
                  How it works
                </div>
                <ul class="info-list">
                  <li>Enter your existing account name</li>
                  <li>Click "Request Access"</li>
                  <li>Wait for administrator approval</li>
                  <li>You'll be automatically logged in</li>
                </ul>
              </div>
            </div>

            <!-- Info box for new account -->
            <div *ngIf="activeTab === 'new'" class="info-box">
              <div class="info-box-header">
                <i class="fas fa-info-circle me-2"></i>
                How it works
              </div>
              <ul class="info-list">
                <li>Choose a server from the list or enter manually</li>
                <li>Enter or generate a unique account name</li>
                <li>Click Connect to send a connection request</li>
                <li>Wait for administrator approval</li>
                <li>Start using Ekydum!</li>
              </ul>
            </div>

            <!-- Advanced settings link -->
            <div class="text-center mt-3">
              <a class="link-glass" routerLink="/settings">
                <i class="fas fa-cog me-1"></i>
                Advanced Settings
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative background elements -->
      <div class="bg-decoration bg-decoration-1"></div>
      <div class="bg-decoration bg-decoration-2"></div>
      <div class="bg-decoration bg-decoration-3"></div>
    </div>
  `,
  styles: [`
    .quick-connect-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Background decorations */
    .bg-decoration {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(13, 110, 253, 0.15), transparent);
      filter: blur(80px);
      z-index: 0;
    }

    .bg-decoration-1 {
      width: 600px;
      height: 600px;
      top: -200px;
      right: -200px;
    }

    .bg-decoration-2 {
      width: 400px;
      height: 400px;
      bottom: -100px;
      left: -100px;
      background: radial-gradient(circle, rgba(198, 17, 32, 0.1), transparent);
    }

    .bg-decoration-3 {
      width: 500px;
      height: 500px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(25, 135, 84, 0.08), transparent);
    }

    /* Main card */
    .quick-connect-card {
      background: rgba(26, 26, 26, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(30px);
      border-radius: 24px;
      overflow: hidden;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 1;
    }

    .card-header {
      background: rgba(13, 110, 253, 0.12);
      border-bottom: 1px solid rgba(13, 110, 253, 0.25);
      padding: 32px 32px 24px;
      text-align: center;
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .logo-section i {
      font-size: 32px;
      color: rgba(13, 110, 253, 1);
      filter: drop-shadow(0 0 10px rgba(13, 110, 253, 0.5));
    }

    .logo-section h2 {
      color: white;
      font-weight: 700;
      font-size: 32px;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      margin-bottom: 0;
    }

    /* Language selector */
    .language-selector {
      max-width: 100%;
      margin: 0 auto;
    }

    .lang-select {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 14px;
    }

    .lang-select option {
      background: #1a1a1a;
      color: white;
    }

    .lang-label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
      text-align: center;
      line-height: 1.4;
      padding: 0 10px;
    }

    .card-body {
      padding: 32px;
    }

    /* Tabs */
    .nav-tabs-glass {
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
    }

    .nav-tabs-glass .nav-item {
      flex: 1;
    }

    .nav-tabs-glass .nav-link {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      padding: 12px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-weight: 600;
    }

    .nav-tabs-glass .nav-link:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-tabs-glass .nav-link.active {
      color: rgba(13, 110, 253, 1);
      border-bottom-color: rgba(13, 110, 253, 1);
      background: rgba(13, 110, 253, 0.1);
    }

    /* Form controls */
    .form-label {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
      margin-bottom: 10px;
      display: block;
    }

    .quick-input,
    .form-select {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 15px;
      transition: all 0.3s ease;
    }

    .quick-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .quick-input:focus,
    .form-select:focus {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(13, 110, 253, 0.6);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.2);
      outline: 0;
    }

    .quick-input:disabled,
    .form-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-select option {
      background: #1a1a1a;
      color: white;
    }

    /* Server select with icon */
    .server-select-wrapper {
      position: relative;
    }

    .server-select {
      background: rgba(13, 110, 253, 0.15);
      border: 1px solid rgba(13, 110, 253, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 14px 40px 14px 16px;
      font-size: 15px;
      transition: all 0.3s ease;
      appearance: none;
      cursor: pointer;
    }

    .server-select:hover:not(:disabled) {
      background: rgba(13, 110, 253, 0.25);
      border-color: rgba(13, 110, 253, 0.5);
    }

    .server-select:focus {
      background: rgba(13, 110, 253, 0.25);
      border-color: rgba(13, 110, 253, 0.6);
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.2);
    }

    .select-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.6);
      pointer-events: none;
      font-size: 14px;
    }

    .text-muted-custom {
      color: rgba(255, 255, 255, 0.55);
      font-size: 13px;
      margin-top: 6px;
      display: block;
    }

    /* Input group */
    .input-group {
      display: flex;
      gap: 8px;
    }

    .input-group .quick-input {
      flex: 1;
    }

    /* Buttons */
    .btn-glass-outline {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 14px 20px;
      transition: all 0.3s ease;
    }

    .btn-glass-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15);
    }

    .btn-glass-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary-glass {
      background: linear-gradient(135deg, rgba(13, 110, 253, 0.3), rgba(13, 110, 253, 0.2));
      border: 1px solid rgba(13, 110, 253, 0.5);
      color: white;
      backdrop-filter: blur(10px);
      font-weight: 700;
      font-size: 16px;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(13, 110, 253, 0.3);
    }

    .btn-primary-glass:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(13, 110, 253, 0.4), rgba(13, 110, 253, 0.3));
      border-color: rgba(13, 110, 253, 0.7);
      color: white;
      transform: translateY(-3px);
      box-shadow: 0 6px 30px rgba(13, 110, 253, 0.5);
    }

    .btn-primary-glass:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-glass {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 10px 20px;
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
    }

    .btn-red-glass {
      background: rgba(198, 17, 32, 0.15);
      border: 1px solid rgba(198, 17, 32, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 10px 20px;
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-red-glass:hover {
      background: rgba(198, 17, 32, 0.25);
      border-color: rgba(198, 17, 32, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(198, 17, 32, 0.4);
    }

    /* Info box */
    .info-box {
      background: rgba(13, 110, 253, 0.08);
      border: 1px solid rgba(13, 110, 253, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;
    }

    .info-box-header {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .info-list {
      margin: 0;
      padding-left: 20px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 13px;
    }

    .info-list li {
      margin-bottom: 6px;
    }

    .info-list li:last-child {
      margin-bottom: 0;
    }

    /* Link */
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

    /* Waiting section */
    .waiting-section {
      padding: 20px 0;
    }

    .waiting-animation {
      text-align: center;
      animation: pulse 2s ease-in-out infinite;
    }

    .waiting-animation i {
      color: rgba(13, 110, 253, 0.8);
      filter: drop-shadow(0 0 15px rgba(13, 110, 253, 0.5));
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    .waiting-section h4 {
      color: white;
      font-weight: 600;
    }

    .account-info-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
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
      font-weight: 500;
      font-size: 14px;
    }

    .info-value {
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-inactive {
      background: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.3);
      color: rgba(255, 193, 7, 1);
    }

    .polling-indicator {
      animation: fadeInOut 2s ease-in-out infinite;
    }

    @keyframes fadeInOut {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 576px) {
      .quick-connect-card {
        border-radius: 16px;
      }

      .card-header {
        padding: 24px 20px 20px;
      }

      .card-body {
        padding: 24px 20px;
      }

      .logo-section h2 {
        font-size: 24px;
      }

      .logo-section i {
        font-size: 24px;
      }

      .lang-label {
        font-size: 10px;
      }
    }
  `]
})
export class QuickConnectComponent implements OnInit, OnDestroy {
  readonly LANG_CODE = LANG_CODE;

  servers: string[] = [];
  selectedServer = '';
  accountName = '';
  exampleName = '';
  connecting = false;
  waitingForApproval = false;
  activeTab: 'new' | 'existing' = 'new';
  lang: LANG_CODE = LANG_CODE.en;

  // For login request flow
  loginRequestId?: string;

  private statusCheckSubscription?: Subscription;
  private alive$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private i18nService: I18nService
  ) {}

  async ngOnInit(): Promise<void> {
    // Load servers from config
    await this.loadServers();

    // Load language
    this.lang = this.i18nService.lang;

    // Check if already waiting for approval
    if (this.auth.isWaitingForApproval()) {
      const savedServer = this.auth.getServerUrl();
      const savedToken = this.auth.getAccountToken();

      if (savedServer && savedToken) {
        this.selectedServer = savedServer;
        this.accountName = '';
        this.waitingForApproval = true;
        this.startStatusPolling();
      } else {
        this.auth.clearWaitingForApproval();
      }
    }

    // Generate example name
    this.exampleName = this.generateName();

    // Generate initial name for user
    this.generateRandomName();
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
    this.stopStatusPolling();
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

  connectNewAccount(): void {
    if (!this.canConnect()) {
      this.toast.error('Please fill in all fields correctly');
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

        this.toast.success('Connection request sent!');
        this.startStatusPolling();
      },
      error: () => {
        this.connecting = false;
      }
    });
  }

  requestLogin(): void {
    if (!this.canConnect()) {
      this.toast.error('Please fill in all fields correctly');
      return;
    }

    this.connecting = true;
    this.auth.setServerUrl(this.selectedServer);

    this.api.createLoginRequest(this.selectedServer, this.accountName).subscribe({
      next: (data) => {
        this.loginRequestId = data.request_id;
        this.connecting = false;
        this.waitingForApproval = true;

        this.toast.success('Login request sent!');
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
          this.toast.success('Account approved! Welcome to Ekydum!');
          this.router.navigate(['/subscriptions']);
        } else if (data.status === 3) {
          this.auth.clearWaitingForApproval();
          this.auth.clearAccountToken();
          this.stopStatusPolling();
          this.waitingForApproval = false;
          this.toast.error('Your account has been blocked by administrator');
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
          this.toast.success('Login approved! Welcome to Ekydum!');
          this.router.navigate(['/subscriptions']);
        } else if (data.status === 'denied') {
          this.stopStatusPolling();
          this.waitingForApproval = false;
          this.loginRequestId = undefined;
          this.toast.error('Login request was denied by administrator');
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
            this.toast.success('Login approved! Welcome to Ekydum!');
            this.router.navigate(['/subscriptions']);
          } else if (data.status === 'denied') {
            this.stopStatusPolling();
            this.waitingForApproval = false;
            this.loginRequestId = undefined;
            this.toast.error('Login request was denied');
          } else {
            this.toast.info('Still waiting for approval...');
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
            this.toast.success('Account approved! Welcome to Ekydum!');
            this.router.navigate(['/subscriptions']);
          } else if (data.status === 3) {
            this.auth.clearWaitingForApproval();
            this.auth.clearAccountToken();
            this.stopStatusPolling();
            this.waitingForApproval = false;
            this.toast.error('Your account has been blocked');
          } else {
            this.toast.info('Still waiting for approval...');
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
    this.toast.info('Connection cancelled');
  }

  updateLang(): void {
    if (this.lang) {
      this.i18nService.setLang(this.lang);
      this.toast.success('Language updated');
    }
  }
}
