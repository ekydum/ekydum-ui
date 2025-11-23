import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SERVER_URL_KEY = 'ekydum_server_url';
  private readonly ACCOUNT_TOKEN_KEY = 'ekydum_account_token';
  private readonly ADMIN_TOKEN_KEY = 'ekydum_admin_token';
  private readonly WAITING_FOR_APPROVAL_KEY = 'ekydum_waiting_for_approval';

  getServerUrl(): string | null {
    return localStorage.getItem(this.SERVER_URL_KEY);
  }

  setServerUrl(url: string): void {
    localStorage.setItem(this.SERVER_URL_KEY, url);
  }

  getAccountToken(): string | null {
    return localStorage.getItem(this.ACCOUNT_TOKEN_KEY);
  }

  setAccountToken(token: string): void {
    localStorage.setItem(this.ACCOUNT_TOKEN_KEY, token);
  }

  clearAccountToken(): void {
    localStorage.removeItem(this.ACCOUNT_TOKEN_KEY);
  }

  getAdminToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  setAdminToken(token: string): void {
    localStorage.setItem(this.ADMIN_TOKEN_KEY, token);
  }

  clearAdminToken(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!(this.getServerUrl() && this.getAccountToken());
  }

  isAdmin(): boolean {
    return !!this.getAdminToken();
  }

  setWaitingForApproval(): void {
    localStorage.setItem(this.WAITING_FOR_APPROVAL_KEY, 'true');
  }

  isWaitingForApproval(): boolean {
    return localStorage.getItem(this.WAITING_FOR_APPROVAL_KEY) === 'true';
  }

  clearWaitingForApproval(): void {
    localStorage.removeItem(this.WAITING_FOR_APPROVAL_KEY);
  }
}
