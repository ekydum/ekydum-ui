import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-manage',
  standalone: false,
  template: `
      <div class="container">
          <h2 class="mb-4" style="margin-left: 48px;">
              <i class="fas fa-users-cog me-2"></i>
              Manage Accounts
          </h2>

          <div class="card mb-4">
              <div class="card-header">
                  <h5 class="mb-0">Admin Authentication</h5>
              </div>
              <div class="card-body">
                  <div class="mb-3">
                      <label class="form-label">Admin Token</label>
                      <input
                              type="password"
                              class="form-control"
                              [(ngModel)]="adminToken"
                              placeholder="Enter admin token"
                              [disabled]="isAdmin">
                  </div>

                  <div class="d-flex gap-2">
                      <button
                              class="btn btn-primary"
                              (click)="saveAdminToken()"
                              [disabled]="isAdmin || !adminToken">
                          <i class="fas fa-save me-2"></i>
                          Save & Login
                      </button>
                      <button
                              class="btn btn-danger"
                              (click)="adminLogout()"
                              [disabled]="!isAdmin">
                          <i class="fas fa-sign-out-alt me-2"></i>
                          Admin Logout
                      </button>
                  </div>

                  <div class="alert alert-success mt-3" *ngIf="isAdmin">
                      <i class="fas fa-check-circle me-2"></i>
                      Admin access granted
                  </div>
              </div>
          </div>

          <div *ngIf="isAdmin">
              <div class="card mb-4">
                  <div class="card-header">
                      <h5 class="mb-0">Create New Account</h5>
                  </div>
                  <div class="card-body">
                      <div class="row g-2">
                          <div class="col">
                              <input
                                      type="text"
                                      class="form-control"
                                      [(ngModel)]="newAccountName"
                                      placeholder="Account name">
                          </div>
                          <div class="col-auto">
                              <button class="btn btn-success" (click)="createAccount()"
                                      [disabled]="!newAccountName || creating">
                                  <i class="fas fa-plus me-2"></i>
                                  {{ creating ? 'Creating...' : 'Create' }}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header d-flex justify-content-between align-items-center">
                      <h5 class="mb-0">Accounts</h5>
                      <button class="btn btn-sm btn-outline-primary" (click)="loadAccounts()">
                          <i class="fas fa-sync me-1"></i>
                          Refresh
                      </button>
                  </div>
                  <div class="card-body">
                      <div *ngIf="loading" class="text-center py-3">
                          <div class="spinner-border text-primary" role="status"></div>
                      </div>

                      <div *ngIf="!loading && accounts.length === 0" class="alert alert-info">
                          No accounts found
                      </div>

                      <div class="table-responsive" *ngIf="!loading && accounts.length > 0">
                          <table class="table table-hover">
                              <thead>
                              <tr>
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
                                              class="form-control form-control-sm"
                                              [(ngModel)]="editingName"
                                              (keyup.enter)="saveEdit(account.id)">
                                  </td>
                                  <td>
                                      <code class="small">{{ account.token.substring(0, 20) }}...</code>
                                      <button
                                              class="btn btn-sm btn-link p-0 ms-2"
                                              (click)="copyToken(account.token)">
                                          <i class="fas fa-copy"></i>
                                      </button>
                                  </td>
                                  <td>
                                      <small>{{ account.created_at | date:'short' }}</small>
                                  </td>
                                  <td>
                                      <div class="btn-group btn-group-sm" *ngIf="editingId !== account.id">
                                          <button class="btn btn-outline-primary" (click)="startEdit(account)">
                                              <i class="fas fa-edit"></i>
                                          </button>
                                          <button class="btn btn-outline-danger" (click)="deleteAccount(account.id)">
                                              <i class="fas fa-trash"></i>
                                          </button>
                                      </div>
                                      <div class="btn-group btn-group-sm" *ngIf="editingId === account.id">
                                          <button class="btn btn-success" (click)="saveEdit(account.id)">
                                              <i class="fas fa-check"></i>
                                          </button>
                                          <button class="btn btn-secondary" (click)="cancelEdit()">
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
  `
})
export class ManageComponent implements OnInit {
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
    var savedToken = this.auth.getAdminToken();
    if (savedToken) {
      this.adminToken = savedToken;
      this.isAdmin = true;
      this.loadAccounts();
    }
  }

  saveAdminToken(): void {
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
