import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { PlayerDisplayMode } from '../models/player-display-mode.model';
import { YtVideoListItem } from '../models/protocol/yt-video-list-item.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  // State subjects
  private readonly queueSubject$ = new BehaviorSubject<YtVideoListItem[]>([]);
  private readonly currentIndexSubject$ = new BehaviorSubject<number>(-1);
  private readonly currentVideoSubject$ = new BehaviorSubject<YtVideoListItem | null>(null);
  private readonly durationSubject$ = new BehaviorSubject<number>(0);
  private readonly currentTimeSubject$ = new BehaviorSubject<number>(0);
  private readonly isPlayingSubject$ = new BehaviorSubject<boolean>(false);
  private readonly displayModeSubject$ = new BehaviorSubject<PlayerDisplayMode>(PlayerDisplayMode.MODE_INACTIVE);

  // Public observables
  readonly queue$ = this.queueSubject$.asObservable();
  readonly currentIndex$ = this.currentIndexSubject$.asObservable();
  readonly currentVideo$ = this.currentVideoSubject$.asObservable();
  readonly duration$ = this.durationSubject$.asObservable();
  readonly currentTime$ = this.currentTimeSubject$.asObservable();
  readonly isPlaying$ = this.isPlayingSubject$.asObservable();
  readonly displayMode$ = this.displayModeSubject$.asObservable();

  // Getters for current values
  get queue(): YtVideoListItem[] { return this.queueSubject$.value; }
  get currentIndex(): number { return this.currentIndexSubject$.value; }
  get currentVideo(): YtVideoListItem | null { return this.currentVideoSubject$.value; }
  get duration(): number { return this.durationSubject$.value; }
  get currentTime(): number { return this.currentTimeSubject$.value; }
  get isPlaying(): boolean { return this.isPlayingSubject$.value; }
  get displayMode(): PlayerDisplayMode { return this.displayModeSubject$.value; }

  constructor(private router: Router) {}

  // Queue Management
  queueAdd(video: YtVideoListItem): void {
    var queue = this.queueSubject$.value;
    var wasEmpty = queue.length === 0;

    queue.push(video);
    this.queueSubject$.next([...queue]);

    // If queue was empty, start playing in minimized mode
    if (wasEmpty) {
      this.currentIndexSubject$.next(0);
      this.currentVideoSubject$.next(video);
      this.isPlayingSubject$.next(true);
      this.displayModeSubject$.next(PlayerDisplayMode.MODE_MINIMIZED);
    }
  }

  queueSet(videos: YtVideoListItem[]): void {
    this.queueSubject$.next([...videos]);
    if (videos.length > 0) {
      this.playVideoAtIndex(0);
    }
  }

  queueRemove(videoId: string): void {
    var queue = this.queueSubject$.value.filter(v => v.yt_id !== videoId);
    var currentIndex = this.currentIndexSubject$.value;

    // Adjust current index if needed
    if (currentIndex >= queue.length) {
      currentIndex = queue.length - 1;
      this.currentIndexSubject$.next(currentIndex);
    }

    this.queueSubject$.next(queue);
  }

  queueClear(): void {
    this.queueSubject$.next([]);
    this.currentIndexSubject$.next(-1);
    this.currentVideoSubject$.next(null);
    this.durationSubject$.next(0);
    this.currentTimeSubject$.next(0);
    this.isPlayingSubject$.next(false);
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_INACTIVE);
  }

  // Playback Control
  playVideo(video: YtVideoListItem): void {
    // Replace entire queue with single video and play in FLOATING mode
    this.queueSubject$.next([video]);
    this.currentIndexSubject$.next(0);
    this.currentVideoSubject$.next(video);
    this.isPlayingSubject$.next(true);
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_FLOATING);
  }

  playVideoAtIndex(index: number): void {
    // Play video from existing queue without replacing it
    var queue = this.queueSubject$.value;
    if (index >= 0 && index < queue.length) {
      this.currentIndexSubject$.next(index);
      this.currentVideoSubject$.next(queue[index]);
      this.isPlayingSubject$.next(true);

      // Keep current display mode or set to FLOATING if inactive
      if (this.displayModeSubject$.value === PlayerDisplayMode.MODE_INACTIVE) {
        this.displayModeSubject$.next(PlayerDisplayMode.MODE_FLOATING);
      }
    }
  }

  play(): void {
    var queue = this.queueSubject$.value;
    if (queue.length > 0 && this.currentIndex === -1) {
      this.playVideoAtIndex(0);
    } else {
      this.isPlayingSubject$.next(true);
    }
  }

  pause(): void {
    this.isPlayingSubject$.next(false);
  }

  stop(): void {
    this.currentVideoSubject$.next(null);
    this.isPlayingSubject$.next(false);
    this.currentTimeSubject$.next(0);
    this.durationSubject$.next(0);
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_INACTIVE);
  }

  next(): void {
    var currentIndex = this.currentIndexSubject$.value;
    var queue = this.queueSubject$.value;

    if (currentIndex < queue.length - 1) {
      this.playVideoAtIndex(currentIndex + 1);
    } else {
      this.stop();
    }
  }

  previous(): void {
    var currentIndex = this.currentIndexSubject$.value;
    if (currentIndex > 0) {
      this.playVideoAtIndex(currentIndex - 1);
    }
  }

  togglePlayPause(): void {
    if (this.isPlayingSubject$.value) {
      this.pause();
    } else {
      this.play();
    }
  }

  // UI State Management
  uiMinimize(): void {
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_MINIMIZED);
  }

  uiMaximize(): void {
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_FLOATING);
  }

  uiHide(): void {
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_HIDDEN);
  }

  uiUnhide(): void {
    // Restore to floating mode when unhiding
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_FLOATING);
  }

  closeFloatingPlayer(): void {
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_INACTIVE);
  }

  openFloatingPlayer(): void {
    this.displayModeSubject$.next(PlayerDisplayMode.MODE_FLOATING);
  }

  expandToFullPage(): void {
    var video = this.currentVideoSubject$.value;
    if (video) {
      this.router.navigate(['/watch', video.yt_id]);
      this.displayModeSubject$.next(PlayerDisplayMode.MODE_INACTIVE);
    }
  }

  // Time Management
  updateTime(currentTime: number, duration: number): void {
    this.currentTimeSubject$.next(currentTime);
    this.durationSubject$.next(duration);
  }

  seekTo(time: number): void {
    this.currentTimeSubject$.next(time);
  }

  onVideoEnded(): void {
    this.next();
  }

  get hasNext(): boolean {
    return this.currentIndexSubject$.value < this.queueSubject$.value.length - 1;
  }

  get hasPrevious(): boolean {
    return this.currentIndexSubject$.value > 0;
  }
}
