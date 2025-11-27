import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerService } from '../../../services/player.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { YtVideo } from '../../../models/protocol/yt-video.model';
import { UserPreference } from '../../../models/user-preference.model';
import { PlayerDisplayMode } from '../../../models/player-display-mode.model';
import { YtVideoListItem } from '../../../models/protocol/yt-video-list-item.model';
import { I18nDict, I18nLocalized, I18nMultilingual } from '../../../i18n/models/dict.models';
import { I18nService } from '../../../i18n/services/i18n.service';
import { dict } from '../../../i18n/dict/main.dict';

@Component({
  selector: 'app-floating-player-modal',
  standalone: false,
  template: `
    <div
      class="player-container"
      *ngIf="displayMode !== 'inactive'"
      [class.mode-floating]="displayMode === 'floating'"
      [class.mode-minimized]="displayMode === 'minimized'"
      [class.mode-hidden]="displayMode === 'hidden'"
      [class.with-sidebar]="(showQueue || showDescription) && displayMode === 'floating'"
    >
      <!-- Overlay for floating mode -->
      <div
        class="floating-overlay"
        *ngIf="displayMode === 'floating'"
        (click)="close()"
      ></div>

      <!-- Main player wrapper -->
      <div class="player-wrapper" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="player-header">
          <div class="player-title">
            {{ currentVideo?.title || i18nStrings['nowPlaying'] }}
          </div>

          <!-- Feature buttons (Star, Watch Later) -->
          <div class="feature-controls">
            <button
              class="btn btn-sm feature-btn"
              (click)="toggleStar()"
              [class.active]="isStarred"
              [disabled]="starLoading"
              title="Star"
            >
              <i class="fas fa-spinner fa-spin" *ngIf="starLoading"></i>
              <i class="fas fa-star" *ngIf="!starLoading"></i>
            </button>
            <button
              class="btn btn-sm feature-btn"
              (click)="toggleWatchLater()"
              [class.active]="isWatchLater"
              [disabled]="watchLaterLoading"
              title="Watch Later"
            >
              <i class="fas fa-spinner fa-spin" *ngIf="watchLaterLoading"></i>
              <i class="fas fa-clock" *ngIf="!watchLaterLoading"></i>
            </button>
          </div>

          <!-- Playback controls (both modes) -->
          <div class="playback-controls">
            <button
              class="btn btn-sm control-btn"
              (click)="previous()"
              [disabled]="!hasPrevious"
              [title]="i18nStrings['btnPrevious']"
            >
              <i class="fas fa-step-backward"></i>
            </button>
            <button
              class="btn btn-sm control-btn play-pause-btn"
              (click)="togglePlayPause()"
              [title]="isPlaying ? i18nStrings['btnPause'] : i18nStrings['btnPlay']"
            >
              <i class="fas" [class.fa-pause]="isPlaying" [class.fa-play]="!isPlaying"></i>
            </button>
            <button
              class="btn btn-sm control-btn"
              (click)="next()"
              [disabled]="!hasNext"
              [title]="i18nStrings['btnNext']"
            >
              <i class="fas fa-step-forward"></i>
            </button>
          </div>

          <div class="player-actions">
            <!-- Floating mode actions -->
            <button
              class="btn btn-sm action-btn"
              (click)="toggleQueue()"
              [class.active]="showQueue"
              [title]="i18nStrings['btnToggleQueue']"
              *ngIf="displayMode === 'floating' && queueLength > 1"
            >
              <i class="fas fa-list"></i>
            </button>
            <button
              class="btn btn-sm action-btn"
              (click)="toggleDescription()"
              [class.active]="showDescription"
              title="Description"
              *ngIf="displayMode === 'floating'"
            >
              <i class="fas fa-align-left"></i>
            </button>
            <!-- Comments button (disabled for now)
            <button
              class="btn btn-sm action-btn"
              (click)="toggleComments()"
              [class.active]="showComments"
              title="Comments"
              *ngIf="displayMode === 'floating'"
              disabled
            >
              <i class="fas fa-comments"></i>
            </button>
            -->
            <button
              class="btn btn-sm action-btn"
              (click)="minimize()"
              [title]="i18nStrings['btnMinimize']"
              *ngIf="displayMode === 'floating'"
            >
              <i class="fas fa-window-minimize"></i>
            </button>

            <!-- Minimized mode - hide and restore -->
            <button
              class="btn btn-sm action-btn"
              (click)="hide()"
              [title]="i18nStrings['btnHideToSidebar']"
              *ngIf="displayMode === 'minimized'"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              class="btn btn-sm action-btn"
              (click)="restore()"
              [title]="i18nStrings['btnRestore']"
              *ngIf="displayMode === 'minimized'"
            >
              <i class="fas fa-window-restore"></i>
            </button>

            <!-- Common close button -->
            <button
              class="btn btn-sm action-btn"
              (click)="close()"
              [title]="i18nStrings['btnClose']"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content area -->
        <div class="player-content">
          <div class="player-video-section">
            <div class="video-wrapper">
              <app-ekydum-player
                *ngIf="videoInfo"
                #ekydumPlayer
                [video]="videoInfo"
                [preferences]="preferences"
                [showCustomControls]="displayMode === 'floating'"
                (channelClick)="onChannelClick($event)"
              ></app-ekydum-player>
            </div>

            <div class="loading-state" *ngIf="loading">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3" *ngIf="displayMode === 'floating'">{{ i18nStrings['loadingVideo'] }}</p>
            </div>
          </div>

          <!-- Queue sidebar (floating only) -->
          <div class="sidebar-section queue-section" *ngIf="showQueue && displayMode === 'floating'">
            <app-queue-sidebar></app-queue-sidebar>
          </div>

          <!-- Description sidebar (floating only) -->
          <div class="sidebar-section description-section" *ngIf="showDescription && displayMode === 'floating'">
            <div class="description-panel">
              <div class="description-header">
                <h5>
                  <i class="fas fa-align-left me-2"></i>
                  Description
                </h5>
              </div>

              <div class="description-body" *ngIf="videoInfo">
                <!-- Meta info -->
                <div class="video-meta">
                  <span class="meta-item" *ngIf="videoInfo.view_count">
                    <i class="fas fa-eye"></i>
                    {{ formatCount(videoInfo.view_count) }}
                  </span>
                  <span class="meta-item" *ngIf="videoInfo.upload_date">
                    <i class="fas fa-calendar"></i>
                    {{ formatUploadDate(videoInfo.upload_date) }}
                  </span>
                </div>

                <!-- Description text -->
                <div class="description-text" [innerHTML]="formattedDescription"></div>
              </div>

              <div class="description-empty" *ngIf="!videoInfo?.description">
                <i class="fas fa-align-left"></i>
                <p>No description available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Base container */
    .player-container {
      position: fixed;
      z-index: 1500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Floating mode overlay */
    .floating-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Floating mode positioning */
    .player-container.mode-floating {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .player-container.mode-floating .player-wrapper {
      position: relative;
      background: rgba(26, 26, 26, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      max-width: 1200px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .player-container.mode-floating.with-sidebar .player-wrapper {
      max-width: 1600px;
    }

    /* Minimized mode positioning */
    .player-container.mode-minimized {
      bottom: 20px;
      right: 20px;
      width: 30vw;
      min-width: 400px;
      max-width: 600px;
    }

    .player-container.mode-minimized .player-wrapper {
      background: rgba(26, 26, 26, 0.45);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.5),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
      overflow: hidden;
      animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* Header */
    .player-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(15, 15, 15, 0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .player-container.mode-minimized .player-header {
      padding: 12px 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .player-title {
      color: white;
      font-weight: 600;
      font-size: 16px;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .player-container.mode-minimized .player-title {
      font-size: 14px;
      text-align: center;
      flex: 0 0 100%;
      margin-bottom: 8px;
    }

    /* Playback controls (prev/play-pause/next) */
    .playback-controls {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .player-container.mode-minimized .playback-controls {
      margin-right: 12px;
    }

    /* Feature controls (Star, Watch Later) */
    .feature-controls {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-left: 16px;
    }

    .player-container.mode-minimized .feature-controls {
      display: none;
    }

    .feature-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      position: relative;
    }

    .feature-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .feature-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Star button active state */
    .feature-btn:nth-child(1).active {
      background: rgba(255, 215, 0, 0.2);
      border-color: rgba(255, 215, 0, 0.4);
      color: #ffd700;
    }

    .feature-btn:nth-child(1).active:hover:not(:disabled) {
      background: rgba(255, 215, 0, 0.3);
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
    }

    /* Watch Later button active state */
    .feature-btn:nth-child(2).active {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      color: #3b82f6;
    }

    .feature-btn:nth-child(2).active:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    }

    .control-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    }

    .control-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .control-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .play-pause-btn {
      background: rgba(13, 110, 253, 0.15);
      border-color: rgba(13, 110, 253, 0.3);
    }

    .play-pause-btn:hover:not(:disabled) {
      background: rgba(13, 110, 253, 0.25);
      border-color: rgba(13, 110, 253, 0.5);
      box-shadow: 0 4px 16px rgba(13, 110, 253, 0.4);
    }

    /* Action buttons (queue/description/minimize/restore/close) */
    .player-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .action-btn.active {
      background: rgba(13, 110, 253, 0.15);
      border-color: rgba(13, 110, 253, 0.3);
    }

    .action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Content */
    .player-content {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .player-video-section {
      flex: 1;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-wrapper {
      width: 100%;
      height: 100%;
    }

    .player-container.mode-floating .player-video-section {
      /* Height determined by video aspect ratio */
    }

    .player-container.mode-minimized .player-video-section {
      aspect-ratio: 16 / 9;
    }

    /* Hidden mode - hide completely but keep in DOM */
    .player-container.mode-hidden {
      display: none;
    }

    .loading-state {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 10;
      pointer-events: none;
    }

    .loading-state .spinner-border {
      pointer-events: auto;
    }

    /* ===== SIDEBAR SECTIONS ===== */
    .sidebar-section {
      width: 380px;
      flex-shrink: 0;
      border-left: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
      background: rgba(15, 15, 15, 0.5);
      display: flex;
      flex-direction: column;
    }

    /* Queue sidebar */
    .queue-section {
      /* Uses queue-sidebar component */
    }

    /* Description sidebar */
    .description-section {
      max-height: 100%;
      overflow-y: auto;
    }

    .description-panel {
      display: flex;
      flex-direction: column;
      color: white;
    }

    .description-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(15, 15, 15, 0.5);
      backdrop-filter: blur(10px);

      h5 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }

    .description-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .video-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;

      i {
        font-size: 12px;
        opacity: 0.8;
      }
    }

    .description-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;

      a {
        color: rgba(13, 110, 253, 0.9);
        text-decoration: none;

        &:hover {
          color: rgba(13, 110, 253, 1);
          text-decoration: underline;
        }
      }

      .timestamp {
        color: rgba(13, 110, 253, 0.9);
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .description-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;

      i {
        font-size: 48px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    /* Custom scrollbar for description */
    .description-body::-webkit-scrollbar {
      width: 8px;
    }

    .description-body::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 4px;
    }

    .description-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .player-container.mode-floating.with-sidebar .player-wrapper {
        max-width: 100%;
      }
      .sidebar-section {
        width: 320px;
      }
    }

    @media (max-width: 768px) {
      .player-container.mode-floating {
        padding: 0;
      }

      .player-container.mode-floating .player-wrapper {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .player-content {
        flex-direction: column;
      }

      .sidebar-section {
        width: 100%;
        max-height: 40%;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .player-title {
        font-size: 14px;
      }

      .player-container.mode-minimized {
        bottom: 10px;
        right: 10px;
        left: 10px;
        width: auto;
        min-width: unset;
        max-width: unset;
      }
    }
  `]
})
export class FloatingPlayerModalComponent implements I18nMultilingual, OnInit, OnDestroy {
  readonly i18nDict: I18nDict = dict['player'];
  i18nStrings: I18nLocalized = {};

  @ViewChild('ekydumPlayer') ekydumPlayer?: any;

  private readonly destroy$ = new Subject<void>();

  displayMode: PlayerDisplayMode = PlayerDisplayMode.MODE_INACTIVE;
  currentVideo: YtVideoListItem | null = null;
  videoInfo: YtVideo | null = null;
  preferences: UserPreference[] = [];
  loading = false;
  showQueue = false;
  showDescription = false;
  showComments = false; // For future use
  isPlaying = false;
  hasNext = false;
  hasPrevious = false;
  queueLength = 0;

  isStarred = false;
  starLoading = false;

  isWatchLater = false;
  watchLaterLoading = false;

  private currentVideoId = '';
  private loadingSubscription?: any;

  constructor(
    public playerService: PlayerService,
    private api: ApiService,
    private i18nService: I18nService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.i18nService.translate(this.i18nDict).pipe(
      takeUntil(this.destroy$),
      tap((localized) => { this.i18nStrings = localized; })
    ).subscribe();

    // Subscribe to display mode
    this.playerService.displayMode$
    .pipe(takeUntil(this.destroy$))
    .subscribe(mode => {
      this.displayMode = mode;
    });

    // Subscribe to current video
    this.playerService.currentVideo$
    .pipe(takeUntil(this.destroy$))
    .subscribe(video => {
      this.currentVideo = video;

      if (video && video.yt_id !== this.currentVideoId) {
        this.currentVideoId = video.yt_id;

        // Cancel previous loading
        if (this.loadingSubscription) {
          this.loadingSubscription.unsubscribe();
        }

        this.loadVideoInfo(this.currentVideoId);
        this.checkStarred();
        this.checkWatchLater();
      }
    });

    // Subscribe to playing state
    this.playerService.isPlaying$
    .pipe(takeUntil(this.destroy$))
    .subscribe(playing => {
      this.isPlaying = playing;

      // Sync with actual player
      if (this.ekydumPlayer?.player) {
        if (playing && this.ekydumPlayer.player.paused) {
          this.ekydumPlayer.play();
        } else if (!playing && !this.ekydumPlayer.player.paused) {
          this.ekydumPlayer.pause();
        }
      }
    });

    // Update navigation states and queue length
    this.playerService.queue$
    .pipe(takeUntil(this.destroy$))
    .subscribe(queue => {
      this.queueLength = queue.length;
      this.hasNext = this.playerService.hasNext;
      this.hasPrevious = this.playerService.hasPrevious;
      // Auto-show queue if multiple items
      if (queue.length > 1 && !this.showDescription) {
        this.showQueue = true;
      } else if (queue.length <= 1) {
        this.showQueue = false;
      }
    });

    this.playerService.currentIndex$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.hasNext = this.playerService.hasNext;
      this.hasPrevious = this.playerService.hasPrevious;
    });

    // Load preferences
    this.loadPreferences();

    // Setup player events listener
    this.setupPlayerEvents();
  }

  ngOnDestroy(): void {
    // Cancel any pending loading
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== SIDEBAR TOGGLES =====

  toggleQueue(): void {
    this.showQueue = !this.showQueue;
    if (this.showQueue) {
      this.showDescription = false;
      this.showComments = false;
    }
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
    if (this.showDescription) {
      this.showQueue = false;
      this.showComments = false;
    }
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
    if (this.showComments) {
      this.showQueue = false;
      this.showDescription = false;
    }
  }

  // ===== PLAYER CONTROLS =====

  minimize(): void {
    this.playerService.uiMinimize();
  }

  restore(): void {
    this.playerService.uiMaximize();
  }

  hide(): void {
    this.playerService.uiHide();
  }

  close(): void {
    this.playerService.stop();
  }

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.playerService.pause();
      if (this.ekydumPlayer?.player) {
        this.ekydumPlayer.pause();
      }
    } else {
      this.playerService.play();
      if (this.ekydumPlayer?.player) {
        this.ekydumPlayer.play();
      }
    }
  }

  next(): void {
    this.playerService.next();
  }

  previous(): void {
    this.playerService.previous();
  }

  // ===== CHANNEL NAVIGATION =====

  onChannelClick(channelId: string): void {
    // Minimize player first
    this.minimize();
    // Navigate to channel page
    this.router.navigate(['/channel', channelId]);
  }

  // ===== STAR & WATCH LATER =====

  checkStarred(): void {
    this.isStarred = false;
    if (this.currentVideo) {
      var vidId = this.currentVideoId;
      this.api.checkStarred(vidId).subscribe({
        next: (data) => {
          if (this.currentVideoId === vidId) {
            this.isStarred = data?.starred || false;
          }
        }
      });
    }
  }

  checkWatchLater(): void {
    this.isWatchLater = false;
    if (this.currentVideo) {
      var vidId = this.currentVideoId;
      this.api.checkWatchLater(vidId).subscribe({
        next: (data) => {
          if (this.currentVideoId === vidId) {
            this.isWatchLater = data?.watch_later || false;
          }
        }
      });
    }
  }

  toggleStar(): void {
    var v = this.currentVideo;
    if (v) {
      var vidId = this.currentVideoId;
      this.starLoading = true;
      if (this.isStarred) {
        this.api.removeStarred(vidId).subscribe({
          next: () => {
            if (this.currentVideoId === vidId) {
              this.isStarred = false;
            }
            this.starLoading = false;
          },
          error: () => {
            this.starLoading = false;
          }
        });
      } else {
        this.api.addStarred(
          vidId,
          v.title || '',
          v.thumbnail_src || '',
          v.duration || 0,
          v.channel_id || '',
          v.channel_name,
        ).subscribe({
          next: () => {
            if (this.currentVideoId === vidId) {
              this.isStarred = true;
            }
            this.starLoading = false;
          },
          error: () => {
            this.starLoading = false;
          }
        });
      }
    }
  }

  toggleWatchLater(): void {
    var v = this.currentVideo;
    if (v) {
      var vidId = this.currentVideoId;
      this.watchLaterLoading = true;
      if (this.isWatchLater) {
        this.api.removeWatchLater(v.yt_id).subscribe({
          next: () => {
            if (this.currentVideoId === vidId) {
              this.isWatchLater = false;
            }
            this.watchLaterLoading = false;
          },
          error: () => {
            this.watchLaterLoading = false;
          }
        });
      } else {
        this.api.addWatchLater(
          v.yt_id,
          v.title,
          v.thumbnail_src,
          v.duration || 0,
          v.channel_id,
          v.channel_name,
        ).subscribe({
          next: () => {
            if (this.currentVideoId === vidId) {
              this.isWatchLater = true;
            }
            this.watchLaterLoading = false;
          },
          error: () => {
            this.watchLaterLoading = false;
          }
        });
      }
    }
  }

  // ===== HELPER METHODS =====

  formatCount(count: number): string {
    if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1) + 'M';
    } else if (count >= 1_000) {
      return (count / 1_000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  formatUploadDate(dateStr: string): string {
    if (dateStr?.length === 8) {
      var year = dateStr.slice(0, 4);
      var month = dateStr.slice(4, 6);
      var day = dateStr.slice(6, 8);
      return `${day}.${month}.${year}`;
    }
    return dateStr || '';
  }

  get formattedDescription(): string {
    if (!this.videoInfo?.description) return '';

    var desc = this.videoInfo.description;

    // Escape HTML
    desc = desc.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Convert URLs to links
    desc = desc.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Convert timestamps (e.g., 1:23, 01:23:45) to styled spans
    desc = desc.replace(
      /\b(\d{1,2}:)?(\d{1,2}):(\d{2})\b/g,
      '<span class="timestamp">$&</span>'
    );

    return desc;
  }

  // ===== PRIVATE METHODS =====

  private loadVideoInfo(videoId: string): void {
    this.loading = true;
    this.videoInfo = null;

    this.loadingSubscription = this.api.getVideo(videoId).subscribe({
      next: (video) => {
        if (videoId === this.currentVideoId) {
          this.videoInfo = video;
          this.loading = false;

          // Auto-play when video loads if supposed to be playing
          setTimeout(() => {
            if (this.ekydumPlayer && this.playerService.isPlaying) {
              this.ekydumPlayer.play();
            }
          }, 100);
        }
      },
      error: () => {
        if (videoId === this.currentVideoId) {
          this.loading = false;
        }
      }
    });
  }

  private loadPreferences(): void {
    this.api.getSettings().subscribe({
      next: (response) => {
        this.preferences = response?.settings || [];
      },
      error: () => {
        this.preferences = [];
      }
    });
  }

  private setupPlayerEvents(): void {
    setInterval(() => {
      if (this.ekydumPlayer?.player) {
        var videoEl = this.ekydumPlayer.player;

        // Update time
        if (!videoEl.paused) {
          this.playerService.updateTime(videoEl.currentTime, videoEl.duration);
        }

        // Check if video ended
        if (videoEl.ended) {
          this.playerService.onVideoEnded();
        }

        // Sync play/pause state
        var actuallyPlaying = !videoEl.paused;
        if (actuallyPlaying !== this.isPlaying) {
          if (actuallyPlaying) {
            this.playerService.play();
          } else {
            this.playerService.pause();
          }
        }
      }
    }, 500);
  }
}
