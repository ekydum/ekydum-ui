import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { HealthInfo, ServerInfo } from '../../models/protocol/server.models';

@Component({
  selector: 'app-about-modal',
  template: `
    <div class="about-modal">
      <div class="modal-header">
        <div class="header-content">
          <img src="/appicon/logo-w128.png" alt="Ekydum" class="about-logo" width="48" height="48">
          <h4 class="modal-title">Ekydum</h4>
        </div>
        <button type="button" class="btn-close btn-close-white" (click)="activeModal.dismiss()"></button>
      </div>

      <div class="modal-body">
        <!-- Version Info -->
        <div class="info-section">
          <!-- UI Version - clickable -->
          <a
            [href]="uiReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="info-card info-card-link"
          >
            <div class="info-icon">
              <i class="fas fa-desktop"></i>
            </div>
            <div class="info-content">
              <span class="info-label">Web UI</span>
              <span class="info-value">v{{ uiVersion }}</span>
            </div>
            <i class="fas fa-external-link-alt link-indicator"></i>
          </a>

          <!-- Server Version - clickable -->
          <a
            *ngIf="serverInfo"
            [href]="serverReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="info-card info-card-link"
          >
            <div class="info-icon">
              <i class="fas fa-server"></i>
            </div>
            <div class="info-content">
              <span class="info-label">Server</span>
              <span class="info-value">v{{ serverInfo.version }}</span>
            </div>
            <i class="fas fa-external-link-alt link-indicator"></i>
          </a>

          <!-- Server loading state -->
          <div class="info-card" *ngIf="!serverInfo && !serverError">
            <div class="info-icon">
              <i class="fas fa-server"></i>
            </div>
            <div class="info-content">
              <span class="info-label">Server</span>
              <span class="info-value loading">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </div>
          </div>

          <!-- Server error state -->
          <div class="info-card info-card-error" *ngIf="serverError">
            <div class="info-icon error">
              <i class="fas fa-server"></i>
            </div>
            <div class="info-content">
              <span class="info-label">Server</span>
              <span class="info-value error">offline</span>
            </div>
          </div>
        </div>

        <!-- Health Status -->
        <div class="health-section" *ngIf="healthInfo">
          <h6 class="section-title">
            <i class="fas fa-heartbeat me-2"></i>
            System Health
          </h6>
          <div class="health-grid">
            <div class="health-item" [class.ok]="healthInfo.status === 'ok'" [class.error]="healthInfo.status !== 'ok'">
              <i class="fas" [class.fa-check-circle]="healthInfo.status === 'ok'" [class.fa-times-circle]="healthInfo.status !== 'ok'"></i>
              <span>Server</span>
            </div>
            <div class="health-item" [class.ok]="healthInfo.db === 'ok'" [class.error]="healthInfo.db !== 'ok'">
              <i class="fas" [class.fa-check-circle]="healthInfo.db === 'ok'" [class.fa-times-circle]="healthInfo.db !== 'ok'"></i>
              <span>Database</span>
            </div>
            <div class="health-item" [class.ok]="healthInfo.cache === 'ok'" [class.error]="healthInfo.cache !== 'ok'">
              <i class="fas" [class.fa-check-circle]="healthInfo.cache === 'ok'" [class.fa-times-circle]="healthInfo.cache !== 'ok'"></i>
              <span>Cache</span>
            </div>
          </div>
        </div>

        <!-- Loading health -->
        <div class="health-section loading-state" *ngIf="!healthInfo && !healthError">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Checking system health...
        </div>

        <!-- Health error -->
        <div class="health-section error-state" *ngIf="healthError">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Unable to reach server
        </div>

        <!-- Description -->
        <div class="description-section">
          <p class="description-text">Free Media Server</p>
          <p class="copyright">© 2025 Ekydum Project</p>
        </div>

        <!-- Links -->
        <div class="links-section">
          <a href="https://github.com/ekydum" target="_blank" rel="noopener noreferrer" class="link-btn">
            <i class="fab fa-github"></i>
            GitHub
          </a>
          <a href="https://github.com/ekydum/ekydum-issues/issues/new" target="_blank" rel="noopener noreferrer" class="link-btn link-btn-issues">
            <i class="fas fa-bug"></i>
            Report Issue
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .about-modal {
      background: rgba(20, 20, 20, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      user-select: none;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.03);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .about-logo {
      filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
    }

    .modal-title {
      color: white;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .modal-body {
      padding: 24px;
    }

    /* Info Section */
    .info-section {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .info-card-link {
      cursor: pointer;
      position: relative;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        .link-indicator {
          opacity: 1;
          transform: translate(2px, -2px);
        }
      }
    }

    .info-card-error {
      border-color: rgba(220, 53, 69, 0.3);
      background: rgba(220, 53, 69, 0.1);
    }

    .link-indicator {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      opacity: 0;
      transition: all 0.2s ease;
    }

    .info-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13, 110, 253, 0.2);
      border-radius: 10px;
      color: rgba(13, 110, 253, 1);
      font-size: 18px;

      &.error {
        background: rgba(220, 53, 69, 0.2);
        color: rgba(220, 53, 69, 1);
      }
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      color: white;
      font-size: 16px;
      font-weight: 600;
      font-family: 'SF Mono', 'Fira Code', monospace;

      &.loading {
        color: rgba(255, 255, 255, 0.5);
      }

      &.error {
        color: rgba(220, 53, 69, 0.9);
      }
    }

    /* Health Section */
    .health-section {
      margin-bottom: 20px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
    }

    .section-title {
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }

    .health-grid {
      display: flex;
      gap: 12px;
    }

    .health-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;

      &.ok {
        background: rgba(40, 167, 69, 0.15);
        color: rgba(40, 167, 69, 1);
        border: 1px solid rgba(40, 167, 69, 0.3);
      }

      &.error {
        background: rgba(220, 53, 69, 0.15);
        color: rgba(220, 53, 69, 1);
        border: 1px solid rgba(220, 53, 69, 0.3);
      }

      i {
        font-size: 14px;
      }
    }

    .loading-state, .error-state {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
    }

    .error-state {
      color: rgba(255, 193, 7, 0.9);
    }

    /* Description Section */
    .description-section {
      text-align: center;
      padding: 16px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 16px;
    }

    .description-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin: 0 0 8px 0;
    }

    .copyright {
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      margin: 0;
    }

    /* Links Section */
    .links-section {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .link-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      user-select: auto;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
        color: white;
        transform: translateY(-1px);
      }

      i {
        font-size: 16px;
      }
    }

    .link-btn-issues {
      background: rgba(255, 193, 7, 0.1);
      border-color: rgba(255, 193, 7, 0.3);
      color: rgba(255, 193, 7, 0.9);

      &:hover {
        background: rgba(255, 193, 7, 0.2);
        border-color: rgba(255, 193, 7, 0.4);
        color: rgba(255, 193, 7, 1);
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .info-section {
        flex-direction: column;
      }

      .health-grid {
        flex-direction: column;
      }

      .links-section {
        flex-direction: column;
      }

      .link-btn {
        justify-content: center;
      }
    }
  `],
  standalone: false
})
export class AboutModalComponent implements OnInit {
  uiVersion = environment.version;
  serverInfo: ServerInfo | null = null;
  healthInfo: HealthInfo | null = null;
  serverError = false;
  healthError = false;

  readonly uiReleaseUrl = `https://github.com/ekydum/ekydum-ui/releases/tag/${environment.version}`;

  get serverReleaseUrl(): string {
    return this.serverInfo
      ? `https://github.com/ekydum/ekydum-server/releases/tag/${this.serverInfo.version}`
      : '#';
  }

  constructor(
    public activeModal: NgbActiveModal,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadServerInfo();
    this.loadHealthInfo();
  }

  private loadServerInfo(): void {
    this.api.getServerInfo().subscribe({
      next: (data) => {
        this.serverInfo = data;
      },
      error: () => {
        this.serverError = true;
      }
    });
  }

  private loadHealthInfo(): void {
    this.api.getServerHealth().subscribe({
      next: (data) => {
        this.healthInfo = data;
      },
      error: () => {
        this.healthError = true;
      }
    });
  }
}
