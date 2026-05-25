import React, { useState, useEffect } from 'react';
import { INITIAL_DIARY } from '../data';
import { DiaryEntry, FanComment } from '../types';
import { BookOpen, Smile, Send, Trash2, Heart, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLOR_STYLES = {
  pink: 'bg-rose-100 border-rose-300 text-rose-800 rotate-[1.5deg]',
  yellow: 'bg-amber-100 border-amber-300 text-amber-800 rotate-[-1deg]',
  orange: 'bg-orange-100 border-orange-300 text-orange-800 rotate-[2deg]',
  green: 'bg-emerald-100 border-emerald-300 text-emerald-800 rotate-[-2deg]',
  blue: 'bg-sky-100 border-sky-300 text-sky-800 rotate-[1deg]',
};

import { getDiaries } from '../lib/firebase';

export default function ExchangeDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [comments, setComments] = useState<FanComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Input Fields for Guestbook
  const [nickname, setNickname] = useState('');
  const [bgColor, setBgColor] = useState<'pink' | 'yellow' | 'orange' | 'green' | 'blue'>('pink');
  const [bodyText, setBodyText] = useState('');

  // Fetch from Firebase/Store
  useEffect(() => {
    getDiaries()
      .then((data) => {
        setEntries(data);
        if (data.length > 0) {
          setSelectedEntryId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Diary load error:", err);
        setLoading(false);
      });
  }, []);

  const activeEntry = entries.find((e) => e.id === selectedEntryId) || entries[0] || null;


  // Retrieve comments on mount
  useEffect(() => {
    const saved = localStorage.getItem('alohaz_diary_comments');
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse comments', e);
      }
    } else {
      // Seed initial fan comments
      const initComments: FanComment[] = [
        {
          id: 'c1',
          diaryId: 'diary-1',
          userName: 'りょーた🌻あろ厨',
          avatarSeed: '1',
          content: '交換日記スタートうれしすぎる！！毎日楽しみに見にきます！すまいるちゃんのハイテンションな文章元気でる！🧡',
          timestamp: '2026/05/24 18:22',
          stickyColor: 'orange'
        },
        {
          id: 'c2',
          diaryId: 'diary-2',
          userName: 'みゆキャラメルラテコ',
          avatarSeed: '2',
          content: 'きゃらめるちゃん可愛い…🧸 いちごタルトになりたかった。明日早起きふぁいとぉ！',
          timestamp: '2026/05/25 00:05',
          stickyColor: 'pink'
        }
      ];
      setComments(initComments);
      localStorage.setItem('alohaz_diary_comments', JSON.stringify(initComments));
    }
  }, []);

  const saveComments = (newComments: FanComment[]) => {
    setComments(newComments);
    localStorage.setItem('alohaz_diary_comments', JSON.stringify(newComments));
  };

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !bodyText.trim()) return;

    const newComment: FanComment = {
      id: `comment-${Date.now()}`,
      diaryId: selectedEntryId,
      userName: nickname.trim(),
      avatarSeed: Math.random().toString(),
      content: bodyText.trim(),
      timestamp: new Date().toLocaleString('ja-JP', { hour12: false }).slice(0, 16),
      stickyColor: bgColor,
    };

    const nextList = [newComment, ...comments];
    saveComments(nextList);

    // Reset fields
    setBodyText('');
    setNickname('');

    // Sparkle bip sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  };

  const deleteComment = (id: string) => {
    const nextList = comments.filter((c) => c.id !== id);
    saveComments(nextList);
  };

  // Filter comments belonging to active notebook entry
  const activeComments = comments.filter((c) => c.diaryId === selectedEntryId);

  if (loading) {
    return (
      <div className="w-full max-w-4xl bg-[#FCF8F2] border-4 border-dark-charcoal p-12 rounded-3xl arcade-border relative flex flex-col items-center justify-center min-h-[350px]">
        <div className="text-dark-charcoal text-sm font-black animate-pulse flex items-center gap-2">
          📓 交換日記をひらいています...🧸
        </div>
      </div>
    );
  }

  if (entries.length === 0 || !activeEntry) {
    return (
      <div className="w-full max-w-4xl bg-[#FCF8F2] border-4 border-dark-charcoal p-12 rounded-3xl arcade-border relative flex flex-col items-center justify-center min-h-[350px]">
        <div className="text-dark-charcoal text-sm font-black">
          📓 交換日記はまだ書かれていません。これからお楽しみに！🌻
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-[#FCF8F2] border-4 border-dark-charcoal p-6 rounded-3xl arcade-border relative flex flex-col gap-6">
      {/* Tape on corners */}
      <div className="absolute -top-3 -left-3 w-16 h-8 bg-brand-orange/40 border border-dashed border-dark-charcoal rounded-sm rotate-[-15deg] pointer-events-none" />
      <div className="absolute -top-3 -right-3 w-16 h-8 bg-brand-pink/40 border border-dashed border-dark-charcoal rounded-sm rotate-[15deg] pointer-events-none" />

      {/* Ribbon Header banner */}
      <div className="text-center">
        <h3 className="text-3xl font-display font-black text-dark-charcoal flex items-center justify-center gap-2">
          📓 あろはーず秘密の交換日記
        </h3>
        <p className="text-xs text-dark-charcoal/70 mt-1.5 font-bold">
          2人が順番に更新する交換日記ノート。下のフォームから付箋を貼ってコメントを残せるよ！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Entries selector list */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <span className="text-xs font-mono font-bold text-dark-charcoal/60 flex items-center gap-1">
            <BookOpen size={14} className="text-brand-orange" /> DIARY LOGS（過去の日記）
          </span>

          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                className={`flex-shrink-0 text-left px-4 py-2.5 rounded-xl border-2 border-dark-charcoal transition-all text-xs font-bold leading-tight cursor-pointer ${
                  selectedEntryId === entry.id
                    ? 'bg-brand-orange text-white shadow-[2px_2px_0_#4A3E3D]'
                    : 'bg-white text-dark-charcoal hover:bg-orange-50/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-80 font-mono text-[9px]">{entry.date}</span>
                  <span className="text-[10px]">
                    {entry.author === 'smile' ? '🧡 すまいる' : '🎀 きゃらめる'}
                  </span>
                </div>
                <div className="truncate font-semibold">{entry.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right column: Selected diary layout */}
        <div className="lg:col-span-8 bg-white border-4 border-dark-charcoal p-5 rounded-2xl shadow-[inset_4px_4px_0_rgba(0,0,0,0.05),4px_4px_0_#4A3E3D] relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          {/* Lined notebook decoration behind */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_28px] opacity-40 pointer-events-none mt-12" />

          <div className="relative z-10 flex flex-col gap-4">
            {/* Header metadata */}
            <div className="flex justify-between items-center border-b-2 border-dark-charcoal pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-dark-charcoal/60 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  {activeEntry.date}
                </span>
                <h4 className="text-lg font-display font-black text-dark-charcoal mt-1">
                  {activeEntry.title}
                </h4>
              </div>

              {/* Author indicator stamp */}
              <div className={`px-3 py-1 border-2 border-dark-charcoal rounded-full text-xs font-bold ${
                activeEntry.author === 'smile' ? 'bg-brand-orange text-white' : 'bg-brand-pink text-white'
              }`}>
                {activeEntry.author === 'smile' ? '🌞 すまいる' : '🧸 きゃらめる'}
              </div>
            </div>

            {/* Diary Journal content body */}
            <div className="text-xs md:text-sm text-dark-charcoal leading-7 font-medium min-h-[140px] whitespace-pre-wrap pt-2">
              {activeEntry.content}
            </div>

            {/* Sticker indicators */}
            <div className="flex gap-1.5 mt-2">
              {activeEntry.stickers.map((st, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>
                  {st}
                </span>
              ))}
            </div>

            {/* Back-and-forth Reply block inside */}
            <div className="mt-4 p-3 bg-amber-50/70 border-2 border-dashed border-dark-charcoal/40 rounded-xl flex gap-2 items-center rotate-[0.5deg]">
              <div className="text-2xl">
                {activeEntry.author === 'smile' ? '🧸' : '🌞'}
              </div>
              <div className="text-[11px] leading-relaxed text-dark-charcoal font-semibold italic">
                {activeEntry.response}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fan guest wall comment section */}
      <div className="border-t-4 border-dashed border-dark-charcoal/20 pt-6 mt-4">
        <h4 className="text-lg font-display font-black text-dark-charcoal mb-4 flex items-center gap-1.5">
          💬 ファンお返事ボード <span className="text-xs font-medium text-stone-500">({activeComments.length}枚の付箋)</span>
        </h4>

        {/* Input Form Box */}
        <form onSubmit={handleCreateComment} className="bg-white border-2 border-dark-charcoal p-4 rounded-2xl shadow-[2px_2px_0_#4A3E3D] flex flex-col md:flex-row gap-4 items-end mb-6">
          {/* Custom username */}
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-dark-charcoal/80 block">おなまえ（ニックネーム）</label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="すまいる大好きマン"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full text-xs px-3 py-2 border-2 border-stone-200 rounded-lg focus:border-brand-orange focus:outline-none"
            />
          </div>

          {/* Color theme selection */}
          <div className="space-y-1 w-full md:w-auto">
            <label className="text-[10px] font-bold text-dark-charcoal/80 block">付箋（ふせん）の色</label>
            <div className="flex gap-1.5">
              {(Object.keys(COLOR_STYLES) as Array<keyof typeof COLOR_STYLES>).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBgColor(color)}
                  className={`w-6 h-6 rounded-full border-2 border-dark-charcoal cursor-pointer flex items-center justify-center transition-all ${
                    color === 'pink' ? 'bg-rose-200' :
                    color === 'yellow' ? 'bg-amber-100' :
                    color === 'orange' ? 'bg-orange-200' :
                    color === 'green' ? 'bg-emerald-200' : 'bg-sky-200'
                  } ${bgColor === color ? 'scale-125 ring-2 ring-brand-orange' : 'opacity-80'}`}
                />
              ))}
            </div>
          </div>

          {/* Comment input content */}
          <div className="flex-[2] w-full space-y-1">
            <label className="text-[10px] font-bold text-dark-charcoal/80 block">メッセージ</label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="かわいい！今日のダンス動画何回もリピートしてます！"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full text-xs px-3 py-2 border-2 border-stone-200 rounded-lg focus:border-brand-pink focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-brand-pink hover:bg-rose-500 text-white border-2 border-dark-charcoal rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-[1px_2px_0_#4A3E3D] cursor-pointer"
          >
            <Send size={12} /> ペタッと貼る
          </button>
        </form>

        {/* Comment sticky notes list */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2 border-2 border-dashed border-dark-charcoal/10 rounded-xl bg-orange-50/10">
          <AnimatePresence>
            {activeComments.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-stone-400 font-bold">
                まだ貼られたふせんはありません。最初の１枚を貼ってみてね！✏️
              </div>
            ) : (
              activeComments.map((com) => (
                <motion.div
                  key={com.id}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: com.id.charCodeAt(com.id.length - 1) % 2 === 0 ? 3 : -3 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`p-3.5 border-2 border-dark-charcoal rounded shadow-[2px_3px_0_#4A3E3D] relative flex flex-col justify-between aspect-square select-none ${
                    COLOR_STYLES[com.stickyColor]
                  }`}
                >
                  {/* Push-pin icon simulation */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 border border-dark-charcoal rounded-full shadow-[1px_1px_1px_rgba(0,0,0,0.2)]" />

                  {/* Comment title */}
                  <div className="border-b border-dark-charcoal/20 pb-1.5 mb-1.5">
                    <span className="font-sans font-black text-[10px] block truncate">
                      👤 {com.userName}
                    </span>
                    <span className="text-[8px] opacity-60 font-mono italic block">{com.timestamp}</span>
                  </div>

                  {/* Comment body */}
                  <p className="text-[10px] leading-normal font-semibold flex-1 overflow-y-auto pr-1">
                    {com.content}
                  </p>

                  {/* Sticky Footer actions */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => deleteComment(com.id)}
                      className="text-stone-500 hover:text-red-700 p-0.5 rounded hover:bg-black/5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer flex items-center"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
