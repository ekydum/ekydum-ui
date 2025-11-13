import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { YtDlpVideoInfo } from '../models/yt-dlp-video-info.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  private getHeaders(useAdmin: boolean = false): HttpHeaders {
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (useAdmin) {
      var adminToken = this.auth.getAdminToken();
      if (adminToken) {
        headers = headers.set('x-admin-token', adminToken);
      }
    } else {
      var accountToken = this.auth.getAccountToken();
      if (accountToken) {
        headers = headers.set('x-account-token', accountToken);
      }
    }

    return headers;
  }

  private getUrl(path: string): string {
    var serverUrl = this.auth.getServerUrl() || 'http://localhost:3000';
    return `${serverUrl}${path}`;
  }

  private handleError(error: any): Observable<never> {
    var message = error.error?.error || error.message || 'An error occurred';
    this.toast.error(message);
    return throwError(() => error);
  }

  getMe(): Observable<any> {
    return this.http.get(this.getUrl('/me'), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  searchChannels(query: string): Observable<any> {
    return this.http.post(this.getUrl('/channels/search'), { q: query }, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  getChannel(channelId: string): Observable<any> {
    return this.http.get(this.getUrl(`/channels/${channelId}`), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  getChannelVideos(channelId: string, page: number = 1, pageSize?: number): Observable<any> {
    var params = new HttpParams().set('page', page.toString());
    if (pageSize) {
      params = params.set('page_size', pageSize.toString());
    }
    return this.http.get(this.getUrl(`/channels/${channelId}/videos`), { headers: this.getHeaders(), params })
      .pipe(catchError(err => this.handleError(err)));
  }

  getVideo(videoId: string) {
    return this.http.get<YtDlpVideoInfo>(this.getUrl(`/videos/${videoId}`), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  getVideoStream(videoId: string, quality?: string): Observable<any> {
    var params = quality ? new HttpParams().set('quality', quality) : new HttpParams();
    return this.http.get(this.getUrl(`/videos/${videoId}/stream`), { headers: this.getHeaders(), params })
      .pipe(catchError(err => this.handleError(err)));
  }

  getSubscriptions(): Observable<any> {
    return this.http.get(this.getUrl('/subscriptions'), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  subscribe(channelId: string): Observable<any> {
    return this.http.post(this.getUrl('/subscriptions'), { yt_channel_id: channelId }, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  unsubscribe(subscriptionId: number): Observable<any> {
    return this.http.delete(this.getUrl(`/subscriptions/${subscriptionId}`), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  getSettings(): Observable<any> {
    return this.http.get(this.getUrl('/settings'), { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  updateSetting(key: string, value: any): Observable<any> {
    return this.http.put(this.getUrl(`/settings/${key}`), { value }, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  getAccounts(): Observable<any> {
    return this.http.get(this.getUrl('/admin/accounts'), { headers: this.getHeaders(true) })
      .pipe(catchError(err => this.handleError(err)));
  }

  getAccount(id: string): Observable<any> {
    return this.http.get(this.getUrl(`/admin/accounts/${id}`), { headers: this.getHeaders(true) })
      .pipe(catchError(err => this.handleError(err)));
  }

  createAccount(name: string): Observable<any> {
    return this.http.post(this.getUrl('/admin/accounts'), { name }, { headers: this.getHeaders(true) })
      .pipe(catchError(err => this.handleError(err)));
  }

  updateAccount(id: string, name: string): Observable<any> {
    return this.http.put(this.getUrl(`/admin/accounts/${id}`), { name }, { headers: this.getHeaders(true) })
      .pipe(catchError(err => this.handleError(err)));
  }

  deleteAccount(id: string): Observable<any> {
    return this.http.delete(this.getUrl(`/admin/accounts/${id}`), { headers: this.getHeaders(true) })
      .pipe(catchError(err => this.handleError(err)));
  }
}
