import React, { useState, useEffect } from 'react';
import { getAnnouncements, AnnouncementEntry } from '../lib/firebase';
import { Megaphone, Calendar, Star, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<AnnouncementEntry[]>([]);
  const [selectedAnn, setSelectedAnn] = useState<AnnouncementEntry | null>(null);

  useEffect(() => {
    getAnnouncements()
      .then(data => setAnnouncements(data))
      .catch(err => console.error("Could not fetch announcements:", err));
  }, []);

  const handlePlaySound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch (_) {}
  };

  if (announcements.length === 0) return null;

  return (
    <div className="w-full max-w-4xl bg-brand-yellow/10 border-4 border-dark-charcoal p-5 rounded-3xl arcade-border relative flex flex-col gap-4">
      {/* Decorative stars */}
      <span className="absolute -top-3.5 left-8 text-2xl select-none animate-bounce">📢</span>
      <span className="absolute -top-3.5 right-8 text-2xl select-none animate-pulse">⭐</span>

      <div className="flex items-center gap-2.5">
        <div className="bg-brand-orange text-white p-1.5 rounded-xl border-2 border-dark-charcoal shadow-[1px_1.5px_0px_#4A2C2A] flex items-center justify-center">
          <Megaphone size={18} />
        </div>
        <div>
          <h3 className="text-lg font-display font-black text-dark-charcoal flex items-center gap-1.5">
            あろはーず運営室からのお知らせボード 🍬
          </h3>
          <p className="text-[10px] text-dark-charcoal/60 font-semibold uppercase font-mono tracking-wide">
            Official Aloha-z Announcements & News
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {announcements.map((ann, idx) => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white border-2 border-dark-charcoal rounded-2xl p-3.5 shadow-[2px_2px_0px_#4A2C2A] hover:shadow-[3px_3px_0px_#4A2C2A] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-8 border-l-brand-orange"
            onClick={() => {
              setSelectedAnn(ann);
              handlePlaySound();
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] font-bold text-dark-charcoal/50 bg-[#FCF8EB] px-2 py-0.5 rounded-full border border-dark-charcoal/10 flex items-center gap-1">
                  <Calendar size={10} className="text-brand-orange" /> {ann.date}
                </span>
                <span className="text-[9px] font-bold text-brand-pink tracking-widest uppercase bg-rose-50 border border-brand-pink/20 px-1.5 py-0.2 rounded">
                  NEW
                </span>
              </div>
              <h4 className="text-xs md:text-sm font-black text-dark-charcoal group-hover:text-brand-orange transition-colors truncate">
                {ann.title}
              </h4>
            </div>
            <div className="text-[11px] font-black text-brand-orange group-hover:translate-x-1 duration-150 flex items-center gap-1 shrink-0">
              詳しく見る <Star size={11} className="fill-current" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sweet popup notice details */}
      <AnimatePresence>
        {selectedAnn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-charcoal/60 backdrop-blur-xs"
              onClick={() => setSelectedAnn(null)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-[#FFFDFC] border-4 border-dark-charcoal rounded-3xl p-5 md:p-6 shadow-[6px_6px_0px_#4A2C2A] z-10"
            >
              <div className="flex justify-between items-center border-b-2 border-dark-charcoal/10 pb-2.5 mb-4">
                <span className="font-mono text-[10px] font-black text-brand-orange bg-[#FCF8EB] py-0.5 px-2.5 rounded-full border border-dark-charcoal/10">
                  📅 {selectedAnn.date}
                </span>
                <button
                  onClick={() => setSelectedAnn(null)}
                  className="w-6 h-6 border-2 border-dark-charcoal rounded-full flex items-center justify-center bg-white hover:bg-stone-50 text-xs font-black cursor-pointer shadow-[1.5px_1.5px_0_#4A2C2A]"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <Volume2 size={16} className="text-brand-orange animate-pulse mt-0.5 shrink-0" />
                <h4 className="text-sm md:text-base font-black text-dark-charcoal leading-tight">
                  {selectedAnn.title}
                </h4>
              </div>

              <div className="bg-orange-50/40 border-2 border-dashed border-brand-orange/15 rounded-2xl p-4 text-xs text-dark-charcoal leading-relaxed whitespace-pre-wrap font-semibold">
                {selectedAnn.content}
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setSelectedAnn(null)}
                  className="px-6 py-2 bg-brand-orange text-white text-xs font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] active:translate-y-0.5 cursor-pointer"
                >
                  とじる 👋
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
