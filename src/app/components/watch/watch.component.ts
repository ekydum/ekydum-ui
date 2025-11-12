import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { YtDlpVideoInfo } from '../../models/yt-dlp-video-info.interface';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  standalone: false,
  styles: []
})
export class WatchComponent implements OnInit {
  videoId = '';
  video: YtDlpVideoInfo|null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {
  }

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.videoId) {
      this.loadVideo();
    }
  }

  loadVideo(): void {
    this.loading = true;
    this.api.getVideo(this.videoId).subscribe({
      next: (data) => {
        this.video = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
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
    this.router.navigate(['/subscriptions']);
  }
}
