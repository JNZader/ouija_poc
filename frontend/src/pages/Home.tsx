import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ghost, Users, Sparkles } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const modes = [
    {
      id: 'solo',
      title: 'Sesión Individual',
      icon: Ghost,
      description: 'Habla con un espíritu en privado',
      path: '/session',
      gradient: 'from-purple-600 to-pink-600',
      glow: 'shadow-purple-500/50',
    },
    {
      id: 'multi',
      title: 'Sala Multijugador',
      icon: Users,
      description: 'Únete a otros para invocar espíritus',
      path: '/multiplayer',
      gradient: 'from-blue-600 to-purple-600',
      glow: 'shadow-blue-500/50',
    },
  ];

  return (
    <div className="min-h-screen mystical-gradient flex items-center justify-center p-8">
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-mystical-purple/20 text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          >
            🔮
          </motion.div>

          <h1 className="text-7xl font-mystical text-transparent bg-clip-text bg-gradient-to-r from-mystical-purple via-mystical-gold to-mystical-purple mb-4">
            Ouija Virtual
          </h1>

          <p className="text-2xl text-gray-300">
            Conecta con el más allá en una experiencia mística interactiva
          </p>

          <motion.div
            className="mt-6 flex items-center justify-center gap-2 text-mystical-gold"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Experimenta lo sobrenatural</span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </motion.div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {modes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <motion.button
                onClick={() => navigate(mode.path)}
                className={`
                  relative w-full p-8 rounded-3xl
                  bg-gradient-to-br ${mode.gradient}
                  overflow-hidden group
                  transition-all duration-500
                  ${hoveredMode === mode.id ? 'shadow-2xl ' + mode.glow : 'shadow-lg'}
                `}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={
                    hoveredMode === mode.id
                      ? {
                          background: [
                            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <mode.icon className="w-16 h-16 mx-auto mb-4 text-white" />

                  <h2 className="text-3xl font-mystical text-white mb-3">
                    {mode.title}
                  </h2>

                  <p className="text-white/80 text-lg">
                    {mode.description}
                  </p>

                  <motion.div
                    className="mt-6 inline-flex items-center gap-2 text-white/90 font-semibold"
                    animate={
                      hoveredMode === mode.id
                        ? { x: [0, 10, 0] }
                        : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Comenzar
                    <span>→</span>
                  </motion.div>
                </div>

                {/* Corner Decorations */}
                <div className="absolute top-4 left-4 text-white/20 text-3xl">✧</div>
                <div className="absolute top-4 right-4 text-white/20 text-3xl">✧</div>
                <div className="absolute bottom-4 left-4 text-white/20 text-3xl">✧</div>
                <div className="absolute bottom-4 right-4 text-white/20 text-3xl">✧</div>
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          className="text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>✨ Utiliza tu intuición y abre tu mente a lo desconocido ✨</p>
          <p className="mt-2">⚠️ Solo para entretenimiento. No tomar decisiones importantes basadas en las respuestas.</p>
        </motion.div>
      </div>
    </div>
  );
};
