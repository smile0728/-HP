import React, { useState, useEffect } from 'react';
import {
  isMockFirebase,
  auth,
  db,
  getPhotos,
  savePhoto,
  deletePhoto,
  getDiaries,
  saveDiary,
  deleteDiary,
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  getFortunes,
  saveFortune,
  deleteFortune,
  getLetters,
  saveLetter,
  deleteLetter,
  getDailyStats,
  PhotoEntry,
  DiaryRecord,
  AnnouncementEntry,
  GachaFortune,
  SeasonLetter,
  DailyStat
} from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Lock,
  Unlock,
  LogOut,
  LayoutDashboard,
  Megaphone,
  BookOpen,
  Camera,
  Award,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Sparkles,
  BarChart2,
  Heart,
  Share2,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_BUILD_MARKER = 'admin-auth-debug-2026-05-25-2';

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSimulatedAdmin, setIsSimulatedAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'announcements' | 'diary' | 'photos' | 'gacha' | 'letters'>('dashboard');

  // Generic loading states
  const [loading, setLoading] = useState(false);

  // Entities state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [diaries, setDiaries] = useState<DiaryRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementEntry[]>([]);
  const [fortunes, setFortunes] = useState<GachaFortune[]>([]);
  const [letters, setLetters] = useState<SeasonLetter[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);

  // Editing modals/forms state
  const [editingPhoto, setEditingPhoto] = useState<Partial<PhotoEntry> | null>(null);
  const [editingDiary, setEditingDiary] = useState<Partial<DiaryRecord> | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<AnnouncementEntry> | null>(null);
  const [editingFortune, setEditingFortune] = useState<Partial<GachaFortune> | null>(null);
  const [editingLetter, setEditingLetter] = useState<Partial<SeasonLetter> | null>(null);

  // Auth subscriber
  useEffect(() => {
    console.info(`Admin panel build: ${ADMIN_BUILD_MARKER}`);
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      setUser(currentUser);
      setIsAdminUser(false);

      if (currentUser) {
        try {
          const adminSnapshot = await getDoc(doc(db, 'admins', currentUser.uid));
          setIsAdminUser(adminSnapshot.exists());
        } catch (error) {
          console.error('Admin authorization check failed:', error);
          setLoginError('管理者権限の確認に失敗しました。時間をおいて再度お試しください。');
        }
      }

      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch all entities once authenticated/simulated
  useEffect(() => {
    if ((user && isAdminUser) || isSimulatedAdmin) {
      refreshData();
    }
  }, [user, isAdminUser, isSimulatedAdmin]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [p, d, a, f, l, s] = await Promise.all([
        getPhotos(true),
        getDiaries(true),
        getAnnouncements(true),
        getFortunes(true),
        getLetters(true),
        getDailyStats()
      ]);
      setPhotos(p);
      setDiaries(d);
      setAnnouncements(a);
      setFortunes(f);
      setLetters(l);
      setStats(s);
    } catch (err) {
      console.error("Could not fetch admin datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const adminSnapshot = await getDoc(doc(db, 'admins', res.user.uid));
      if (!adminSnapshot.exists()) {
        await signOut(auth);
        setLoginError(`アクセス権限がありません。Firestore に admins/${res.user.uid} のドキュメントを作成してください。ログイン中のメール: ${res.user.email || '不明'}`);
      }
    } catch (error: any) {
      console.error("Firebase popup login error:", error);
      setLoginError(`ログインに失敗しました。詳細: ${error.message || error}`);
    }
  };

  // Simulation fallback for offline presentation
  const handleSimulateLogin = () => {
    setIsSimulatedAdmin(true);
    setLoginError('');
  };

  const handleLogout = () => {
    signOut(auth);
    setIsSimulatedAdmin(false);
  };

  // Check master authorization status
  const isAuthorized = (user && isAdminUser) || isSimulatedAdmin;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FCF8F2] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <span className="text-4xl animate-spin block">🌈</span>
          <p className="text-dark-charcoal text-sm font-black animate-pulse">あろはーず運営用のキーロッカーを解錠中...</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // LOGIN SCREEN
  // -----------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 selection:bg-brand-pink/20 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-4 border-dark-charcoal rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_#4A2C2A] relative overflow-hidden">
          {/* Top Tape decorative border */}
          <div className="absolute top-0 inset-x-0 h-4 bg-brand-orange/60" />
          <div className="absolute -top-3 -left-3 w-12 h-6 bg-yellow-100 border border-dark-charcoal/20 rotate-[-15deg] pointer-events-none" />

          {/* Heading */}
          <div className="text-center mt-4 mb-6">
            <span className="text-4xl animate-bounce block">🧸🌻</span>
            <h2 className="text-2xl font-display font-black text-dark-charcoal mt-2">
              あろはーず運営室
            </h2>
            <p className="text-xs text-dark-charcoal/60 mt-1 font-bold">
              ALOHA-ZU Operations & Content Room
            </p>
          </div>

          <div className="bg-orange-50/50 border-2 border-dashed border-brand-orange/20 rounded-2xl p-4 mb-6 text-xs text-dark-charcoal/80 font-semibold space-y-1.5 leading-relaxed">
            <p className="text-brand-orange font-bold flex items-center gap-1">
              🔑 本人専用アクセス管理エリア
            </p>
            <p>※ 一般のファンの方はご覧になれません。</p>
            <p>※ 管理者として登録された Google アカウントでのみログイン可能です。</p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 bg-rose-50 border-2 border-brand-pink rounded-xl text-xs text-brand-pink font-bold leading-normal">
              ⚠️ {loginError}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange/95 text-white font-black text-sm rounded-2xl border-2 border-dark-charcoal shadow-[3px_3px_0px_#4A2C2A] hover:shadow-[1px_1px_0px_#4A2C2A] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Lock size={16} /> Googleアカウントでログイン
            </button>

            {isMockFirebase && (
              <div className="pt-2 text-center">
                <span className="text-[10px] text-dark-charcoal/40 font-bold block mb-2">
                  ーー ローカルデモ環境または準備中 ーー
                </span>
                <button
                  onClick={handleSimulateLogin}
                  className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-[#D97706] border-2 border-[#FBBF24] rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  ⚙️ テスト用模擬管理者として進む（簡単動作確認）
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // GENERATE DYNAMIC VISUAL SVG CHARTS
  // -----------------------------------------------------------------
  const renderAccessCharts = () => {
    if (stats.length === 0) {
      return (
        <div className="text-center py-8 text-xs font-black text-dark-charcoal/40">
          アクセス統計情報がまだありません。
        </div>
      );
    }

    // Accumulate total views over last 14 days
    const totalViews = stats.reduce((sum, s) => sum + s.pageViews, 0);
    const totalFortunes = stats.reduce((sum, s) => sum + s.fortunesDrawn, 0);
    const totalCompletions = stats.reduce((sum, s) => sum + s.completions, 0);
    const totalSns = stats.reduce((sum, s) => sum + s.snsClicks, 0);

    // Let's create an elegant visual pure-Tailwind line SVG plot for PVs
    const maxPv = Math.max(...stats.map(s => s.pageViews), 10);
    const pointsStr = stats.map((stat, i) => {
      const cellWidth = 360 / (stats.length - 1 || 1);
      const x = i * cellWidth + 20;
      const y = 110 - (stat.pageViews / maxPv) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Statistics Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
          <div className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0px_#4A2C2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-dark-charcoal/60 uppercase flex items-center gap-1">
              👁️ 総閲覧数 (ページビュー)
            </span>
            <div className="mt-2">
              <span className="text-2xl font-black text-brand-orange">{totalViews}</span> <span className="text-[10px] font-bold text-stone-400">PV</span>
            </div>
          </div>
          <div className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0px_#4A2C2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-dark-charcoal/60 uppercase flex items-center gap-1">
              🔮 おみくじ総再生数
            </span>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-500">{totalFortunes}</span> <span className="text-[10px] font-bold text-stone-400">回</span>
            </div>
          </div>
          <div className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0px_#4A2C2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-dark-charcoal/60 uppercase flex items-center gap-1">
              🏆 おみくじコンプリート
            </span>
            <div className="mt-2">
              <span className="text-2xl font-black text-brand-pink">{totalCompletions}</span> <span className="text-[10px] font-bold text-stone-400">人</span>
            </div>
          </div>
          <div className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0px_#4A2C2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-dark-charcoal/60 uppercase flex items-center gap-1">
              🔗 SNS&動画リンククリック
            </span>
            <div className="mt-2">
              <span className="text-2xl font-black text-sky-500">{totalSns}</span> <span className="text-[10px] font-bold text-stone-400">Click</span>
            </div>
          </div>
        </div>

        {/* Elegant mini PV trend graph (SVG) */}
        <div className="lg:col-span-8 bg-white border-2 border-dark-charcoal rounded-3xl p-4 shadow-[3px_3px_0px_#4A2C2A] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100">
            <div>
              <h4 className="text-xs font-black text-dark-charcoal">日別ページビュー推移 📈</h4>
              <p className="text-[9px] text-dark-charcoal/40 font-bold">過去数日間のビジターアクティビティログ</p>
            </div>
            <span className="text-[9px] font-mono font-black text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-dark-charcoal/10">
              {stats[0]?.id || ''} ~ {stats[stats.length - 1]?.id || ''}
            </span>
          </div>

          <div className="relative w-full h-[120px] bg-[#FCFBF7] border border-dashed border-dark-charcoal/20 rounded-xl overflow-hidden p-2">
            <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#E6E6E1" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="#E6E6E1" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="#9A9A92" strokeWidth="1.5" />

              {/* Linear Polyline curve */}
              <polyline
                fill="none"
                stroke="#FF8C00"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStr}
              />

              {/* Data circles */}
              {stats.map((stat, i) => {
                const cellWidth = 360 / (stats.length - 1 || 1);
                const x = i * cellWidth + 20;
                const y = 110 - (stat.pageViews / maxPv) * 80;
                return (
                  <g key={i} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill="#FF8C00"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <title>{`${stat.id}: ${stat.pageViews} PV`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Date Axis tags layout */}
          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-dark-charcoal/40 px-3 pt-1">
            {stats.map((s, i) => {
              if (i === 0 || i === stats.length - 1 || i === Math.floor(stats.length / 2)) {
                return <span key={i}>{s.id.slice(5)}</span>;
              }
              return <span key={i} className="invisible">.</span>;
            })}
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // BULLETINS / ANNOUNCEMENTS SAVING
  // -----------------------------------------------------------------
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement?.title || !editingAnnouncement?.date || !editingAnnouncement?.content) {
      alert("全項目（日付・お知らせタイトル・掲載内容）を入力してね！🌻");
      return;
    }
    await saveAnnouncement({
      id: editingAnnouncement.id || `ann-${Date.now()}`,
      title: editingAnnouncement.title,
      date: editingAnnouncement.date,
      content: editingAnnouncement.content,
      visible: editingAnnouncement.visible !== false
    });
    setEditingAnnouncement(null);
    refreshData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("この掲載お知らせを削除してもよろしいですか？💭")) return;
    await deleteAnnouncement(id);
    refreshData();
  };

  // -----------------------------------------------------------------
  // EXCHANGE DIARIES SAVING
  // -----------------------------------------------------------------
  const handleSaveDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiary?.title || !editingDiary?.date || !editingDiary?.content) {
      alert("全項目（ノート日付・タイトル・本文）をきちんと入力してね！🧸");
      return;
    }
    await saveDiary({
      id: editingDiary.id || `diary-${Date.now()}`,
      date: editingDiary.date,
      author: editingDiary.author || 'smile',
      title: editingDiary.title,
      content: editingDiary.content,
      response: editingDiary.response || '',
      stickers: editingDiary.stickers || ['🥰'],
      visible: editingDiary.visible !== false
    });
    setEditingDiary(null);
    refreshData();
  };

  const handleDeleteDiary = async (id: string) => {
    if (!confirm("この交換日記エントリーを消去します。よろしいですか？📕")) return;
    await deleteDiary(id);
    refreshData();
  };

  // -----------------------------------------------------------------
  // ALBUM PHOTO CARDS SAVING
  // -----------------------------------------------------------------
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto?.title || !editingPhoto?.imageUrl || !editingPhoto?.comment) {
      alert("すべての項目（日付・写真タイトル・画像アドレス・コメント）を入力してください！📸");
      return;
    }
    await savePhoto({
      id: editingPhoto.id || `photo-${Date.now()}`,
      imageUrl: editingPhoto.imageUrl,
      title: editingPhoto.title,
      date: editingPhoto.date || new Date().toISOString().split('T')[0].replaceAll('-', '.'),
      comment: editingPhoto.comment,
      visible: editingPhoto.visible !== false
    });
    setEditingPhoto(null);
    refreshData();
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("このアルバム写真を廃棄してもよろしいですか？🔥")) return;
    await deletePhoto(id);
    refreshData();
  };

  // -----------------------------------------------------------------
  // GA FORTUNES SAVING
  // -----------------------------------------------------------------
  const handleSaveFortune = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFortune?.id || !editingFortune?.resultName || !editingFortune?.resultMessage) {
      alert("必須項目（みくじ固有ID・運勢結果・解説文）を入力してね！🔮");
      return;
    }
    await saveFortune({
      id: editingFortune.id,
      season: editingFortune.season || '通年シーズン',
      title: editingFortune.title || `あろはーず${editingFortune.resultName}おみくじ`,
      resultName: editingFortune.resultName,
      resultMessage: editingFortune.resultMessage,
      imageUrl: editingFortune.imageUrl || '',
      commentSmile: editingFortune.commentSmile || '',
      commentCaramel: editingFortune.commentCaramel || '',
      luckyItem: editingFortune.luckyItem || '',
      luckyDance: editingFortune.luckyDance || '',
      ratingSmile: Number(editingFortune.ratingSmile ?? 3),
      ratingCaramel: Number(editingFortune.ratingCaramel ?? 3),
      startDate: editingFortune.startDate || '',
      endDate: editingFortune.endDate || '',
      visible: editingFortune.visible !== false,
      sortOrder: Number(editingFortune.sortOrder ?? 9)
    });
    setEditingFortune(null);
    refreshData();
  };

  const handleDeleteFortune = async (id: string) => {
    if (!confirm("このおみくじ内容をリストから削除しますか？⚠️")) return;
    await deleteFortune(id);
    refreshData();
  };

  // -----------------------------------------------------------------
  // REWARD LETTERS SAVING
  // -----------------------------------------------------------------
  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLetter?.id || !editingLetter?.smileContent || !editingLetter?.caramelContent) {
      alert("必須項目（対象シーズン・すまいるレター・きゃらめるレター）は省略できません！💌");
      return;
    }
    await saveLetter({
      id: editingLetter.id,
      season: editingLetter.season || '春シーズン',
      title: editingLetter.title || 'コンプリート達成を祝う特別なお知らせ',
      content: editingLetter.content || 'コプリート達成おめでとう！',
      smileContent: editingLetter.smileContent,
      caramelContent: editingLetter.caramelContent,
      visible: editingLetter.visible !== false,
      startDate: editingLetter.startDate || '',
      endDate: editingLetter.endDate || ''
    });
    setEditingLetter(null);
    refreshData();
  };

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("このご褒美お手紙定義を削除しますか？")) return;
    await deleteLetter(id);
    refreshData();
  };

  // -----------------------------------------------------------------
  // GRAPHICAL LAYOUT RENDERING
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDFBF7] selection:bg-brand-pink/20 font-sans text-dark-charcoal">
      {/* Dynamic Dashboard Utility Bar */}
      <header className="bg-white border-b-4 border-dark-charcoal py-4 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-orange text-white w-9 h-9 rounded-xl border-2 border-dark-charcoal flex items-center justify-center font-black animate-pulse shadow-[1px_1.5px_0_#4A2C2A]">
            👑
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-black tracking-tight flex items-center gap-1.5">
              あろはーず運営室 <span className="text-[10px] font-bold text-brand-pink bg-rose-50 px-2 py-0.5 border border-brand-pink/20 rounded-full">本人認証済</span>
            </h1>
            <p className="text-[10px] text-dark-charcoal/50 font-bold uppercase tracking-wider font-mono">
              Admin Control center // {isSimulatedAdmin ? "SIMULATORFALLBACK" : user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            title="データを同期"
            className="p-2 sm:px-3.5 sm:py-2 bg-stone-50 hover:bg-stone-100 text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A] flex items-center gap-1 shrink-0 cursor-pointer text-dark-charcoal transition-transform hover:scale-105 active:translate-y-0.5"
          >
            🔄 同期
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-brand-pink text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A] flex items-center gap-1 shrink-0 cursor-pointer transition-transform hover:scale-105 active:translate-y-0.5"
          >
            <LogOut size={13} /> ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Navigation Rail Panel */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white border-3 border-dark-charcoal p-4 rounded-3xl shadow-[3px_3px_0px_#4A2C2A]">
            <p className="text-[10px] font-mono font-black text-dark-charcoal/40 uppercase tracking-widest mb-3 px-1 border-b border-stone-100 pb-1">
              🏢 コンテンツ管理メニュー
            </p>
            <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              <button
                onClick={() => { setActiveTab('dashboard'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <LayoutDashboard size={14} /> 運営ダッシュボード
              </button>

              <button
                onClick={() => { setActiveTab('announcements'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'announcements'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <Megaphone size={14} /> お知らせ管理 ({announcements.length})
              </button>

              <button
                onClick={() => { setActiveTab('diary'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'diary'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <BookOpen size={14} /> 交換日記管理 ({diaries.length})
              </button>

              <button
                onClick={() => { setActiveTab('photos'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <Camera size={14} /> アルバム写真管理 ({photos.length})
              </button>

              <button
                onClick={() => { setActiveTab('gacha'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'gacha'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <Award size={14} /> おみくじ管理 ({fortunes.length})
              </button>

              <button
                onClick={() => { setActiveTab('letters'); }}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'letters'
                    ? 'bg-brand-orange text-white border-dark-charcoal shadow-[2.5px_2.5px_0_#4A2C2A]'
                    : 'bg-white text-dark-charcoal border-transparent hover:bg-orange-50/40'
                }`}
              >
                <FileText size={14} /> コンプリート手紙管理 ({letters.length})
              </button>
            </nav>
          </div>

          <div className="bg-brand-pink/5 border-2 border-brand-pink/15 p-4 rounded-2xl text-[11px] font-semibold text-brand-pink/75 space-y-1.5 leading-normal">
            <span className="block font-black text-brand-pink mb-1 text-xs">💡 クイックヒント</span>
            <p>• ここで「非表示」に設定したものは、ファン向けホームページ側で即座に見えなくなります。</p>
            <p>• データの変更はリアルタイムにFirestoreデータベースに保存・反映されます。</p>
          </div>
        </aside>

        {/* Content Board Screen Panel */}
        <main className="lg:col-span-9">
          {loading && (
            <div className="bg-amber-50 border-2 border-[#FCD34D] p-3 rounded-2xl text-xs text-[#D97706] font-black text-center mb-5 animate-pulse">
              🚀 データベースから最新データにシンクロ中です...
            </div>
          )}

          {/* -----------------------------------------------------------------
              DASHBOARD PANEL RENDERING
             ----------------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-3 border-dark-charcoal p-5 rounded-3xl shadow-[3px_3px_0px_#4A2C2A] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-display font-black text-dark-charcoal">
                    あろはーずアクセス活動統計
                  </h3>
                  <p className="text-xs text-dark-charcoal/60 mt-1 font-bold">
                    ホームページがどれくらい見られているか。リアルタイム集計状況です🌻🍰
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black font-mono text-dark-charcoal/50 bg-[#FFF7E3] px-2.5 py-1 border border-dark-charcoal/10 rounded-full inline-block">
                    📍 DATABASE STATUS: OK
                  </span>
                </div>
              </div>

              {renderAccessCharts()}

              <div className="bg-white border-2 border-dark-charcoal p-5 rounded-3xl shadow-[3px_3px_0px_#4A2C2A]">
                <h4 className="text-sm font-black text-dark-charcoal mb-4 flex items-center gap-1.5">
                  🧸 最近更新されたオペレーションログ
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold flex items-center gap-1.5">📢 登録されたお知らせ総件数</span>
                    <span className="font-mono font-black text-brand-orange bg-white px-2 py-0.5 rounded border border-stone-200">{announcements.length} 件</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold flex items-center gap-1.5">📓 交換日記登録枚数</span>
                    <span className="font-mono font-black text-brand-pink bg-white px-2 py-0.5 rounded border border-stone-200">{diaries.length} 通</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold flex items-center gap-1.5">📸 写真アルバム登録枚数</span>
                    <span className="font-mono font-black text-indigo-500 bg-white px-2 py-0.5 rounded border border-stone-200">{photos.length} 枚</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              ANNOUNCEMENTS CRUD PANEL
             ----------------------------------------------------------------- */}
          {activeTab === 'announcements' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-dark-charcoal/20">
                <h3 className="text-lg font-black flex items-center gap-1.5">📢 お知らせ管理</h3>
                <button
                  onClick={() => setEditingAnnouncement({ id: '', title: '', date: new Date().toISOString().split('T')[0].replaceAll('-', '/'), content: '', visible: true })}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] flex items-center gap-1 hover:-translate-y-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> お知らせ作成
                </button>
              </div>

              {/* Edit overlay */}
              {editingAnnouncement && (
                <form onSubmit={handleSaveAnnouncement} className="bg-white border-3 border-dark-charcoal p-5 rounded-3xl shadow-[4px_4px_0_#4A2C2A] space-y-4">
                  <h4 className="text-sm font-black text-brand-orange border-b border-stone-100 pb-1.5">
                    {editingAnnouncement.id ? 'お知らせの編集 ✏️' : '新規お知らせの作成 📢'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">掲載日付 (※ YYYY/MM/DD 形式で入力してね)</label>
                      <input
                        type="text"
                        value={editingAnnouncement.date || ''}
                        onChange={e => setEditingAnnouncement({ ...editingAnnouncement, date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: YYYY/MM/DD"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">公開・非表示 (表示フラグ)</label>
                      <select
                        value={editingAnnouncement.visible !== false ? 'true' : 'false'}
                        onChange={e => setEditingAnnouncement({ ...editingAnnouncement, visible: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="true">公開する</option>
                        <option value="false">下書き非表示</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">お知らせ見出し</label>
                    <input
                      type="text"
                      value={editingAnnouncement.title || ''}
                      onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: 重大発表！ホームページ新調のお知らせ🌻"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">本文（掲載内容）</label>
                    <textarea
                      value={editingAnnouncement.content || ''}
                      onChange={e => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                      className="w-full px-3 py-2.5 border-2 border-dark-charcoal rounded-xl text-xs font-bold font-mono h-28"
                      placeholder="お知らせの詳細、リンク等を入力してください..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingAnnouncement(null)}
                      className="px-4 py-2 bg-stone-100 border-2 border-dark-charcoal rounded-xl text-xs font-black text-dark-charcoal cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] cursor-pointer"
                    >
                      保存登録
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0_#4A2C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black text-dark-charcoal/50 bg-[#FCF8EB] px-2 py-0.5 border border-dark-charcoal/10 rounded-full">
                          📅 {ann.date}
                        </span>
                        {ann.visible ? (
                          <span className="text-[9px] font-black text-brand-orange bg-orange-50 px-2 py-0.5 border border-brand-orange/10 rounded-full flex items-center gap-0.5">
                            <Eye size={10} /> 公開中
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-[gray] bg-stone-100 px-2 py-0.5 border border-stone-200 rounded-full flex items-center gap-0.5">
                            <EyeOff size={10} /> 非表示
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-dark-charcoal">{ann.title}</h4>
                      <p className="text-[11px] text-dark-charcoal/70 truncate">{ann.content}</p>
                    </div>

                    <div className="flex gap-1.5 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => setEditingAnnouncement(ann)}
                        className="p-1 px-2.5 bg-yellow-50 hover:bg-yellow-100 text-[#D97706] border border-[#F3F4F6] text-[10.5px] font-black rounded-lg cursor-pointer flex items-center gap-0.5"
                      >
                        <Edit3 size={11} /> 編集
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-brand-pink border border-[#F3F4F6] text-[10.5px] font-black rounded-lg cursor-pointer flex items-center gap-0.5"
                      >
                        <Trash2 size={11} /> 削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              EXCHANGE DIARY CRUD PANEL
             ----------------------------------------------------------------- */}
          {activeTab === 'diary' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-dark-charcoal/20">
                <h3 className="text-lg font-black flex items-center gap-1.5">📓 交換日記管理</h3>
                <button
                  onClick={() => setEditingDiary({ id: '', title: '', date: new Date().toISOString().split('T')[0].replaceAll('-', '/'), author: 'smile', content: '', response: '', stickers: ['🌞'], visible: true })}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] flex items-center gap-1 hover:-translate-y-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> 日記追加
                </button>
              </div>

              {/* Edit overlay */}
              {editingDiary && (
                <form onSubmit={handleSaveDiary} className="bg-white border-3 border-dark-charcoal p-5 rounded-3xl shadow-[4px_4px_0_#4A2C2A] space-y-4">
                  <h4 className="text-sm font-black text-brand-orange border-b border-stone-100 pb-1.5">
                    {editingDiary.id ? '交換日記ノート編集 ✏️' : '交換日記ノート追加 📓'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">掲載日付 (YYYY/MM/DD)</label>
                      <input
                        type="text"
                        value={editingDiary.date || ''}
                        onChange={e => setEditingDiary({ ...editingDiary, date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: 2026/05/25"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">執筆メンバー</label>
                      <select
                        value={editingDiary.author || 'smile'}
                        onChange={e => setEditingDiary({ ...editingDiary, author: e.target.value as 'smile' | 'caramel' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="smile">すまいる 🌻</option>
                        <option value="caramel">きゃらめる 🧸</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">公開設定</label>
                      <select
                        value={editingDiary.visible !== false ? 'true' : 'false'}
                        onChange={e => setEditingDiary({ ...editingDiary, visible: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="true">公開する</option>
                        <option value="false">下書き非表示</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">日記のタイトル</label>
                    <input
                      type="text"
                      value={editingDiary.title || ''}
                      onChange={e => setEditingDiary({ ...editingDiary, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: 今日は美味しいイチゴケーキを食べたよ！🎂"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">日記の本文（1日のきろく）</label>
                    <textarea
                      value={editingDiary.content || ''}
                      onChange={e => setEditingDiary({ ...editingDiary, content: e.target.value })}
                      className="w-full px-3 py-2 h-24 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="ハッピーな今日の日記をここに書いてね..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">相方（もう一方のメンバー）からの返信メモ 💬</label>
                    <input
                      type="text"
                      value={editingDiary.response || ''}
                      onChange={e => setEditingDiary({ ...editingDiary, response: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-[#10B981] rounded-xl text-xs font-bold bg-[#ECFDF5]"
                      placeholder="例: すまいる：一口くれるはずだったのに全部食べたじゃん！"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-dark-charcoal/60 block">日記に貼る可愛いスタンプ（複数から選択可）</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['🌞', '🧸', '🍰', '🌸', '🍊', '🍧', '🔥', '💖', '✨', '🐾', '🎀'].map(st => {
                        const arr = editingDiary.stickers || [];
                        const hasSt = arr.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              const nextArr = hasSt ? arr.filter(v => v !== st) : [...arr, st];
                              setEditingDiary({ ...editingDiary, stickers: nextArr });
                            }}
                            className={`p-2 text-base rounded-xl border-2 transition-all cursor-pointer ${
                              hasSt ? 'bg-amber-100 border-[#FF8C00] shadow-xsScale' : 'bg-white border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingDiary(null)}
                      className="px-4 py-2 bg-stone-100 border-2 border-dark-charcoal rounded-xl text-xs font-black cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] cursor-pointer"
                    >
                      保存登録
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3.5">
                {diaries.map((dl) => (
                  <div key={dl.id} className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2px_2px_0_#4A2C2A] flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          {dl.date}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 border border-dark-charcoal/10 rounded-full ${
                          dl.author === 'smile' ? 'bg-orange-50 text-brand-orange' : 'bg-rose-50 text-brand-pink'
                        }`}>
                          {dl.author === 'smile' ? '🌞 すまいる執筆' : '🧸 きゃらめる執筆'}
                        </span>
                        {dl.visible ? (
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            公開中
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                            非表示
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingDiary(dl)}
                          className="px-2.5 py-1 bg-white hover:bg-stone-50 text-dark-charcoal border border-stone-200 text-[10.5px] font-black rounded-lg cursor-pointer"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteDiary(dl.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-brand-pink border border-rose-100 text-[10.5px] font-black rounded-lg cursor-pointer"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-black text-xs block text-dark-charcoal">{dl.title}</span>
                      <p className="text-[11px] text-dark-charcoal/70 line-clamp-2 leading-relaxed">{dl.content}</p>
                    </div>

                    {dl.response && (
                      <div className="bg-[#ECFDF5] border border-dashed border-[#10B981]/20 p-2 rounded-xl text-[10.5px] font-semibold text-emerald-850 flex items-center gap-1">
                        💭 <span className="font-black">相方コメ:</span> {dl.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              PHOTOS ALBUM CRUD PANEL
             ----------------------------------------------------------------- */}
          {activeTab === 'photos' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-dark-charcoal/20">
                <h3 className="text-lg font-black flex items-center gap-1.5">📸 写真アルバム管理</h3>
                <button
                  onClick={() => setEditingPhoto({ id: '', title: '', date: new Date().toISOString().split('T')[0].replaceAll('-', '.'), imageUrl: 'https://picsum.photos/seed/sample/500/500', comment: '', visible: true })}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] flex items-center gap-1 hover:-translate-y-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> 写真登録
                </button>
              </div>

              {/* Edit overlay */}
              {editingPhoto && (
                <form onSubmit={handleSavePhoto} className="bg-white border-3 border-dark-charcoal p-5 rounded-3xl shadow-[4px_4px_0_#4A2C2A] space-y-4">
                  <h4 className="text-sm font-black text-brand-orange border-b border-stone-100 pb-1.5">
                    {editingPhoto.id ? 'Polaroidアルバム写真編集 ✏️' : 'Polaroid写真を追加登録 📸'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60 font-mono">撮影日付 (YYYY.MM.DD 形式推奨)</label>
                      <input
                        type="text"
                        value={editingPhoto.date || ''}
                        onChange={e => setEditingPhoto({ ...editingPhoto, date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: 2026.05.25"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">アルバム表示ステータス</label>
                      <select
                        value={editingPhoto.visible !== false ? 'true' : 'false'}
                        onChange={e => setEditingPhoto({ ...editingPhoto, visible: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="true">公開する</option>
                        <option value="false">非表示にする</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60 font-sans">写真の見出し・タイトル</label>
                    <input
                      type="text"
                      value={editingPhoto.title || ''}
                      onChange={e => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: リハーサル前のオフショット！"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60 text-stone-500">
                      画像アドレス (URLパス)
                    </label>
                    <input
                      type="text"
                      value={editingPhoto.imageUrl || ''}
                      onChange={e => setEditingPhoto({ ...editingPhoto, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-mono text-stone-600"
                      placeholder="https://images.unsplash.com/... 等の画像URL"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">写真解説メモ（スクラップブック用コメント）</label>
                    <textarea
                      value={editingPhoto.comment || ''}
                      onChange={e => setEditingPhoto({ ...editingPhoto, comment: e.target.value })}
                      className="w-full px-3 py-2 h-20 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: 本番に向けた気合いの一振りです！"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(null)}
                      className="px-4 py-2 bg-stone-100 border-2 border-dark-charcoal rounded-xl text-xs font-black cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] cursor-pointer"
                    >
                      フォト登録保存
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {photos.map((ph) => (
                  <div key={ph.id} className="bg-white border-2 border-dark-charcoal rounded-2xl p-3 shadow-[2.5px_2.5px_0_#4A2C2A] flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="border border-stone-200 aspect-square rounded-xl overflow-hidden relative bg-stone-100">
                        <img src={ph.imageUrl} alt={ph.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {!ph.visible && (
                          <div className="absolute inset-0 bg-dark-charcoal/60 flex items-center justify-center">
                            <span className="text-white text-[10px] font-black uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded-full border border-white/20">
                              🔒 非公開中
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] font-mono text-stone-400 font-bold">
                          <span>📅 {ph.date}</span>
                        </div>
                        <h4 className="text-xs font-black text-dark-charcoal truncate">{ph.title}</h4>
                        <p className="text-[10px] text-dark-charcoal/70 line-clamp-2 leading-relaxed">{ph.comment}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-stone-100">
                      <button
                        onClick={() => setEditingPhoto(ph)}
                        className="flex-1 py-1 bg-yellow-50 hover:bg-yellow-100 text-[#D97706] text-[10.5px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-0.5 border border-amber-100"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(ph.id)}
                        className="flex-1 py-1 bg-rose-50 hover:bg-rose-100 text-brand-pink text-[10.5px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-0.5 border border-rose-100"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              GACHA SECRETS / OMIKUJI FORTUNES CRUD PANEL
             ----------------------------------------------------------------- */}
          {activeTab === 'gacha' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-dark-charcoal/20">
                <h3 className="text-lg font-black flex items-center gap-1.5">🔮 おみくじ結果管理</h3>
                <button
                  onClick={() => setEditingFortune({ id: '', season: '春シーズン', title: '', resultName: '', resultMessage: '', imageUrl: '', commentSmile: '', commentCaramel: '', luckyItem: '', luckyDance: '', ratingSmile: 3, ratingCaramel: 3, sortOrder: 9, visible: true })}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] flex items-center gap-1 hover:-translate-y-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> おみくじ追加
                </button>
              </div>

              {/* Edit overlay */}
              {editingFortune && (
                <form onSubmit={handleSaveFortune} className="bg-white border-3 border-dark-charcoal p-5 rounded-3xl shadow-[4px_4px_0_#4A2C2A] space-y-4">
                  <h4 className="text-sm font-black text-brand-orange border-b border-stone-100 pb-1.5">
                    おみくじスロットの編集・定義 ✏️
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">対象おみくじID (※一意な識別キー)</label>
                      <input
                        type="text"
                        value={editingFortune.id || ''}
                        disabled={!!fortunes.find(x => x.id === editingFortune.id)}
                        onChange={e => setEditingFortune({ ...editingFortune, id: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-mono font-bold"
                        placeholder="例: 超大吉, 笑顔中吉 など"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60 font-sans">シーズン（タグ）</label>
                      <select
                        value={editingFortune.season || '春シーズン'}
                        onChange={e => setEditingFortune({ ...editingFortune, season: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="春シーズン">春シーズン</option>
                        <option value="夏シーズン">夏シーズン</option>
                        <option value="秋シーズン">秋シーズン</option>
                        <option value="冬シーズン">冬シーズン</option>
                        <option value="通年シーズン">通年シーズン</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">全クリア対象の選定</label>
                      <select
                        value={editingFortune.visible !== false ? 'true' : 'false'}
                        onChange={e => setEditingFortune({ ...editingFortune, visible: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="true">ガチャで出現させる（公開する）</option>
                        <option value="false">テスト下書き（非表示）</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">運勢の結果ネーム</label>
                      <input
                        type="text"
                        value={editingFortune.resultName || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, resultName: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: 超大吉, 中吉 ..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">並び順(表示優先順) (数字が小さいほど前)</label>
                      <input
                        type="number"
                        value={editingFortune.sortOrder ?? 9}
                        onChange={e => setEditingFortune({ ...editingFortune, sortOrder: Number(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60 font-sans">おみくじ全体のタイトル見出し</label>
                    <input
                      type="text"
                      value={editingFortune.title || ''}
                      onChange={e => setEditingFortune({ ...editingFortune, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: スマイル全快超大吉！！🌻"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">運勢の解説メッセージ</label>
                    <textarea
                      value={editingFortune.resultMessage || ''}
                      onChange={e => setEditingFortune({ ...editingFortune, resultMessage: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold font-sans h-16"
                      placeholder="今日のラッキー運勢解説を書いてね..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">当たり配布画像URL</label>
                      <input
                        type="url"
                        value={editingFortune.imageUrl || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="https://... 画像のURLを貼り付け"
                      />
                      <p className="text-[10px] text-dark-charcoal/45 font-bold">
                        未入力の場合は、これまで通り自動生成のお札画像を配布します。
                      </p>
                    </div>
                    <div className="h-28 bg-stone-50 border-2 border-dashed border-dark-charcoal/20 rounded-xl overflow-hidden flex items-center justify-center">
                      {editingFortune.imageUrl ? (
                        <img
                          src={editingFortune.imageUrl}
                          alt="配布画像プレビュー"
                          className="w-full h-full object-contain bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] font-black text-dark-charcoal/35">画像プレビュー</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">🌻 すまいるからの応援コメント</label>
                      <textarea
                        value={editingFortune.commentSmile || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, commentSmile: e.target.value })}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-xl text-xs font-semibold bg-amber-50 h-14"
                        placeholder="「いつでも私が応援してるからねッ！🌻」"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">🧸 きゃらめるからの応援コメント</label>
                      <textarea
                        value={editingFortune.commentCaramel || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, commentCaramel: e.target.value })}
                        className="w-full px-3 py-1.5 border border-pink-300 rounded-xl text-xs font-semibold bg-[#FFF5F6] h-14"
                        placeholder="「のんびり、いっしょに進もうね🧸」"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">今日のおすすめラッキーアイテム</label>
                      <input
                        type="text"
                        value={editingFortune.luckyItem || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, luckyItem: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: オレンジ味のグミキャンディ"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">今日のおすすめダンス課題</label>
                      <input
                        type="text"
                        value={editingFortune.luckyDance || ''}
                        onChange={e => setEditingFortune({ ...editingFortune, luckyDance: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                        placeholder="例: 「ハッピーシンセサイザ」のイントロの部分！"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingFortune(null)}
                      className="px-4 py-2 bg-stone-100 border-2 border-dark-charcoal rounded-xl text-xs font-black cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] cursor-pointer"
                    >
                      おみくじ登録保存
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {fortunes.map((fort) => (
                  <div key={fort.id} className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2.5px_2.5px_0_#4A2C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[9px] font-black text-dark-charcoal/60 bg-[#FFFBEB] px-2 py-0.5 border border-amber-200 rounded-full">
                          🍂 {fort.season}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 font-sans">
                          (順位順: #{fort.sortOrder})
                        </span>
                        <span className="px-2 py-0.2 bg-orange-100 text-[#D97706] font-black text-[10px] border border-orange-200 rounded">
                          【{fort.resultName}】
                        </span>
                        {fort.visible ? (
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            アクティブ
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-stone-400 bg-stone-50 px-2.5 py-0.5 rounded-full border border-stone-200">
                            テスト非公開
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-dark-charcoal mt-1">{fort.title}</h4>
                      <p className="text-[11px] text-dark-charcoal/70 line-clamp-1 leading-relaxed">{fort.resultMessage}</p>
                      {fort.imageUrl && (
                        <p className="text-[10px] text-brand-pink font-black line-clamp-1">
                          🎁 配布画像あり: {fort.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingFortune(fort)}
                        className="px-2.5 py-1 bg-white hover:bg-stone-50 text-dark-charcoal border border-stone-200 text-[10.5px] font-black rounded-lg cursor-pointer"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteFortune(fort.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-brand-pink border border-rose-100 text-[10.5px] font-black rounded-lg cursor-pointer"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              Clearance Special Secret Letters CRUD PANEL
             ----------------------------------------------------------------- */}
          {activeTab === 'letters' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-dark-charcoal/20">
                <h3 className="text-lg font-black flex items-center gap-1.5">💌 コンプリート手紙管理</h3>
                <button
                  onClick={() => setEditingLetter({ id: '', season: '春シーズン', title: '', smileContent: '', caramelContent: '', visible: true })}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] flex items-center gap-1 hover:-translate-y-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <Plus size={14} /> 宛名手紙を定義
                </button>
              </div>

              {/* Edit overlay */}
              {editingLetter && (
                <form onSubmit={handleSaveLetter} className="bg-white border-3 border-dark-charcoal p-5 rounded-3xl shadow-[4px_4px_0_#4A2C2A] space-y-4">
                  <h4 className="text-sm font-black text-brand-orange border-b border-stone-100 pb-1.5">
                    コンプリート特別招待状（手紙）定義 ✏️
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">手紙識別キー (独自ID / 英数字)</label>
                      <input
                        type="text"
                        value={editingLetter.id || ''}
                        disabled={!!letters.find(x => x.id === editingLetter.id)}
                        onChange={e => setEditingLetter({ ...editingLetter, id: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-mono font-bold"
                        placeholder="例: season-letter-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60 font-sans">達成条件の対象シーズン</label>
                      <select
                        value={editingLetter.season || '春シーズン'}
                        onChange={e => setEditingLetter({ ...editingLetter, season: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="春シーズン">春シーズン</option>
                        <option value="夏シーズン">夏シーズン</option>
                        <option value="秋シーズン">秋シーズン</option>
                        <option value="冬シーズン">冬シーズン</option>
                        <option value="通年シーズン">通年シーズン</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-dark-charcoal/60">公開設定</label>
                      <select
                        value={editingLetter.visible !== false ? 'true' : 'false'}
                        onChange={e => setEditingLetter({ ...editingLetter, visible: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      >
                        <option value="true">有効にする（公開）</option>
                        <option value="false">制作中(非表示)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-dark-charcoal/60">手紙の統一見出しタイトル</label>
                    <input
                      type="text"
                      value={editingLetter.title || ''}
                      onChange={e => setEditingLetter({ ...editingLetter, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-dark-charcoal rounded-xl text-xs font-bold"
                      placeholder="例: すまいる＆きゃらめるからの愛のコンプリートレター"
                    />
                  </div>

                  <div className="bg-amber-50 p-3 rounded-2xl text-[11px] font-bold text-dark-charcoal/70 border border-dashed border-amber-300">
                    💡 宛名プレースホルダー: 本文の中に <strong>{"{{name}}"}</strong> を書くと、ファンが入力した名前（ニックネーム）が自動的にそこに埋め込まれます！
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[orange] font-semibold">🌻 すまいる執筆のお手紙本文 ({"{{name}}"}使用可能)</label>
                    <textarea
                      value={editingLetter.smileContent || ''}
                      onChange={e => setEditingLetter({ ...editingLetter, smileContent: e.target.value })}
                      className="w-full px-3 py-2 h-28 border-2 border-dark-charcoal rounded-xl text-xs font-bold font-sans"
                      placeholder="大好きな{{name}}へ🌻 おみくじコンプリート本当におめでとう！..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[pink] font-semibold">🧸 きゃらめる執筆のお手紙本文 ({"{{name}}"}使用可能)</label>
                    <textarea
                      value={editingLetter.caramelContent || ''}
                      onChange={e => setEditingLetter({ ...editingLetter, caramelContent: e.target.value })}
                      className="w-full px-3 py-2 h-28 border-2 border-dark-charcoal rounded-xl text-xs font-bold font-sans"
                      placeholder="親愛なる{{name}}へ🧸 すべての運勢を揃えてくれてありがとう..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingLetter(null)}
                      className="px-4 py-2 bg-stone-100 border-2 border-dark-charcoal rounded-xl text-xs font-black cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0_#4A2C2A] cursor-pointer"
                    >
                      手紙内容の保存
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {letters.map((letItem) => (
                  <div key={letItem.id} className="bg-white border-2 border-dark-charcoal rounded-2xl p-4 shadow-[2.5px_2.5px_0_#4A2C2A] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 border border-rose-200 rounded-full">
                          達成条件 Season: {letItem.season}
                        </span>
                        {letItem.visible ? (
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                            稼働中
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                            停止中
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-dark-charcoal mt-1">{letItem.title}</h4>
                      <span className="text-[10px] text-stone-400 font-semibold block">Smile message: {letItem.smileContent?.slice(0, 30)}...</span>
                      <span className="text-[10px] text-stone-400 font-semibold block">Caramel message: {letItem.caramelContent?.slice(0, 30)}...</span>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingLetter(letItem)}
                        className="px-2.5 py-1 bg-white hover:bg-stone-50 text-dark-charcoal border border-stone-200 text-[10.5px] font-black rounded-lg cursor-pointer"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteLetter(letItem.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-brand-pink border border-rose-100 text-[10.5px] font-black rounded-lg cursor-pointer"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
