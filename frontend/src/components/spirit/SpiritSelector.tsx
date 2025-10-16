import { motion } from 'framer-motion';
import { Ghost, Sparkles, Moon, Smile } from 'lucide-react';
import type { Spirit } from '../../types';
import { COLOR_SCHEMES } from '../../utils/constants';

interface SpiritSelectorProps {
  spirits: Spirit[];
  selectedSpirit: Spirit | null;
  onSelectSpirit: (spirit: Spirit) => void;
}

const SPIRIT_ICONS = {
  wise: Sparkles,
  cryptic: Moon,
  dark: Ghost,
  playful: Smile,
};

export const SpiritSelector = ({
  spirits,
  selectedSpirit,
  onSelectSpirit,
}: SpiritSelectorProps) => {
  const SpiritCard = ({ spirit }: { spirit: Spirit }) => {
    const Icon = SPIRIT_ICONS[spirit.personality];
    const colors = COLOR_SCHEMES[spirit.personality];
    const isSelected = selectedSpirit?.id === spirit.id;

    return (
      <motion.div
        className={`
          relative p-6 rounded-2xl cursor-pointer
          transition-all duration-300
          ${
            isSelected
              ? 'bg-gradient-to-br ' + colors.primary + ' shadow-2xl ' + colors.glow
              : 'bg-mystical-dark/50 hover:bg-mystical-dark/70 border border-mystical-purple/30'
          }
        `}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectSpirit(spirit)}
        layoutId={`spirit-${spirit.id}`}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selection"
            className="absolute inset-0 rounded-2xl border-4 border-white/50"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <motion.div
            className={`
              p-4 rounded-full
              ${isSelected ? 'bg-white/20' : 'bg-mystical-purple/20'}
            `}
            animate={
              isSelected
                ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className={`w-12 h-12 ${isSelected ? 'text-white' : colors.text}`} />
          </motion.div>
        </div>

        {/* Name */}
        <h3 className={`
          text-2xl font-mystical text-center mb-2
          ${isSelected ? 'text-white' : 'text-gray-200'}
        `}>
          {spirit.name}
        </h3>

        {/* Personality Badge */}
        <div className="flex justify-center mb-3">
          <span className={`
            px-3 py-1 rounded-full text-xs font-semibold uppercase
            ${isSelected ? 'bg-white/20 text-white' : 'bg-mystical-purple/20 ' + colors.text}
          `}>
            {spirit.personality}
          </span>
        </div>

        {/* Description */}
        <p className={`
          text-sm text-center
          ${isSelected ? 'text-white/90' : 'text-gray-400'}
        `}>
          {spirit.description}
        </p>

        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 text-2xl opacity-20">
          {isSelected ? '✨' : '👻'}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <motion.h2
          className="text-4xl font-mystical text-mystical-purple mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Elige tu Espíritu Guía
        </motion.h2>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Cada espíritu tiene su propia personalidad y forma de comunicarse
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {spirits.map((spirit, index) => (
          <motion.div
            key={spirit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SpiritCard spirit={spirit} />
          </motion.div>
        ))}
      </div>

      {selectedSpirit && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-mystical-gold text-lg">
            Has seleccionado a <span className="font-mystical font-bold">{selectedSpirit.name}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
};
