import { apiClient } from './config';
import type { Spirit, OuijaSession, SessionMessage } from '../../types';

export const spiritService = {
  // Get all available spirits
  getAllSpirits: async (): Promise<Spirit[]> => {
    const response = await apiClient.get<Spirit[]>('/api/spirits');
    return response.data;
  },

  // Get spirit by ID
  getSpiritById: async (id: string): Promise<Spirit> => {
    const response = await apiClient.get<Spirit>(`/api/spirits/${id}`);
    return response.data;
  },

  // Create a new session with a spirit
  createSession: async (spiritId: string): Promise<OuijaSession> => {
    const response = await apiClient.post<OuijaSession>('/api/ouija/sessions', {
      spiritId,
    });
    return response.data;
  },

  // Get session by ID
  getSession: async (sessionId: string): Promise<OuijaSession> => {
    const response = await apiClient.get<OuijaSession>(`/api/ouija/sessions/${sessionId}`);
    return response.data;
  },

  // Get session messages
  getSessionMessages: async (sessionId: string): Promise<SessionMessage[]> => {
    const response = await apiClient.get<SessionMessage[]>(`/api/ouija/sessions/${sessionId}/messages`);
    return response.data;
  },

  // Send message to spirit
  sendMessage: async (sessionId: string, content: string): Promise<SessionMessage> => {
    const response = await apiClient.post<SessionMessage>(
      `/api/ouija/sessions/${sessionId}/messages`,
      { content }
    );
    return response.data;
  },

  // End session
  endSession: async (sessionId: string): Promise<void> => {
    await apiClient.patch(`/api/ouija/sessions/${sessionId}/end`);
  },
};
