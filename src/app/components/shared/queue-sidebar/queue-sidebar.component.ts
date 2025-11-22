import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayerService } from '../../../services/player.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { VideoItemData } from '../../../models/video-item.model';

@Component({
  selector: 'app-queue-sidebar',
  standalone: false,
  template: `
    <div class="queue-sidebar glass-effect">
      <div class="queue-header">
        <h5>
          <i class="fas fa-list me-2"></i>
          Queue
          <span class="badge bg-secondary ms-2">{{ queue.length }}</span>
        </h5>
        <button
          class="btn btn-sm btn-outline-danger"
          (click)="clearQueue()"
          *ngIf="queue.length > 0"
          title="Clear Queue"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>

      <div class="queue-list" *ngIf="queue.length > 0">
        <div
          class="queue-item-wrapper"
          *ngFor="let item of queue; let i = index"
          [class.active]="i === currentIndex"
          (click)="playAt(i)"
        >
          <div class="current-indicator" *ngIf="i === currentIndex">
            <i class="fas fa-caret-right"></i>
          </div>
          <div class="queue-item-content">
            <div class="queue-thumbnail">
              <img [src]="item.thumbnail" [alt]="item.title" *ngIf="item.thumbnail">
              <div class="queue-number" *ngIf="i !== currentIndex">{{ i + 1 }}</div>
            </div>
            <div class="queue-info">
              <div class="queue-title">{{ item.title }}</div>
              <div class="queue-channel" *ngIf="item.channel_name">
                <i class="fas fa-user me-1"></i>{{ item.channel_name }}
              </div>
              <div class="queue-duration" *ngIf="item.duration">
                {{ formatDuration(item.duration) }}
              </div>
            </div>
            <button
              class="btn btn-sm queue-item-remove"
              (click)="removeFromQueue($event, item.yt_video_id)"
              title="Remove"
              *ngIf="i !== currentIndex"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="queue-empty" *ngIf="queue.length === 0">
        <i class="fas fa-list-ul mb-3"></i>
        <p class="mb-1">Queue is empty</p>
        <small class="text-muted">Add videos to start playing</small>
      </div>
    </div>
  `,
  styles: [`
    .queue-sidebar { display: flex; flex-direction: column; height: 100%; color: white; }
    .glass-effect { background: rgba(26, 26, 26, 0.8); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
    .queue-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(15, 15, 15, 0.5); backdrop-filter: blur(10px); }
    .queue-header h5 { margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
    .queue-header .btn-outline-danger { border-color: rgba(220, 53, 69, 0.3); color: #dc3545; background: rgba(220, 53, 69, 0.1); backdrop-filter: blur(10px); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .queue-header .btn-outline-danger:hover { background: rgba(220, 53, 69, 0.2); border-color: rgba(220, 53, 69, 0.5); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3); }
    .queue-list { flex: 1; overflow-y: auto; padding: 8px; }
    .queue-item-wrapper { margin-bottom: 8px; border-radius: 8px; overflow: hidden; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; position: relative; }
    .queue-item-wrapper:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); transform: translateX(4px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
    .queue-item-wrapper.active { background: rgba(13, 110, 253, 0.15); border: 1px solid rgba(13, 110, 253, 0.3); box-shadow: 0 0 20px rgba(13, 110, 253, 0.2); }
    .current-indicator { position: absolute; left: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; width: 32px; background: rgba(13, 110, 253, 0.3); border-right: 2px solid rgba(13, 110, 253, 0.6); backdrop-filter: blur(10px); z-index: 5; }
    .current-indicator i { font-size: 20px; color: white; text-shadow: 0 2px 8px rgba(13, 110, 253, 0.8); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { text-shadow: 0 2px 8px rgba(13, 110, 253, 0.8); } 50% { text-shadow: 0 4px 16px rgba(13, 110, 253, 1); } }
    .queue-item-content { display: flex; align-items: center; gap: 12px; padding: 8px; position: relative; }
    .queue-item-wrapper.active .queue-item-content { padding-left: 40px; }
    .queue-thumbnail { position: relative; width: 80px; height: 80px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: #2a2a2a; }
    .queue-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .queue-number { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
    .queue-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .queue-title { font-size: 14px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: white; }
    .queue-channel { font-size: 12px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .queue-duration { font-size: 11px; color: rgba(255,255,255,0.5); }
    .queue-item-remove { opacity: 0; transition: opacity 0.2s; background: rgba(220, 53, 69, 0.9); backdrop-filter: blur(10px); border: none; color: white; padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); align-self: flex-start; margin-top: 4px; }
    .queue-item-wrapper:hover .queue-item-remove { opacity: 1; }
    .queue-item-remove:hover { background: rgba(220, 53, 69, 1); transform: scale(1.1); }
    .queue-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: rgba(255,255,255,0.4); text-align: center; }
    .queue-empty i { font-size: 64px; opacity: 0.2; margin-bottom: 16px; }
    .queue-empty p { margin: 0; font-size: 16px; font-weight: 600; }
    .queue-list::-webkit-scrollbar { width: 8px; }
    .queue-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
    .queue-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; backdrop-filter: blur(10px); }
    .queue-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
  `]
})
export class QueueSidebarComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  queue: VideoItemData[] = [];
  currentIndex = -1;

  constructor(private playerService: PlayerService, private router: Router) {}

  ngOnInit(): void {
    this.playerService.queue$.pipe(takeUntil(this.destroy$)).subscribe(queue => { this.queue = queue; });
    this.playerService.currentIndex$.pipe(takeUntil(this.destroy$)).subscribe(index => { this.currentIndex = index; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  playAt(index: number): void {
    this.playerService.playVideoAtIndex(index);
  }

  removeFromQueue(event: Event, videoId: string): void {
    event.stopPropagation();
    this.playerService.queueRemove(videoId);
  }

  clearQueue(): void {
    if (confirm('Clear all videos from queue?')) {
      this.playerService.queueClear();
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '';
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
