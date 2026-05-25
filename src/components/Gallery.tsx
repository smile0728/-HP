import React, { useState, useEffect } from 'react';
import { getPhotos, PhotoEntry } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, BookOpen, X, ChevronLeft, ChevronRight, Sparkles, Heart } from 'lucide-react';

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'daily'>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhotos()
      .then((data) => {
        const mapped = data.map((photo) => {
          // Deterministic rotation between -4 and 4 based on photo id hash
          const codeSum = photo.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const rotation = (codeSum % 9) - 4;
          const stickerChoices = ['⭐', '🌻', '🧸', '🍭', '🍓', '💖', '✨', '🎀', '⚡', '🔥'];
          const sticker = stickerChoices[codeSum % stickerChoices.length];
          const isDaily = photo.title.includes('パフェ') || 
                          photo.title.includes('おやつ') || 
                          photo.title.includes('タルト') || 
                          photo.title.includes('喫茶') ||
                          photo.comment.includes('ご褒美') ||
                          photo.comment.includes('美味しい');
          const category = isDaily ? 'daily' : 'activity';
          return {
            id: photo.id,
            title: photo.title,
            url: photo.imageUrl,
            date: photo.date,
            description: photo.comment,
            rotation,
            sticker,
            category
          };
        });
        setPhotos(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gallery photos load error:", err);
        setLoading(false);
      });
  }, []);

  // Filter photos based on selection
  const filteredPhotos = photos.filter(photo => {
    if (activeTab === 'all') return true;
    return photo.category === activeTab;
  });

  const handleOpenLightbox = (photoId: string) => {
    const originalIndex = photos.findIndex((p) => p.id === photoId);
    if (originalIndex !== -1) {
      setSelectedPhotoIndex(originalIndex);
      // Soft spark sound effect
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (_) {}
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null || photos.length === 0) return;
    setSelectedPhotoIndex((prevIndex) => {
      if (prevIndex === null) return null;
      return prevIndex === 0 ? photos.length - 1 : prevIndex - 1;
    });
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null || photos.length === 0) return;
    setSelectedPhotoIndex((prevIndex) => {
      if (prevIndex === null) return null;
      return prevIndex === photos.length - 1 ? 0 : prevIndex + 1;
    });
  };

  const currentSelectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] || photos[0] || null : null;

  return (
    <div className="w-full max-w-4xl bg-orange-50/20 border-4 border-dark-charcoal p-4 md:p-6 rounded-3xl arcade-border relative flex flex-col gap-6">
      
      {/* Album Header Deco */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-double border-dark-charcoal/30 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-brand-pink p-2 rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-display font-black text-dark-charcoal tracking-tight flex items-center gap-2">
              📖 あろはーず思い出フォトアルバム
            </h3>
            <p className="text-[10px] text-dark-charcoal/60 font-semibold font-mono tracking-wider">
              ALOHA-Z MEMORY ALBUM & SCRAPBOOK
            </p>
          </div>
        </div>

        {/* Categories Tab Selectors in cute sticker buttons */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'すべて ✨' },
            { id: 'activity', label: 'ダンス・イベント 💃' },
            { id: 'daily', label: '日常・おやつ 🍨' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 text-xs font-black rounded-full border-2 border-dark-charcoal transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-orange text-white shadow-[2px_2px_0px_#4A2C2A]'
                  : 'bg-white text-dark-charcoal hover:bg-orange-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Album Description */}
      <p className="text-xs md:text-sm text-dark-charcoal/80 font-bold leading-relaxed bg-brand-yellow/10 p-3 rounded-2xl border-2 border-dashed border-brand-orange/20">
        📌 あろはーず(スマイル＆キャラメル)の日記から、とっておきの写真を集めたお楽しみアルバム！気になる写真をクリックして、大きな写真とアルバムメッセージを読んでみてね🍭
      </p>

      {/* Album Content View - Looks like a vintage paper/ring notebook layout */}
      <div className="relative bg-[#FCF8EB] border-4 border-dark-charcoal rounded-3xl p-6 md:p-8 shadow-[inset_0_4px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {/* Ring lines simulation / Binder rings at the top */}
        <div className="absolute top-0 left-0 right-0 h-4 flex justify-around pointer-events-none select-none px-12">
          <div className="w-4 h-8 bg-zinc-400 border-2 border-dark-charcoal rounded-full -mt-2 z-10 shadow-md"></div>
          <div className="w-4 h-8 bg-zinc-400 border-2 border-dark-charcoal rounded-full -mt-2 z-10 shadow-md"></div>
          <div className="w-4 h-8 bg-zinc-400 border-2 border-dark-charcoal rounded-full -mt-2 z-10 shadow-md"></div>
          <div className="w-4 h-8 bg-zinc-400 border-2 border-dark-charcoal rounded-full -mt-2 z-10 shadow-md"></div>
        </div>

        {/* Handwriting background grids decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#CE9F61_1px,transparent_1px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />

        {/* Grid of Polaroid entries */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 text-dark-charcoal/50 font-bold">
            このカテゴリーの写真はまだありません 🍭
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8 pt-4">
            {filteredPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: photo.rotation * 0.8,
                  zIndex: 20,
                  boxShadow: '0 12px 25px rgba(74, 44, 42, 0.15)'
                }}
                onClick={() => handleOpenLightbox(photo.id)}
                className="bg-white border-2 border-dark-charcoal rounded-xl p-3 shadow-[4px_4px_0px_#4A2C2A] flex flex-col justify-between cursor-pointer transition-shadow"
                style={{ rotate: `${photo.rotation}deg` }}
              >
                {/* Visual indicator (Sticky ribbon tape) */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-pink/50 border border-dashed border-dark-charcoal/30 w-12 h-5 rotate-[-5deg] z-10 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black text-white">{photo.sticker}</span>
                </div>

                {/* Main Photo Thumbnail Area */}
                <div className="relative aspect-square w-full rounded overflow-hidden border-2 border-dark-charcoal bg-amber-50/50">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-350 hover:scale-105"
                  />
                  {/* Subtle date mark inner tag */}
                  <span className="absolute bottom-1 right-1 bg-dark-charcoal text-white text-[8px] px-1 rounded font-mono font-bold">
                    {photo.date}
                  </span>
                </div>

                {/* Polaroid description text block */}
                <div className="mt-3 text-center border-t border-dashed border-dark-charcoal/20 pt-2">
                  <p className="text-xs font-black text-dark-charcoal truncate mb-0.5">
                    {photo.title}
                  </p>
                  <span className="text-[9px] text-brand-orange-600 font-extrabold max-w-full opacity-70 block">
                    {photo.category === 'activity' ? '💃 活動のきろく' : '🍨 日常・おやつ'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Vintage album stamps decoration */}
        <div className="absolute bottom-2 left-3 text-3xl rotate-[-15deg] opacity-60 select-none pointer-events-none font-display text-brand-orange">
          🌺 ALOHA!
        </div>
        <div className="absolute bottom-2 right-4 text-3xl rotate-12 opacity-50 select-none pointer-events-none">
          🍬✨
        </div>
      </div>

      {/* LIGHTBOX POPUP MODAL (AnimatePresence for beautiful buttery modal pop) */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && currentSelectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute inset-0 bg-dark-charcoal/80 backdrop-blur-sm"
            />

            {/* Modal Body container */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-[#FFFCF5] border-4 border-dark-charcoal rounded-3xl p-5 md:p-6 shadow-[8px_8px_0px_#4A2C2A] z-10 overflow-hidden"
            >
              {/* Retro graph-paper lines backing */}
              <div className="absolute inset-0 bg-[radial-gradient(#FF8C00_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />

              {/* Top Close Bar */}
              <div className="flex justify-between items-center border-b-2 border-dashed border-dark-charcoal/20 pb-2 mb-4 relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-black text-brand-orange">
                  <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                  <span>ALOHA-Z ALBUM VIEW</span>
                </div>
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="p-1 rounded-full border-2 border-dark-charcoal bg-white hover:bg-stone-150 text-dark-charcoal transition-all cursor-pointer shadow-[2px_2px_0px_#4A2C2A]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Large Image Section */}
              <div className="relative border-4 border-dark-charcoal rounded-2xl overflow-hidden shadow-md bg-stone-100 aspect-square mb-4">
                <img
                  src={currentSelectedPhoto.url}
                  alt={currentSelectedPhoto.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Floating sticker mark in the corner */}
                <div className="absolute top-4 right-4 bg-brand-yellow font-black text-2xl w-12 h-12 rounded-full border-2 border-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] flex items-center justify-center rotate-12">
                  {currentSelectedPhoto.sticker}
                </div>
              </div>

              {/* Photo Meta & Written scrapbook message */}
              <div className="bg-white/80 p-4 rounded-2xl border-2 border-dark-charcoal relative">
                {/* Ring spirals look */}
                <div className="absolute -top-2 left-6 right-6 h-2 flex justify-between">
                  <div className="w-1 h-3 bg-dark-charcoal rounded"></div>
                  <div className="w-1 h-3 bg-dark-charcoal rounded"></div>
                  <div className="w-1 h-3 bg-dark-charcoal rounded"></div>
                  <div className="w-1 h-3 bg-dark-charcoal rounded"></div>
                </div>

                <div className="flex justify-between items-center mb-1.5 pt-1">
                  <span className="font-mono text-xs font-black text-brand-pink flex items-center gap-1 bg-brand-pink/10 px-2 py-0.5 rounded-full">
                    <Heart size={10} className="fill-current" /> {currentSelectedPhoto.date}
                  </span>
                  <span className="text-[10px] text-dark-charcoal/60 font-black tracking-wider">
                    {currentSelectedPhoto.category === 'activity' ? '💃 活動のきろく' : '🍨 日常・おやつ'}
                  </span>
                </div>

                <h4 className="text-lg font-black text-dark-charcoal mb-2 leading-snug">
                  {currentSelectedPhoto.title}
                </h4>

                {/* Hand-written like descriptive comment */}
                <p className="text-xs text-dark-charcoal leading-relaxed font-semibold bg-orange-50/40 p-2.5 rounded-xl border border-dashed border-brand-orange-500/20">
                  {currentSelectedPhoto.description}
                </p>
              </div>

              {/* Navigation arrows */}
              <div className="flex justify-between items-center mt-5">
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-50 border-2 border-dark-charcoal rounded-xl text-xs font-black text-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] cursor-pointer"
                >
                  <ChevronLeft size={14} /> 前へ
                </button>

                <div className="text-xs font-black text-dark-charcoal font-mono">
                  {(selectedPhotoIndex ?? 0) + 1} / {photos.length}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-50 border-2 border-dark-charcoal rounded-xl text-xs font-black text-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] cursor-pointer"
                >
                  次へ <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
