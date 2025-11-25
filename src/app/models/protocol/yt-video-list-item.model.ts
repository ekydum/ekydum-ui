export interface YtVideoListItem {
  yt_id?: string;
  yt_video_id: string;
  title: string;
  thumbnail: string;
  duration: number;
  view_count?: number;
  channel_name?: string;
  channel_id?: string;
  upload_date?: string;
}
