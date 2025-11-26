import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { YtVideo } from '../models/protocol/yt-video.model';

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

  // Quick Connect - create new account
  quickConnect(serverUrl: string, accountName: string): Observable<any> {
    return this.http.post(`${serverUrl}/quick-connect`, { account_name: accountName })
    .pipe(catchError(err => this.handleError(err)));
  }

  // Quick Connect - create login request for existing account
  createLoginRequest(serverUrl: string, accountName: string): Observable<any> {
    return this.http.post(`${serverUrl}/quick-connect/login-request`, { account_name: accountName })
    .pipe(catchError(err => this.handleError(err)));
  }

  // Quick Connect - check login request status (for polling)
  getLoginRequestStatus(requestId: string): Observable<any> {
    return this.http.get(this.getUrl(`/quick-connect/login-request/${requestId}/status`))
    .pipe(catchError(err => this.handleError(err)));
  }

  getMe(): Observable<any> {
    return this.http.get(this.getUrl('/me'), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  searchChannels(query: string): Observable<any> {
    return this.http.post(this.getUrl('/channels/search'), { q: query }, { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  searchVideos(query: string, offset: number = 0, limit: number = 20): Observable<any> {
    return this.http.post(this.getUrl('/search/videos'), { q: query, offset, limit }, { headers: this.getHeaders() })
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

  getChannelPlaylists(channelId: string): Observable<any> {
    return this.http.get(this.getUrl(`/channels/${channelId}/playlists`), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  getPlaylistVideos(playlistId: string, page: number = 1, pageSize?: number): Observable<any> {
    var params = new HttpParams().set('page', page.toString());
    if (pageSize) {
      params = params.set('page_size', pageSize.toString());
    }
    return this.http.get(this.getUrl(`/playlists/${playlistId}/videos`), { headers: this.getHeaders(), params })
    .pipe(catchError(err => this.handleError(err)));
  }

  getVideo(videoId: string) {
    return this.http.get<YtVideo>(this.getUrl(`/videos/${videoId}`), { headers: this.getHeaders() })
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

  getStarred(): Observable<any> {
    return this.http.get(this.getUrl('/starred/starred'), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  addStarred(ytVideoId: string, title: string, thumbnail: string, duration?: number, ytChannelId?: string, channelName?: string): Observable<any> {
    return this.http.post(this.getUrl('/starred/starred'), {
      yt_video_id: ytVideoId,
      title,
      thumbnail,
      duration: duration || null,
      yt_channel_id: ytChannelId || null,
      channel_name: channelName || null
    }, { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  removeStarred(ytVideoId: string): Observable<any> {
    return this.http.delete(this.getUrl(`/starred/starred/${ytVideoId}`), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  checkStarred(ytVideoId: string): Observable<any> {
    return this.http.get(this.getUrl(`/starred/starred/${ytVideoId}`), { headers: this.getHeaders() })
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

  // Account status management
  approveAccount(id: string): Observable<any> {
    return this.http.post(this.getUrl(`/admin/accounts/${id}/approve`), {}, { headers: this.getHeaders(true) })
    .pipe(catchError(err => this.handleError(err)));
  }

  blockAccount(id: string): Observable<any> {
    return this.http.post(this.getUrl(`/admin/accounts/${id}/block`), {}, { headers: this.getHeaders(true) })
    .pipe(catchError(err => this.handleError(err)));
  }

  // Login requests management (admin)
  getLoginRequests(): Observable<any> {
    return this.http.get(this.getUrl('/admin/login-requests'), { headers: this.getHeaders(true) })
    .pipe(catchError(err => this.handleError(err)));
  }

  approveLoginRequest(requestId: string): Observable<any> {
    return this.http.post(this.getUrl(`/admin/login-requests/${requestId}/approve`), {}, { headers: this.getHeaders(true) })
    .pipe(catchError(err => this.handleError(err)));
  }

  denyLoginRequest(requestId: string): Observable<any> {
    return this.http.post(this.getUrl(`/admin/login-requests/${requestId}/deny`), {}, { headers: this.getHeaders(true) })
    .pipe(catchError(err => this.handleError(err)));
  }

  getWatchLater(): Observable<any> {
    return this.http.get(this.getUrl('/watch-later'), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  addWatchLater(ytVideoId: string, title: string, thumbnail: string, duration?: number, ytChannelId?: string, channelName?: string): Observable<any> {
    return this.http.post(this.getUrl('/watch-later'), {
      yt_video_id: ytVideoId,
      title,
      thumbnail,
      duration: duration || null,
      yt_channel_id: ytChannelId || null,
      channel_name: channelName || null
    }, { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  removeWatchLater(ytVideoId: string): Observable<any> {
    return this.http.delete(this.getUrl(`/watch-later/${ytVideoId}`), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }

  checkWatchLater(ytVideoId: string): Observable<any> {
    return this.http.get(this.getUrl(`/watch-later/check/${ytVideoId}`), { headers: this.getHeaders() })
    .pipe(catchError(err => this.handleError(err)));
  }
}
