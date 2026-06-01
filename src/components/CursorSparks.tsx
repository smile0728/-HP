import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Spark {
  id: number;
  createdAt: number;
  x: number;
  y: number;
  character: string;
  color: string;
  size: number;
  angle: number;
}

const SHAPES = ['🍬', '✨', '🌻', '🧸', '🍭', '🎀', '⭐', '🧡', '🩷'];
const COLORS = ['#FF9E00', '#FFD000', '#FF6B8B', '#FFA5A5', '#A26BFF', '#74E5FF'];

export default function CursorSparks() {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    let sparkId = 0;

    const handleClick = (e: MouseEvent) => {
      const createdAt = Date.now();
      const burst: Spark[] = [];
      for (let i = 0; i < 6; i++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = Math.floor(Math.random() * 16) + 16;
        const angle = Math.random() * 360;

        burst.push({
          id: sparkId++,
          createdAt,
          x: e.clientX,
          y: e.clientY + window.scrollY,
          character: shape,
          color,
          size,
          angle,
        });
      }
      setSparks((prev) => [...prev.slice(-25), ...burst]);
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    if (sparks.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setSparks((prev) => prev.filter((spark) => now - spark.createdAt < 1200));
    }, 300);
    return () => clearInterval(interval);
  }, [sparks]);

  return (
    <div className="pointer-events-none absolute top-0 left-0 z-[9999] w-full h-full overflow-hidden">
      <AnimatePresence>
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            initial={{
              opacity: 1,
              scale: 0.3,
              x: spark.x,
              y: spark.y,
              rotate: spark.angle,
            }}
            animate={{
              opacity: 0,
              scale: 1.4,
              x: spark.x + (Math.random() - 0.5) * 80,
              y: spark.y - 120 - Math.random() * 80,
              rotate: spark.angle + 180,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              fontSize: `${spark.size}px`,
              textShadow: `0 2px 4px rgba(0,0,0,0.1)`,
            }}
          >
            {spark.character}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
