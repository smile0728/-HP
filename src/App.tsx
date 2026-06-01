import { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Tv, 
  Youtube, 
  Twitter, 
  Heart, 
  Sparkles, 
  Volume2, 
  Gift, 
  CornerRightDown, 
  Smile, 
  Compass,
  Star
} from 'lucide-react';

// Import components
import CursorSparks from './components/CursorSparks';
import LoadingScreen from './components/LoadingScreen';

// Data
import { DANCE_VIDEOS } from './data';
import { DanceVideo } from './types';
import { toYouTubeEmbedUrl, toYouTubeThumbnailUrl } from './lib/youtube';

// Site images served from public/
const MainVisualImg = "/picture/main-visual.png";
const LogoImg = "/picture/logo.svg";
const OFFICIAL_LINKS = {
  youtube: 'https://www.youtube.com/@aloha-z_0728',
  instagram: 'https://www.instagram.com/oamebiyori/',
  niconico: 'https://www.nicovideo.jp/mylist/69049323',
  x: 'https://x.com/aloha_z_0728?s=20',
};
const Announcements = lazy(() => import('./components/Announcements'));
const ExchangeDiary = lazy(() => import('./components/ExchangeDiary'));
const FortuneGame = lazy(() => import('./components/FortuneGame'));
const Gallery = lazy(() => import('./components/Gallery'));
const MusicPlayer = lazy(() => import('./components/MusicPlayer'));
const ProfileCards = lazy(() => import('./components/ProfileCards'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

function SectionFallback() {
  return (
    <div className="w-full min-h-24 rounded-2xl border-2 border-dashed border-dark-charcoal/20 bg-white/50 flex items-center justify-center text-xs font-black text-dark-charcoal/50">
      準備中...
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    const poller = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 500);

    // Track pageView event if active path is fan homepage
    if (!window.location.pathname.startsWith('/admin')) {
      import('./lib/firebase')
        .then(({ logTelemetryEvent }) => logTelemetryEvent('pageViews'))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(poller);
    };
  }, [currentPath]);

  const [isLoading, setIsLoading] = useState(true);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  
  // Video simulated play states
  const [activeVideo, setActiveVideo] = useState<DanceVideo>(DANCE_VIDEOS[0]);
  const [danceVideos, setDanceVideos] = useState<DanceVideo[]>(DANCE_VIDEOS);
  const [videoLikes, setVideoLikes] = useState<{ [key: string]: number }>({
    'video-1': DANCE_VIDEOS[0].heartsCount,
    'video-2': DANCE_VIDEOS[1].heartsCount,
    'video-3': DANCE_VIDEOS[2].heartsCount,
  });
  const [hasLikedVideo, setHasLikedVideo] = useState<{ [key: string]: boolean }>({});
  const [siteImages, setSiteImages] = useState({
    mainVisualUrl: MainVisualImg,
    logoUrl: LogoImg,
    footerLogoUrl: LogoImg,
  });
  const activeVideoEmbedUrl = toYouTubeEmbedUrl(activeVideo.youtubeUrl);

  useEffect(() => {
    import('./lib/firebase')
      .then(async ({ getDanceVideos }) => {
        const videos = await getDanceVideos(false);
        if (videos.length === 0) return;
        setDanceVideos(videos);
        setActiveVideo(videos[0]);
        const baseCounts = videos.reduce<Record<string, number>>((acc, video) => {
            acc[video.id] = video.heartsCount;
            return acc;
          }, {});
        setVideoLikes(baseCounts);

        const { getLikeEngagement } = await import('./lib/firebase');
        const engagement = await getLikeEngagement('dance_video', videos.map((video) => video.id), baseCounts);
        setVideoLikes(engagement.counts);
        setHasLikedVideo(engagement.liked);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    import('./lib/firebase')
      .then(async ({ getSiteImages }) => {
        setSiteImages(await getSiteImages());
      })
      .catch(() => {});
  }, []);

  // Secret candy rain particle simulation
  const [fallingCandies, setFallingCandies] = useState<Array<{ id: number; left: number; emoji: string; delay: number }>>([]);

  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);

    // Audio click beep inside
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + nextCount * 120, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}

    if (nextCount >= 5) {
      setLogoClicks(0);
      setShowSecret(true);
      triggerCandyRain();

      // Play victory fanfare synthesizer
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const synth = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration - 0.02);
          osc.start(audioCtx.currentTime + start);
          osc.stop(audioCtx.currentTime + start + duration);
        };
        synth(523.25, 0, 0.15); // C5
        synth(659.25, 0.15, 0.15); // E5
        synth(783.99, 0.3, 0.15); // G5
        synth(1046.50, 0.45, 0.4); // C6
      } catch (_) {}
    }
  };

  const triggerCandyRain = () => {
    const emojis = ['🍬', '🍭', '🍓', '🌻', '🧸', '💖', '⭐', '✨'];
    const array = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 95, // % position
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 4, // delay in seconds
    }));
    setFallingCandies(array);

    // Auto clear after 8 seconds
    setTimeout(() => {
      setFallingCandies([]);
    }, 8000);
  };

  const handleLikeVideo = (videoId: string) => {
    const prevLiked = Boolean(hasLikedVideo[videoId]);
    const nextLiked = !prevLiked;
    if (prevLiked) {
      setVideoLikes((prev) => ({ ...prev, [videoId]: Math.max((prev[videoId] ?? 0) - 1, 0) }));
      setHasLikedVideo((prev) => ({ ...prev, [videoId]: false }));
    } else {
      setVideoLikes((prev) => ({ ...prev, [videoId]: (prev[videoId] ?? activeVideo.heartsCount ?? 0) + 1 }));
      setHasLikedVideo((prev) => ({ ...prev, [videoId]: true }));

      // Soft heart beat beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(512, audioCtx.currentTime);
        osc.frequency.setValueAtTime(640, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (_) {}
    }

    import('./lib/firebase')
      .then(({ toggleLikeReaction }) => toggleLikeReaction('dance_video', videoId, nextLiked))
      .catch((error) => console.warn('Could not persist video like', error));
  };

  const handleSnsClick = () => {
    import('./lib/firebase')
      .then(({ logTelemetryEvent }) => logTelemetryEvent('snsClicks'))
      .catch(() => {});
  };

  if (currentPath.startsWith('/admin')) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-brand-cream text-dark-charcoal flex items-center justify-center font-sans font-black">
            管理画面を読み込み中...
          </div>
        }
      >
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen text-dark-charcoal dotted-bg font-sans scroll-smooth relative select-none overflow-x-hidden">
      {/* Loading Splash overlay */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* Sparks cursor visuals */}
      {!isLoading && <CursorSparks />}

      {/* Falling candy rain inside secret mode */}
      <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
        {fallingCandies.map((candy) => (
          <motion.div
            key={candy.id}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: 3.5, ease: 'linear', delay: candy.delay }}
            style={{
              position: 'absolute',
              left: `${candy.left}%`,
              fontSize: '28px',
            }}
          >
            {candy.emoji}
          </motion.div>
        ))}
      </div>

      {/* Golden secret modal card */}
      <AnimatePresence>
        {showSecret && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.5, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-amber-100 border-4 border-dark-charcoal p-6 rounded-3xl max-w-md w-full shadow-[6px_8px_0px_#4A3E3D] relative text-center"
            >
              <div className="absolute -top-6 -right-6 text-5xl">👑</div>
              <h4 className="text-2xl font-display font-black text-amber-600 mb-2">
                ✨ シークレットおやつ部屋 ✨
              </h4>
              <p className="text-xs text-dark-charcoal/80 leading-relaxed font-bold mb-4">
                おめでとう！ここを見つけたあなたは正真正銘あろはーずマスターだ！
              </p>

              <div className="bg-white p-4 border-2 border-dashed border-dark-charcoal rounded-2xl flex flex-col gap-4 text-left">
                <div className="text-xs">
                  <span className="text-brand-orange font-bold font-display block mb-1">🌻 すまいる：</span>
                  「見つけてくれてありがとうっ！ いろんな仕掛けを作ったからたくさんあそんでいってね！」
                </div>
                <div className="text-xs border-t border-dashed border-stone-200 pt-3">
                  <span className="text-brand-pink font-bold font-display block mb-1">🧸 きゃるめん：</span>
                  「うわ、見つかっちゃったぁ…！細かいとこまで見てくれて嬉しいです！楽しんでいってね！」
                </div>
              </div>

              <button
                onClick={() => setShowSecret(false)}
                className="mt-5 px-6 py-2.5 bg-brand-pink hover:bg-rose-500 text-white font-black rounded-xl border-2 border-dark-charcoal text-xs shadow-[2px_2px_0_#4A3E3D] cursor-pointer"
              >
                ひみつを閉じる 🍬
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bubbly Scrolling Top Marquee header */}
      <div className="bg-brand-orange border-b-4 border-dark-charcoal py-2 text-white font-mono font-bold text-xs uppercase overflow-hidden tracking-wider select-none relative z-40">
        <div className="flex gap-12 whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          <span>★ DANCE WITH ALOHA-Z! ★元気いっぱいステップ!! ★ DANCE COVER DUO ALOHA-Z ★ SMILE & Kyarumen ENERGETIC LIVE STAMP ★ 踊って、笑って、あろはーず ★</span>
          <span>★ DANCE WITH ALOHA-Z! ★元気いっぱいステップ!! ★ DANCE COVER DUO ALOHA-Z ★ SMILE & Kyarumen ENERGETIC LIVE STAMP ★ 踊って、笑って、あろはーず！ ★</span>
        </div>
      </div>

      {/* Main Container Layout */}
      {!isLoading && (
        <>
          {/* Sticky Navigation Bar */}
          <div className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-md border-b-4 border-dark-charcoal py-3 px-3 sm:px-4 shadow-[0_4px_0_rgba(74,44,42,0.15)] flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Left logo / mini-brand */}
            <div 
              className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="トップに戻る"
            >
              <span className="bg-brand-orange text-white font-black text-lg px-4 py-1.5 rounded-full shadow-[2.5px_2.5px_0px_#4A2C2A] rotate-[-1deg] flex items-center">
                ALOHA-Z! <span className="ml-1 text-sm">🍬</span>
              </span>
              <span className="text-[10px] font-black text-dark-charcoal font-sans hidden md:inline-block tracking-widest opacity-85">CANDY POP NAVI</span>
            </div>
            {/* Nav buttons */}
            <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
              {[
                { label: '🎦 シアター', id: 'videos', shadowColor: '#FF8C00' },
                { label: '🌻 プロフィール', id: 'profiles', shadowColor: '#FF69B4' },
                { label: '📝 交換日記', id: 'diary', shadowColor: '#FFD700' },
                { label: '🎨 ギャラリー', id: 'gallery', shadowColor: '#FF8C00' },
                { label: '🔮 おみくじガチャ', id: 'fortune', shadowColor: '#FF69B4' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const el = document.getElementById(item.id);
                    if (el) {
                      const offset = 80;
                      const bodyRect = document.body.getBoundingClientRect().top;
                      const elementRect = el.getBoundingClientRect().top;
                      const elementPosition = elementRect - bodyRect;
                      const offsetPosition = elementPosition - offset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="bg-white border-2 border-dark-charcoal rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black text-dark-charcoal transition-all hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
                  style={{ boxShadow: `2.5px 2.5px 0px ${item.shadowColor}` }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-10 sm:gap-12 relative overflow-hidden">
          
          {/* Section ① HERO FIRST VIEW */}
          <section className="w-full min-w-0 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center bg-brand-cream/80 border-4 border-dark-charcoal p-4 sm:p-6 rounded-3xl shadow-[4px_4px_0_#4A3E3D] sm:shadow-[6px_6px_0_#4A3E3D] relative overflow-hidden mt-4">
            
            {/* Gloss shine card design details */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Left Side: Generated Character Illustration within retro border */}
            <div className="w-full min-w-0 lg:w-1/2 flex flex-col items-center">
              <motion.div 
                initial={{ rotate: -2, scale: 0.95 }}
                animate={{ rotate: [-2, 1, -2] }}
                transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                className="p-3 sm:p-4 bg-white border-4 border-dark-charcoal rounded-3xl shadow-[4px_5px_0_rgba(255,158,0,0.3)] sm:shadow-[5px_8px_0_rgba(255,158,0,0.3)] relative group w-full max-w-xl aspect-[16/9]"
              >
                {/* Visual sticker badges overlapping the frame */}
                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-3xl sm:text-4xl animate-bounce">🌻</div>
                <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 text-3xl sm:text-4xl animate-bounce" style={{ animationDelay: '300ms' }}>🧸</div>

                <div className="h-full overflow-hidden rounded-2xl border-2 border-dark-charcoal">
                  <img 
                    src={siteImages.mainVisualUrl} 
                    alt="あろはーず 2人のビジュアル" 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Side: Logo, Copy & SNS links box */}
            <div className="w-full min-w-0 lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 justify-center">
              {/* Logo Sticker */}
              <div 
                onClick={handleLogoClick}
                className="relative w-full max-w-[240px] sm:max-w-[280px] cursor-pointer hover:scale-105 sm:hover:scale-110 active:scale-95 transition-all duration-200 select-none group"
                title="何度もクリックしてみてね！"
              >
                {/* Hint banner */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-brand-yellow border border-dark-charcoal px-2 py-0.5 rounded text-[8px] font-black text-dark-charcoal rotate-[2deg] shadow-sm animate-bounce group-hover:block hidden">
                  PULL SECRET HINT! 🍭
                </div>

                <img 
                  src={siteImages.logoUrl} 
                  alt="あろはーずの公式ロゴ" 
                  referrerPolicy="no-referrer"
                  className="w-full pointer-events-none"
                />
              </div>

              {/* Main Slogan Catchphrases */}
              <div className="space-y-1 mt-2">
                <h2 className="text-2xl sm:text-3xl font-display font-black text-dark-charcoal leading-tight drop-shadow-sm">
                  「ようこそあろはーずパークへ！」
                </h2>
                <p className="text-brand-pink font-semibold text-sm tracking-widest font-display animate-pulse">
                  あなたの笑顔があろはーずの幸せ！気軽に楽しんでいってね！
                </p>
              </div>

              {/* Description body */}
              <p className="text-xs text-dark-charcoal/70 max-w-md leading-relaxed font-semibold">
                私たちは踊ってみたで笑顔をお届けする女性２人組踊り手ユニット「あろはーず」です！
                YouTubeやニコニコ動画でマイペースに投稿しています。ここはいつも頑張ってる皆さんがくすっと笑顔になれるように2人で作ったテーマパークです⭐
                おもちゃ屋さんを歩くように、いっぱい遊んでいってね！
              </p>

              {/* SNS and Links buttons frame */}
              <div className="w-full border-t-2 border-dashed border-dark-charcoal/30 pt-4 mt-2">
                <span className="text-[10px] font-mono text-zinc-500 block mb-3 font-semibold tracking-wider">CONNECT WITH US!（公式リンク）</span>
                <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
                  
                  <a href={OFFICIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" onClick={handleSnsClick} className="px-3.5 py-2 rounded-xl border-2 border-dark-charcoal bg-[#FF0000] hover:bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#4A3E3D] transition-all transform active:translate-y-0.5">
                    <Youtube size={14} fill="currentColor" /> YouTube
                  </a>

                  <a href={OFFICIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" onClick={handleSnsClick} className="px-3.5 py-2 rounded-xl border-2 border-dark-charcoal bg-gradient-to-tr from-[#FD1D1D] to-[#E1306C] hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#4A3E3D] transition-all transform active:translate-y-0.5">
                    <Instagram size={14} /> Instagram
                  </a>

                  <a href={OFFICIAL_LINKS.niconico} target="_blank" rel="noopener noreferrer" onClick={handleSnsClick} className="px-3.5 py-2 rounded-xl border-2 border-dark-charcoal bg-[#252525] hover:bg-zinc-800 text-white font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#4A3E3D] transition-all transform active:translate-y-0.5">
                    <Tv size={14} /> ニコニコ
                  </a>

                  <a href={OFFICIAL_LINKS.x} target="_blank" rel="noopener noreferrer" onClick={handleSnsClick} className="px-3.5 py-2 rounded-xl border-2 border-dark-charcoal bg-zinc-850 bg-stone-100 hover:bg-stone-200 text-dark-charcoal font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#4A3E3D] transition-all transform active:translate-y-0.5">
                    <Twitter size={14} fill="currentColor" /> X
                  </a>
                  
                </div>
              </div>

            </div>
          </section>

          {/* Dynamic Bulletins Board */}
          <section id="announcements" className="w-full flex justify-center max-w-4xl mx-auto py-2">
            <Suspense fallback={<SectionFallback />}>
              <Announcements />
            </Suspense>
          </section>

          {/* Section ② LATEST VIDEO & CASSETTE AUDIO COLUMN */}
          <section id="videos" className="w-full min-w-0 bg-brand-orange/10 border-4 border-dark-charcoal p-4 sm:p-6 rounded-3xl shadow-[4px_4px_0_#4A3E3D] sm:shadow-[6px_6px_0_#4A3E3D] relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch">
            
            {/* Title icon */}
            <div className="absolute top-3 left-4 sm:left-6 bg-brand-orange border-2 border-dark-charcoal rounded-full px-3 sm:px-4 py-1 sm:py-1.5 font-sans font-extrabold text-xs sm:text-sm text-white shadow-[2px_2px_0_#4A3E3D] flex items-center gap-1">
              <Tv size={14} /> あろはーずシアター
            </div>

            {/* Left side: Retro CRT visual display showing selected cover video */}
            <div className="w-full min-w-0 md:flex-1 flex flex-col gap-4">
              <h3 className="text-lg sm:text-xl font-display font-black text-dark-charcoal text-left mt-12 sm:mt-12 pl-1">
                🎥 踊ってみた最新映像
              </h3>

              {/* Retro Heisei TV Monitor console */}
              <div className="w-full min-w-0 bg-stone-800 border-4 border-dark-charcoal rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-[3px_3px_0_#4A3E3D] sm:shadow-[4px_4px_0_#4A3E3D] relative overflow-hidden">
                {/* TV screen glass glossy overlay */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10" />

                {/* CRT grid texture overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none z-10" />

                {/* Simulated Playing display or Playable screen */}
                <div className="w-full aspect-video rounded border-2 border-dark-charcoal bg-black relative flex items-center justify-center overflow-hidden">
                  {activeVideo.youtubeUrl ? (
                    <iframe
                      src={activeVideoEmbedUrl}
                      title={activeVideo.title || activeVideo.description}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <img
                      src={activeVideo.thumbnailUrl || toYouTubeThumbnailUrl(activeVideo.youtubeUrl) || ''}
                      alt={activeVideo.title || activeVideo.description}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover blur-[0.5px] opacity-75"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                </div>

                {/* TV controls board inside shell */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-zinc-400 font-mono text-[8px] sm:text-[9px] mt-2 border-t border-zinc-700 pt-2 z-10">
                  <span className="text-emerald-400 animate-pulse flex items-center gap-1 font-bold">● ALOHA-Z RECORDING ACTIVE</span>
                  <span>UTC: 2026/05/25</span>
                </div>
              </div>

              {/* Cute comments below the screen from SMILE & Kyarumen */}
              <div className="bg-white border-2 border-dark-charcoal p-4 rounded-2xl shadow-sm text-xs flex flex-col gap-2">
                <div className="text-brand-orange font-bold flex items-center gap-1">
                  💡 メンバーのイチオシ裏話
                </div>
                <div className="space-y-1.5 leading-relaxed font-semibold">
                  <p className="text-dark-charcoal">{activeVideo.description || activeVideo.title}</p>
                </div>

                {/* Heart Button for like index */}
                <div className="border-t border-dashed border-stone-200 pt-2 mt-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-[10px] text-stone-500 font-bold font-mono">RELEASED: {activeVideo.releasedDate}</span>
                  <button
                    onClick={() => handleLikeVideo(activeVideo.id)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dark-charcoal text-[11px] font-bold cursor-pointer transition-all ${
                      hasLikedVideo[activeVideo.id]
                        ? 'bg-brand-pink text-white shadow-[1px_2px_0_#4A3E3D]'
                        : 'bg-stone-50 text-dark-charcoal hover:bg-stone-100 pl-3'
                    }`}
                  >
                    <Heart size={12} fill={hasLikedVideo[activeVideo.id] ? 'currentColor' : 'none'} className={hasLikedVideo[activeVideo.id] ? 'animate-bounce' : ''} />
                    <span>この動画すき！ ({videoLikes[activeVideo.id] ?? activeVideo.heartsCount})</span>
                  </button>
                </div>
              </div>

              {/* Switchable Video selection items */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-mono font-bold text-dark-charcoal/50">VIDEO SELECTOR（動画を選択）</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {danceVideos.map((vid) => (
                    <button
                      key={vid.id}
                      onClick={() => setActiveVideo(vid)}
                      className={`min-w-0 text-left p-2 rounded-xl border-2 border-dark-charcoal transition-all text-[11px] font-bold cursor-pointer leading-tight flex items-center gap-2 ${
                        activeVideo.id === vid.id
                          ? 'bg-brand-orange text-white'
                          : 'bg-white text-dark-charcoal hover:bg-orange-50/50'
                      }`}
                    >
                      <img 
                        src={vid.thumbnailUrl || toYouTubeThumbnailUrl(vid.youtubeUrl) || ''} 
                        alt={vid.title || vid.description} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded border border-dark-charcoal/20"
                      />
                      <div className="truncate flex-1 min-w-0">
                        <span className="font-mono text-[8px] opacity-75">{vid.releasedDate}</span>
                        <div className="truncate font-semibold">{(vid.description || vid.title || '').replace('【あろはーず】', '').replace('踊ってみた', '')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right side: Music Player Component */}
            <div className="w-full md:w-auto flex flex-col items-center justify-center p-0 sm:p-2">
              <h3 className="text-lg sm:text-xl font-display font-black text-dark-charcoal text-center mb-4 self-center md:self-start flex items-center gap-1 md:pl-2">
                🎵 あろはーずのマイリス
              </h3>
              <Suspense fallback={<SectionFallback />}>
                <MusicPlayer />
              </Suspense>
            </div>

          </section>

          {/* Section ③ MEMBER DETAILED PROFILE BOOK */}
          <section id="profiles" className="w-full min-w-0 flex flex-col items-center gap-4">
            <div className="text-center mb-2">
              <span className="text-xs font-bold font-mono tracking-widest text-brand-pink bg-pink-100/60 px-2.5 py-1 rounded-full border border-pink-200">
                PROFILES
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-dark-charcoal mt-2 leading-tight">
                あろはーずの２人を紹介！ 🌸
              </h2>
            </div>
            
            <Suspense fallback={<SectionFallback />}>
              <ProfileCards />
            </Suspense>
          </section>

          {/* Section ④ EXCHANGE DIARY */}
          <section id="diary" className="w-full min-w-0 flex flex-col items-center gap-4">
            <Suspense fallback={<SectionFallback />}>
              <ExchangeDiary />
            </Suspense>
          </section>

          {/* Section ⑤ DRAGGABLE PHOTO COLLAGE BOARD */}
          <section id="gallery" className="w-full min-w-0 flex flex-col items-center gap-4">
            <Suspense fallback={<SectionFallback />}>
              <Gallery />
            </Suspense>
          </section>

          {/* Section ⑥ INTERACTIVE O-MIKUJI GACHAMACHINE */}
          <section id="fortune" className="w-full min-w-0 flex flex-col items-center justify-center">
            <Suspense fallback={<SectionFallback />}>
              <FortuneGame />
            </Suspense>
          </section>

          {/* Footer view */}
          <footer className="w-full border-t-4 border-dashed border-dark-charcoal/20 pt-8 pb-4 text-center flex flex-col items-center gap-4">
            
            <div 
              onClick={handleLogoClick}
              className="max-w-[120px] select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <img 
                src={siteImages.footerLogoUrl || siteImages.logoUrl} 
                alt="Aloha-z design logo" 
                referrerPolicy="no-referrer"
                className="w-full"
              />
            </div>

            {/* Social direct grid */}
            <div className="flex gap-4">
              {[
                { name: 'X', icon: <Twitter size={14} />, color: 'bg-stone-150 text-dark-charcoal' },
                { name: 'Instagram', icon: <Instagram size={14} />, color: 'bg-pink-150 text-brand-pink' },
                { name: 'Youtube', icon: <Youtube size={14} fill="currentColor" />, color: 'text-red-650' }
              ].map((soc, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-dark-charcoal ${soc.color} flex items-center justify-center text-xs font-black shadow-[1.5px_2px_0_#4A3E3D]`}>
                  {soc.icon}
                </div>
              ))}
            </div>

            {/* Copyright stamp */}
            <div className="text-[10px] font-mono font-bold text-dark-charcoal/50 uppercase leading-snug">
              © 2026 ALOHA-Z CANDY POP THEMEPARK WEB SITE. <br className="md:hidden"/> All rights reserved (すまいる & きゃるめん).
            </div>

            <button 
              onClick={() => {
                window.history.pushState(null, '', '/admin');
                setCurrentPath('/admin');
              }}
              className="text-[10px] font-bold text-dark-charcoal/30 hover:text-brand-orange hover:underline transition-colors cursor-pointer mt-1"
            >
              ⚙️ 運営管理室ログインはこちら
            </button>
          </footer>

        </main>
        </>
      )}
    </div>
  );
}
