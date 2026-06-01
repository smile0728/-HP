import { useEffect, useState } from 'react';
import { Play, Radio, Music, Heart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getLikeEngagement, getMusicTracks, toggleLikeReaction } from '../lib/firebase';
import { MusicTrack } from '../types';
import { toYouTubeEmbedUrl, toYouTubeThumbnailUrl } from '../lib/youtube';

const FALLBACK_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'ハッピー・キャンディ・ステップ 🍬',
    description: 'すまいる選曲！',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    likes: 128,
    visible: true,
    sortOrder: 1,
  },
  {
    id: 'track-2',
    title: '夕焼けメロンソーダ 🥤',
    description: 'きゃるめん選曲！',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    likes: 128,
    visible: true,
    sortOrder: 2,
  }
];

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>(FALLBACK_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [likesByTrackId, setLikesByTrackId] = useState<Record<string, number>>({
    [FALLBACK_TRACKS[0].id]: FALLBACK_TRACKS[0].likes,
    [FALLBACK_TRACKS[1].id]: FALLBACK_TRACKS[1].likes,
  });
  const [likedByTrackId, setLikedByTrackId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getMusicTracks(false)
      .then(async (items) => {
        const nextTracks = items.length > 0 ? items : FALLBACK_TRACKS;
        setTracks(nextTracks);
        setCurrentTrackIndex(0);
        const baseCounts = nextTracks.reduce<Record<string, number>>((acc, track) => {
          acc[track.id] = track.likes;
          return acc;
        }, {});
        setLikesByTrackId(baseCounts);
        const engagement = await getLikeEngagement('music_track', nextTracks.map((track) => track.id), baseCounts);
        setLikesByTrackId(engagement.counts);
        setLikedByTrackId(engagement.liked);
      })
      .catch(() => {});
  }, []);

  const currentTrack = tracks[currentTrackIndex] || FALLBACK_TRACKS[0];
  const embedUrl = toYouTubeEmbedUrl(currentTrack.youtubeUrl);
  const likes = likesByTrackId[currentTrack.id] ?? currentTrack.likes;
  const isLiked = Boolean(likedByTrackId[currentTrack.id]);

  const handleHeartClick = () => {
    const nextLiked = !isLiked;
    setLikesByTrackId((prev) => ({
      ...prev,
      [currentTrack.id]: nextLiked ? (prev[currentTrack.id] ?? currentTrack.likes) + 1 : Math.max((prev[currentTrack.id] ?? 0) - 1, 0)
    }));
    setLikedByTrackId((prev) => ({ ...prev, [currentTrack.id]: nextLiked }));

    toggleLikeReaction('music_track', currentTrack.id, nextLiked).catch(() => {
      setLikedByTrackId((prev) => ({ ...prev, [currentTrack.id]: isLiked }));
      setLikesByTrackId((prev) => ({
        ...prev,
        [currentTrack.id]: isLiked ? (prev[currentTrack.id] ?? currentTrack.likes) + 1 : Math.max((prev[currentTrack.id] ?? 0) - 1, 0)
      }));
    });
  };

  const stepTrack = (delta: number) => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + delta + tracks.length) % tracks.length);
  };

  return (
    <div className="bg-amber-50 border-4 border-dark-charcoal p-4 sm:p-5 rounded-3xl arcade-border max-w-sm w-full min-w-0 relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-2 right-2 flex gap-1 text-[10px] items-center text-amber-900 border border-amber-900/30 px-2 py-0.5 rounded-full bg-amber-100">
        <Radio size={12} className="animate-pulse" />
        <span className="font-mono">YOUTUBE</span>
      </div>

      <div className="flex gap-2 items-center text-left self-start mb-4 min-w-0 pr-20">
        <Music className="text-brand-orange animate-bounce" size={24} />
        <div className="min-w-0">
          <h4 className="text-sm font-display font-black text-dark-charcoal">あろはーず・YouTubeプレイヤー</h4>
          <span className="text-[10px] font-mono text-dark-charcoal/60">STREAM FROM YOUTUBE</span>
        </div>
      </div>

      <div className="w-full min-w-0 bg-brand-orange rounded-xl border-4 border-dark-charcoal p-3 flex flex-col gap-3 shadow-[inset_-3px_-6px_0px_rgba(0,0,0,0.15)] relative">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-dark-charcoal text-white rounded">NOW PLAYING</span>
          <span className="text-[9px] font-mono text-dark-charcoal font-black">TRACK {currentTrackIndex + 1}</span>
        </div>

        <div className="bg-black border-2 border-dark-charcoal rounded-xl overflow-hidden aspect-video relative">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentTrack.title || currentTrack.description}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <img
              src={currentTrack.thumbnailUrl || toYouTubeThumbnailUrl(currentTrack.youtubeUrl) || ''}
              alt={currentTrack.title || currentTrack.description}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="flex flex-col gap-1 px-1 text-white">
          <span className="text-[10px] font-mono opacity-80">YOUTUBE LINK</span>
          <span className="text-xs font-black truncate">{currentTrack.title || currentTrack.description}</span>
          <p className="text-[10px] font-semibold text-white/85 line-clamp-2">{currentTrack.description}</p>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 bg-brand-cream/80 border-2 border-dark-charcoal rounded-xl p-3 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => stepTrack(-1)}
            className="w-10 h-10 rounded-full bg-white hover:bg-stone-50 border-2 border-dark-charcoal flex items-center justify-center shadow-[2px_2px_0px_#4A3E3D] active:translate-y-0.5 cursor-pointer text-dark-charcoal"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => window.open(currentTrack.youtubeUrl, '_blank', 'noopener,noreferrer')}
            className="w-10 h-10 rounded-full bg-brand-yellow hover:bg-yellow-400 border-2 border-dark-charcoal flex items-center justify-center shadow-[2px_2px_0px_#4A3E3D] active:translate-y-0.5 cursor-pointer text-dark-charcoal"
          >
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </button>

          <button
            onClick={() => stepTrack(1)}
            className="w-10 h-10 rounded-full bg-brand-pink hover:bg-rose-400 border-2 border-dark-charcoal flex items-center justify-center shadow-[2px_2px_0px_#4A3E3D] active:translate-y-0.5 cursor-pointer text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleHeartClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dark-charcoal text-xs font-mono font-bold transition-all ${
              isLiked ? 'bg-brand-pink text-white' : 'bg-white text-dark-charcoal hover:bg-pink-100'
            }`}
          >
            <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-bounce' : ''} />
            <span>{likes}</span>
          </button>

          <a
            href={currentTrack.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dark-charcoal text-xs font-mono font-bold bg-white text-dark-charcoal hover:bg-stone-50"
          >
            <ExternalLink size={12} />
            開く
          </a>
        </div>
      </div>

      <div className="w-full flex items-center gap-2 mt-3 px-1">
        <span className="text-[9px] font-black text-dark-charcoal/60">DESCRIPTION</span>
        <p className="flex-1 text-[10px] font-bold text-dark-charcoal/80 truncate">{currentTrack.description}</p>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {tracks.map((track, index) => (
          <motion.button
            key={track.id}
            onClick={() => setCurrentTrackIndex(index)}
            className={`min-w-0 flex items-center gap-2 p-2 rounded-xl border-2 border-dark-charcoal text-left text-[10px] font-bold cursor-pointer ${
              currentTrack.id === track.id ? 'bg-brand-orange text-white' : 'bg-white text-dark-charcoal hover:bg-orange-50'
            }`}
          >
            <img
              src={track.thumbnailUrl || toYouTubeThumbnailUrl(track.youtubeUrl) || ''}
              alt={track.title || track.description}
              className="w-9 h-9 rounded-md object-cover border border-dark-charcoal/20"
              referrerPolicy="no-referrer"
            />
            <span className="truncate min-w-0">{track.title || track.description}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
