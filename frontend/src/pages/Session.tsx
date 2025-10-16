import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SpiritSelector } from '../components/spirit/SpiritSelector';
import { OuijaBoard } from '../components/ouija/OuijaBoard';
import { ChatInterface } from '../components/chat/ChatInterface';
import { useOuijaStore } from '../store/useOuijaStore';
import { spiritService } from '../services/api/spiritService';
import { socketService } from '../services/socket/socketService';
import { SPIRITS } from '../utils/constants';
import type { SessionMessage } from '../types';

type SessionStep = 'select-spirit' | 'session-active';

export const Session = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<SessionStep>('select-spirit');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  const {
    selectedSpirit,
    setSelectedSpirit,
    currentSession,
    setCurrentSession,
    addMessage,
    setMessages,
    clearSession,
    setConnecting,
    setError,
  } = useOuijaStore();

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        setConnecting(true);
        await socketService.connect();
        setConnecting(false);

        // Setup message listener
        socketService.onMessageReceived((message: SessionMessage) => {
          addMessage(message);
          setIsLoadingMessage(false);
        });
      } catch (error) {
        console.error('Socket connection error:', error);
        setError('No se pudo conectar con el servidor');
        setConnecting(false);
      }
    };

    initSocket();

    return () => {
      if (currentSession) {
        socketService.leaveSession(currentSession.id);
      }
      socketService.disconnect();
    };
  }, []);

  const handleStartSession = async () => {
    if (!selectedSpirit) return;

    try {
      setConnecting(true);

      // Create session via API
      const session = await spiritService.createSession(selectedSpirit.id);
      setCurrentSession(session);

      // Join session via socket
      await socketService.joinSession(session.id);

      // Load previous messages if any
      const messages = await spiritService.getSessionMessages(session.id);
      setMessages(messages);

      setStep('session-active');
      setConnecting(false);
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Error al iniciar la sesión');
      setConnecting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    try {
      setIsLoadingMessage(true);

      // Send via API
      const userMessage = await spiritService.sendMessage(currentSession.id, content);
      addMessage(userMessage);

      // Spirit response will come via socket
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error al enviar el mensaje');
      setIsLoadingMessage(false);
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;

    try {
      await spiritService.endSession(currentSession.id);
      await socketService.leaveSession(currentSession.id);
      clearSession();
      setStep('select-spirit');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

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

      <AnimatePresence mode="wait">
        {step === 'select-spirit' && (
          <motion.div
            key="select-spirit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto"
          >
            <SpiritSelector
              spirits={SPIRITS}
              selectedSpirit={selectedSpirit}
              onSelectSpirit={setSelectedSpirit}
            />

            {selectedSpirit && (
              <motion.div
                className="flex justify-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={handleStartSession}
                  className="btn-mystical text-xl px-12 py-4"
                >
                  Iniciar Sesión Mística
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 'session-active' && currentSession && (
          <motion.div
            key="session-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-7xl mx-auto"
          >
            {/* Session Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-mystical text-mystical-purple mb-2">
                Sesión con {selectedSpirit?.name}
              </h2>
              <p className="text-gray-400">
                Haz tus preguntas y espera la respuesta del más allá...
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Ouija Board */}
              <div className="flex items-center justify-center">
                <OuijaBoard isActive={true} />
              </div>

              {/* Right: Chat */}
              <div className="h-[600px]">
                <ChatInterface
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingMessage}
                />
              </div>
            </div>

            {/* End Session Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleEndSession}
                className="px-8 py-3 rounded-lg bg-red-600/80 hover:bg-red-600 transition-all duration-300 font-semibold"
              >
                Finalizar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {useOuijaStore.getState().isConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-mystical-purple animate-spin mx-auto mb-4" />
              <p className="text-2xl text-mystical-purple font-mystical">
                Conectando con el más allá...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
