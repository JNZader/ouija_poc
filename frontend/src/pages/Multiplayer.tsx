import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Lock } from 'lucide-react';

export const Multiplayer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mystical-gradient p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-mystical-purple transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>
      </div>

      {/* Coming Soon */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-8xl mb-8"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            👥
          </motion.div>

          <h1 className="text-6xl font-mystical text-mystical-purple mb-6">
            Modo Multijugador
          </h1>

          <div className="glass-effect p-12 rounded-3xl border-2 border-mystical-purple/30 mb-8">
            <Users className="w-20 h-20 mx-auto mb-6 text-mystical-gold" />

            <h2 className="text-3xl font-mystical text-mystical-gold mb-4">
              Próximamente
            </h2>

            <p className="text-xl text-gray-300 mb-6">
              Pronto podrás unirte a salas multijugador para invocar espíritus junto a otros usuarios.
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
              <div className="bg-mystical-dark/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-mystical-purple mb-2 flex items-center gap-2">
                  <span>🎭</span>
                  Salas Públicas
                </h3>
                <p className="text-gray-400">
                  Únete a salas abiertas con otros usuarios y experimenta sesiones grupales.
                </p>
              </div>

              <div className="bg-mystical-dark/50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-mystical-purple" />
                  <h3 className="text-lg font-semibold text-mystical-purple">
                    Salas Privadas
                  </h3>
                </div>
                <p className="text-gray-400">
                  Crea salas privadas con código de acceso para jugar con tus amigos.
                </p>
              </div>

              <div className="bg-mystical-dark/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-mystical-purple mb-2 flex items-center gap-2">
                  <span>💬</span>
                  Chat Grupal
                </h3>
                <p className="text-gray-400">
                  Comunícate con otros participantes mientras el espíritu responde.
                </p>
              </div>

              <div className="bg-mystical-dark/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-mystical-purple mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  Votación Grupal
                </h3>
                <p className="text-gray-400">
                  Los participantes votan las preguntas más interesantes para hacerle al espíritu.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            className="text-mystical-gold"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-lg">
              ✨ Esta función estará disponible en una futura actualización ✨
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
