import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppInitializerService } from '../services/app-initializer.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private appInitializer: AppInitializerService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is authenticated or waiting for approval
    if (this.auth.isAuthenticated() || this.auth.isWaitingForApproval()) {
      // If waiting for approval, redirect to quick-connect
      if (this.auth.isWaitingForApproval() && state.url !== '/quick-connect') {
        this.router.navigate(['/quick-connect']);
        return false;
      }
      return true;
    }

    // Not authenticated - check if servers config is available
    if (this.appInitializer.hasServersConfig()) {
      // Redirect to quick connect
      this.router.navigate(['/quick-connect']);
    } else {
      // Redirect to settings for manual configuration
      this.router.navigate(['/settings']);
    }

    return false;
  }
}
