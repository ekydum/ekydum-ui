import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { YtDlpVideoInfo } from '../../models/yt-dlp-video-info.interface';
import { forkJoin, of, Subject, takeUntil, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserPreference } from '../../models/settings';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  standalone: false,
  styles: []
})
export class WatchComponent implements OnInit, OnDestroy {
  videoId = '';
  video: YtDlpVideoInfo|null = null;
  loading = false;

  preferences!: UserPreference[];

  isStarred = false;
  starLoading = false;

  private alive$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {
  }

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.videoId) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  checkStarred(): void {
    if (!this.video?.id) return;

    this.api.checkStarred(this.video.id).subscribe({
      next: (data) => {
        this.isStarred = data?.starred || false;
      }
    });
  }

  toggleStar(): void {
    if (!this.video) return;

    this.starLoading = true;

    if (this.isStarred) {
      this.api.removeStarred(this.video.id).subscribe({
        next: () => {
          this.isStarred = false;
          this.starLoading = false;
        },
        error: () => {
          this.starLoading = false;
        }
      });
    } else {
      this.api.addStarred(
        this.video.id,
        this.video.title || '',
        this.video.thumbnail || '',
        this.video.duration || undefined,
        this.video.channel_id || undefined,
        this.video.channel || this.video.uploader || undefined,
      ).subscribe({
        next: () => {
          this.isStarred = true;
          this.starLoading = false;
        },
        error: () => {
          this.starLoading = false;
        }
      });
    }
  }

  private load(): void {
    this.loading = true;
    forkJoin([
      this.loadVideo(),
      this.loadPreferences(),
    ]).pipe(
      takeUntil(this.alive$),
      tap(() => {
        this.loading = false;
        this.checkStarred();
      }),
      catchError((e) => {
        this.loading = false;
        console.error(e);
        return of(null);
      })
    ).subscribe();
  }

  private loadVideo() {
    return this.api.getVideo(this.videoId).pipe(
      tap((v) => {
        // console.log('video info loaded: ', v);
        this.video = v;
      }),
      catchError((e) => {
        console.error('cannot load video info', e);
        return of(null);
      })
    );
  }

  private loadPreferences() {
    return this.api.getSettings().pipe(
      tap((r) => {
        // console.log('preferences loaded: ', r.settings);
        this.preferences = r.settings;
      }),
      catchError((e) => {
        console.error('cannot load preferences', e);
        return of(null);
      })
    );
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    var year = dateStr.substring(0, 4);
    var month = dateStr.substring(4, 6);
    var day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  formatDuration(seconds: number): string {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }

  goBack(): void {
    history.back();
  }
}
