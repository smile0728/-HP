export interface MemberProfile {
  id: 'smile' | 'caramel';
  name: string;
  jpName: string;
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
  title: string;
  originalSong: string;
  youtubeUrl: string; // Embed or mock play
  thumbnailUrl: string;
  releasedDate: string;
  smileComment: string;
  caramelComment: string;
  heartsCount: number;
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
  title: string;
  description: string;
  luckLevel: '超大吉' | '大吉' | '激吉' | '中吉' | '吉' | 'あろはーず吉';
  commentSmile: string;
  commentCaramel: string;
  luckyItem: string;
  luckyDance: string;
  ratingSmile: number; // 1-5
  ratingCaramel: number; // 1-5
}
