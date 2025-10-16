import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OUIJA_LETTERS, OUIJA_NUMBERS, OUIJA_CONTROLS } from '../../utils/constants';

interface OuijaBoardProps {
  isActive: boolean;
  currentLetter?: string;
  onLetterHover?: (letter: string) => void;
}

export const OuijaBoard = ({ isActive, currentLetter, onLetterHover }: OuijaBoardProps) => {
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [planchettePosition, setPlanchettePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (currentLetter) {
      // Animate planchette to current letter
      // This would calculate the position based on the letter
      // For now, just a simple animation
      setPlanchettePosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
      });
    }
  }, [currentLetter]);

  const LetterButton = ({ letter }: { letter: string }) => {
    const isActive = currentLetter === letter || hoveredLetter === letter;

    return (
      <motion.button
        className={`
          relative w-10 h-10 rounded-full font-mystical text-lg
          transition-all duration-300
          ${isActive ? 'text-mystical-gold scale-125 spirit-glow' : 'text-gray-400'}
          hover:text-mystical-purple hover:scale-110
        `}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => {
          setHoveredLetter(letter);
          onLetterHover?.(letter);
        }}
        onMouseLeave={() => setHoveredLetter(null)}
      >
        {letter}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-mystical-gold/20"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto ouija-board rounded-3xl p-8 shadow-2xl">
      {/* Mystical Glow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-mystical-purple/10 to-mystical-gold/10 animate-pulse-slow pointer-events-none" />

      {/* Top Decorative Arc */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="text-mystical-gold text-4xl"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ☽✧☾
        </motion.div>
      </div>

      {/* Letters Arc - Top */}
      <div className="flex justify-center items-center gap-1 mb-6">
        {OUIJA_LETTERS.slice(0, 13).map((letter) => (
          <LetterButton key={letter} letter={letter} />
        ))}
      </div>

      {/* Letters Arc - Bottom */}
      <div className="flex justify-center items-center gap-1 mb-8">
        {OUIJA_LETTERS.slice(13).map((letter) => (
          <LetterButton key={letter} letter={letter} />
        ))}
      </div>

      {/* Numbers */}
      <div className="flex justify-center items-center gap-2 mb-8">
        {OUIJA_NUMBERS.map((number) => (
          <LetterButton key={number} letter={number} />
        ))}
      </div>

      {/* YES and NO */}
      <div className="flex justify-between items-center px-12 mb-6">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
        >
          <div className={`
            px-8 py-4 rounded-full font-mystical text-2xl
            ${currentLetter === 'YES' ? 'text-green-400 spirit-glow' : 'text-gray-400'}
          `}>
            YES
          </div>
        </motion.div>

        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
        >
          <div className={`
            px-8 py-4 rounded-full font-mystical text-2xl
            ${currentLetter === 'NO' ? 'text-red-400 spirit-glow' : 'text-gray-400'}
          `}>
            NO
          </div>
        </motion.div>
      </div>

      {/* GOODBYE */}
      <div className="flex justify-center">
        <motion.div
          className={`
            px-12 py-4 rounded-full font-mystical text-2xl
            ${currentLetter === 'GOODBYE' ? 'text-mystical-purple spirit-glow' : 'text-gray-400'}
          `}
          whileHover={{ scale: 1.1 }}
        >
          GOODBYE
        </motion.div>
      </div>

      {/* Planchette */}
      {isActive && (
        <motion.div
          className="absolute w-20 h-20 pointer-events-none"
          style={{
            left: `${planchettePosition.x}%`,
            top: `${planchettePosition.y}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            {/* Planchette Shape */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full filter drop-shadow-2xl"
            >
              <path
                d="M 50 10 L 80 40 L 60 90 L 40 90 L 20 40 Z"
                fill="rgba(139, 92, 246, 0.3)"
                stroke="rgba(139, 92, 246, 0.8)"
                strokeWidth="2"
              />
              {/* Center Hole */}
              <circle
                cx="50"
                cy="50"
                r="15"
                fill="transparent"
                stroke="rgba(139, 92, 246, 1)"
                strokeWidth="3"
              />
            </svg>
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-mystical-purple/40 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 text-mystical-gold/30 text-2xl">✧</div>
      <div className="absolute top-4 right-4 text-mystical-gold/30 text-2xl">✧</div>
      <div className="absolute bottom-4 left-4 text-mystical-gold/30 text-2xl">✧</div>
      <div className="absolute bottom-4 right-4 text-mystical-gold/30 text-2xl">✧</div>
    </div>
  );
};
