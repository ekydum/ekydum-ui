import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private serversAvailable = false;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async initialize(): Promise<void> {
    await this.loadServerConfig();
    await this.loadUserConfig();
  }

  private async loadServerConfig(): Promise<void> {
    try {
      const response = await fetch('/config/servers.json');
      const data = await response.json();
      this.serversAvailable = !!(data.servers && data.servers.length > 0);
    } catch (error) {
      console.log('No servers config found, using default settings');
      this.serversAvailable = false;
    }
  }

  private async loadUserConfig(): Promise<void> {
    // Only load config if user is authenticated
    if (this.authService.getAccountToken()) {
      try {
        await firstValueFrom(this.configService.init());
      } catch (error) {
        console.error('Failed to load user config:', error);
      }
    }
  }

  hasServersConfig(): boolean {
    return this.serversAvailable;
  }
}
