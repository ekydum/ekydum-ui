import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService, Toast } from './services/toast.service';
import { PlayerService } from './services/player.service';
import { YtVideoListItem } from './models/protocol/yt-video-list-item.model';
import { Subject, takeUntil, tap } from 'rxjs';
import { I18nDict, I18nLocalized, I18nMultilingual } from './i18n/models/dict.models';
import { I18nService } from './i18n/services/i18n.service';
import { dict } from './i18n/dict/main.dict';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AboutModalComponent } from './components/about-modal/about-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements I18nMultilingual, OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly i18nDict: I18nDict = dict['app'];
  i18nStrings: I18nLocalized = {};

  sidebarCollapsed = false;
  toasts: Toast[] = [];

  // Player state
  currentVideo: YtVideoListItem | null = null;
  displayMode = 'inactive';
  isPlaying = false;

  constructor(
    private toastService: ToastService,
    private playerService: PlayerService,
    private i18nService: I18nService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.destroy$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

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

  openAboutModal(): void {
    this.modalService.open(AboutModalComponent, {
      centered: true,
      windowClass: 'about-modal-window'
    });
  }
}
