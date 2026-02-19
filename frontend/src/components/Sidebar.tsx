import { useState } from 'react';
import { MessageSquare, Globe, Plus, Trash2, Settings, LogOut, ChevronUp } from 'lucide-react';
import { ChatSession } from '@/hooks/useChatHistory';

interface SidebarProps {
  currentView: string;
  onNewChat: () => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
}

const Sidebar = ({ currentView, onNewChat, chatSessions, activeSessionId, onSelectChat, onDeleteChat }: SidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 flex-col items-start p-4 transition-all duration-300 relative z-30 h-full rounded-2xl border-r border-white/5 bg-slate-900/40 backdrop-blur-xl">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 w-full px-2">
        <div className="bg-gradient-to-tr from-cyan-400 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform duration-300 cursor-pointer">
          <Globe className="w-6 h-6 text-white animate-pulse-glow" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-200 tracking-tight">
          LinguaSphere
        </h1>
      </div>

      {/* New Chat Button */}
      <button 
        onClick={onNewChat}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-start gap-3"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-semibold tracking-wide">New Chat</span>
      </button>

      {/* Chat History - scrollable */}
      <div className="flex-1 w-full overflow-y-auto pr-1 custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Recent Chats</div>
        <div className="flex flex-col gap-1">
          {chatSessions.length === 0 && (
            <p className="text-xs text-slate-600 px-3 py-4 text-center italic">No conversations yet</p>
          )}
          {chatSessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectChat(session.id)}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 group relative ${
                session.id === activeSessionId && currentView === 'chat'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate flex-1 font-medium">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* User Profile + Settings at Bottom */}
      <div className="mt-auto w-full pt-4 border-t border-white/5 relative">
        
        {/* Settings Popover */}
        {settingsOpen && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-3 border-b border-white/5">
              <p className="text-sm font-semibold text-slate-200">John Doe</p>
              <p className="text-[11px] text-slate-400">johndoe@email.com</p>
            </div>
            <div className="p-1.5">
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full bg-slate-800/40 p-3 rounded-xl border border-white/5 flex items-center gap-3 hover:bg-slate-800/60 transition-all cursor-pointer group hover:border-cyan-500/20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-transparent group-hover:ring-cyan-500/30 transition-all">
            JD
          </div>
          <div className="overflow-hidden flex-1 text-left">
            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">John Doe</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">Pro Plan</p>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${settingsOpen ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
