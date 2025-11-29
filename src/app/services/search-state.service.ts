import { Injectable } from '@angular/core';
import { YtVideoListItem } from '../models/protocol/yt-video-list-item.model';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  searchQuery = '';
  lastSearchQuery = '';
  videos: YtVideoListItem[] = [];
  searched = false;
  currentOffset = 0;
  pageSize = 50;
}
