import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInAnonymously,
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  increment,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DANCE_VIDEOS, MEMBERS } from '../data';
import { DanceVideo, MemberProfile, MusicTrack } from '../types';

// Recognize if setup is using mocked keys
export const isMockFirebase = firebaseConfig.apiKey === 'mock-api-key' || !firebaseConfig.apiKey;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Error handler specified by the Firebase skill requirements
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// LOCAL STORAGE FALLBACK ENGINE FOR SEAMLESS OFF-LINE & PREVIEW USE
// ----------------------------------------------------
const LOCAL_STORAGE_PREFIX = 'alohaz_firestore_';

function getLocalStorageData<T>(key: string, defaultData: T[]): T[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(stored);
}

function saveLocalStorageData<T>(key: string, data: T[]) {
  localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
}

const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'ハッピー・キャンディ・ステップ 🍬',
    composer: 'すまいる選曲！',
    likes: 128,
    visible: true,
    sortOrder: 1,
    notes: [
      { note: 261.63, duration: 0.2 },
      { note: 293.66, duration: 0.2 },
      { note: 329.63, duration: 0.2 },
      { note: 349.23, duration: 0.2 },
      { note: 392.00, duration: 0.2 },
      { note: 329.63, duration: 0.2 },
      { note: 392.00, duration: 0.4 },
      { note: 440.00, duration: 0.2 },
      { note: 392.00, duration: 0.2 },
      { note: 349.23, duration: 0.2 },
      { note: 329.63, duration: 0.2 },
      { note: 293.66, duration: 0.2 },
      { note: 261.63, duration: 0.4 }
    ]
  },
  {
    id: 'track-2',
    title: '夕焼けメロンソーダ 🥤',
    composer: 'きゃらめる選曲！',
    likes: 128,
    visible: true,
    sortOrder: 2,
    notes: [
      { note: 329.63, duration: 0.3 },
      { note: 392.00, duration: 0.3 },
      { note: 440.00, duration: 0.3 },
      { note: 523.25, duration: 0.3 },
      { note: 493.88, duration: 0.3 },
      { note: 440.00, duration: 0.3 },
      { note: 392.00, duration: 0.6 },
      { note: 349.23, duration: 0.3 },
      { note: 329.63, duration: 0.3 },
      { note: 293.66, duration: 0.3 },
      { note: 392.00, duration: 0.6 }
    ]
  }
];

const normalizeMusicNotes = (notes: unknown): Array<{ note: number; duration: number }> => {
  if (!Array.isArray(notes)) return DEFAULT_MUSIC_TRACKS[0].notes;
  const normalized = notes
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const note = Number((item as { note?: unknown }).note);
      const duration = Number((item as { duration?: unknown }).duration);
      if (!Number.isFinite(note) || !Number.isFinite(duration) || note <= 0 || duration <= 0) return null;
      return { note, duration };
    })
    .filter((item): item is { note: number; duration: number } => item !== null);
  return normalized.length > 0 ? normalized : DEFAULT_MUSIC_TRACKS[0].notes;
};

// ----------------------------------------------------
// PUBLIC THEATER / MUSIC / PROFILE CONTENT
// ----------------------------------------------------
export const getDanceVideos = async (adminView = false): Promise<DanceVideo[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<DanceVideo>('dance_videos', DANCE_VIDEOS);
    return adminView ? list : list.filter((item) => item.visible !== false);
  }

  const path = 'dance_videos';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: DanceVideo[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        title: d.title || '',
        originalSong: d.originalSong || '',
        youtubeUrl: d.youtubeUrl || '',
        thumbnailUrl: d.thumbnailUrl || '',
        releasedDate: d.releasedDate || '',
        smileComment: d.smileComment || '',
        caramelComment: d.caramelComment || '',
        heartsCount: Number(d.heartsCount ?? 0),
        visible: d.visible !== false,
        sortOrder: Number(d.sortOrder ?? 99)
      });
    });
    const sorted = (items.length > 0 ? items : DANCE_VIDEOS).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    return adminView ? sorted : sorted.filter((item) => item.visible !== false);
  } catch (error) {
    console.warn('Could not query Firestore dance videos, utilizing fallback storage', error);
    const list = getLocalStorageData<DanceVideo>('dance_videos', DANCE_VIDEOS);
    return adminView ? list : list.filter((item) => item.visible !== false);
  }
};

export const saveDanceVideo = async (video: DanceVideo): Promise<void> => {
  const list = getLocalStorageData<DanceVideo>('dance_videos', DANCE_VIDEOS);
  const foundIdx = list.findIndex((item) => item.id === video.id);
  if (foundIdx !== -1) list[foundIdx] = video;
  else list.push(video);
  saveLocalStorageData('dance_videos', list);

  if (isMockFirebase) return;
  const path = `dance_videos/${video.id}`;
  try {
    await setDoc(doc(db, 'dance_videos', video.id), {
      title: video.title,
      originalSong: video.originalSong,
      youtubeUrl: video.youtubeUrl,
      thumbnailUrl: video.thumbnailUrl,
      releasedDate: video.releasedDate,
      smileComment: video.smileComment,
      caramelComment: video.caramelComment,
      heartsCount: video.heartsCount,
      visible: video.visible !== false,
      sortOrder: Number(video.sortOrder ?? 99),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteDanceVideo = async (id: string): Promise<void> => {
  const list = getLocalStorageData<DanceVideo>('dance_videos', DANCE_VIDEOS);
  saveLocalStorageData('dance_videos', list.filter((item) => item.id !== id));

  if (isMockFirebase) return;
  const path = `dance_videos/${id}`;
  try {
    await deleteDoc(doc(db, 'dance_videos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getMusicTracks = async (adminView = false): Promise<MusicTrack[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<MusicTrack>('music_tracks', DEFAULT_MUSIC_TRACKS);
    return adminView ? list : list.filter((item) => item.visible !== false);
  }

  const path = 'music_tracks';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: MusicTrack[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        title: d.title || '',
        composer: d.composer || '',
        notes: normalizeMusicNotes(d.notes),
        likes: Number(d.likes ?? 0),
        visible: d.visible !== false,
        sortOrder: Number(d.sortOrder ?? 99)
      });
    });
    const sorted = (items.length > 0 ? items : DEFAULT_MUSIC_TRACKS).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    return adminView ? sorted : sorted.filter((item) => item.visible !== false);
  } catch (error) {
    console.warn('Could not query Firestore music tracks, utilizing fallback storage', error);
    const list = getLocalStorageData<MusicTrack>('music_tracks', DEFAULT_MUSIC_TRACKS);
    return adminView ? list : list.filter((item) => item.visible !== false);
  }
};

export const saveMusicTrack = async (track: MusicTrack): Promise<void> => {
  const normalizedTrack = { ...track, notes: normalizeMusicNotes(track.notes) };
  const list = getLocalStorageData<MusicTrack>('music_tracks', DEFAULT_MUSIC_TRACKS);
  const foundIdx = list.findIndex((item) => item.id === normalizedTrack.id);
  if (foundIdx !== -1) list[foundIdx] = normalizedTrack;
  else list.push(normalizedTrack);
  saveLocalStorageData('music_tracks', list);

  if (isMockFirebase) return;
  const path = `music_tracks/${normalizedTrack.id}`;
  try {
    await setDoc(doc(db, 'music_tracks', normalizedTrack.id), {
      title: normalizedTrack.title,
      composer: normalizedTrack.composer,
      notes: normalizedTrack.notes,
      likes: normalizedTrack.likes,
      visible: normalizedTrack.visible !== false,
      sortOrder: Number(normalizedTrack.sortOrder ?? 99),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteMusicTrack = async (id: string): Promise<void> => {
  const list = getLocalStorageData<MusicTrack>('music_tracks', DEFAULT_MUSIC_TRACKS);
  saveLocalStorageData('music_tracks', list.filter((item) => item.id !== id));

  if (isMockFirebase) return;
  const path = `music_tracks/${id}`;
  try {
    await deleteDoc(doc(db, 'music_tracks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getMemberProfiles = async (adminView = false): Promise<MemberProfile[]> => {
  if (isMockFirebase) {
    return getLocalStorageData<MemberProfile>('member_profiles', MEMBERS);
  }

  const path = 'member_profiles';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: MemberProfile[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      const id = doc.id === 'caramel' ? 'caramel' : 'smile';
      items.push({
        id,
        name: d.name || '',
        jpName: d.jpName || '',
        color: d.color || (id === 'smile' ? '#FF9E00' : '#FF6B8B'),
        subColor: d.subColor || (id === 'smile' ? '#FFD000' : '#FFA5A5'),
        signature: d.signature || '',
        tagline: d.tagline || '',
        birthday: d.birthday || '',
        bloodType: d.bloodType || '',
        likes: Array.isArray(d.likes) ? d.likes.filter((item: unknown) => typeof item === 'string') : [],
        dislikes: Array.isArray(d.dislikes) ? d.dislikes.filter((item: unknown) => typeof item === 'string') : [],
        message: d.message || '',
        stickerStyle: d.stickerStyle || ''
      });
    });
    if (items.length === 0) return MEMBERS;
    const order = ['smile', 'caramel'];
    return items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  } catch (error) {
    console.warn('Could not query Firestore member profiles, utilizing fallback storage', error);
    return getLocalStorageData<MemberProfile>('member_profiles', MEMBERS);
  }
};

export const saveMemberProfile = async (profile: MemberProfile): Promise<void> => {
  const list = getLocalStorageData<MemberProfile>('member_profiles', MEMBERS);
  const foundIdx = list.findIndex((item) => item.id === profile.id);
  if (foundIdx !== -1) list[foundIdx] = profile;
  else list.push(profile);
  saveLocalStorageData('member_profiles', list);

  if (isMockFirebase) return;
  const path = `member_profiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'member_profiles', profile.id), {
      name: profile.name,
      jpName: profile.jpName,
      color: profile.color,
      subColor: profile.subColor,
      signature: profile.signature,
      tagline: profile.tagline,
      birthday: profile.birthday,
      bloodType: profile.bloodType,
      likes: profile.likes,
      dislikes: profile.dislikes,
      message: profile.message,
      stickerStyle: profile.stickerStyle,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// ----------------------------------------------------
// TELEMETRY LOGGING (DAILY ACCESS STATS)
// ----------------------------------------------------
export interface DailyStat {
  id: string; // YYYY-MM-DD
  pageViews: number;
  fortunesDrawn: number;
  completions: number;
  galleryViews: number;
  snsClicks: number;
  videoClicks: number;
}

export const logTelemetryEvent = async (type: keyof Omit<DailyStat, 'id'>) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (isMockFirebase) {
    const stats = getLocalStorageData<DailyStat>('daily_stats', []);
    let day = stats.find(s => s.id === todayStr);
    if (!day) {
      day = { id: todayStr, pageViews: 0, fortunesDrawn: 0, completions: 0, galleryViews: 0, snsClicks: 0, videoClicks: 0 };
      stats.push(day);
    }
    day[type] = (day[type] || 0) + 1;
    saveLocalStorageData('daily_stats', stats);
    return;
  }

  const docRef = doc(db, 'daily_stats', todayStr);
  try {
    await setDoc(docRef, { [type]: increment(1) }, { merge: true });
  } catch (err) {
    // Silently fall back to localStorage if connection is pending
    const stats = getLocalStorageData<DailyStat>('daily_stats', []);
    let day = stats.find(s => s.id === todayStr);
    if (!day) {
      day = { id: todayStr, pageViews: 0, fortunesDrawn: 0, completions: 0, galleryViews: 0, snsClicks: 0, videoClicks: 0 };
      stats.push(day);
    }
    day[type] = (day[type] || 0) + 1;
    saveLocalStorageData('daily_stats', stats);
  }
};

export const getDailyStats = async (): Promise<DailyStat[]> => {
  if (isMockFirebase) {
    // Generate mock stats over 7 days if empty for stunning dashboard visualization
    let stats = getLocalStorageData<DailyStat>('daily_stats', []);
    if (stats.length === 0) {
      stats = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dtStr = d.toISOString().split('T')[0];
        return {
          id: dtStr,
          pageViews: Math.floor(Math.random() * 80) + 40,
          fortunesDrawn: Math.floor(Math.random() * 20) + 5,
          completions: Math.floor(Math.random() * 3) + 1,
          galleryViews: Math.floor(Math.random() * 30) + 10,
          snsClicks: Math.floor(Math.random() * 15) + 5,
          videoClicks: Math.floor(Math.random() * 25) + 8
        };
      });
      saveLocalStorageData('daily_stats', stats);
    }
    return stats.sort((a, b) => a.id.localeCompare(b.id));
  }

  const path = 'daily_stats';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: DailyStat[] = [];
    qSnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        pageViews: data.pageViews || 0,
        fortunesDrawn: data.fortunesDrawn || 0,
        completions: data.completions || 0,
        galleryViews: data.galleryViews || 0,
        snsClicks: data.snsClicks || 0,
        videoClicks: data.videoClicks || 0
      });
    });
    return items.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

// ----------------------------------------------------
// FAN GACHA ACCOUNT STATE
// ----------------------------------------------------
export interface UserGachaState {
  lastDrawDate: string;
  todayFortune: Record<string, unknown> | null;
  collection: string[];
  visitorName: string;
  updatedAt?: string;
}

export const ensureFanUser = async (): Promise<FirebaseUser | null> => {
  if (isMockFirebase) return null;
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
};

export const getUserGachaState = async (uid: string): Promise<UserGachaState | null> => {
  if (isMockFirebase) return null;

  const path = `users/${uid}/gacha/state`;
  try {
    const snapshot = await getDoc(doc(db, 'users', uid, 'gacha', 'state'));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      lastDrawDate: typeof data.lastDrawDate === 'string' ? data.lastDrawDate : '',
      todayFortune: data.todayFortune || null,
      collection: Array.isArray(data.collection) ? data.collection.filter((item) => typeof item === 'string') : [],
      visitorName: typeof data.visitorName === 'string' ? data.visitorName : '',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined
    };
  } catch (error) {
    console.warn('Could not load user gacha state, using local storage fallback', error);
    return null;
  }
};

export const saveUserGachaState = async (uid: string, state: UserGachaState): Promise<void> => {
  if (isMockFirebase) return;

  const path = `users/${uid}/gacha/state`;
  try {
    await setDoc(doc(db, 'users', uid, 'gacha', 'state'), {
      lastDrawDate: state.lastDrawDate,
      todayFortune: state.todayFortune,
      collection: state.collection,
      visitorName: state.visitorName,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn(`Could not save user gacha state at ${path}`, error);
  }
};

// ----------------------------------------------------
// PHOTOS COLLECTION OPERATIONS
// ----------------------------------------------------
export interface PhotoEntry {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  comment: string;
  visible: boolean;
}

const DEFAULT_PHOTOS: PhotoEntry[] = [
  { id: 'p1', title: '結成日のワンショット', imageUrl: 'https://picsum.photos/seed/photo1/500/500', comment: 'あろはーずとしての第一歩を描いた、記念すべき日！ドキドキが止まりませんでした✨', date: '2025.04.01', visible: true },
  { id: 'p2', title: 'スタジオ練習でヘトヘト（笑）', imageUrl: 'https://picsum.photos/seed/photo2/500/500', comment: '3時間ぶっ続けでハッピーシンセサイザを踊りきったあとの2人（笑）お疲れ様でした！', date: '2025.05.15', visible: true },
  { id: 'p3', title: 'ひまわり畑でのロケ撮影！🌻', imageUrl: 'https://picsum.photos/seed/photo3/500/500', comment: '一面に咲くひまわり畑でお日様を浴びながら撮影！スマイル全開のベストショットです🌻', date: '2025.08.21', visible: true },
  { id: 'p4', title: 'お気に入りキャラメルパフェ！🍧', imageUrl: 'https://picsum.photos/seed/photo4/500/500', comment: 'ダンス練習のご褒美に食べた巨大パフェ。キャラメルソースがたっぷりで超幸せでした🍨', date: '2025.11.12', visible: true },
  { id: 'p5', title: 'ステージ裏のドタバタ２人組', imageUrl: 'https://picsum.photos/seed/photo5/500/500', comment: 'いよいよ本番直前のステージ裏！お互いの背中を叩いて気合いを入れているところをパシャリ！', date: '2026/02/14', visible: true },
  { id: 'p6', title: '帰り道の夕焼けポーズ！✨', imageUrl: 'https://picsum.photos/seed/photo6/500/500', comment: '帰り道の夕暮れ時。今日の夕焼けはオレンジ色できれいだったな🌇また明日も楽しもうね！', date: '2026/05/18', visible: true }
];

export const getPhotos = async (adminView = false): Promise<PhotoEntry[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<PhotoEntry>('photos', DEFAULT_PHOTOS);
    return adminView ? list : list.filter(p => p.visible);
  }

  const path = 'photos';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: PhotoEntry[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        imageUrl: d.imageUrl || '',
        title: d.title || '',
        date: d.date || '',
        comment: d.comment || '',
        visible: d.visible !== false
      });
    });
    const sorted = items.sort((a, b) => b.date.localeCompare(a.date));
    return adminView ? sorted : sorted.filter(p => p.visible);
  } catch (error) {
    console.warn("Could not query Firestore photos, utilizing fallback storage", error);
    const list = getLocalStorageData<PhotoEntry>('photos', DEFAULT_PHOTOS);
    return adminView ? list : list.filter(p => p.visible);
  }
};

export const savePhoto = async (photo: PhotoEntry): Promise<void> => {
  const statsList = getLocalStorageData<PhotoEntry>('photos', DEFAULT_PHOTOS);
  const foundIdx = statsList.findIndex(p => p.id === photo.id);
  if (foundIdx !== -1) {
    statsList[foundIdx] = photo;
  } else {
    statsList.push(photo);
  }
  saveLocalStorageData('photos', statsList);

  if (isMockFirebase) return;
  const path = `photos/${photo.id}`;
  try {
    await setDoc(doc(db, 'photos', photo.id), {
      imageUrl: photo.imageUrl,
      title: photo.title,
      date: photo.date,
      comment: photo.comment,
      visible: photo.visible,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePhoto = async (id: string): Promise<void> => {
  const statsList = getLocalStorageData<PhotoEntry>('photos', DEFAULT_PHOTOS);
  const filtered = statsList.filter(p => p.id !== id);
  saveLocalStorageData('photos', filtered);

  if (isMockFirebase) return;
  const path = `photos/${id}`;
  try {
    await deleteDoc(doc(db, 'photos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// EXCHANGE DIARY COLLECTION OPERATIONS
// ----------------------------------------------------
export interface DiaryRecord {
  id: string;
  date: string;
  author: 'smile' | 'caramel';
  title: string;
  content: string;
  response: string;
  stickers: string[];
  visible: boolean;
}

const DEFAULT_DIARIES: DiaryRecord[] = [
  {
    id: 'diary-1',
    date: '2026/05/24',
    author: 'smile',
    title: '今日から新コーナー！交換日記はじめるよ！✨',
    content: 'みんなあろはーず！すまいるだよ！今日からこのHPで『交換日記コーナー』をスタートすることになりましたー！パチパチパチ👏\n\nSNSだと言いきれない2人の日常とか、最近買った変なおもちゃの話とか（笑）、ゆるーく届けていきます！きゃらめる、ちゃんと毎日書いてね〜〜〜！！約束！！🌻🍊',
    response: 'きゃらめる：約束の指切り、すでに3回くらいしてる気がする…（がんばります！🥺）',
    stickers: ['🌞', '🔥', '🍊'],
    visible: true
  },
  {
    id: 'diary-2',
    date: '2026/05/25',
    author: 'caramel',
    title: '今日のご褒美はイチゴのタルト🍓',
    content: 'すまいるに呼び出されて、今日のハードなスタジオレッスンのあとに、駅前のレトロな喫茶店に行ってきました。そこのイチゴタルト、生クリームがもこもこで夢みたいな味だったよぉ…🧸\n\nすまいるは相変わらずクリームソーダを３秒くらいで飲み干しててびっくりした。明日は早起きだけどがんばるね。',
    response: 'すまいる：３秒じゃないよ！５秒はかかったもん！🥤 てかいちご一口食べる約束だったじゃん！ずるい！',
    stickers: ['🍓', '🍰', '🧸'],
    visible: true
  }
];

export const getDiaries = async (adminView = false): Promise<DiaryRecord[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<DiaryRecord>('diaries', DEFAULT_DIARIES);
    return adminView ? list : list.filter(p => p.visible);
  }

  const path = 'diaries';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: DiaryRecord[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        date: d.date || '',
        author: d.author || 'smile',
        title: d.title || '',
        content: d.content || '',
        response: d.response || '',
        stickers: Array.isArray(d.stickers) ? d.stickers : [],
        visible: d.visible !== false
      });
    });
    const sorted = items.sort((a, b) => b.date.localeCompare(a.date));
    return adminView ? sorted : sorted.filter(p => p.visible);
  } catch (error) {
    console.warn("Could not query Firestore diaries, utilizing fallback storage", error);
    const list = getLocalStorageData<DiaryRecord>('diaries', DEFAULT_DIARIES);
    return adminView ? list : list.filter(p => p.visible);
  }
};

export const saveDiary = async (diary: DiaryRecord): Promise<void> => {
  const statsList = getLocalStorageData<DiaryRecord>('diaries', DEFAULT_DIARIES);
  const foundIdx = statsList.findIndex(p => p.id === diary.id);
  if (foundIdx !== -1) {
    statsList[foundIdx] = diary;
  } else {
    statsList.push(diary);
  }
  saveLocalStorageData('diaries', statsList);

  if (isMockFirebase) return;
  const path = `diaries/${diary.id}`;
  try {
    await setDoc(doc(db, 'diaries', diary.id), {
      date: diary.date,
      author: diary.author,
      title: diary.title,
      content: diary.content,
      response: diary.response,
      stickers: diary.stickers,
      visible: diary.visible,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteDiary = async (id: string): Promise<void> => {
  const statsList = getLocalStorageData<DiaryRecord>('diaries', DEFAULT_DIARIES);
  const filtered = statsList.filter(p => p.id !== id);
  saveLocalStorageData('diaries', filtered);

  if (isMockFirebase) return;
  const path = `diaries/${id}`;
  try {
    await deleteDoc(doc(db, 'diaries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// ANNOUNCEMENT COLLECTION OPERATIONS
// ----------------------------------------------------
export interface AnnouncementEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  visible: boolean;
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementEntry[] = [
  { id: 'a1', date: '2026/05/25', title: '【重要】ホームページを新しくオープンしました！🌻🧸', content: 'あろはーずオフィシャルWebサイトがついに大公開！メンバープロフィールのほか、新コーナー「交換日記」や、1日1回引ける「開運おみくじガチャ」も遊べるよ！ぜひ毎日見にきてね🍭', visible: true },
  { id: 'a2', date: '2026/05/28', title: '【お披露目予告】あろはーず重大発表の生配信決定！？', content: 'メンバーのすまいる＆きゃらめるから重大なお知らせ…！？結成記念をお祝いするプレミア生配信を企画中。詳細はのちほどお知らせします！お見逃しなく✨', visible: true }
];

export const getAnnouncements = async (adminView = false): Promise<AnnouncementEntry[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<AnnouncementEntry>('announcements', DEFAULT_ANNOUNCEMENTS);
    return adminView ? list : list.filter(p => p.visible);
  }

  const path = 'announcements';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: AnnouncementEntry[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        date: d.date || '',
        title: d.title || '',
        content: d.content || '',
        visible: d.visible !== false
      });
    });
    const sorted = items.sort((a, b) => b.date.localeCompare(a.date));
    return adminView ? sorted : sorted.filter(p => p.visible);
  } catch (error) {
    console.warn("Could not query Firestore announcements, utilizing fallback storage", error);
    const list = getLocalStorageData<AnnouncementEntry>('announcements', DEFAULT_ANNOUNCEMENTS);
    return adminView ? list : list.filter(p => p.visible);
  }
};

export const saveAnnouncement = async (ann: AnnouncementEntry): Promise<void> => {
  const statsList = getLocalStorageData<AnnouncementEntry>('announcements', DEFAULT_ANNOUNCEMENTS);
  const foundIdx = statsList.findIndex(p => p.id === ann.id);
  if (foundIdx !== -1) {
    statsList[foundIdx] = ann;
  } else {
    statsList.push(ann);
  }
  saveLocalStorageData('announcements', statsList);

  if (isMockFirebase) return;
  const path = `announcements/${ann.id}`;
  try {
    await setDoc(doc(db, 'announcements', ann.id), {
      date: ann.date,
      title: ann.title,
      content: ann.content,
      visible: ann.visible,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const statsList = getLocalStorageData<AnnouncementEntry>('announcements', DEFAULT_ANNOUNCEMENTS);
  const filtered = statsList.filter(p => p.id !== id);
  saveLocalStorageData('announcements', filtered);

  if (isMockFirebase) return;
  const path = `announcements/${id}`;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// GA GACHA FORTUNES OPERATIONS
// ----------------------------------------------------
export interface GachaFortune {
  id: string; // matches luckLevel
  season: string; // 例: 春、夏
  title: string;
  resultName: string; // e.g. "超大吉"
  resultMessage: string; // description
  imageUrl?: string;
  commentSmile: string;
  commentCaramel: string;
  luckyItem: string;
  luckyDance: string;
  ratingSmile: number;
  ratingCaramel: number;
  startDate: string;
  endDate: string;
  visible: boolean;
  sortOrder: number;
}

const DEFAULT_FORTUNES_DB: GachaFortune[] = [
  {
    id: '超大吉',
    season: '春シーズン',
    title: 'あろはーず全力超大吉！！',
    resultName: '超大吉',
    resultMessage: '今日は星がピカピカ！何をやってもあろはーずが全力で応援しているような、スーパーミラクルな１日になるよ！運気が宇宙を越えて大気圏突入！',
    commentSmile: '「もう最強！お菓子食べ放題、ガチャガチャ全種コンプできちゃうかも！？」',
    commentCaramel: '「きゃらめるも、お布団の中からお祈りしてるね…むにゃむにゃ…」',
    luckyItem: 'オレンジ味のハードグミキャンディ',
    luckyDance: '「ファンサ」のサビラストの全力手をふるところ！',
    ratingSmile: 5,
    ratingCaramel: 5,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 1
  },
  {
    id: '大吉',
    season: '春シーズン',
    title: '笑顔まんてん！すまいる大吉🌻',
    resultName: '大吉',
    resultMessage: 'すまいるのパワーがあなたにシンクロ！憂鬱な雨雲も、あなたの笑顔で一気にキャンディポップ色の青空になっちゃうよ！',
    commentSmile: '「やったね！いつでも隣に私がついてるから、ニコニコでいこうッ！🌻」',
    commentCaramel: '「すまいるのテンションに負けず、のんびりいきましょ〜」',
    luckyItem: '黄色いハンカチ、またはお花のステッカー',
    luckyDance: '「ハッピーシンセサイザ」のイントロのクラップ！',
    ratingSmile: 5,
    ratingCaramel: 3,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 2
  },
  {
    id: '激吉',
    season: '春シーズン',
    title: '甘口あざと！きゃらめる激吉🧸',
    resultName: '激吉',
    resultMessage: 'きゃらめるのあざとパワーが炸裂。いつもは恥ずかしいセリフも、今日なら言えちゃうかも？周囲の人がみんなあなたに甘々になります。',
    commentSmile: '「きゃらめるが激吉なんてズルい！あざとビーム分けて〜〜！」',
    commentCaramel: '「ふふ、今日は周りのみんなにワガママを３つまで言っていいよ〜？🎀」',
    luckyItem: 'キャラメルラテ（ホイップマシマシで！）',
    luckyDance: '「おねがいダーリン」の首かしげポーズ( *´艸｀)',
    ratingSmile: 3,
    ratingCaramel: 5,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 3
  },
  {
    id: '中吉',
    season: '春シーズン',
    title: 'お昼寝推奨！ぽかぽか中吉☀️',
    resultName: '中吉',
    resultMessage: '焦らず急がず、マイペースが一番な日。あま〜いお茶を飲んで、風の音を聞きながら15分だけお昼寝するのが吉。エネルギー充電完了！',
    commentSmile: '「レッスンさぼっちゃダメだよ！…えっ、アイスくれるなら一緒に寝る！」',
    commentCaramel: '「お昼寝は世界を救うライフハック…いっしょに寝よ…💤」',
    luckyItem: 'レトロな喫茶店の固めプリン',
    luckyDance: 'うとうと揺れるマイペースなダンス',
    ratingSmile: 4,
    ratingCaramel: 4,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 4
  },
  {
    id: '吉',
    season: '春シーズン',
    title: 'のびのび踊ろう！ダンシング吉🕺',
    resultName: '吉',
    resultMessage: '足元がスキップしたがっているよ！日常の階段や横断歩道で、ちょっぴりリズムを取りながら歩くと、素敵なアイディアがひらめくかも。',
    commentSmile: '「いいね〜！ターンを１回するごとにハッピーメーターが10溜まるよ！」',
    commentCaramel: '「転ばないように、可愛いスニーカーを履いてお出かけしてね？」',
    luckyItem: '厚底スニーカー、あるいはカラフルな靴下',
    luckyDance: 'スキップしながら「金曜日のおはよう」',
    ratingSmile: 4,
    ratingCaramel: 3,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 5
  },
  {
    id: 'あろはーず吉',
    season: '春シーズン',
    title: 'あろはーずまったり大吉🍵',
    resultName: 'あろはーず吉',
    resultMessage: '失敗しちゃっても大丈夫！あろはーずが「どんまい！」と美味しいキャンディを口に放り込んでくれるよ。あたたかい世界が包んでくれます。',
    commentSmile: '「転んだら起き上がればよし！私がハグしてあげるーー！！😆」',
    commentCaramel: '「ゆっくり休むのも、明日のステップのためのたいせつな準備だからね」',
    luckyItem: 'あたたかい麦茶とキャンディ',
    luckyDance: '肩の力をぬいて、ゆらゆらするダンス',
    ratingSmile: 4,
    ratingCaramel: 5,
    startDate: '',
    endDate: '',
    visible: true,
    sortOrder: 6
  }
];

export const getFortunes = async (adminView = false): Promise<GachaFortune[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<GachaFortune>('fortunes', DEFAULT_FORTUNES_DB);
    return adminView ? list : list.filter(p => p.visible);
  }

  const path = 'fortunes';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: GachaFortune[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        season: d.season || '',
        title: d.title || '',
        resultName: d.resultName || doc.id,
        resultMessage: d.resultMessage || '',
        imageUrl: d.imageUrl || '',
        commentSmile: d.commentSmile || '',
        commentCaramel: d.commentCaramel || '',
        luckyItem: d.luckyItem || '',
        luckyDance: d.luckyDance || '',
        ratingSmile: Number(d.ratingSmile ?? 3),
        ratingCaramel: Number(d.ratingCaramel ?? 3),
        startDate: d.startDate || '',
        endDate: d.endDate || '',
        visible: d.visible !== false,
        sortOrder: Number(d.sortOrder ?? 99)
      });
    });
    const sorted = items.sort((a, b) => a.sortOrder - b.sortOrder);
    return adminView ? sorted : sorted.filter(p => p.visible);
  } catch (error) {
    console.warn("Could not query Firestore fortunes, utilizing fallback storage", error);
    const list = getLocalStorageData<GachaFortune>('fortunes', DEFAULT_FORTUNES_DB);
    return adminView ? list : list.filter(p => p.visible);
  }
};

export const saveFortune = async (fortune: GachaFortune): Promise<void> => {
  const statsList = getLocalStorageData<GachaFortune>('fortunes', DEFAULT_FORTUNES_DB);
  const foundIdx = statsList.findIndex(p => p.id === fortune.id);
  if (foundIdx !== -1) {
    statsList[foundIdx] = fortune;
  } else {
    statsList.push(fortune);
  }
  saveLocalStorageData('fortunes', statsList);

  if (isMockFirebase) return;
  const path = `fortunes/${fortune.id}`;
  try {
    await setDoc(doc(db, 'fortunes', fortune.id), {
      id: fortune.id,
      season: fortune.season,
      title: fortune.title,
      resultName: fortune.resultName,
      resultMessage: fortune.resultMessage,
      imageUrl: fortune.imageUrl || '',
      commentSmile: fortune.commentSmile,
      commentCaramel: fortune.commentCaramel,
      luckyItem: fortune.luckyItem,
      luckyDance: fortune.luckyDance,
      ratingSmile: fortune.ratingSmile,
      ratingCaramel: fortune.ratingCaramel,
      startDate: fortune.startDate,
      endDate: fortune.endDate,
      visible: fortune.visible,
      sortOrder: fortune.sortOrder,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteFortune = async (id: string): Promise<void> => {
  const statsList = getLocalStorageData<GachaFortune>('fortunes', DEFAULT_FORTUNES_DB);
  const filtered = statsList.filter(p => p.id !== id);
  saveLocalStorageData('fortunes', filtered);

  if (isMockFirebase) return;
  const path = `fortunes/${id}`;
  try {
    await deleteDoc(doc(db, 'fortunes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ----------------------------------------------------
// COMPLETE REWARDS (SECRET LETTERS) OPERATIONS
// ----------------------------------------------------
export interface SeasonLetter {
  id: string;
  season: string;
  title: string;
  content: string; // Hand-written contents loaded with markdown or replacement name placeholders
  smileContent: string;
  caramelContent: string;
  visible: boolean;
  startDate: string;
  endDate: string;
}

const DEFAULT_LETTERS_DB: SeasonLetter[] = [
  {
    id: 'season-letter-1',
    season: '春シーズン',
    title: 'すまいる＆きゃらめるからの愛のコンプリートレター',
    content: '大好きな{{name}}へ🌻🧸\n\nおみくじ図鑑のコンプリート、本当に本当にありがとーー！！\n毎日毎日引いてくれてる{{name}}の姿を想像してたら、あろはーずの心のハッピーメーターが1万倍になっちゃいました！',
    smileContent: '大好きな{{name}}へ🌻\nおみくじコプリート本当にうれしいッ！毎日楽しんでくれてありがとう。落ち込んじゃう時や力が出ないなーって日も、私たちが送ったおみくじを見てニコニコになってくれたらとってもうれしいなッ！これからも特等席でいーーっぱい踊っていくから、ずーっと見ててね？大好きーー！ 🌻',
    caramelContent: 'いつも温かく支えてくれる{{name}}へ🧸\nコンプリートしてくれてありがとう。のんびり、あせらず、きゃらめるのペースで日記もダンスもがんばれてるの。{{name}}が見守ってくれてるおかげだよ。これからも２人と一緒に、いっぱーい甘〜い時間をすごそうな？約束ね。🎀',
    visible: true,
    startDate: '',
    endDate: ''
  }
];

export const getLetters = async (adminView = false): Promise<SeasonLetter[]> => {
  if (isMockFirebase) {
    const list = getLocalStorageData<SeasonLetter>('letters', DEFAULT_LETTERS_DB);
    return adminView ? list : list.filter(p => p.visible);
  }

  const path = 'letters';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const items: SeasonLetter[] = [];
    qSnapshot.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        season: d.season || '',
        title: d.title || '',
        content: d.content || '',
        smileContent: d.smileContent || '',
        caramelContent: d.caramelContent || '',
        visible: d.visible !== false,
        startDate: d.startDate || '',
        endDate: d.endDate || ''
      });
    });
    return adminView ? items : items.filter(p => p.visible);
  } catch (error) {
    console.warn("Could not query Firestore letters, utilizing fallback storage", error);
    const list = getLocalStorageData<SeasonLetter>('letters', DEFAULT_LETTERS_DB);
    return adminView ? list : list.filter(p => p.visible);
  }
};

export const saveLetter = async (letter: SeasonLetter): Promise<void> => {
  const statsList = getLocalStorageData<SeasonLetter>('letters', DEFAULT_LETTERS_DB);
  const foundIdx = statsList.findIndex(p => p.id === letter.id);
  if (foundIdx !== -1) {
    statsList[foundIdx] = letter;
  } else {
    statsList.push(letter);
  }
  saveLocalStorageData('letters', statsList);

  if (isMockFirebase) return;
  const path = `letters/${letter.id}`;
  try {
    await setDoc(doc(db, 'letters', letter.id), {
      season: letter.season,
      title: letter.title,
      content: letter.content,
      smileContent: letter.smileContent,
      caramelContent: letter.caramelContent,
      visible: letter.visible,
      startDate: letter.startDate,
      endDate: letter.endDate,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteLetter = async (id: string): Promise<void> => {
  const statsList = getLocalStorageData<SeasonLetter>('letters', DEFAULT_LETTERS_DB);
  const filtered = statsList.filter(p => p.id !== id);
  saveLocalStorageData('letters', filtered);

  if (isMockFirebase) return;
  const path = `letters/${id}`;
  try {
    await deleteDoc(doc(db, 'letters', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
