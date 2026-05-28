export interface MemberProfile {
  id: 'smile' | 'caramel';
  name: string;
  jpName: string;
  imageUrl?: string;
  color: string;
  subColor: string;
  signature: string;
  tagline: string;
  birthday: string;
  bloodType: string;
  likes: string[];
  dislikes: string[];
  message: string;
  stickerStyle: string;
}

export interface DanceVideo {
  id: string;
  title?: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  releasedDate?: string;
  originalSong?: string;
  smileComment?: string;
  caramelComment?: string;
  heartsCount: number;
  visible?: boolean;
  sortOrder?: number;
}

export interface MusicTrack {
  id: string;
  title?: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  composer?: string;
  notes?: Array<{ note: number; duration: number }>;
  likes: number;
  visible?: boolean;
  sortOrder?: number;
}

export interface SiteImages {
  mainVisualUrl: string;
  logoUrl: string;
  footerLogoUrl: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  author: 'smile' | 'caramel';
  title: string;
  content: string;
  response: string; // The other girl's response comment
  stickers: string[]; // icon names or emotions
}

export interface FanComment {
  id: string;
  diaryId: string;
  userName: string;
  avatarSeed: string; // for random cute color/pfp
  content: string;
  timestamp: string;
  stickyColor: 'pink' | 'yellow' | 'orange' | 'green' | 'blue';
}

export interface FortuneResult {
  id?: string;
  title: string;
  description: string;
  luckLevel: string;
  imageUrl?: string;
  commentSmile: string;
  commentCaramel: string;
  luckyItem: string;
  luckyDance: string;
  ratingSmile: number; // 1-5
  ratingCaramel: number; // 1-5
}
