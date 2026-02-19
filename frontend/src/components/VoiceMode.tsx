'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Trash2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChat, ChatHistoryItem } from '@/services/api';

interface VoiceMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', speechCode: 'de-DE' },
  { code: 'hi', name: 'Hindi', speechCode: 'hi-IN' },
  { code: 'ja', name: 'Japanese', speechCode: 'ja-JP' },
  { code: 'zh', name: 'Chinese', speechCode: 'zh-CN' },
  { code: 'ru', name: 'Russian', speechCode: 'ru-RU' },
  { code: 'ar', name: 'Arabic', speechCode: 'ar-SA' },
];

const VoiceMode = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldBeListeningRef = useRef(false);
  const transcriptRef = useRef('');

  // Keep transcriptRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      window.speechSynthesis?.cancel();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startVolumeMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setVolume(avg / 128); // normalize 0-1
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch {
      // Microphone access may already be granted via recognition
    }
  };

  const stopVolumeMonitor = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  };

  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES.find(l => l.code === language)?.speechCode || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // These are non-fatal, silently handled — recognition will auto-restart via onend
      const silentErrors = ['no-speech', 'aborted'];
      if (silentErrors.includes(event.error)) {
        return;
      }
      // Fatal errors — stop listening
      shouldBeListeningRef.current = false;
      setError(`Microphone error: ${event.error === 'not-allowed' ? 'Permission denied. Please allow microphone access.' : event.error}`);
      setIsListening(false);
      stopVolumeMonitor();
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped
      if (shouldBeListeningRef.current) {
        try {
          const newRecognition = createRecognition();
          if (newRecognition) {
            recognitionRef.current = newRecognition;
            newRecognition.start();
          }
        } catch {
          shouldBeListeningRef.current = false;
          setIsListening(false);
          stopVolumeMonitor();
        }
        return;
      }
      setIsListening(false);
      stopVolumeMonitor();
    };

    return recognition;
  };

  const startListening = () => {
    setError(null);
    
    // Cancel any ongoing speech
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const recognition = createRecognition();
    if (!recognition) return;

    shouldBeListeningRef.current = true;
    recognitionRef.current = recognition;
    setTranscript('');
    startVolumeMonitor();
    recognition.start();
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopVolumeMonitor();

    // If we have a transcript, send it
    const currentTranscript = transcriptRef.current;
    if (currentTranscript.trim()) {
      handleSendVoiceMessage(currentTranscript.trim());
    }
  };

  const handleSendVoiceMessage = async (text: string) => {
    const userMsg: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setTranscript('');
    setIsProcessing(true);

    try {
      const history: ChatHistoryItem[] = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await sendChat(text, history, language);
      
      const aiMsg: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // Auto-speak the response
      if (autoSpeak) {
        speakText(response.response);
      }
    } catch (err) {
      console.error('Voice chat error:', err);
      const errorMsg: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langConfig = LANGUAGES.find(l => l.code === language);
    utterance.lang = langConfig?.speechCode || 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setTranscript('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // Pulsing ring scale based on volume
  const ringScale = 1 + volume * 0.4;

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto glass-panel overflow-hidden relative shadow-2xl rounded-2xl">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : isProcessing ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.4)]`} />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              Voice Mode <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">Live</span>
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isSpeaking ? 'Speaking...' : 'Ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-800/60 pl-3 pr-2 py-1.5 rounded-xl border border-white/5">
            <Globe className="w-4 h-4 text-purple-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 border-none focus:ring-0 cursor-pointer outline-none w-24 appearance-none py-1"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`p-2.5 rounded-xl border transition-all ${
              autoSpeak 
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                : 'bg-slate-800/40 border-white/5 text-slate-500'
            }`}
            title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear */}
          <button
            onClick={clearConversation}
            className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/20 transition-all"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !isListening && !transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/5 flex items-center justify-center mb-6">
              <Mic className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Voice Conversation</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Press the microphone button to start speaking. Your voice will be transcribed and sent to LinguaSphere AI, which will respond back in voice.
            </p>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="px-3 py-1.5 rounded-full bg-slate-800/40 border border-white/5">🎙️ Speak naturally</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-800/40 border border-white/5">🌍 Multilingual</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-800/40 border border-white/5">🔊 Auto-reply</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl rounded-tr-sm border border-purple-500/50'
                  : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm border border-white/5'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                <div className={`flex items-center gap-2 mt-1.5 text-[11px] ${
                  msg.role === 'user' ? 'text-purple-200/60 justify-end' : 'text-slate-400/60'
                }`}>
                  <span>{msg.timestamp}</span>
                  {msg.role === 'ai' && (
                    <button 
                      onClick={() => speakText(msg.content)}
                      className="hover:text-purple-400 transition-colors ml-1"
                      title="Replay"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] px-5 py-3 bg-purple-600/30 text-purple-200 rounded-2xl rounded-tr-sm border border-purple-500/30 border-dashed">
              <p className="text-[15px] leading-relaxed italic">{transcript}</p>
              <p className="text-[10px] text-purple-300/40 mt-1 text-right">transcribing...</p>
            </div>
          </motion.div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/40 px-6 py-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-2"
          >
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Control Area */}
      <div className="p-8 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl flex flex-col items-center gap-4">
        
        {/* Mic Button with Volume Ring */}
        <div className="relative">
          {/* Outer pulsing rings */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-[-16px] rounded-full border-2 border-red-500/30"
                animate={{ scale: [1, ringScale + 0.1], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-[-8px] rounded-full border-2 border-red-500/20"
                animate={{ scale: [1, ringScale], opacity: [0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}

          {/* Speaking animation */}
          {isSpeaking && (
            <motion.div
              className="absolute inset-[-12px] rounded-full border-2 border-purple-500/30"
              animate={{ scale: [1, 1.15], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Glow */}
          <div className={`absolute inset-[-6px] rounded-full transition-all duration-500 ${
            isListening ? 'bg-red-500/20 blur-xl' : isSpeaking ? 'bg-purple-500/20 blur-xl' : 'bg-transparent'
          }`} />

          <motion.button
            onClick={toggleMic}
            disabled={isProcessing}
            whileTap={{ scale: 0.95 }}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30 ring-4 ring-red-500/20'
                : isProcessing
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-br from-purple-500 to-blue-600 shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          {isListening 
            ? 'Tap to stop & send'
            : isProcessing
              ? 'Processing your message...'
              : isSpeaking
                ? 'AI is speaking...'
                : 'Tap to start speaking'
          }
        </p>

        {/* Stop Speaking button */}
        {isSpeaking && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={stopSpeaking}
            className="px-4 py-2 rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800"
          >
            Stop Speaking
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;
