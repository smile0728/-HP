import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState<'rolling' | 'collided' | 'loaded'>('rolling');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Candy rolling and progress ticking
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // 2. Schedule phases
    const collideTimer = setTimeout(() => {
      setStage('collided');
    }, 1500);

    const loadedTimer = setTimeout(() => {
      setStage('loaded');
    }, 2100);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(collideTimer);
      clearTimeout(loadedTimer);
    };
  }, []);

  // Synthesize a retro coin/start sound when the user starts the HP
  const playStartSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Simple arcade bip-bop-zoom!
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.25);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.35);
      osc2.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log('AudioContext not allowed or supported yet', e);
    }
    
    // Call the parent state to unload the splash
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-brand-cream overflow-hidden">
      {/* Decorative dots grid pattern for retro Heisei flavor */}
      <div className="absolute inset-0 dotted-bg opacity-70 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full px-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {stage === 'rolling' && (
            <motion.div 
              key="rolling"
              className="relative w-full h-40 flex items-center justify-between"
              exit={{ opacity: 0 }}
            >
              {/* Left candy: Orange smile candy */}
              <motion.div
                initial={{ x: -100, rotate: 0 }}
                animate={{ x: 120, rotate: 360 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="w-14 h-14 bg-brand-orange border-4 border-dark-charcoal rounded-full flex items-center justify-center shadow-[4px_4px_0px_#4A3E3D] relative bubble-shadow"
              >
                <span className="text-xl">🍬</span>
                <span className="absolute -top-1 -right-1 text-xs bg-brand-yellow px-1 rounded-full border border-dark-charcoal text-[8px] font-bold">SM</span>
              </motion.div>

              {/* Center candy wrapper or collision target zone */}
              <div className="w-1 md:w-4" />

              {/* Right candy: Pink caramel candy */}
              <motion.div
                initial={{ x: 100, rotate: 0 }}
                animate={{ x: -120, rotate: -360 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="w-14 h-14 bg-brand-pink border-4 border-dark-charcoal rounded-full flex items-center justify-center shadow-[4px_4px_0px_#4A3E3D] relative bubble-shadow"
              >
                <span className="text-xl">🍬</span>
                <span className="absolute -top-1 -left-1 text-xs bg-pink-100 px-1 rounded-full border border-dark-charcoal text-[8px] font-bold">CR</span>
              </motion.div>
            </motion.div>
          )}

          {stage === 'collided' && (
            <motion.div
              key="collided"
              initial={{ scale: 0.1, rotate: 0 }}
              animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
              exit={{ opacity: 0 }}
              className="h-40 flex items-center justify-center"
            >
              <div className="relative">
                {/* Visual Comic burst effect */}
                <span className="text-6xl animate-ping absolute -top-4 -left-4">💥</span>
                <span className="text-7xl font-sans font-black text-brand-orange drop-shadow-[4px_4px_0_#4A3E3D] tracking-wider z-20">
                  ぴこんっ！
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl text-brand-pink animate-pulse">✨</span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'loaded' && (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              {/* Star shapes */}
              <div className="flex gap-4 mb-4">
                <span className="text-3xl animate-bounce">🌻</span>
                <span className="text-3xl animate-pulse">🍬</span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '200ms' }}>🧸</span>
              </div>

              {/* Logo text & Title */}
              <h1 className="text-5xl font-display font-black text-brand-orange text-center tracking-tight drop-shadow-[5px_5px_0px_#4A3E3D] mb-2 scale-105">
                あろはーず
              </h1>
              <p className="text-dark-charcoal text-xs font-mono font-bold tracking-widest bg-brand-yellow/30 px-3 py-1 rounded-full border border-brand-orange/40 mb-8 self-center">
                ✨ WELCOME TO ALOHA-Z! ✨
              </p>

              {/* Big retro play button */}
              <motion.button
                onClick={playStartSound}
                whileHover={{ scale: 1.1, rotate: [0, 2, -2, 0] }}
                whileTap={{ scale: 0.9, y: 6 }}
                className="px-8 py-4 bg-brand-pink ring-4 ring-dark-charcoal hover:bg-rose-400 text-white font-sans font-extrabold text-xl rounded-2xl arcade-border tracking-wider cursor-pointer mb-2"
              >
                あそびにいく！🎮
              </motion.button>
              <p className="text-[10px] text-dark-charcoal/60 font-mono mt-2 animate-pulse">
                Click to enter the Candy Theme Park
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level / loading bar indicator */}
        <div className="w-full mt-10">
          <div className="flex justify-between text-[11px] font-mono font-semibold text-dark-charcoal/80 mb-1">
            <span>UPDATING SWEETNESS STATE...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-5 bg-stone-200 border-2 border-dark-charcoal rounded-full p-1 overflow-hidden relative">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-brand-orange via-brand-yellow to-brand-pink rounded-full relative"
            >
              {/* Highlight bubblestripe */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[size:16px_16px] animate-[loading-bar_1.2s_linear_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
