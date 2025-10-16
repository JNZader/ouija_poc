import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import type { SessionMessage } from '../../types';
import { useOuijaStore } from '../../store/useOuijaStore';

interface ChatInterfaceProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChatInterface = ({ onSendMessage, isLoading }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sessionMessages, selectedSpirit } = useOuijaStore();

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const MessageBubble = ({ msg }: { msg: SessionMessage }) => {
    const isSpirit = msg.sender === 'spirit';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex ${isSpirit ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div
          className={`
            max-w-[70%] px-4 py-3 rounded-2xl
            ${
              isSpirit
                ? 'bg-gradient-to-br from-mystical-purple/30 to-mystical-purple/10 border border-mystical-purple/50'
                : 'bg-gradient-to-br from-mystical-gold/30 to-mystical-gold/10 border border-mystical-gold/50'
            }
            glass-effect
          `}
        >
          {isSpirit && (
            <div className="text-xs text-mystical-purple font-semibold mb-1">
              {selectedSpirit?.name || 'Spirit'}
            </div>
          )}
          <div className="text-gray-100 whitespace-pre-wrap">{msg.content}</div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-mystical-dark/50 rounded-2xl border border-mystical-purple/30 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-mystical-purple/20 to-mystical-purple/10 border-b border-mystical-purple/30">
        <h3 className="text-xl font-mystical text-mystical-purple flex items-center gap-2">
          <span className="animate-pulse">🔮</span>
          Conversación Mística
        </h3>
        {selectedSpirit && (
          <p className="text-sm text-gray-400 mt-1">
            Conectado con {selectedSpirit.name}
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        <AnimatePresence>
          {sessionMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="text-6xl mb-4 animate-float">👻</div>
              <p className="text-gray-400 text-lg">
                El espíritu aguarda tu pregunta...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Escribe algo para comenzar la conversación
              </p>
            </motion.div>
          ) : (
            sessionMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-mystical-purple/30 to-mystical-purple/10 border border-mystical-purple/50 glass-effect">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-mystical-purple" />
                <span className="text-gray-400 text-sm">El espíritu está pensando...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 bg-mystical-dark/80 border-t border-mystical-purple/30">
        <div className="flex gap-3 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta para el espíritu..."
            className="
              flex-1 px-4 py-3 rounded-xl resize-none
              bg-mystical-darker/80 border border-mystical-purple/30
              text-gray-100 placeholder-gray-500
              focus:outline-none focus:border-mystical-purple/50 focus:ring-2 focus:ring-mystical-purple/20
              transition-all duration-300
            "
            rows={2}
            disabled={isSending}
          />
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className={`
              p-3 rounded-xl transition-all duration-300
              ${
                message.trim() && !isSending
                  ? 'bg-gradient-to-r from-mystical-purple to-mystical-purple-dark hover:shadow-lg hover:shadow-mystical-purple/50'
                  : 'bg-gray-700 cursor-not-allowed'
              }
            `}
            whileHover={message.trim() && !isSending ? { scale: 1.05 } : {}}
            whileTap={message.trim() && !isSending ? { scale: 0.95 } : {}}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            ) : (
              <Send className="w-5 h-5 text-gray-100" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
