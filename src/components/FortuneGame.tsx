import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { FORTUNES } from '../data';
import { FortuneResult } from '../types';
import { ensureFanUser, getFortunes, getLetters, getUserGachaState, saveUserGachaState, UserGachaState } from '../lib/firebase';
import { Award, RefreshCw, Sun, Heart, Gift, PlayCircle, Download, CheckCircle, BookOpen, Star, Sparkles, Mail, Lock, Unlock } from 'lucide-react';

export default function FortuneGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  
  // Real 1-draw-per-day restriction states
  const [isDrawRestricted, setIsDrawRestricted] = useState(false);
  const [lastDrawDate, setLastDrawDate] = useState<string>('');
  
  // Custom dynamically fetched fortunes & letters states
  const [fortunesList, setFortunesList] = useState<FortuneResult[]>(FORTUNES);
  const [lettersList, setLettersList] = useState<any[]>([]);

  // Collection Book system states
  const [collection, setCollection] = useState<string[]>([]);
  const [showLetter, setShowLetter] = useState(false);
  const [canvasGenerating, setCanvasGenerating] = useState(false);

  // Visitor Name registration states
  const [visitorName, setVisitorName] = useState<string>('');
  const [tempName, setTempName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [fanAccountId, setFanAccountId] = useState<string | null>(null);
  const [gachaSaveStatus, setGachaSaveStatus] = useState<'loading' | 'cloud' | 'local'>('loading');

  // Convert schema-level GachaFortune into FortuneResult format for compatibility
  const mapGachaFortuneToFortuneResult = (f: any): FortuneResult => ({
    title: f.title,
    description: f.resultMessage,
    luckLevel: f.resultName as any,
    imageUrl: f.imageUrl || '',
    commentSmile: f.commentSmile,
    commentCaramel: f.commentCaramel,
    luckyItem: f.luckyItem,
    luckyDance: f.luckyDance,
    ratingSmile: f.ratingSmile,
    ratingCaramel: f.ratingCaramel
  });

  // Fetch collections on mount
  useEffect(() => {
    getFortunes()
      .then((data) => {
        if (data && data.length > 0) {
          setFortunesList(data.map(mapGachaFortuneToFortuneResult));
        }
      })
      .catch((err) => console.warn("Failed to retrieve custom fortunes, using fallback", err));

    getLetters()
      .then((data) => {
        if (data && data.length > 0) {
          setLettersList(data);
        }
      })
      .catch((err) => console.warn("Failed to retrieve custom letters, using fallback", err));
  }, []);


  const triggerConfetti = () => {
    try {
      // Gorgeous explosion of sparks and colors
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#FFB6C1', '#FFF', '#FFD700', '#FF8C00']
      });
      // Staggered follow-up confetti from side coordinates
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.75 },
          colors: ['#FF69B4', '#FFF', '#FFD700']
        });
      }, 150);
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.75 },
          colors: ['#FF8C00', '#FFF', '#FFB6C1']
        });
      }, 300);
    } catch (_) {}
  };

  const saveGachaStateToLocal = (state: UserGachaState) => {
    if (state.lastDrawDate) {
      localStorage.setItem('alohaz_last_draw_date', state.lastDrawDate);
    } else {
      localStorage.removeItem('alohaz_last_draw_date');
    }

    if (state.todayFortune) {
      localStorage.setItem('alohaz_today_fortune', JSON.stringify(state.todayFortune));
    } else {
      localStorage.removeItem('alohaz_today_fortune');
    }

    localStorage.setItem('alohaz_gacha_collection', JSON.stringify(state.collection));
    localStorage.setItem('alohaz_visitor_name', state.visitorName);
  };

  const loadGachaStateFromLocal = (): UserGachaState => {
    let parsedCollection: string[] = [];
    let parsedTodayFortune: Record<string, unknown> | null = null;

    try {
      const storedCollectionStr = localStorage.getItem('alohaz_gacha_collection');
      parsedCollection = storedCollectionStr ? JSON.parse(storedCollectionStr) : [];
    } catch (_) {
      parsedCollection = [];
    }

    try {
      const storedTodayResult = localStorage.getItem('alohaz_today_fortune');
      parsedTodayFortune = storedTodayResult ? JSON.parse(storedTodayResult) : null;
    } catch (_) {
      parsedTodayFortune = null;
    }

    return {
      lastDrawDate: localStorage.getItem('alohaz_last_draw_date') || '',
      todayFortune: parsedTodayFortune,
      collection: parsedCollection.filter((item) => typeof item === 'string'),
      visitorName: localStorage.getItem('alohaz_visitor_name') || ''
    };
  };

  const applyGachaState = (state: UserGachaState) => {
    const todayStr = getTodayString();
    setLastDrawDate(state.lastDrawDate);
    setCollection(state.collection);
    setVisitorName(state.visitorName);
    setTempName(state.visitorName);
    setIsDrawRestricted(state.lastDrawDate === todayStr);
    setResult(state.lastDrawDate === todayStr && state.todayFortune ? state.todayFortune as unknown as FortuneResult : null);
  };

  const mergeGachaStates = (remoteState: UserGachaState | null, localState: UserGachaState): UserGachaState => {
    if (!remoteState) return localState;

    return {
      lastDrawDate: remoteState.lastDrawDate || localState.lastDrawDate,
      todayFortune: remoteState.todayFortune || localState.todayFortune,
      collection: Array.from(new Set([...localState.collection, ...remoteState.collection])),
      visitorName: remoteState.visitorName || localState.visitorName
    };
  };

  const persistGachaState = async (state: UserGachaState) => {
    saveGachaStateToLocal(state);
    if (fanAccountId) {
      await saveUserGachaState(fanAccountId, state);
    }
  };

  const saveAndOpenLetter = async () => {
    if (!tempName.trim()) return;
    const finalName = tempName.trim();
    setVisitorName(finalName);
    await persistGachaState({
      lastDrawDate,
      todayFortune: result as unknown as Record<string, unknown> | null,
      collection,
      visitorName: finalName
    });
    setShowNameModal(false);
    setShowLetter(true);
    triggerConfetti();
    
    // Play warm unlock / bell sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch (_) {}
  };

  // Initialize from localStorage, then upgrade to anonymous Firebase account storage when possible.
  useEffect(() => {
    let cancelled = false;

    const initializeGachaAccount = async () => {
      const localState = loadGachaStateFromLocal();
      applyGachaState(localState);

      try {
        const user = await ensureFanUser();
        if (cancelled) return;

        if (!user) {
          setGachaSaveStatus('local');
          return;
        }

        setFanAccountId(user.uid);
        const remoteState = await getUserGachaState(user.uid);
        if (cancelled) return;

        const mergedState = mergeGachaStates(remoteState, localState);
        applyGachaState(mergedState);
        saveGachaStateToLocal(mergedState);
        await saveUserGachaState(user.uid, mergedState);
        if (!cancelled) setGachaSaveStatus('cloud');
      } catch (error) {
        console.warn('Anonymous fan account setup failed, staying on local gacha save', error);
        if (!cancelled) setGachaSaveStatus('local');
      }
    };

    initializeGachaAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  // Utility to get today's date string YYYY-MM-DD in local time
  const getTodayString = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const drawFortune = () => {
    const todayStr = getTodayString();
    
    // Check daily restriction
    if (isDrawRestricted) {
      return;
    }

    setIsPlaying(true);
    setResult(null);

    // Play arcade sound synth
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
      osc.frequency.linearRampToValueAtTime(523.25, audioCtx.currentTime + 0.4); // C5
      osc.frequency.linearRampToValueAtTime(1046.50, audioCtx.currentTime + 1.0); // C6
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.25);
    } catch (_) {}

    // Simulated ticket dispensing delay
    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * fortunesList.length);
      const drawnFortune = fortunesList[randomIndex];
      const nextCollection = collection.includes(drawnFortune.luckLevel)
        ? collection
        : [...collection, drawnFortune.luckLevel];
      
      setResult(drawnFortune);
      setIsPlaying(false);

      // Save restriction
      setLastDrawDate(todayStr);
      setIsDrawRestricted(true);
      setCollection(nextCollection);

      await persistGachaState({
        lastDrawDate: todayStr,
        todayFortune: drawnFortune as unknown as Record<string, unknown>,
        collection: nextCollection,
        visitorName
      });

      // Sweet success bell
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (_) {}

    }, 1500);
  };

  // Helper to manual reset to test drawing again (for convenience of testing, with clear visual note!)
  const resetDrawStatusForTesting = () => {
    setIsDrawRestricted(false);
    setResult(null);
    setLastDrawDate('');
    persistGachaState({
      lastDrawDate: '',
      todayFortune: null,
      collection,
      visitorName
    });
  };

  // Clear entire collection to reset
  const resetEntireGachaRecords = () => {
    setCollection([]);
    setIsDrawRestricted(false);
    setResult(null);
    setLastDrawDate('');
    setShowLetter(false);
    persistGachaState({
      lastDrawDate: '',
      todayFortune: null,
      collection: [],
      visitorName
    });
  };

  const isComplete = fortunesList.length > 0 ? collection.length >= fortunesList.length : collection.length >= 6;

  const currentLetterData = lettersList.length > 0 ? lettersList[0] : null;

  const smileLetterText = currentLetterData?.smileContent
    ? currentLetterData.smileContent.replaceAll('{{name}}', visitorName || 'あなた')
    : `大好きな${visitorName || 'あなた'}へ🌻

おみくじ図鑑のコンプリート、本当に本当にありがとーー！！
毎日毎日引いてくれてる${visitorName || 'あなた'}の姿を想像してたら、すまいるの心のハッピーメーターが1万倍になっちゃいました！

落ち込んじゃう時や、今日ちょっと力が出ないなーって日も、私たちが送ったお札みくじを見て、少しでもニコニコになってくれたら嬉しいなッ！

これからも${visitorName || 'あなた'}の特等席で、いーーーっぱい踊り狂っていくので、ずっと見つめててね？
２人は永遠に、${visitorName || 'あなた'}のスーパーヒーロー・スマイルパフォーマーです！だいすきー！

すまいるより 🌻（ハグ！）`;

  const caramelLetterText = currentLetterData?.caramelContent
    ? currentLetterData.caramelContent.replaceAll('{{name}}', visitorName || 'あなた')
    : `親愛なる${visitorName || 'あなた'}へ🧸

運勢のすべてを引き当ててくれて、ありがとうございます。おめでとうございます！
いつも私たちの活動を、お布団の中から…あ、違う、心の中から暖かく見守ってくれて本当に感謝してます。

甘々のキャラメルパフェみたいに、${visitorName || 'あなた'}の毎日が甘くてハッピーな幸せでいっぱい満たされますように。きゃらめるのあざとビームもたくさんお札に注入しておきました（笑）

もし転んじゃっても、のんびり、ゆっくり休んでから、明日またいっしょにスキップしよう？

甘やかされたくなったら、いつでも私たちのところに帰ってきてくださいね。
${visitorName || 'あなた'}がずっと笑顔でいられるように。

きゃらめるより 🎀（むにゃ…おやすみなさい…）`;

  // Rich HTML5 Canvas image rendering tool for downloading
  const handleDownloadImage = async (fortune: FortuneResult) => {
    if (!fortune) return;
    setCanvasGenerating(true);

    try {
      const width = 640;
      const height = 900;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background (Cream #FFF9E5 with Warm Orange frame)
      ctx.fillStyle = '#FFF9E5';
      ctx.fillRect(0, 0, width, height);

      // Solid outer borders
      ctx.strokeStyle = '#4A2C2A';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, width - 36, height - 36);

      // Dotted Retro Grid Decoration inside background
      ctx.fillStyle = 'rgba(255, 140, 0, 0.06)';
      for (let x = 30; x < width - 30; x += 20) {
        for (let y = 30; y < height - 30; y += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Header ribbon
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.roundRect(40, 45, width - 80, 75, 18);
      ctx.fill();
      ctx.strokeStyle = '#4A2C2A';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#4A2C2A';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText('ALOHA-Z! あろはーず 🍬 開運お札', width / 2, 80);
      ctx.font = 'bold 13px monospace';
      ctx.fillText('OFFICIAL CANDY POP DAILY FORTUNE TICKET', width / 2, 105);

      // Reset shadows
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw Capsule Shape behind the Luck Badge
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(140, 155, width - 280, 110, 55);
      ctx.fill();
      ctx.strokeStyle = '#4A2C2A';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Luck Level Label (e.g. 超大吉)
      let badgeColor = '#FF69B4'; // Default Pink
      if (fortune.luckLevel === '超大吉') badgeColor = '#FF8C00';
      if (fortune.luckLevel === '大吉' || fortune.luckLevel === '中吉') badgeColor = '#FFD700';

      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.arc(width / 2, 210, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4A2C2A';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillText(fortune.luckLevel, width / 2, 222);
      ctx.shadowBlur = 0;

      // Decorative Star icons
      ctx.fillStyle = '#FFD700';
      ctx.font = '28px sans-serif';
      ctx.fillText('★', 90, 215);
      ctx.fillText('★', width - 90, 215);

      // Fortune Title Text
      ctx.fillStyle = '#4A2C2A';
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`✨ ${fortune.title} ✨`, width / 2, 310);

      // Paper notebook Lines frame
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(40, 345, width - 80, 455, 20);
      ctx.fill();
      ctx.strokeStyle = '#4A2C2A';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Horizontal dashed guide lines
      ctx.strokeStyle = 'rgba(74, 44, 42, 0.1)';
      ctx.lineWidth = 2;
      for (let r = 0; r < 14; r++) {
        ctx.beginPath();
        ctx.moveTo(60, 365 + r * 30);
        ctx.lineTo(width - 60, 365 + r * 30);
        ctx.stroke();
      }

      // Draw description paragraphs with wrapping
      ctx.fillStyle = '#4A2C2A';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      wrapText(ctx, fortune.description, 60, 390, width - 120, 24);

      // Draw Smile comment on card
      ctx.fillStyle = '#FF8C00';
      ctx.font = '900 14px sans-serif';
      ctx.fillText('🌻 すまいるのメッセージ', 60, 520);
      ctx.fillStyle = '#4A2C2A';
      ctx.font = 'bold 14px sans-serif';
      wrapText(ctx, fortune.commentSmile, 70, 545, width - 140, 22);

      // Draw Caramel comment on card
      ctx.fillStyle = '#FF69B4';
      ctx.font = '900 14px sans-serif';
      ctx.fillText('🧸 きゃらめるのメッセージ', 60, 620);
      ctx.fillStyle = '#4A2C2A';
      ctx.font = 'bold 14px sans-serif';
      wrapText(ctx, fortune.commentCaramel, 70, 645, width - 140, 22);

      // Draw lucky items
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#FCF8EB';
      ctx.beginPath();
      ctx.roundRect(55, 715, width - 110, 65, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4A2C2A';
      ctx.font = '900 12px sans-serif';
      ctx.fillText('🍬 ラッキーおやつ：', 75, 742);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(fortune.luckyItem, 195, 742);

      ctx.font = '900 12px sans-serif';
      ctx.fillText('🕺 ラッキーダンス：', 75, 765);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(fortune.luckyDance, 195, 765);

      // Card stamp signature/barcode look at bottom
      ctx.fillStyle = '#4A2C2A';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const dStr = new Date().toLocaleDateString('ja-JP');
      ctx.fillText(`CANDY CODE: ALOHAZ-GACHA-${fortune.luckLevel}-DL  |  GENERATED: ${dStr}`, width / 2, 850);

      // Beautiful simulated mini Barcode bars
      const startX = 230;
      ctx.fillStyle = '#4A2C2A';
      for (let b = 0; b < 36; b++) {
        const barWidth = (b % 3 === 0) ? 4 : (b % 4 === 1) ? 1.5 : 2.5;
        const spacing = b * 5;
        ctx.fillRect(startX + spacing, 860, barWidth, 20);
      }

      // Download helper execution
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ALOHAZ-Fortune-${fortune.luckLevel}-${dStr.replace(/\//g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate template card image:', err);
    } finally {
      // Soft finish indicator
      setCanvasGenerating(false);
    }
  };

  // Safe canvas text-wrap helper function
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    let words = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n];
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      
      {/* 2-Column Retro Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Capsule Vending Machine */}
        <div className="lg:col-span-5 bg-white border-4 border-dark-charcoal p-6 rounded-3xl alarm-shadow relative">
          {/* Paper staple decor */}
          <div className="absolute top-2 left-6 right-6 h-1 flex justify-between pointer-events-none">
            <div className="w-12 h-3 bg-stone-300 rounded-sm -mt-2.5 opacity-60"></div>
            <div className="w-12 h-3 bg-stone-300 rounded-sm -mt-2.5 opacity-60"></div>
          </div>

          <div className="text-center mb-4 mt-2">
            <span className="inline-block bg-brand-orange text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest mb-1.5 shadow-sm">
              ONCE A DAY LIMIT 🍬
            </span>
            <h3 className="text-xl font-display font-black text-dark-charcoal">
              🔮 あろはーずおみくじガチャ
            </h3>
            <p className="text-[11px] text-dark-charcoal/60 font-semibold mt-1">
              一日一回引いて、今日の運勢とお札画像をゲットしてね！
            </p>
          </div>

          {/* Vending machine graphic */}
          <div className="flex flex-col items-center">
            <div className="w-56 h-72 bg-[#FCF8EB] rounded-3xl border-4 border-dark-charcoal p-3.5 flex flex-col justify-between shadow-[inset_-4px_-8px_0_rgba(0,0,0,0.06),5px_5px_0px_#4A2C2A] relative overflow-hidden mb-4 bg-dot-grid">
              
              {/* Glass dome loaded with capsules */}
              <div className="bg-gradient-to-b from-brand-cream/80 to-amber-100/40 border-2 border-dark-charcoal h-40 rounded-2xl flex flex-wrap content-start gap-1 p-1.5 overflow-hidden relative">
                {/* Gloss glare sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/40 pointer-events-none" />

                {/* Simulated capsules */}
                {!result && !isPlaying ? (
                  Array.from({ length: 18 }).map((_, i) => {
                    const colors = ['bg-brand-orange', 'bg-brand-pink', 'bg-brand-yellow', 'bg-emerald-400', 'bg-sky-400'];
                    const randomColor = colors[i % colors.length];
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, 1.5, -1.5, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2 + (i % 3),
                          delay: i * 0.05
                        }}
                        className={`w-5 h-5 rounded-full ${randomColor} border border-dark-charcoal shadow-sm flex items-center justify-center`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 -mt-1 -ml-1"></div>
                      </motion.div>
                    );
                  })
                ) : isPlaying ? (
                  // Highly dynamic Gacha shaking
                  Array.from({ length: 18 }).map((_, i) => {
                    const colors = ['bg-brand-orange', 'bg-brand-pink', 'bg-brand-yellow', 'bg-emerald-400', 'bg-sky-400'];
                    const randomColor = colors[i % colors.length];
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -25, 18, -12, 0],
                          x: [0, 12, -10, 8, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.45,
                          delay: (i % 5) * 0.04
                        }}
                        className={`w-5 h-5 rounded-full ${randomColor} border border-dark-charcoal shadow-sm`}
                      />
                    );
                  })
                ) : (
                  // Output result capsule drop
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 animate-pulse pointer-events-none">
                    <span className="text-3xl">✨🍬✨</span>
                    <span className="text-[10px] font-black text-brand-orange-650 tracking-wider mt-1.5">
                      カプセルがガチャ窓に落ちてきたよ！↓
                    </span>
                  </div>
                )}
              </div>

              {/* Lower Section with dial knob dispenser */}
              <div className="flex justify-between items-center h-16 bg-[#FFF] border-t-2 border-dashed border-dark-charcoal/30 px-2 rounded-xl">
                  {/* Spin rotary dial knob trigger */}
                <motion.div
                  animate={isPlaying ? { rotate: [0, 1080] } : {}}
                  transition={{ duration: 1.4, ease: 'easeInOut' }}
                  onClick={() => {
                    if (isPlaying) return;
                    if (isDrawRestricted) return;
                    drawFortune();
                  }}
                  className={`w-14 h-14 bg-brand-orange hover:bg-orange-550 border-3 border-dark-charcoal rounded-full flex items-center justify-center shadow-[2px_2px_0_#4A2C2A] cursor-pointer relative active:translate-y-0.5 shrink-0 ${
                    isDrawRestricted ? 'opacity-50 cursor-not-allowed bg-stone-300' : ''
                  }`}
                  title={isDrawRestricted ? '本日はこれ以上引けません' : 'カプセルを回す！'}
                >
                  <div className="w-8 h-2.5 bg-dark-charcoal rounded-full rotate-45" />
                  <div className="w-8 h-2.5 bg-dark-charcoal rounded-full -rotate-45 absolute" />
                </motion.div>

                {/* Capsule Outlets */}
                <div className="w-10 h-10 bg-zinc-800 rounded border-2 border-dark-charcoal flex items-center justify-center flex-col shrink-0 overflow-hidden relative">
                  {!result ? (
                    <div className="w-4 h-4 bg-zinc-950 rounded-full border-t border-white/20"></div>
                  ) : (
                    <motion.div 
                      animate={{ y: [-15, 0], scale: [0.6, 1], rotate: [0, 180] }}
                      className="w-6 h-6 rounded-full bg-brand-pink border border-dark-charcoal flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <span className="text-[8px] text-white">🎁</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {isPlaying ? (
              <div className="bg-brand-yellow/30 text-dark-charcoal font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 border border-dashed border-brand-orange animate-pulse mb-2">
                <RefreshCw size={14} className="animate-spin" />
                カプセルガラガラ回転中…♪
              </div>
            ) : isDrawRestricted ? (
              <div className="w-full flex flex-col gap-2">
                <div className="bg-orange-50 border-2 border-brand-orange/40 rounded-2xl p-4 text-center mb-2">
                  <p className="text-xs font-black text-brand-orange flex items-center justify-center gap-1.5">
                    <CheckCircle size={15} className="fill-brand-orange text-white text-brand-orange" /> 本日分のおみくじは完了！
                  </p>
                  <p className="text-[11px] text-dark-charcoal/80 font-bold mt-1.5 leading-relaxed">
                    おみくじは1日1回限定です🍭<br />
                    今日の運勢は引き終えました。明日また遊びに来てね！✨
                  </p>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={drawFortune}
                className="w-full py-3 bg-brand-orange text-white font-sans font-black text-sm rounded-2xl border-4 border-dark-charcoal shadow-[3px_3px_0px_#4A2C2A] hover:-translate-y-0.5 active:translate-y-0 duration-150 tracking-wider mb-2 cursor-pointer"
              >
                レバーをガチャっと回す！ 🎯
              </motion.button>
            )}

            {/* General Collection progress */}
            <div className="w-full mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
              <span className="font-bold text-dark-charcoal flex items-center gap-1">
                <BookOpen size={12} className="text-brand-pink" /> 運勢コプリート進捗
              </span>
              <span className={`px-2.5 py-0.5 font-mono text-xs font-black rounded-full ${isComplete ? 'bg-emerald-400 text-white animate-bounce' : 'bg-brand-pink/20 text-brand-pink'}`}>
                {collection.length} / {fortunesList.length || 6} 種類
              </span>
            </div>

            <div className="w-full mt-2 bg-white/80 border border-dashed border-dark-charcoal/20 rounded-xl px-3 py-2 text-[10px] font-bold text-dark-charcoal/60 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                {gachaSaveStatus === 'loading' ? (
                  <>
                    <RefreshCw size={11} className="animate-spin text-brand-orange" />
                    保存先を準備中...
                  </>
                ) : gachaSaveStatus === 'cloud' ? (
                  <>
                    <CheckCircle size={11} className="text-emerald-500" />
                    コンプ情報はアカウントに保存中
                  </>
                ) : (
                  <>
                    <BookOpen size={11} className="text-brand-pink" />
                    コンプ情報はこのブラウザに保存中
                  </>
                )}
              </span>
              {fanAccountId && (
                <span className="font-mono opacity-50">
                  ID:{fanAccountId.slice(0, 6)}
                </span>
              )}
            </div>
            
            {/* Quick dev restart button */}
            <button
              onClick={resetEntireGachaRecords}
              className="mt-3 text-[9px] text-stone-400 hover:text-stone-600 font-semibold cursor-pointer underline hover:no-underline"
            >
              ※ テスト中の最初からコンプやり直し
            </button>
          </div>
        </div>

        {/* Right Column: Open Ballot Result slip details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.luckLevel}
                initial={{ transform: 'scale(0.95)', opacity: 0 }}
                animate={{ transform: 'scale(1)', opacity: 1 }}
                exit={{ transform: 'scale(0.95)', opacity: 0 }}
                className="bg-white border-4 border-dark-charcoal rounded-3xl p-6 shadow-[6px_6px_0px_#4A2C2A] relative overflow-hidden"
              >
                {/* Wobbly stamp sticker on upper right corner */}
                <div className="absolute top-4 right-4 bg-brand-yellow text-dark-charcoal text-[9px] font-black tracking-widest uppercase border-2 border-dark-charcoal py-1 px-2.5 rounded shadow-sm rotate-12 z-10">
                  NEW REWARD 🍬
                </div>

                {/* Visual binder rings */}
                <div className="absolute top-0 inset-x-0 h-4 flex justify-around pointer-events-none px-8">
                  <div className="w-3 h-5 bg-stone-300 border-2 border-dark-charcoal rounded-full -mt-2"></div>
                  <div className="w-3 h-5 bg-stone-300 border-2 border-dark-charcoal rounded-full -mt-2"></div>
                  <div className="w-3 h-5 bg-stone-300 border-2 border-dark-charcoal rounded-full -mt-2"></div>
                  <div className="w-3 h-5 bg-stone-300 border-2 border-dark-charcoal rounded-full -mt-2"></div>
                </div>

                <div className="mt-2 border-b-4 border-double border-dark-charcoal pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl font-display font-black text-brand-pink bg-[#FCF8EB] border-2 border-dark-charcoal px-4 py-1.5 rounded-2xl shadow-[3px_3px_0px_#4A2C2A] rotate-[-2deg]">
                      {result.luckLevel}
                    </span>
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-dark-charcoal leading-snug">
                        {result.title}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold font-mono tracking-wide mt-0.5">
                        ALOHA-Z POP LUCKY FORTUNE RESULT SLIP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fortune Main description paragraph */}
                <p className="text-xs md:text-sm text-dark-charcoal font-bold leading-relaxed bg-[#FFFCE8] p-4 rounded-xl border-2 border-dashed border-brand-yellow/30 mb-5 relative">
                  {result.description}
                  
                  {/* Decorative background stars */}
                  <span className="absolute bottom-2 right-2 text-xl opacity-20">⭐</span>
                </p>

                {/* Star-meter indicators for both girls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border-2 border-dark-charcoal mb-5">
                  
                  {/* Smile block */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-brand-orange text-xs font-black flex items-center gap-1 mb-1">
                      <Sun size={14} className="fill-current" /> すまいるお墨付き
                    </span>
                    <div className="flex gap-0.5 mb-1.5 text-brand-yellow">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < result.ratingSmile ? 'fill-current' : 'text-stone-200'}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-dark-charcoal/80 italic font-semibold leading-relaxed">
                      {result.commentSmile}
                    </p>
                  </div>

                  {/* Caramel block */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200">
                    <span className="text-brand-pink text-xs font-black flex items-center gap-1 mb-1">
                      <Heart size={14} className="fill-current" /> きゃらめるお墨付き
                    </span>
                    <div className="flex gap-0.5 mb-1.5 text-brand-pink">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < result.ratingCaramel ? 'fill-current' : 'text-stone-200'}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-dark-charcoal/80 italic font-semibold leading-relaxed">
                      {result.commentCaramel}
                    </p>
                  </div>

                </div>

                {result.imageUrl && (
                  <div className="mb-5 bg-[#FFFCE8] border-2 border-dark-charcoal rounded-2xl overflow-hidden shadow-[3px_3px_0px_#4A2C2A]">
                    <div className="bg-brand-orange text-white text-[10px] font-black px-3 py-1.5 border-b-2 border-dark-charcoal">
                      🎁 今回の当たり配布画像
                    </div>
                    <a href={result.imageUrl} target="_blank" rel="noreferrer" className="block bg-white">
                      <img
                        src={result.imageUrl}
                        alt={`${result.luckLevel}の配布画像`}
                        className="w-full max-h-[360px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                )}

                {/* Lucky item labels */}
                <div className="border-t border-dashed border-dark-charcoal/20 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-brand-orange text-white text-[9px] font-black px-2 py-0.5 rounded border border-dark-charcoal">
                        ラッキーおやつ
                      </span>
                      <span className="text-xs font-black text-dark-charcoal">
                        {result.luckyItem}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-brand-pink text-white text-[9px] font-black px-2 py-0.5 rounded border border-dark-charcoal">
                        ラッキーダンス
                      </span>
                      <span className="text-xs font-black text-dark-charcoal flex items-center gap-1">
                        <PlayCircle size={12} className="text-brand-pink animate-pulse" />
                        {result.luckyDance}
                      </span>
                    </div>
                  </div>

                  {result.imageUrl ? (
                    <a
                      href={result.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full md:w-auto px-4 py-2 bg-brand-pink text-white font-sans font-black text-xs rounded-xl border-2 border-dark-charcoal shadow-[2.5px_2.5px_0px_#4A2C2A] hover:-translate-y-0.5 active:translate-y-0 duration-150 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download size={13} />
                      当たり画像を開く 💾
                    </a>
                  ) : (
                    <button
                      onClick={() => handleDownloadImage(result)}
                      disabled={canvasGenerating}
                      className="w-full md:w-auto px-4 py-2 bg-brand-pink text-white font-sans font-black text-xs rounded-xl border-2 border-dark-charcoal shadow-[2.5px_2.5px_0px_#4A2C2A] hover:-translate-y-0.5 active:translate-y-0 duration-150 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {canvasGenerating ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          画像作成中...
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          お札画像をダウンロード 💾
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Extra guidance sticker */}
                <p className="text-[10px] text-stone-400 font-bold mt-2.5 text-center">
                  💾 {result.imageUrl ? '当たり画像はタップして開いて保存してね！' : 'ボタンを押すと高解像度お札おみくじカードがダウンロードできるよ！'}コンプリートを目指してね🍭
                </p>
              </motion.div>
            ) : (
              <div className="bg-[#FFFCE8] border-4 border-dashed border-brand-orange/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[340px]">
                <div className="w-16 h-16 bg-white border-2 border-dark-charcoal rounded-full flex items-center justify-center text-3xl shadow-sm rotate-[-8deg] mb-3">
                  🔮
                </div>
                <h4 className="text-base font-black text-dark-charcoal mb-1">
                  今日の運勢はなんだろう？
                </h4>
                <p className="text-xs text-dark-charcoal/65 font-bold max-w-sm mb-4">
                  左のガチャレバーをクリックして回すと、あなたへ向けたメッセージとお札画像が飛び出します！
                </p>
                <div className="flex gap-1">
                  <span className="text-xs bg-brand-yellow font-bold text-dark-charcoal px-2.5 py-0.5 rounded-full">超大吉</span>
                  <span className="text-xs bg-brand-pink/20 text-brand-pink font-bold px-2.5 py-0.5 rounded-full">激吉</span>
                  <span className="text-xs bg-brand-orange/20 text-brand-orange font-bold px-2.5 py-0.5 rounded-full">まったり吉</span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collector Scrapbook Status Section */}
      <div className="bg-[#FCF8EB] border-4 border-dark-charcoal p-5 md:p-6 rounded-3xl shadow-[5px_5px_0_#4A2C2A] relative overflow-hidden bg-dot-grid">
        <h4 className="text-lg font-display font-black text-dark-charcoal border-b-2 border-dark-charcoal/20 pb-3 mb-4 flex items-center gap-2">
          🎯 運勢コレクション図鑑 (全6種類)
        </h4>

        {/* 6 unique fortune card spots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
          {[
            { id: '超大吉', label: '全力超大吉', color: 'bg-amber-400', emoji: '✨👑' },
            { id: '大吉', label: 'スマイル大吉', color: 'bg-yellow-300', emoji: '🌻💛' },
            { id: '激吉', label: 'きゃらめる激吉', color: 'bg-pink-400', emoji: '🧸💖' },
            { id: '中吉', label: 'ぽかぽか中吉', color: 'bg-orange-300', emoji: '☀️🍵' },
            { id: '吉', label: 'ダンシング吉', color: 'bg-emerald-400', emoji: '🕺💚' },
            { id: 'あろはーず吉', label: 'まったり吉', color: 'bg-indigo-300', emoji: '🍬☘️' },
          ].map((spot) => {
            const hasCollected = collection.includes(spot.id);

            return (
              <div
                key={spot.id}
                className={`border-2 border-dark-charcoal p-3 rounded-2xl flex flex-col items-center justify-between aspect-square transition-all ${
                  hasCollected
                    ? `${spot.color} shadow-[2.5px_2.5px_0px_#4A2C2A] rotate-[-2deg] scale-[1.02]`
                    : 'bg-stone-100 opacity-60 line-through'
                }`}
              >
                <div className="text-center">
                  <span className="text-[10px] b-full font-black text-dark-charcoal tracking-wide bg-white/60 px-1.5 py-0.2 rounded-full block border border-dark-charcoal/20">
                    {spot.id}
                  </span>
                </div>

                <div className="my-2.5 text-2xl">
                  {hasCollected ? spot.emoji.substring(2, 4) : '🔒'}
                </div>

                <p className="text-[10px] font-black text-dark-charcoal text-center leading-tight">
                  {hasCollected ? spot.label : '未獲得...'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Letters/Unlocks indicator message below */}
        <div className="mt-5 pt-4 border-t-2 border-dashed border-dark-charcoal/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs font-black text-dark-charcoal">
              {isComplete ? (
                <span className="text-brand-pink flex items-center gap-1.5 justify-center md:justify-start">
                  🎉 おめでとうございます！おみくじ図鑑が全種コンプリートされました！
                </span>
              ) : (
                <span className="text-dark-charcoal/70 flex items-center gap-1 justify-center md:justify-start">
                  <Star size={12} className="text-brand-orange" /> 6つの運勢をすべて1度以上引くと、2人から手書きの手紙（ファンレターのお返し）が届くよ！
                </span>
              )}
            </p>
            <p className="text-[10px] text-stone-500 font-semibold mt-0.5">
              ※ 何度も弾いてすべての運を呼び寄せてね。
            </p>
          </div>

          {/* Special Letter Reveal clicker */}
          {isComplete ? (
            <button
              onClick={() => {
                if (!visitorName) {
                  setShowNameModal(true);
                } else {
                  const nextShow = !showLetter;
                  setShowLetter(nextShow);
                  if (nextShow) {
                    triggerConfetti();
                  }
                }
              }}
              className="px-5 py-2.5 bg-brand-yellow hover:bg-yellow-400 text-dark-charcoal font-black text-xs rounded-2xl border-3 border-dark-charcoal shadow-[3px_3px_0px_#4A2C2A] hover:-translate-y-0.5 active:translate-y-0 duration-150 cursor-pointer flex items-center gap-2"
            >
              <Mail className="animate-bounce" size={16} />
              {showLetter ? '手紙を折りたたむ 💌' : '２人からの大事なお手紙を開く！ 💌'}
            </button>
          ) : (
            <button
              disabled
              className="px-5 py-2.5 bg-zinc-200 border-2 border-dashed border-zinc-400 text-zinc-400 font-black text-xs rounded-2xl flex items-center gap-1.5 cursor-not-allowed"
            >
              <Lock size={14} /> ２人からの手紙（コンプでロック解除）
            </button>
          )}
        </div>
      </div>

      {/* HEARFELT WRITTEN LETTER REVEAL FRAME */}
      <AnimatePresence>
        {isComplete && showLetter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 16, stiffness: 120 }}
            className="bg-[#FFFDF4] border-4 border-dark-charcoal rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#4A2C2A] relative overflow-hidden"
          >
            {/* Scrapbook lace decoration */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-brand-pink/20" />
            
            {/* Left tape sticker decoration */}
            <div className="absolute top-4 left-6 bg-brand-pink/40 border border-dark-charcoal/20 w-16 h-6 rotate-[-10deg] shadow-sm z-10 pointer-events-none"></div>
            {/* Right tape sticker decoration */}
            <div className="absolute top-4 right-6 bg-brand-orange/40 border border-dark-charcoal/20 w-16 h-6 rotate-[8deg] shadow-sm z-10 pointer-events-none"></div>

            <div className="text-center pt-4 pb-4 mb-6 border-b-2 border-dashed border-dark-charcoal/20">
              <span className="text-2xl">💌</span>
              <h3 className="text-xl md:text-2xl font-display font-black text-dark-charcoal mt-1">
                すまいる＆きゃらめるからの愛のコンプリートレター
              </h3>
              <p className="text-[10px] text-brand-pink font-semibold font-mono tracking-wider mt-0.5">
                SPECIAL REWARD LETTER FROM ALOHA-Z FOR ALL-CLEARED FANS
              </p>
            </div>

            {/* Simulated cute lined notebook papers with custom handwritten remarks */}
            <div className="bg-white border-2 border-dark-charcoal rounded-2xl p-6 md:p-8 relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.04)]">
              {/* Notebook binding rings deco */}
              <div className="absolute top-4 inset-x-0 h-1 flex justify-around pointer-events-none px-12">
                <div className="w-1.5 h-4 bg-stone-300 rounded"></div>
                <div className="w-1.5 h-4 bg-stone-300 rounded"></div>
                <div className="w-1.5 h-4 bg-stone-300 rounded"></div>
                <div className="w-1.5 h-4 bg-stone-300 rounded"></div>
              </div>

              {/* Recipient Display and Edit name button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 mb-6 bg-amber-50/50 border-2 border-dashed border-brand-orange/20 rounded-2xl pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍭</span>
                  <p className="text-xs font-black text-dark-charcoal">
                    このお手紙は <span className="text-sm text-brand-pink font-extrabold underline decoration-2 decoration-brand-yellow underline-offset-2">{visitorName || 'あなた'}</span> さん宛てに書かれています
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTempName(visitorName);
                    setShowNameModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-dark-charcoal text-[11px] font-black rounded-xl border-2 border-dark-charcoal shadow-[2px_2px_0px_#4A2C2A] flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:translate-y-0.5"
                >
                  ✏️ 宛名を変更する
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* Smile Side message */}
                <div className="space-y-3 md:border-r border-dashed border-dark-charcoal/20 md:pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌻</span>
                    <h5 className="text-sm font-black text-brand-orange-650 bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
                      すまいる より 🌻
                    </h5>
                  </div>
                  
                  <p className="text-xs md:text-sm text-dark-charcoal font-bold leading-relaxed whitespace-pre-line tracking-wide">
                    {smileLetterText}
                  </p>
                </div>

                {/* Caramel Side message */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧸</span>
                    <h5 className="text-sm font-black text-brand-pink bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/20">
                      きゃらめる より 🧸
                    </h5>
                  </div>

                  <p className="text-xs md:text-sm text-dark-charcoal font-bold leading-relaxed whitespace-pre-line tracking-wide">
                    {caramelLetterText}
                  </p>
                </div>

              </div>

              {/* Hand-made deco drawings */}
              <div className="flex justify-between items-center. mt-8 pt-4 border-t border-dashed border-dark-charcoal/20">
                <span className="text-[10px] font-bold text-stone-400 font-mono">
                  ALOHAZ-FANTRIBUTE-LETTER // MAY 2026
                </span>
                
                <div className="flex gap-2">
                  <div className="bg-brand-yellow font-black text-[9px] px-3 py-1 rounded-full border border-dark-charcoal shadow-sm rotate-[4deg]">
                    💛 SMILE 100%
                  </div>
                  <div className="bg-brand-pink text-white font-black text-[9px] px-3 py-1 rounded-full border border-dark-charcoal shadow-sm rotate-[-3deg]">
                    💗 CARAMEL 100%
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom floating sticker style */}
            <div className="absolute -bottom-1 right-2 text-3xl rotate-12 opacity-80 select-none pointer-events-none">
              💎🌈
            </div>
            <div className="absolute bottom-2 left-2 text-2xl -rotate-12 opacity-85 select-none pointer-events-none">
              🍩✨
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUTE NAME INPUT MODAL OVERLAY */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-dark-charcoal rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_#4A2C2A] text-center relative overflow-hidden"
            >
              {/* Decorative sweet sparkles */}
              <div className="absolute top-2 right-2 text-2xl">✨</div>
              <div className="absolute bottom-2 left-2 text-2xl">🍭</div>

              <span className="text-4xl block mb-2">🎁</span>
              <h3 className="text-xl font-display font-black text-dark-charcoal mb-2">
                お名前を教えてね！
              </h3>
              <p className="text-xs text-dark-charcoal/70 font-semibold mb-6">
                すまいるときゃらめるが、あなたのために心を込めて、お名前を呼ぶ特別な手紙をお届けします💌
              </p>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  maxLength={15}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="お名前、ニックネームなど"
                  className="w-full px-4 py-3 border-3 border-dark-charcoal rounded-2xl font-sans font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink text-center placeholder-stone-400 bg-stone-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) {
                      saveAndOpenLetter();
                    }
                  }}
                />
                <p className="text-[10px] text-stone-500 font-bold">
                  ※ 15文字以内で入力してね♪ あとから何度でも変更できます。
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-dark-charcoal font-black text-xs rounded-xl border-2 border-dark-charcoal transition-transform active:scale-95 cursor-pointer"
                >
                  キャンセル 閉じる
                </button>
                <button
                  disabled={!tempName.trim()}
                  onClick={saveAndOpenLetter}
                  className="flex-1 py-2.5 bg-brand-pink text-white font-black text-xs rounded-xl border-2 border-dark-charcoal shadow-[2.5px_2.5px_0px_#4A2C2A] hover:-translate-y-0.5 active:translate-y-0 duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock size={12} /> お手紙を開く！ ✨
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
