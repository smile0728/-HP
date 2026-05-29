import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState<'ready' | 'smile' | 'kyarumen' | 'aloha' | 'loaded'>('ready');
  const [progress, setProgress] = useState(0);
  const smileImage = '/picture/loading-smile.png';
  const kyarumenImage = '/picture/loading-kyarumen.png';
  const alohazImage = '/picture/loading-alohaz.png';

  useEffect(() => {
    [smileImage, kyarumenImage, alohazImage].forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 55);

    const smileTimer = setTimeout(() => {
      setStage('smile');
    }, 1100);

    const kyarumenTimer = setTimeout(() => {
      setStage('kyarumen');
    }, 2600);

    const alohaTimer = setTimeout(() => {
      setStage('aloha');
    }, 4100);

    const loadedTimer = setTimeout(() => {
      setStage('loaded');
    }, 6100);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(smileTimer);
      clearTimeout(kyarumenTimer);
      clearTimeout(alohaTimer);
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
          {stage === 'ready' && (
            <motion.div 
              key="ready"
              className="relative h-40 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <span className="absolute -top-8 -left-8 text-3xl animate-bounce">🌻</span>
                <span className="absolute -bottom-8 -right-8 text-3xl animate-bounce" style={{ animationDelay: '160ms' }}>🧸</span>
                <span className="text-5xl sm:text-6xl font-sans font-black text-brand-orange drop-shadow-[4px_4px_0_#4A3E3D]">
                  せーの！
                </span>
              </div>
            </motion.div>
          )}

          {stage === 'smile' && (
            <motion.div
              key="smile"
              initial={{ opacity: 0, x: -90, rotate: -8 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0 }}
              className="h-52 w-full flex items-center justify-center"
            >
              <div className="relative w-full flex items-end justify-center gap-2">
                <img
                  src={smileImage}
                  alt="すまいる"
                  className="h-44 sm:h-52 w-auto object-contain drop-shadow-[5px_5px_0_#4A3E3D]"
                />
                <div className="bg-white border-4 border-dark-charcoal rounded-3xl px-4 py-3 shadow-[6px_6px_0_#4A3E3D] -rotate-2 mb-4">
                  <span className="block text-sm font-black text-brand-orange mb-1">🌻 すまいる</span>
                  <span className="whitespace-nowrap text-2xl sm:text-3xl font-sans font-black text-dark-charcoal">
                    すまいるです！
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'kyarumen' && (
            <motion.div
              key="kyarumen"
              initial={{ opacity: 0, x: 90, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0 }}
              className="h-52 w-full flex items-center justify-center"
            >
              <div className="relative w-full flex flex-row-reverse items-end justify-center gap-2">
                <img
                  src={kyarumenImage}
                  alt="きゃるめん"
                  className="h-44 sm:h-52 w-auto object-contain drop-shadow-[5px_5px_0_#4A3E3D]"
                />
                <div className="bg-white border-4 border-dark-charcoal rounded-3xl px-4 py-3 shadow-[6px_6px_0_#4A3E3D] rotate-2 mb-4">
                  <span className="block text-sm font-black text-brand-pink mb-1">🧸 きゃるめん</span>
                  <span className="whitespace-nowrap text-2xl sm:text-3xl font-sans font-black text-dark-charcoal">
                    きゃるめんです！
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'aloha' && (
            <motion.div
              key="aloha"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: [1, 1.08, 1] }}
              exit={{ opacity: 0 }}
              className="h-56 w-full flex items-center justify-center text-center"
            >
              <div className="relative w-full flex flex-col items-center">
                <span className="absolute top-2 left-4 text-3xl animate-pulse">✨</span>
                <span className="absolute bottom-2 right-4 text-3xl animate-pulse">✨</span>
                <img
                  src={alohazImage}
                  alt="あろはーず"
                  className="h-36 sm:h-44 w-auto object-contain drop-shadow-[5px_5px_0_#4A3E3D] mb-1"
                />
                <span className="block text-base sm:text-lg font-black text-brand-pink">
                  2人合わせて
                </span>
                <span className="block whitespace-nowrap text-[clamp(1.45rem,7vw,3rem)] leading-none font-display font-black text-brand-orange drop-shadow-[5px_5px_0_#4A3E3D]">
                  あろはーずです！！
                </span>
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
            <span>ALOHA-Z GREETING START...</span>
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
