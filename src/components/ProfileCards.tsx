import { useEffect, useState } from 'react';
import { MEMBERS } from '../data';
import { MemberProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Stars, Calendar, Award, Sparkles, Smile, XCircle } from 'lucide-react';
import { getMemberProfiles } from '../lib/firebase';

export default function ProfileCards() {
  const [activeTab, setActiveTab] = useState<'smile' | 'caramel'>('smile');
  const [members, setMembers] = useState<MemberProfile[]>(MEMBERS);
  const selectedMember = (members.find((m) => m.id === activeTab) || MEMBERS.find((m) => m.id === activeTab)) as MemberProfile;

  useEffect(() => {
    getMemberProfiles(false)
      .then((items) => {
        if (items.length > 0) setMembers(items);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-2xl min-w-0 bg-white border-4 border-dark-charcoal p-4 sm:p-6 rounded-3xl arcade-border relative overflow-hidden">
      {/* Decorative notebook binders design on top to mimic a profiles notebook binding */}
      <div className="absolute top-0 inset-x-0 h-4 flex justify-around px-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-4 h-6 bg-zinc-400 border-2 border-dark-charcoal rounded-t-full -translate-y-2 z-10" />
        ))}
      </div>

      <div className="mt-4 flex flex-col md:flex-row gap-5 sm:gap-6 min-w-0">
        {/* Left Side: Photo panel & tabs picker */}
        <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
          {/* Tabs switch panel (designed like stickers) */}
          <div className="flex flex-wrap gap-2 w-full justify-center">
            <button
              onClick={() => setActiveTab('smile')}
              className={`px-3 sm:px-4 py-2 rounded-2xl border-2 border-dark-charcoal font-sans font-extrabold text-xs sm:text-sm relative transition-all cursor-pointer ${
                activeTab === 'smile'
                  ? 'bg-brand-orange text-white shadow-[2px_4px_0_#4A3E3D]'
                  : 'bg-orange-50 text-brand-orange hover:bg-orange-100'
              }`}
            >
              すまいる 🌻
              {activeTab === 'smile' && (
                <span className="absolute -top-2 -right-2 text-xs text-brand-yellow animate-ping">✨</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('caramel')}
              className={`px-3 sm:px-4 py-2 rounded-2xl border-2 border-dark-charcoal font-sans font-extrabold text-xs sm:text-sm relative transition-all cursor-pointer ${
                activeTab === 'caramel'
                  ? 'bg-brand-pink text-white shadow-[2px_4px_0_#4A3E3D]'
                  : 'bg-rose-50 text-brand-pink hover:bg-rose-100'
              }`}
            >
              きゃるめん 🧸
              {activeTab === 'caramel' && (
                <span className="absolute -top-2 -right-2 text-xs text-brand-yellow animate-ping">✨</span>
              )}
            </button>
          </div>

          {/* Member Polaroid/Sticker-style Visual Frame */}
          <div className="relative p-3 bg-brand-cream border-4 border-dark-charcoal rounded-2xl shadow-[4px_6px_0_#4A3E3D] rotate-[-2deg] max-w-[200px] w-full aspect-[3/4] flex flex-col justify-between overflow-hidden">
            {/* Top washi tape deco */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-brand-yellow/70 border border-dashed border-brand-orange/40 rotate-[5deg] z-10" />

            {/* Simulated cute avatar or character placeholder using gradient pop */}
            <div className={`w-full aspect-square rounded-xl border-2 border-dark-charcoal flex items-center justify-center font-black text-white relative overflow-hidden ${
              selectedMember.id === 'smile'
                ? 'bg-gradient-to-br from-brand-orange to-brand-yellow'
                : 'bg-gradient-to-br from-brand-pink to-amber-100'
            }`}>
              {selectedMember.imageUrl ? (
                <img
                  src={selectedMember.imageUrl}
                  alt={`${selectedMember.jpName}の自己紹介画像`}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-20 dotted-bg" />
                  <div className="text-center z-10">
                    <span className="text-4xl block mb-1">
                      {selectedMember.id === 'smile' ? '🌻' : '🧸'}
                    </span>
                    <span className="text-xs tracking-widest font-mono">DANCE CUTIE</span>
                  </div>
                </>
              )}
            </div>

            {/* Hand-written signature section */}
            <div className="mt-3 text-center border-t border-dashed border-dark-charcoal/30 pt-1.5">
              <span className="font-display font-black text-xs text-dark-charcoal tracking-wide">
                ♥ {selectedMember.signature} ♥
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Retro Profile Booklet contents */}
        <div className="w-full min-w-0 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMember.id}
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-4 sm:p-5 rounded-2xl border-4 border-dark-charcoal flex flex-col gap-4 relative shadow-[3px_3px_0_#4A3E3D] sm:shadow-[4px_4px_0_#4A3E3D] ${
                selectedMember.id === 'smile' ? 'bg-amber-50/50' : 'bg-rose-50/50'
              }`}
            >
              {/* Corner badge sticker */}
              <div className={`absolute -top-3 -right-3 px-3 py-1 text-[10px] font-mono font-black border-2 border-dark-charcoal rounded-full ${
                selectedMember.id === 'smile' ? 'bg-brand-yellow text-dark-charcoal' : 'bg-brand-pink text-white'
              }`}>
                {selectedMember.name.toUpperCase()}
              </div>

              {/* Title Header */}
              <div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xl">{selectedMember.id === 'smile' ? '🌻' : '🧸'}</span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-dark-charcoal leading-tight">
                    {selectedMember.jpName} <span className="text-sm font-normal text-stone-500">（{selectedMember.name}）</span>
                  </h3>
                </div>
                <p className="text-xs font-semibold text-dark-charcoal/80 mt-1 leading-snug">
                  {selectedMember.tagline}
                </p>
              </div>

              {/* Booklet items */}
              <div className="grid grid-cols-2 gap-3 text-xs border-y-2 border-dashed border-dark-charcoal/20 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Calendar size={12} className="text-brand-orange" /> BIRTHDAY
                  </span>
                  <span className="font-bold text-dark-charcoal">{selectedMember.birthday}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Award size={12} className="text-brand-pink" /> BLOOD TYPE
                  </span>
                  <span className="font-bold text-dark-charcoal">{selectedMember.bloodType}</span>
                </div>
              </div>

              {/* Likes & Dislikes lists with badge tag styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Likes */}
                <div>
                  <h5 className="text-[11px] font-mono font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                    <Sparkles size={12} /> LIKES（すき!）
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedMember.likes.map((like, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg text-[10px] font-semibold">
                        {like}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dislikes */}
                <div>
                  <h5 className="text-[11px] font-mono font-bold text-red-500 mb-1.5 flex items-center gap-1">
                    <XCircle size={12} /> DISLIKES（にがて…）
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedMember.dislikes.map((dislike, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] font-semibold">
                        {dislike}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Handwritten message preview */}
              <div className="bg-white border-2 border-dashed border-stone-300 p-3 rounded-xl mt-1">
                <span className="text-[9px] font-mono text-zinc-400 block mb-1">♥ MESSAGE FROM {selectedMember.name.toUpperCase()} ♥</span>
                <p className="text-xs text-dark-charcoal leading-relaxed font-medium">
                  「{selectedMember.message}」
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
