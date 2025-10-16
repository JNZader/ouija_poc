import type { Spirit } from '../types';

export const SPIRITS: Spirit[] = [
  {
    id: 'morgana',
    name: 'Morgana la Sabia',
    personality: 'wise',
    description: 'Un espíritu sereno y compasivo que ofrece sabiduría ancestral y guía espiritual.',
  },
  {
    id: 'azazel',
    name: 'Azazel el Críptico',
    personality: 'cryptic',
    description: 'Un ser enigmático y filosófico que habla en acertijos y metáforas profundas.',
  },
  {
    id: 'lilith',
    name: 'Lilith la Sombra',
    personality: 'dark',
    description: 'Una presencia sombría y melancólica que revela verdades oscuras del más allá.',
  },
  {
    id: 'puck',
    name: 'Puck el Travieso',
    personality: 'playful',
    description: 'Un espíritu juguetón y caprichoso que disfruta de bromas y adivinanzas.',
  },
];

export const OUIJA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const OUIJA_NUMBERS = '0123456789'.split('');
export const OUIJA_CONTROLS = ['YES', 'NO', 'GOODBYE'];

export const MYSTICAL_EMOJIS = ['✨', '🔮', '👻', '🌙', '⭐', '💫', '🕯️', '🎭'];

export const COLOR_SCHEMES = {
  wise: {
    primary: 'from-blue-600 to-purple-600',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-400',
  },
  cryptic: {
    primary: 'from-purple-600 to-pink-600',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-400',
  },
  dark: {
    primary: 'from-red-600 to-purple-900',
    glow: 'shadow-red-500/50',
    text: 'text-red-400',
  },
  playful: {
    primary: 'from-green-500 to-teal-500',
    glow: 'shadow-green-500/50',
    text: 'text-green-400',
  },
};
