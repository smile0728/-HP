import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, Radio, Music, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface ChiptuneTrack {
  id: string;
  title: string;
  composer: string;
  notes: Array<{ note: number; duration: number }>;
}

// Interactive synth melody notes (MIDI numbers or frequencies representation)
const TRACKS: ChiptuneTrack[] = [
  {
    id: 'track-1',
    title: 'ハッピー・キャンディ・ステップ 🍬',
    composer: 'すまいる選曲！',
    notes: [
      { note: 261.63, duration: 0.2 }, // C4
      { note: 293.66, duration: 0.2 }, // D4
      { note: 329.63, duration: 0.2 }, // E4
      { note: 349.23, duration: 0.2 }, // F4
      { note: 392.00, duration: 0.2 }, // G4
      { note: 329.63, duration: 0.2 }, // E4
      { note: 392.00, duration: 0.4 }, // G4
      { note: 440.00, duration: 0.2 }, // A4
      { note: 392.00, duration: 0.2 }, // G4
      { note: 349.23, duration: 0.2 }, // F4
      { note: 329.63, duration: 0.2 }, // E4
      { note: 293.66, duration: 0.2 }, // D4
      { note: 261.63, duration: 0.4 }, // C4
    ]
  },
  {
    id: 'track-2',
    title: '夕焼けメロンソーダ 🥤',
    composer: 'きゃらめる選曲！',
    notes: [
      { note: 329.63, duration: 0.3 }, // E4
      { note: 392.00, duration: 0.3 }, // G4
      { note: 440.00, duration: 0.3 }, // A4
      { note: 523.25, duration: 0.3 }, // C5
      { note: 493.88, duration: 0.3 }, // B4
      { note: 440.00, duration: 0.3 }, // A4
      { note: 392.00, duration: 0.6 }, // G4
      { note: 349.23, duration: 0.3 }, // F4
      { note: 329.63, duration: 0.3 }, // E4
      { note: 293.66, duration: 0.3 }, // D4
      { note: 392.00, duration: 0.6 }, // G4
    ]
  }
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [likes, setLikes] = useState(128);
  const [isLiked, setIsLiked] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noteIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playStateRef = useRef({ noteIndex: 0, isPlaying: false });

  const currentTrack = TRACKS[currentTrackIndex];

  // Stop synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopMelody();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSynthesizerNote = (frequency: number, duration: number) => {
    if (!audioCtxRef.current) return;
    
    // Resume context if suspended (browser security restriction rule)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    // Chiptune Square wave signature
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);

    // Cute envelope
    gainNode.gain.setValueAtTime(volume * 0.4, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration - 0.05);

    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  };

  const startMelody = () => {
    initAudio();
    stopMelody();
    setIsPlaying(true);
    playStateRef.current.isPlaying = true;
    
    const track = TRACKS[currentTrackIndex];
    let noteIdx = playStateRef.current.noteIndex;

    const tick = () => {
      if (!playStateRef.current.isPlaying) return;
      const noteItem = track.notes[noteIdx];
      
      playSynthesizerNote(noteItem.note, noteItem.duration);
      
      noteIdx = (noteIdx + 1) % track.notes.length;
      playStateRef.current.noteIndex = noteIdx;

      // schedule next note
      noteIntervalRef.current = setTimeout(tick, noteItem.duration * 1000);
    };

    tick();
  };

  const stopMelody = () => {
    setIsPlaying(false);
    playStateRef.current.isPlaying = false;
    if (noteIntervalRef.current) {
      clearTimeout(noteIntervalRef.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopMelody();
    } else {
      startMelody();
    }
  };

  const playNext = () => {
    stopMelody();
    playStateRef.current.noteIndex = 0;
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    // Restart automatic player
    setTimeout(() => {
      startMelody();
    }, 150);
  };

  const handleHeartClick = () => {
    if (isLiked) {
      setLikes((p) => p - 1);
    } else {
      setLikes((p) => p + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="bg-amber-50 border-4 border-dark-charcoal p-5 rounded-3xl arcade-border max-w-sm w-full relative overflow-hidden flex flex-col items-center">
      {/* Tape spinner screen background overlay inside */}
      <div className="absolute top-2 right-2 flex gap-1 text-[10px] items-center text-amber-900 border border-amber-900/30 px-2 py-0.5 rounded-full bg-amber-100">
        <Radio size={12} className="animate-pulse" />
        <span className="font-mono">MIDI CH-2</span>
      </div>

      <div className="flex gap-2 items-center text-left self-start mb-4">
        <Music className="text-brand-orange animate-bounce" size={24} />
        <div>
          <h4 className="text-sm font-display font-black text-dark-charcoal">あろはーず・オリジナル8bit</h4>
          <span className="text-[10px] font-mono text-dark-charcoal/60">HEISEI SOUND CHIP V1</span>
        </div>
      </div>

      {/* Retro Cassette Box Shell */}
      <div className="w-full h-36 bg-brand-orange rounded-xl border-4 border-dark-charcoal p-3 flex flex-col justify-between shadow-[inset_-3px_-6px_0px_rgba(0,0,0,0.15)] relative">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-dark-charcoal text-white rounded">NORMAL POSITION</span>
          <span className="text-[9px] font-mono text-dark-charcoal font-black">TYPE I</span>
        </div>

        {/* Cassette Center Grid */}
        <div className="bg-brand-yellow border-2 border-dark-charcoal h-16 rounded-lg p-2 flex items-center justify-between relative">
          {/* Spinners */}
          <motion.div 
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
            className="w-10 h-10 border-4 border-dark-charcoal bg-dark-charcoal/20 rounded-full flex items-center justify-center relative border-dashed"
          >
            <div className="w-4 h-4 bg-dark-charcoal rounded-full" />
          </motion.div>

          {/* Equalizer Wave bars */}
          <div className="flex gap-1 h-8 items-end justify-center">
            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, i) => (
              <motion.div
                key={i}
                animate={isPlaying ? { height: [val * 3, val * 7, val * 2] } : { height: 6 }}
                transition={{ repeat: Infinity, duration: 0.6 + i * 0.05, ease: 'easeInOut' }}
                className="w-1 bg-brand-pink rounded-t"
              />
            ))}
          </div>

          <motion.div 
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
            className="w-10 h-10 border-4 border-dark-charcoal bg-dark-charcoal/20 rounded-full flex items-center justify-center relative border-dashed"
          >
            <div className="w-4 h-4 bg-dark-charcoal rounded-full" />
          </motion.div>
        </div>

        {/* Labels */}
        <div className="flex justify-between items-center px-1 text-[10px] text-dark-charcoal font-bold tracking-tight">
          <span className="truncate max-w-[170px]">{currentTrack.title}</span>
          <span>{currentTrack.composer}</span>
        </div>
      </div>

      {/* Play Controls Box */}
      <div className="w-full flex justify-between items-center mt-4 bg-brand-cream/80 border-2 border-dark-charcoal rounded-xl p-3 shadow-sm">
        <div className="flex gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-brand-yellow hover:bg-yellow-400 border-2 border-dark-charcoal flex items-center justify-center shadow-[2px_2px_0px_#4A3E3D] active:translate-y-0.5 cursor-pointer text-dark-charcoal"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Skip Track */}
          <button
            onClick={playNext}
            className="w-10 h-10 rounded-full bg-brand-pink hover:bg-rose-400 border-2 border-dark-charcoal flex items-center justify-center shadow-[2px_2px_0px_#4A3E3D] active:translate-y-0.5 cursor-pointer text-white"
          >
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>

        {/* Right - volume bar & Like Node */}
        <div className="flex items-center gap-2">
          {/* Like feature */}
          <button
            onClick={handleHeartClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dark-charcoal text-xs font-mono font-bold transition-all ${
              isLiked ? 'bg-brand-pink text-white' : 'bg-white text-dark-charcoal hover:bg-pink-100'
            }`}
          >
            <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-bounce' : ''} />
            <span>{likes}</span>
          </button>
        </div>
      </div>

      {/* Volume slider */}
      <div className="w-full flex items-center gap-2 mt-3 px-1">
        <Volume2 size={14} className="text-dark-charcoal/60" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-brand-pink h-1 rounded-full bg-stone-300 pointer-events-auto"
        />
        <span className="font-mono text-[9px] font-bold text-dark-charcoal/70">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
