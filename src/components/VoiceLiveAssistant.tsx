import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  AlertCircle, 
  Radio, 
  User, 
  Bot, 
  HelpCircle,
  Activity,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { ContractAnalysisResult, LiveVoiceTranscriptItem } from '../types';

interface VoiceLiveAssistantProps {
  currentAnalysis: ContractAnalysisResult | null;
}

export const VoiceLiveAssistant: React.FC<VoiceLiveAssistantProps> = ({
  currentAnalysis,
}) => {
  // Session states: idle | connecting | active | error
  const [sessionState, setSessionState] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [isListening, setIsListening] = useState(false); // User speaking into mic
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configuration options
  const [selectedVoice, setSelectedVoice] = useState<'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'>('Zephyr');
  const [selectedRole, setSelectedRole] = useState<'advisor' | 'negotiator' | 'simplifier'>('advisor');
  const [includeDocumentContext, setIncludeDocumentContext] = useState(true);

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<LiveVoiceTranscriptItem[]>([
    {
      id: 'welcome-voice',
      sender: 'model',
      text: 'Hello! I am ClarifyLegal Voice, running on Gemini 3.8 Live API. Tap "Start Voice Call" to discuss your contracts, practice negotiations, or clarify confusing clauses in real-time.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio & WebSocket References
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Keep mute status updated in callback ref
  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Scroll to bottom on new transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Helper: Float32Array to 16-bit PCM Base64
  const pcmToBase64 = (pcmData: Float32Array): string => {
    const int16 = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Gapless Playback of 24kHz Model Audio Chunk
  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      analyserRef.current = outputAudioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.connect(outputAudioCtxRef.current.destination);
    }

    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Route through analyser node for waveform visuals
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      } else {
        source.connect(ctx.destination);
      }

      const now = ctx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.push(source);

      setIsSpeaking(true);

      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx > -1) {
          activeSourcesRef.current.splice(idx, 1);
        }
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Error decoding/scheduling live audio chunk:', e);
    }
  }, []);

  // Stop all playback immediately on interruption
  const interruptPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  // Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderVisualizer = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (sessionState !== 'active') {
        // Idle calm pulse
        ctx.fillStyle = '#cbd5e1';
        const barWidth = 4;
        const gap = 4;
        const totalBars = Math.floor(canvas.width / (barWidth + gap));
        for (let i = 0; i < totalBars; i++) {
          const h = 4 + Math.sin(Date.now() / 400 + i) * 2;
          const x = i * (barWidth + gap);
          const y = (canvas.height - h) / 2;
          ctx.fillRect(x, y, barWidth, h);
        }
        animationFrameIdRef.current = requestAnimationFrame(renderVisualizer);
        return;
      }

      // Active state
      const barWidth = 5;
      const gap = 3;
      const totalBars = Math.floor(canvas.width / (barWidth + gap));

      let dataArray = new Uint8Array(32);
      if (analyserRef.current) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < totalBars; i++) {
        const val = dataArray[i % dataArray.length] || 10;
        let barHeight = Math.max(6, (val / 255) * (canvas.height - 10));
        
        // Add subtle wave modulation
        if (isSpeaking) {
          barHeight += Math.sin(Date.now() / 150 + i) * 8;
        } else if (isListening) {
          barHeight += Math.cos(Date.now() / 100 + i) * 5;
        }

        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        // Gradient color based on speaking/listening
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isSpeaking) {
          grad.addColorStop(0, '#818cf8'); // Indigo
          grad.addColorStop(1, '#3b82f6'); // Blue
        } else if (isListening) {
          grad.addColorStop(0, '#34d399'); // Emerald
          grad.addColorStop(1, '#059669');
        } else {
          grad.addColorStop(0, '#64748b'); // Slate
          grad.addColorStop(1, '#475569');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameIdRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [sessionState, isSpeaking, isListening]);

  // Start Live Call
  const handleStartCall = async () => {
    setErrorMessage(null);
    setSessionState('connecting');

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      // 2. Setup audio capture context (16kHz for Gemini input)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      // 3. Setup playback context (24kHz for Gemini output)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      analyserRef.current = outputCtx.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.connect(outputCtx.destination);
      nextStartTimeRef.current = outputCtx.currentTime;

      // 4. Connect WebSocket to backend /live-voice
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-voice?voice=${selectedVoice}&role=${selectedRole}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Live API WebSocket');
        setSessionState('active');

        // If contract context is toggled, send initial priming text
        if (includeDocumentContext && currentAnalysis) {
          const summarySnippet = `Contract: "${currentAnalysis.documentTitle}" (${currentAnalysis.documentType}, Risk: ${currentAnalysis.riskScore}/100). Summary: ${currentAnalysis.summary.slice(0, 500)}`;
          ws.send(JSON.stringify({
            type: 'text',
            text: `[SYSTEM NOTICE]: The user is currently viewing the following agreement in ClarifyLegal. Use this to inform your answers when asked about their document: ${summarySnippet}`
          }));
        }

        // Setup microphone processor
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMicMutedRef.current) return;
          if (ws.readyState !== WebSocket.OPEN) return;

          const channelData = e.inputBuffer.getChannelData(0);
          
          // Detect if user is speaking based on amplitude
          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += Math.abs(channelData[i]);
          }
          const avg = sum / channelData.length;
          setIsListening(avg > 0.015);

          const base64Pcm = pcmToBase64(channelData);
          ws.send(JSON.stringify({
            type: 'audio',
            audio: base64Pcm,
          }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            interruptPlayback();
          } else if (msg.type === 'model_transcript' && msg.text) {
            setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'model') {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + msg.text }];
              }
              return [...prev, {
                id: `model-${Date.now()}`,
                sender: 'model',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }];
            });
          } else if (msg.type === 'user_transcript' && msg.text) {
            setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'user') {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + msg.text }];
              }
              return [...prev, {
                id: `user-${Date.now()}`,
                sender: 'user',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }];
            });
          } else if (msg.type === 'error') {
            console.error('Server reported Live API error:', msg.error);
            setErrorMessage(msg.error || 'Live connection error occurred.');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        setErrorMessage('WebSocket connection failed. Please ensure the backend is running and Gemini API key is valid.');
        setSessionState('error');
      };

      ws.onclose = () => {
        console.log('Live WebSocket closed');
        handleEndCall();
      };
    } catch (err: any) {
      console.error('Error initiating live call:', err);
      setErrorMessage(err.message || 'Microphone access denied or audio initialization failed.');
      setSessionState('error');
      handleEndCall();
    }
  };

  // End Call & Cleanup
  const handleEndCall = () => {
    interruptPlayback();

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop Media Tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect Processors
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Close Audio Contexts
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    setIsSpeaking(false);
    setIsListening(false);
    setSessionState('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscripts = () => {
    const text = transcripts.map(t => `[${t.timestamp}] ${t.sender === 'user' ? 'You' : 'ClarifyLegal (' + selectedVoice + ')'}: ${t.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClarifyLegal-VoiceTranscript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearTranscripts = () => {
    setTranscripts([
      {
        id: `welcome-${Date.now()}`,
        sender: 'model',
        text: 'Transcripts cleared. Tap "Start Voice Call" to resume real-time audio discussion.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Quick speaking starter prompts to inspire user
  const voicePrompts = [
    '🎙️ "Are there any uncapped indemnification risks in my agreement?"',
    '🎙️ "Let\'s practice countering an automatic 1-year renewal clause."',
    '🎙️ "What should I ask my landlord before signing a commercial lease?"',
    '🎙️ "Explain the difference between direct and consequential damages."'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Gemini 3.8 Live Voice Studio</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
                  <span>Live API</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ultra-low latency, bidirectional real-time audio conversation with model <code className="text-teal-700 font-mono font-semibold">gemini-3.8-live</code>
              </p>
            </div>
          </div>

          {/* Voice Settings & Options */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Persona Preset */}
            <div className="relative">
              <select
                disabled={sessionState === 'active'}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer disabled:opacity-60 shadow-xs"
                title="Voice Persona"
              >
                <option value="advisor">Advisor: Legal Consultant</option>
                <option value="negotiator">Roleplay: Tough Landlord / Counterparty</option>
                <option value="simplifier">Simplifier: 5th-Grade Translator</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Voice Name */}
            <div className="relative">
              <select
                disabled={sessionState === 'active'}
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as any)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer disabled:opacity-60 shadow-xs"
                title="Synthetic Voice"
              >
                <option value="Zephyr">Voice: Zephyr (Warm & Natural)</option>
                <option value="Puck">Voice: Puck (Energetic & Direct)</option>
                <option value="Charon">Voice: Charon (Deep & Authoritative)</option>
                <option value="Kore">Voice: Kore (Calm & Articulate)</option>
                <option value="Fenrir">Voice: Fenrir (Firm & Confident)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Export Transcripts */}
            <button
              onClick={handleExportTranscripts}
              className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer shadow-xs"
              title="Download call transcripts"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear Transcripts */}
            <button
              onClick={handleClearTranscripts}
              className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-medium transition-colors cursor-pointer shadow-xs"
              title="Clear transcripts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linked Document Context */}
        {currentAnalysis && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-slate-500">Context Contract:</span>
              <span className="font-semibold text-slate-800">{currentAnalysis.documentTitle}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                Risk {currentAnalysis.riskScore}/100
              </span>
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDocumentContext}
                onChange={(e) => setIncludeDocumentContext(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className={includeDocumentContext ? 'text-teal-700 font-semibold' : 'text-slate-500'}>
                {includeDocumentContext ? 'Document Context Active in Live Voice' : 'Document Context Muted'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Main Interactive Call Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Stage: Voice Hub & Visualizer (5 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between shadow-xs relative overflow-hidden">
          {/* Ambient background glow */}
          <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
            sessionState === 'active' 
              ? (isSpeaking ? 'bg-indigo-100/60 opacity-100' : isListening ? 'bg-emerald-100/60 opacity-100' : 'bg-teal-100/50 opacity-70')
              : 'bg-transparent opacity-0'
          }`} />

          {/* Status Indicator */}
          <div className="w-full flex items-center justify-between text-xs z-10">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                sessionState === 'active'
                  ? (isSpeaking ? 'bg-indigo-500 animate-pulse' : isListening ? 'bg-emerald-500 animate-pulse' : 'bg-teal-500')
                  : sessionState === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-slate-300'
              }`} />
              <span className="font-semibold text-slate-800">
                {sessionState === 'active' 
                  ? (isSpeaking ? 'Gemini 3.8 Live Speaking...' : isListening ? 'Listening to You...' : 'Connected (Speak anytime)')
                  : sessionState === 'connecting' ? 'Connecting to Live API...' : 'Ready to Connect'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              {selectedVoice} • {selectedRole}
            </span>
          </div>

          {/* Center Call Sphere / Visualizer */}
          <div className="flex flex-col items-center justify-center my-auto py-6 z-10">
            {/* Dynamic Waveform Rings */}
            <div className="relative flex items-center justify-center">
              {sessionState === 'active' && (
                <>
                  <div className={`absolute w-44 h-44 rounded-full border border-teal-300 transition-all duration-500 ${
                    isSpeaking ? 'scale-125 opacity-80 animate-ping' : isListening ? 'scale-110 opacity-60' : 'scale-100 opacity-20'
                  }`} />
                  <div className={`absolute w-36 h-36 rounded-full border border-indigo-300 transition-all duration-300 ${
                    isSpeaking ? 'scale-110 opacity-90' : 'scale-95 opacity-30'
                  }`} />
                </>
              )}

              {/* Main Call Action Circle */}
              <button
                onClick={sessionState === 'active' ? handleEndCall : handleStartCall}
                disabled={sessionState === 'connecting'}
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  sessionState === 'active'
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'
                }`}
              >
                {sessionState === 'active' ? (
                  <>
                    <PhoneOff className="w-9 h-9 mb-1" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">End Call</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-9 h-9 mb-1" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {sessionState === 'connecting' ? 'Starting...' : 'Start Call'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="mt-8 w-64 h-12 bg-slate-50 rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-inner">
              <canvas ref={canvasRef} width={240} height={40} className="w-full h-full" />
            </div>
          </div>

          {/* Bottom In-Call Controls */}
          <div className="w-full z-10 pt-4 border-t border-slate-100">
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4">
              <button
                disabled={sessionState !== 'active'}
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-3 rounded-full border transition-all cursor-pointer ${
                  isMicMuted
                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5 text-amber-700" /> : <Mic className="w-5 h-5 text-emerald-600" />}
              </button>

              <button
                disabled={sessionState !== 'active'}
                onClick={interruptPlayback}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="Interrupt AI speaking immediately"
              >
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span>Interrupt AI</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500 mt-3">
              {sessionState === 'active' 
                ? (isMicMuted ? 'Microphone muted. Tap mic icon to speak.' : 'Speak naturally into your microphone. Gemini responds in real-time.')
                : 'Supports Chrome, Firefox, Safari, Edge with microphone permissions.'}
            </p>
          </div>
        </div>

        {/* Right Stage: Real-Time Live Transcripts & Prompt Inspirations (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Live Spoken Transcript Feed</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {transcripts.length} {transcripts.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Transcripts Thread */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {transcripts.map((t) => {
              const isUser = t.sender === 'user';
              return (
                <div
                  key={t.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-tr-none'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-2 mb-1 text-[10px] ${
                      isUser ? 'text-teal-100 opacity-90' : 'text-slate-500'
                    }`}>
                      <span className="font-semibold">
                        {isUser ? 'You (Spoken)' : `ClarifyLegal (${selectedVoice})`}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span>{t.timestamp}</span>
                        <button
                          onClick={() => handleCopy(t.id, t.text)}
                          className="hover:text-slate-900 p-0.5 rounded transition-colors cursor-pointer"
                          title="Copy spoken line"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={transcriptEndRef} />
          </div>

          {/* Quick Voice Conversation Starters */}
          <div className="pt-3 border-t border-slate-100 mt-3">
            <p className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Suggested topics to ask aloud during your call:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {voicePrompts.map((promptText, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700 hover:border-teal-400 hover:bg-teal-50/40 transition-colors"
                >
                  {promptText}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
