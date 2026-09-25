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
  ChevronDown,
  ExternalLink
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
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [hasActiveMic, setHasActiveMic] = useState<boolean>(true);
  const [customSpokenPrompt, setCustomSpokenPrompt] = useState('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN' | 'en-US'>('hi-IN');
  const [interimText, setInterimText] = useState<string>('');

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
  const recognitionRef = useRef<any>(null);
  const sessionStateRef = useRef(sessionState);
  const silenceTimerRef = useRef<any>(null);
  const currentInterimRef = useRef<string>('');

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // Keep mute status updated in callback ref
  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Dynamically update speech recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = speechLanguage;
      } catch (e) {}
    }
  }, [speechLanguage]);

  // Scroll to bottom on new transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Linear Downsampler from device sample rate to 16kHz
  const downsampleTo16k = (buffer: Float32Array, inputRate: number): Float32Array => {
    if (inputRate === 16000) return buffer;
    const ratio = inputRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : buffer[offsetBuffer] || 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  // Helper: Float32Array to 16-bit PCM Base64 with sample rate normalization
  const pcmToBase64 = (pcmData: Float32Array, inputRate: number): string => {
    const resampled = downsampleTo16k(pcmData, inputRate);
    const int16 = new Int16Array(resampled.length);
    for (let i = 0; i < resampled.length; i++) {
      const s = Math.max(-1, Math.min(1, resampled[i]));
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

  // Helper: Send spoken query directly to Gemini 3.8 Live
  const sendSpokenQuery = useCallback((textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    currentInterimRef.current = '';
    setInterimText('');

    setTranscripts(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text
      }));
    }
  }, []);

  // Helper: Gapless Playback of 24kHz Model Audio Chunk
  const playAudioChunk = useCallback((base64Audio: string) => {
    let ctx = outputAudioCtxRef.current;
    if (!ctx || ctx.state === 'closed') {
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      } catch (e) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      outputAudioCtxRef.current = ctx;
    }

    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const binary = atob(base64Audio);
      const len = binary.length;
      const numSamples = Math.floor(len / 2);
      if (numSamples === 0) return;

      const float32 = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const b1 = binary.charCodeAt(i * 2);
        const b2 = binary.charCodeAt(i * 2 + 1);
        let val = (b2 << 8) | b1;
        if (val >= 0x8000) val -= 0x10000;
        float32[i] = val / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Route through analyser node for waveform visuals and connect to destination
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
  const handleStartCall = async (initialPrompt?: string) => {
    setErrorMessage(null);
    setMicNotice(null);
    setSessionState('connecting');

    // 1. Setup audio playback context on user click gesture
    let outputCtx: AudioContext;
    try {
      outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    } catch (e) {
      outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (outputCtx.state === 'suspended') {
      try {
        await outputCtx.resume();
      } catch (e) {}
    }

    outputAudioCtxRef.current = outputCtx;
    analyserRef.current = outputCtx.createAnalyser();
    analyserRef.current.fftSize = 64;
    analyserRef.current.connect(outputCtx.destination);
    nextStartTimeRef.current = outputCtx.currentTime;

    // 2. Request microphone access with fallback
    let stream: MediaStream | null = null;
    let inputCtx: AudioContext | null = null;
    let micOk = false;
    let micErrorReason = '';

    try {
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            }
          });
          micOk = true;
        } catch (e1: any) {
          micErrorReason = e1?.name || e1?.message || 'Permission denied';
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micOk = true;
          } catch (e2: any) {
            micErrorReason = e2?.name || e2?.message || 'Permission denied';
            console.warn('Microphone permission denied or device not found:', e2);
          }
        }
      } else {
        micErrorReason = 'Browser mediaDevices API unavailable';
      }
    } catch (micErr: any) {
      micErrorReason = micErr?.name || micErr?.message || 'Microphone error';
      console.warn('Microphone capture error:', micErr);
    }

    if (stream && micOk) {
      mediaStreamRef.current = stream;
      setHasActiveMic(true);
      setMicNotice(null);
      try {
        inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
        }
        inputAudioCtxRef.current = inputCtx;
      } catch (e) {
        console.warn('Failed creating input AudioContext:', e);
      }
    } else {
      setHasActiveMic(false);
      setMicNotice(
        micErrorReason.toLowerCase().includes('notallowed') || micErrorReason.toLowerCase().includes('permission')
          ? 'Browser microphone permission is blocked. Click the lock/settings icon 🔒 in your browser URL address bar to Allow microphone, or open in a direct tab.'
          : 'Microphone is unavailable or blocked in this browser window. You can click "Allow / Retry Microphone" below or open in a dedicated tab.'
      );
    }

    // 3. Connect WebSocket to backend /live-voice
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl = `${protocol}//${window.location.host}/live-voice?voice=${selectedVoice}&role=${selectedRole}`;
      if (includeDocumentContext && currentAnalysis) {
        wsUrl += `&docTitle=${encodeURIComponent(currentAnalysis.documentTitle || '')}&docRisk=${encodeURIComponent(currentAnalysis.riskScore || '')}&docType=${encodeURIComponent(currentAnalysis.documentType || '')}`;
      }
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Live API WebSocket');
        setSessionState('active');

        // If an initial prompt was requested, send it immediately
        if (initialPrompt && initialPrompt.trim()) {
          setTranscripts(prev => [
            ...prev,
            {
              id: `user-${Date.now()}`,
              sender: 'user',
              text: initialPrompt.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isStreaming: false,
            }
          ]);
          ws.send(JSON.stringify({
            type: 'text',
            text: initialPrompt.trim()
          }));
        }

        // Setup microphone processor if mic is available
        if (stream && inputCtx) {
          try {
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMicMutedRef.current) {
                setMicLevel(0);
                return;
              }
              if (ws.readyState !== WebSocket.OPEN) return;

              const channelData = e.inputBuffer.getChannelData(0);
              
              // Calculate real-time RMS audio level for visual mic meter
              let sumSquares = 0;
              for (let i = 0; i < channelData.length; i++) {
                sumSquares += channelData[i] * channelData[i];
              }
              const rms = Math.sqrt(sumSquares / channelData.length);
              const level = Math.min(100, Math.round(rms * 450));
              setMicLevel(level);
              setIsListening(rms > 0.0035);

              const base64Pcm = pcmToBase64(channelData, inputCtx!.sampleRate);
              ws.send(JSON.stringify({
                type: 'audio',
                audio: base64Pcm,
              }));
            };

            // Use silent gain to avoid echo feedback loop that triggers OS noise suppression
            const muteGain = inputCtx.createGain();
            muteGain.gain.value = 0;
            source.connect(processor);
            processor.connect(muteGain);
            muteGain.connect(inputCtx.destination);
          } catch (procErr) {
            console.warn('ScriptProcessor setup warning:', procErr);
          }
        }

        // Initialize Speech Recognition for immediate transcription & vocal feedback
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          try {
            const recognition = new SpeechRecognitionClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = speechLanguage;

            recognition.onresult = (event: any) => {
              let interim = '';
              let finalChunk = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalChunk += event.results[i][0].transcript;
                } else {
                  interim += event.results[i][0].transcript;
                }
              }

              const speechText = (finalChunk || interim).trim();
              if (speechText) {
                currentInterimRef.current = speechText;
                setInterimText(speechText);
                setIsListening(true);

                // Auto-commit on 1.2 seconds of silence
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                  if (currentInterimRef.current.trim() && sessionStateRef.current === 'active') {
                    sendSpokenQuery(currentInterimRef.current.trim());
                  }
                }, 1200);
              }

              if (finalChunk && finalChunk.trim()) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                sendSpokenQuery(finalChunk.trim());
              }
            };

            recognition.onerror = (errEvent: any) => {
              console.warn('SpeechRecognition warning:', errEvent.error);
              if (errEvent.error === 'not-allowed') {
                setHasActiveMic(false);
                setMicNotice('Browser microphone permission is blocked. Click the lock icon 🔒 in your address bar to Allow microphone, or click "Open in Direct Tab" below.');
              }
            };

            recognition.onend = () => {
              // Auto-restart recognition while the live call is active
              if (sessionStateRef.current === 'active' && !isMicMutedRef.current) {
                try {
                  recognition.start();
                } catch (e) {}
              }
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (speechErr) {
            console.warn('SpeechRecognition not initialized:', speechErr);
          }
        }
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
              if (last && last.sender === 'model' && last.isStreaming) {
                return [...prev.slice(0, -1), { ...last, text: last.text + msg.text }];
              }
              return [...prev, {
                id: `model-${Date.now()}`,
                sender: 'model',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: true,
              }];
            });
          } else if (msg.type === 'turn_complete') {
            setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'model') {
                return [...prev.slice(0, -1), { ...last, isStreaming: false }];
              }
              return prev;
            });
          } else if (msg.type === 'user_transcript' && msg.text) {
            setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'user' && last.isStreaming) {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + msg.text }];
              }
              return [...prev, {
                id: `user-${Date.now()}`,
                sender: 'user',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: true,
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
        setErrorMessage('WebSocket connection failed. Ensure your internet connection is active and try again.');
        setSessionState('error');
      };

      ws.onclose = () => {
        console.log('Live WebSocket closed');
        handleEndCall();
      };
    } catch (err: any) {
      console.error('Error initiating live call:', err);
      setErrorMessage(err.message || 'Live call initialization failed.');
      setSessionState('error');
      handleEndCall();
    }
  };

  // Send a custom text question to the Live voice session
  const handleSendLivePrompt = (text: string) => {
    if (!text.trim()) return;

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state === 'suspended') {
      outputAudioCtxRef.current.resume().catch(() => {});
    }

    if (sessionState === 'active' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setTranscripts(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: false,
        }
      ]);
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: text.trim()
      }));
      setCustomSpokenPrompt('');
    } else {
      // Auto start call and send prompt
      handleStartCall(text.trim());
      setCustomSpokenPrompt('');
    }
  };

  // Explicitly prompt and activate microphone permission
  const requestMicPermission = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (s) {
        s.getTracks().forEach(t => t.stop());
        setHasActiveMic(true);
        setMicNotice(null);
        if (sessionState === 'active') {
          handleEndCall();
          setTimeout(() => handleStartCall(), 300);
        } else {
          handleStartCall();
        }
      }
    } catch (err: any) {
      console.warn('Manual microphone permission request failed:', err);
      setMicNotice(
        'Permission request was blocked. Please click the Lock icon 🔒 next to the URL in your browser address bar, choose "Allow" for Microphone, and click Retry.'
      );
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

    // Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setInterimText('');
    setMicLevel(0);

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
    <div className="flex flex-col min-h-screen max-w-6xl mx-auto px-4 py-4 space-y-4 pb-16">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[520px]">
        {/* Left Stage: Voice Hub & Visualizer (5 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center shadow-xs relative space-y-3">
          {/* Ambient background glow */}
          <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
            sessionState === 'active' 
              ? (isSpeaking ? 'bg-indigo-100/60 opacity-100' : isListening ? 'bg-emerald-100/60 opacity-100' : 'bg-teal-100/50 opacity-70')
              : 'bg-transparent opacity-0'
          }`} />

          {/* Status Indicator */}
          <div className="w-full flex items-center justify-between text-xs z-10 pb-2 border-b border-slate-100">
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
            <span className="text-[11px] font-mono text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {selectedVoice} • {selectedRole}
            </span>
          </div>

          {/* Spoken Language Selector */}
          <div className="w-full z-10 flex flex-col space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Language Preference:</span>
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl text-xs gap-1">
              <button
                type="button"
                onClick={() => setSpeechLanguage('hi-IN')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  speechLanguage === 'hi-IN' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Speak in Hindi or Hinglish"
              >
                🇮🇳 Hindi / Hinglish
              </button>
              <button
                type="button"
                onClick={() => setSpeechLanguage('en-IN')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  speechLanguage === 'en-IN' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Speak in Indian English"
              >
                English (India)
              </button>
              <button
                type="button"
                onClick={() => setSpeechLanguage('en-US')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  speechLanguage === 'en-US' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Speak in US English"
              >
                English (US)
              </button>
            </div>
          </div>

          {/* Center Call Sphere & Visualizer */}
          <div className="flex flex-col items-center justify-center w-full py-2 z-10 space-y-3">
            {/* Dynamic Waveform Rings & Main Sphere */}
            <div className="relative flex items-center justify-center my-1">
              {sessionState === 'active' && (
                <>
                  <div className={`absolute w-36 h-36 rounded-full border border-teal-300 transition-all duration-500 ${
                    isSpeaking ? 'scale-125 opacity-80 animate-ping' : isListening ? 'scale-110 opacity-60' : 'scale-100 opacity-20'
                  }`} />
                  <div className={`absolute w-28 h-28 rounded-full border border-indigo-300 transition-all duration-300 ${
                    isSpeaking ? 'scale-110 opacity-90' : 'scale-95 opacity-30'
                  }`} />
                </>
              )}

              {/* Main Call Action Circle */}
              <button
                onClick={sessionState === 'active' ? () => handleEndCall() : () => handleStartCall()}
                disabled={sessionState === 'connecting'}
                className={`relative w-22 h-22 rounded-full flex flex-col items-center justify-center shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  sessionState === 'active'
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'
                }`}
              >
                {sessionState === 'active' ? (
                  <>
                    <PhoneOff className="w-7 h-7 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">End Call</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-7 h-7 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {sessionState === 'connecting' ? 'Starting...' : 'Start Call'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* In-Call Action Toolbar (Visible directly under Call Button) */}
            {sessionState === 'active' && (
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isMicMuted
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-amber-700" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>

                <button
                  type="button"
                  onClick={interruptPlayback}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Interrupt AI speaking immediately"
                >
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Interrupt AI</span>
                </button>
              </div>
            )}

            {/* Audio Waveform Canvas */}
            <div className="w-full max-w-[260px] h-9 bg-slate-50 rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-inner">
              <canvas ref={canvasRef} width={240} height={32} className="w-full h-full" />
            </div>

            {/* Live Mic Audio Input Level Meter */}
            {sessionState === 'active' && hasActiveMic && (
              <div className="w-full max-w-[260px] flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <Mic className={`w-3.5 h-3.5 ${micLevel > 12 ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-75 rounded-full ${
                      micLevel > 12 ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(100, micLevel * 2.2)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 w-14 text-right">
                  {micLevel > 12 ? 'Speaking' : 'Listening'}
                </span>
              </div>
            )}
          </div>

          {/* Live Hearing Box with Instant Send */}
          {interimText && (
            <div className="w-full z-10 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-semibold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Hearing You Speak:</span>
                </span>
                <button
                  type="button"
                  onClick={() => sendSpokenQuery(interimText)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>Send Now ➔</span>
                </button>
              </div>
              <p className="font-medium italic text-xs bg-white/80 p-2 rounded-lg border border-emerald-200 leading-snug">
                &ldquo;{interimText}&rdquo;
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                Tip: Pause for 1 second or tap &ldquo;Send Now&rdquo; to hear Gemini speak back.
              </p>
            </div>
          )}

          {/* Direct In-Stage Voice/Text Question Bar */}
          <div className="w-full z-10 pt-2 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendLivePrompt(customSpokenPrompt);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={customSpokenPrompt}
                onChange={(e) => setCustomSpokenPrompt(e.target.value)}
                placeholder="Ask ClarifyLegal voice directly (e.g. Hindi or English)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!customSpokenPrompt.trim() || sessionState === 'connecting'}
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs flex-shrink-0"
              >
                <span>Ask Voice</span>
              </button>
            </form>
          </div>

          {/* Warnings & Diagnostics */}
          <div className="w-full z-10 space-y-2">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {micNotice && (
              <div className="p-3 rounded-xl bg-amber-50/95 border border-amber-200 text-xs text-amber-900 shadow-xs space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <p className="font-semibold text-amber-950 text-xs">Microphone Permission Notice</p>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {micNotice}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={requestMicPermission}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Allow / Retry Microphone</span>
                      </button>

                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                        title="Opens app in clean browser tab where microphone popup can trigger directly"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Open in Direct Tab</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Microphone Active Indicator */}
            {sessionState === 'active' && hasActiveMic && !micNotice && (
              <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">Microphone active & streaming</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">16kHz PCM</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Stage: Real-Time Live Transcripts & Prompt Inspirations (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs min-h-[500px]">
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

          {/* Spoken Text Query Bar */}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendLivePrompt(customSpokenPrompt);
              }}
              className="flex items-center gap-2 mb-2"
            >
              <input
                type="text"
                value={customSpokenPrompt}
                onChange={(e) => setCustomSpokenPrompt(e.target.value)}
                placeholder="Type a question to hear Gemini 3.8 Live speak back..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!customSpokenPrompt.trim() || sessionState === 'connecting'}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>Ask Spoken</span>
              </button>
            </form>

            {/* Quick Voice Conversation Starters */}
            <p className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>1-Click Spoken Quick-Topics (Tap to hear live voice answer):</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {voicePrompts.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendLivePrompt(promptText)}
                  className="text-left bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl px-3 py-2 text-[11px] text-slate-700 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <span className="line-clamp-2 pr-2">{promptText}</span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
