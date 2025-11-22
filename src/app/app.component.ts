import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService, Toast } from './services/toast.service';
import { PlayerService } from './services/player.service';
import { VideoItemData } from './models/video-item.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  sidebarCollapsed = false;
  toasts: Toast[] = [];

  // Player state
  currentVideo: VideoItemData | null = null;
  displayMode = 'inactive';
  isPlaying = false;

  constructor(
    private toastService: ToastService,
    private playerService: PlayerService,
  ) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });

    // Subscribe to player state
    this.playerService.currentVideo$
    .pipe(takeUntil(this.destroy$))
    .subscribe(video => {
      this.currentVideo = video;
    });

    this.playerService.displayMode$
    .pipe(takeUntil(this.destroy$))
    .subscribe(mode => {
      this.displayMode = mode;
    });

    this.playerService.isPlaying$
    .pipe(takeUntil(this.destroy$))
    .subscribe(playing => {
      this.isPlaying = playing;
    });

    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  // Mini player controls
  togglePlayPause(): void {
    if (this.isPlaying) {
      this.playerService.pause();
    } else {
      this.playerService.play();
    }
  }

  showPlayer(): void {
    this.playerService.uiUnhide();
  }
}
