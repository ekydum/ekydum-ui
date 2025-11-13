import { YtDlpSourceFormat } from '../../../models/yt-dlp-video-info.interface';

export enum Ekydum_SourceKind {
  COMBINED = 0,
  VIDEO_ONLY = 1,
  AUDIO_ONLY = 2,
  OTHER = 3,
}

export interface Ekydum_SourceFormat extends YtDlpSourceFormat {
  ekydum_isHls: boolean;
  ekydum_label: string;
  ekydum_sourceKind: Ekydum_SourceKind;
  ekydum_isCurrent: boolean;
}
