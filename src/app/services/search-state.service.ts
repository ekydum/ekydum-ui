import { Injectable } from '@angular/core';
import { VideoItemData } from '../models/video-item.model';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  searchQuery = '';
  lastSearchQuery = '';
  videos: VideoItemData[] = [];
  searched = false;
  currentOffset = 0;
  pageSize = 20;
}
