import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-manage',
  standalone: false,
  template: `
    <div class="container">
      <h2 class="mb-4 page-title text-no-select" style="margin-left: 48px;">
        <i class="fas fa-users-cog me-2"></i>
        Manage Accounts
      </h2>

      <div class="card settings-card mb-4">
        <div class="card-header">
          <h5 class="mb-0 text-no-select">Admin Authentication</h5>
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
            <label class="form-label text-no-select">Admin Token</label>
            <input
              type="password"
              class="form-control settings-input"
              [(ngModel)]="adminToken"
              placeholder="Enter admin token"
              [disabled]="isAdmin">
          </div>

          <div class="d-flex gap-2">
            <button
              class="btn btn-blue-glass"
              (click)="saveAdminToken()"
              [disabled]="isAdmin || !adminToken">
              <i class="fas fa-save me-2"></i>
              Save & Login
            </button>
            <button
              class="btn btn-red-glass"
              (click)="adminLogout()"
              [disabled]="!isAdmin">
              <i class="fas fa-sign-out-alt me-2"></i>
              Admin Logout
            </button>
          </div>

          <div class="alert-custom alert-success-custom mt-3" *ngIf="isAdmin">
            <i class="fas fa-check-circle me-2"></i>
            Admin access granted
          </div>
        </div>
      </div>

      <div *ngIf="isAdmin">
        <div class="card settings-card mb-4">
          <div class="card-header">
            <h5 class="mb-0 text-no-select">Create New Account</h5>
          </div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col">
                <input
                  type="text"
                  class="form-control settings-input"
                  [(ngModel)]="newAccountName"
                  placeholder="Account name">
              </div>
              <div class="col-auto">
                <button class="btn btn-success-glass" (click)="createAccount()"
                        [disabled]="!newAccountName || creating">
                  <i class="fas fa-plus me-2"></i>
                  {{ creating ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card settings-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-no-select">Accounts</h5>
            <button class="btn btn-sm btn-glass" (click)="loadAccounts()">
              <i class="fas fa-sync me-1"></i>
              Refresh
            </button>
          </div>
          <div class="card-body p-0">
            <div *ngIf="loading" class="text-center py-3">
              <div class="spinner-border spinner-custom" role="status"></div>
            </div>

            <div *ngIf="!loading && accounts.length === 0" class="alert-custom alert-info-custom">
              <i class="fas fa-info-circle me-2"></i>
              No accounts found
            </div>

            <div class="table-responsive" *ngIf="!loading && accounts.length > 0">
              <table class="table table-dark-glass">
                <thead>
                <tr class="text-no-select">
                  <th>Name</th>
                  <th>Token</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr *ngFor="let account of accounts">
                  <td>
                    <div *ngIf="editingId !== account.id">
                      {{ account.name }}
                    </div>
                    <input
                      *ngIf="editingId === account.id"
                      type="text"
                      class="form-control form-control-sm settings-input"
                      [(ngModel)]="editingName"
                      (keyup.enter)="saveEdit(account.id)">
                  </td>
                  <td>
                    <code class="token-code">{{ account.token.substring(0, 20) }}...</code>
                    <button
                      class="btn btn-sm btn-glass-icon ms-2"
                      (click)="copyToken(account.token)"
                      title="Copy token">
                      <i class="fas fa-copy"></i>
                    </button>
                  </td>
                  <td>
                    <small class="text-muted-custom">{{ account.created_at | date:'short' }}</small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm" *ngIf="editingId !== account.id">
                      <button class="btn btn-blue-glass" (click)="startEdit(account)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-red-glass" (click)="deleteAccount(account.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                    <div class="btn-group btn-group-sm" *ngIf="editingId === account.id">
                      <button class="btn btn-success-glass" (click)="saveEdit(account.id)">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="btn btn-glass" (click)="cancelEdit()">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
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

    .settings-input {
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

    .settings-input:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(13, 110, 253, 0.5);
      color: white;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      outline: 0;
    }

    .settings-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .text-muted-custom {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    /* Buttons */
    .btn-glass {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .btn-glass-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      padding: 4px 8px;
    }

    .btn-glass-icon:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;
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

    .btn-success-glass {
      background: rgba(25, 135, 84, 0.15);
      border: 1px solid rgba(25, 135, 84, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-success-glass:hover:not(:disabled) {
      background: rgba(25, 135, 84, 0.25);
      border-color: rgba(25, 135, 84, 0.5);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(25, 135, 84, 0.4);
    }

    .btn-success-glass:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Table */
    .table-dark-glass {
      --bs-table-bg: transparent;
      --bs-table-striped-bg: rgba(0, 0, 0, 0.2);
      --bs-table-hover-bg: rgba(13, 110, 253, 0.1);
      color: white;
      margin-bottom: 0;
    }

    .table-dark-glass thead th {
      background: rgba(13, 110, 253, 0.15);
      border-bottom: 1px solid rgba(13, 110, 253, 0.3);
      color: white;
      font-weight: 600;
      padding: 12px;
    }

    .table-dark-glass tbody {
      background: transparent;
    }

    .table-dark-glass tbody tr {
      background: rgba(0, 0, 0, 0.3) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;
    }

    .table-dark-glass tbody tr:hover {
      background: rgba(13, 110, 253, 0.1) !important;
      transform: scale(1.01);
    }

    .table-dark-glass tbody td {
      padding: 12px;
      vertical-align: middle;
      color: rgba(255, 255, 255, 0.9);
    }

    .token-code {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(13, 202, 240, 0.9);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.875rem;
      font-family: 'Courier New', monospace;
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

    .alert-info-custom {
      color: rgba(13, 202, 240, 0.9);
      border-color: rgba(13, 202, 240, 0.3);
      background: rgba(13, 202, 240, 0.1);
    }
  `]
})
export class ManageComponent implements OnInit {
  serverUrl = 'http://localhost:3000';
  adminToken = '';
  isAdmin = false;
  accounts: any[] = [];
  loading = false;
  creating = false;
  newAccountName = '';
  editingId: string | null = null;
  editingName = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    var savedUrl = this.auth.getServerUrl();
    if (savedUrl) {
      this.serverUrl = savedUrl;
    }

    var savedToken = this.auth.getAdminToken();
    if (savedToken) {
      this.adminToken = savedToken;
      this.isAdmin = true;
      this.loadAccounts();
    }
  }

  saveAdminToken(): void {
    if (!this.serverUrl) {
      this.toast.error('Please enter server URL');
      return;
    }
    this.auth.setServerUrl(this.serverUrl);

    if (!this.adminToken) {
      this.toast.error('Please enter admin token');
      return;
    }

    this.auth.setAdminToken(this.adminToken);

    this.api.getAccounts().subscribe({
      next: () => {
        this.isAdmin = true;
        this.toast.success('Admin access granted');
        this.loadAccounts();
      },
      error: () => {
        this.auth.clearAdminToken();
        this.isAdmin = false;
        this.adminToken = '';
      }
    });
  }

  adminLogout(): void {
    this.auth.clearAdminToken();
    this.adminToken = '';
    this.isAdmin = false;
    this.accounts = [];
    this.toast.info('Admin logged out');
  }

  loadAccounts(): void {
    this.loading = true;
    this.api.getAccounts().subscribe({
      next: (data) => {
        this.accounts = data?.accounts || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  createAccount(): void {
    if (!this.newAccountName) {
      this.toast.error('Please enter account name');
      return;
    }

    this.creating = true;
    this.api.createAccount(this.newAccountName).subscribe({
      next: (data) => {
        this.toast.success('Account created successfully');
        this.newAccountName = '';
        this.creating = false;
        this.loadAccounts();

        this.toast.info('Token: ' + data.token);
      },
      error: () => {
        this.creating = false;
      }
    });
  }

  startEdit(account: any): void {
    this.editingId = account.id;
    this.editingName = account.name;
  }

  saveEdit(id: string): void {
    if (!this.editingName) {
      this.toast.error('Name cannot be empty');
      return;
    }

    this.api.updateAccount(id, this.editingName).subscribe({
      next: () => {
        this.toast.success('Account updated');
        this.editingId = null;
        this.editingName = '';
        this.loadAccounts();
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = '';
  }

  deleteAccount(id: string): void {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    this.api.deleteAccount(id).subscribe({
      next: () => {
        this.toast.success('Account deleted');
        this.loadAccounts();
      }
    });
  }

  copyToken(token: string): void {
    navigator.clipboard.writeText(token).then(() => {
      this.toast.success('Token copied to clipboard');
    }).catch(() => {
      this.toast.error('Failed to copy token');
    });
  }
}
