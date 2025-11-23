import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private serversAvailable = false;

  async loadServerConfig(): Promise<void> {
    try {
      const response = await fetch('/config/servers.json');
      const data = await response.json();
      this.serversAvailable = !!(data.servers && data.servers.length > 0);
    } catch (error) {
      console.log('No servers config found, using default settings');
      this.serversAvailable = false;
    }
  }

  hasServersConfig(): boolean {
    return this.serversAvailable;
  }
}
