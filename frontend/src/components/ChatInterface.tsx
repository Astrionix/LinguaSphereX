'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Sparkles, RefreshCcw, Copy, Check } from 'lucide-react';
import { sendChat } from '@/services/api';
import { motion } from 'framer-motion';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { ChatMessage } from '@/hooks/useChatHistory';

interface Message {
  role: 'user' | 'ai';
  content: string;
  language: string;
  original?: string;
  timestamp?: string;
  id: string;
}

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', speechCode: 'ar-SA' },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'ai',
  content: "Hello! I am **LinguaSphere**. How can I assist you today? I can understand and respond in many languages, and I can also help with code and technical questions!",
  language: 'en',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function ChatInterface({ initialMessages = [], onMessagesChange }: ChatInterfaceProps) {
  const getInitialMessages = (): Message[] => {
    if (initialMessages.length > 0) {
      return initialMessages.map(m => ({
        ...m,
        language: m.language || 'en',
      }));
    }
    return [WELCOME_MESSAGE];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const language = 'en';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Report message changes for persistence (skip welcome-only state)
  useEffect(() => {
    if (onMessagesChange) {
      const persistable = messages.filter(m => m.id !== 'welcome');
      if (persistable.length > 0) {
        onMessagesChange(messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          language: m.language,
          timestamp: m.timestamp || '',
        })));
      }
    }
  }, [messages, onMessagesChange]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  // Voice Input
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldBeVoiceListeningRef = useRef(false);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES.find(l => l.code === language)?.speechCode || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let accumulated = input;

    recognition.onstart = () => {
      setIsVoiceListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        accumulated += (accumulated ? ' ' : '') + finalTranscript;
        setInput(accumulated);
      } else if (interimTranscript) {
        setInput(accumulated + (accumulated ? ' ' : '') + interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (['no-speech', 'aborted'].includes(event.error)) return;
      shouldBeVoiceListeningRef.current = false;
      setIsVoiceListening(false);
    };

    recognition.onend = () => {
      if (shouldBeVoiceListeningRef.current) {
        try {
          recognition.start();
        } catch {
          shouldBeVoiceListeningRef.current = false;
          setIsVoiceListening(false);
        }
        return;
      }
      setIsVoiceListening(false);
    };

    shouldBeVoiceListeningRef.current = true;
    voiceRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    shouldBeVoiceListeningRef.current = false;
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      voiceRecognitionRef.current = null;
    }
    setIsVoiceListening(false);
  };

  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const toggleOriginal = (id: string) => {
    const newSet = new Set(showOriginalIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setShowOriginalIds(newSet);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsgId = Date.now().toString();
    const newMessage: Message = { 
      id: userMsgId,
      role: 'user', 
      content: input, 
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Prepare history for backend
      const history = messages.map(m => ({ 
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.original || m.content 
      }));
      
      const response = await sendChat(currentInput, history, language);
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        role: 'ai', 
        content: response.response, 
        original: response.original_response_en,
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        role: 'ai', 
        content: "I apologize, but I encountered a connection error. Please try again.", 
        language: 'en',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto glass-panel overflow-hidden relative shadow-2xl rounded-2xl">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.4)]`} />
             {loading && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />}
           </div>
           <div>
               <h2 className="font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                   LinguaSphere <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">Beta</span>
               </h2>
               <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Multilingual Intelligence</p>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'ai' && (
                    <div className="mt-1 mr-4 flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 transform group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}

                <div className={`relative max-w-[90%] md:max-w-[85%] lg:max-w-[75%]`}>
                    <div className={`
                        relative px-6 py-4 transition-all duration-200
                        ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}
                    `}>
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950/50 prose-pre:border prose-pre:border-white/5">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({inline, className, children, ...props}: {inline?: boolean, className?: string, children?: React.ReactNode}) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code my-4">
                                                <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), msg.id + '-code')}
                                                        className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-cyan-400 transition-all active:scale-90"
                                                        title="Copy Code"
                                                    >
                                                        {copiedId === msg.id + '-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                                <div className="text-[10px] absolute left-4 top-2 text-slate-500 font-mono uppercase tracking-wider">{match[1]}</div>
                                                <SyntaxHighlighter
                                                    {...props}
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    className="rounded-xl !bg-slate-950/50 !p-6 !pt-8 border border-white/5"
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300`} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {showOriginalIds.has(msg.id) && msg.original ? msg.original : msg.content}
                            </ReactMarkdown>
                        </div>
                        
                        {/* Metadata & Actions */}
                        <div className={`flex items-center gap-3 mt-3 pt-2 border-t border-white/5 text-[11px] opacity-70 ${msg.role === 'user' ? 'justify-end text-blue-100/60' : 'text-slate-400'}`}>
                            <span>{isClient ? (msg.timestamp || '') : ''}</span>
                            {msg.role === 'ai' && (
                                <>
                                    <span>•</span>
                                    <button 
                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                        className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                                        title="Copy full message"
                                    >
                                        {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        Copy
                                    </button>
                                    
                                    {msg.original && msg.original !== msg.content && (
                                        <>
                                            <span>•</span>
                                            <button 
                                                onClick={() => toggleOriginal(msg.id)}
                                                className={`transition-colors flex items-center gap-1 ${showOriginalIds.has(msg.id) ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
                                            >
                                                <RefreshCcw className={`w-3 h-3 ${showOriginalIds.has(msg.id) ? 'animate-spin-once' : ''}`} />
                                                {showOriginalIds.has(msg.id) ? 'Show Translation' : 'View English Original'}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ))}
        
        {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                {[
                    { label: "Translate 'Hello' to Spanish", icon: "🇪🇸" },
                    { label: "How do I write a Python function for RAG?", icon: "🐍" },
                    { label: "Business email in German", icon: "��" },
                    { label: "Explain quantum computing in simple Hindi", icon: "��" }
                ].map((suggestion, idx) => (
                    <motion.button 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        onClick={() => setInput(suggestion.label)}
                        className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 rounded-xl text-left transition-all hover:scale-[1.02] group"
                    >
                        <span className="text-2xl mb-2 block">{suggestion.icon}</span>
                        <span className="text-sm text-slate-300 group-hover:text-cyan-300 font-medium">{suggestion.label}</span>
                    </motion.button>
                ))}
            </div>
        )}

        {loading && (
             <div className="flex justify-start animate-pulse">
                <div className="mt-1 mr-4 flex-shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/5"></div>
                </div>
                <div className="bg-slate-800/40 px-6 py-5 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center backdrop-blur-md">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                </div>
             </div>
        )}
        <div className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl z-20">
        <div className="max-w-4xl mx-auto relative group">
            {/* Glow Effect */}
            <div className={`absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500 blur-lg ${
              isVoiceListening 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 opacity-20' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 group-focus-within:opacity-20'
            }`}></div>
            
            <div className={`relative flex gap-2 items-end bg-slate-900/90 rounded-2xl p-2 border shadow-2xl transition-all ${
              isVoiceListening 
                ? 'border-red-500/30' 
                : 'border-white/10 focus-within:border-cyan-500/30'
            }`}>
                
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={isVoiceListening ? '🎙️ Listening...' : `Ask anything in any language...`}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none py-3 pl-2 max-h-[150px] min-h-[48px] text-[15px] scrollbar-hide leading-relaxed"
                    rows={1}
                />

                {/* Voice Input Button */}
                <button 
                    onClick={toggleVoiceInput}
                    className={`p-3 rounded-xl transition-all active:scale-95 flex-shrink-0 ${
                      isVoiceListening
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/30 animate-pulse'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-purple-400'
                    }`}
                    title={isVoiceListening ? 'Stop voice input' : 'Voice input'}
                >
                    {isVoiceListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                {/* Send Button */}
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className={`
                        p-3 rounded-xl transition-all duration-300 flex-shrink-0
                        ${!input.trim() || loading 
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95'
                        }
                    `}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}
