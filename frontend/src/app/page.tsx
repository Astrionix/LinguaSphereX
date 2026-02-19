'use client';

import { useState, useCallback } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { useChatHistory, ChatMessage } from '@/hooks/useChatHistory';

export default function Home() {
  const [currentView, setCurrentView] = useState('chat');
  const {
    sessions,
    activeSession,
    activeSessionId,
    isLoaded,
    createNewChat,
    updateSession,
    deleteSession,
    selectSession,
  } = useChatHistory();

  const handleNewChat = useCallback(() => {
    createNewChat();
    setCurrentView('chat');
  }, [createNewChat]);

  const handleSelectChat = useCallback((sessionId: string) => {
    selectSession(sessionId);
    setCurrentView('chat');
  }, [selectSession]);

  const handleMessagesChange = useCallback((messages: ChatMessage[]) => {
    if (activeSessionId) {
      updateSession(activeSessionId, messages);
    }
  }, [activeSessionId, updateSession]);

  // Auto-create first chat if none exist
  if (isLoaded && sessions.length === 0 && currentView === 'chat') {
    createNewChat();
  }

  return (
    <div className="fixed inset-0 flex bg-[#020617] text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-blue-900/10 rounded-full blur-[80px] animate-pulse-glow" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full h-full p-4 gap-4">
        <Sidebar
          currentView={currentView}
          onNewChat={handleNewChat}
          chatSessions={sessions}
          activeSessionId={activeSessionId}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteSession}
        />
        
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {activeSession && (
            <ChatInterface
              key={activeSessionId}
              initialMessages={activeSession.messages}
              onMessagesChange={handleMessagesChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
