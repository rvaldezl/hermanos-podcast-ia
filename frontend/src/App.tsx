import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Layers, MonitorPlay, Radio, Sliders } from 'lucide-react';
import {
  CharacterConfig,
  DialogueTurn,
  PodcastState,
  StageConfig,
  TopicConfig,
} from './types';
import { useAudioLipSync } from './hooks/useAudioLipSync';
import { LivePreview } from './components/LivePreview';
import { ControlPanel } from './components/ControlPanel';
import { StageManager } from './components/StageManager';

const INITIAL_FALLBACK_STATE: PodcastState = {
  isRunning: false,
  activeSpeaker: null,
  currentTurn: null,
  topic: {
    title: 'Cosas de Mujeres, Exs y Vida en Pareja',
    premise:
      'Plática amena y sin filtros al estilo Hermanos de Leche (@hermanosdelechemx) sobre el FBI femenino, las indirectas, primeras citas y cómo sobrevive el hombre casado.',
  },
  characters: {
    A: {
      id: 'A',
      name: 'Adrián Marcelo',
      role: 'Conductor @hermanosdelechemx • Psicólogo Regio & Humor Ácido',
      systemPrompt:
        'Eres Adrián Marcelo en Hermanos de Leche. Hablas relajado, irreverente, con humor negro inteligente y observaciones psicológicas cínicas.',
      fishVoiceId: '3f45a7fd7a614655a61eb7027b955783',
      avatarMode: 'rig2d',
      live2dModelUrl: '',
      pngSprites: {},
      rigStyle: {
        primaryColor: '#38bdf8',
        accentColor: '#0284c7',
        hairColor: '#3b2416',
        skinTone: '#ebb892',
        glasses: false,
        headphones: false,
        preset: 'adrian',
      },
      position: { x: 270, y: 1120, scale: 1.0 },
    },
    B: {
      id: 'B',
      name: 'La Mole',
      role: 'Co-conductor @hermanosdelechemx • Comediante de Barrio & Señor Regio',
      systemPrompt:
        'Eres Iván Fematt "La Mole" en Hermanos de Leche. Hablas como comediante regio de barrio, señor casado y maestro de las anécdotas de carnes asadas y amigos.',
      fishVoiceId: 'bfed5c0810a347dbb62e8ccce7f59c48',
      avatarMode: 'rig2d',
      live2dModelUrl: '',
      pngSprites: {},
      rigStyle: {
        primaryColor: '#f43f5e',
        accentColor: '#e11d48',
        hairColor: '#1c1614',
        skinTone: '#ebb892',
        glasses: false,
        headphones: false,
        preset: 'lamole',
      },
      position: { x: 810, y: 1120, scale: 1.0 },
    },
  },
  stage: {
    themePreset: 'late-night-brick',
    showSubtitles: true,
    showTelemetry: true,
    showTopicBanner: true,
  },
  tiktokConnected: false,
  tiktokUsername: '',
  eventQueue: [],
  recentHistory: [],
  hasGroqKey: false,
  hasFishKey: false,
};

export const App: React.FC = () => {
  const [state, setState] = useState<PodcastState>(INITIAL_FALLBACK_STATE);
  const [mainTab, setMainTab] = useState<'control' | 'stage'>('control');
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const lastPlayedTurnIdRef = useRef<string | null>(null);

  const isObsMode = new URLSearchParams(window.location.search).get('obs') === 'true';

  const handleTurnCompleted = useCallback((turnId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'turn_completed', turnId }));
    }
  }, []);

  const { activeSpeaker, micSpeaker, frame, playTurn, stopPlayback, toggleMicTest } =
    useAudioLipSync(handleTurnCompleted);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      const envWs = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_WS_URL;
      const isRenderHost = window.location.hostname.includes('onrender.com');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl =
        envWs ||
        (isRenderHost
          ? 'wss://hermanos-podcast-ia-backend.onrender.com'
          : `${protocol}://${window.location.hostname}:3001`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isUnmounted) setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type: 'state' | 'turn' | 'tiktokEvent';
            data: unknown;
          };

          if (payload.type === 'state') {
            setState(payload.data as PodcastState);
          } else if (payload.type === 'turn') {
            const turn = payload.data as DialogueTurn;
            if (lastPlayedTurnIdRef.current !== turn.id) {
              lastPlayedTurnIdRef.current = turn.id;
              void playTurn(turn);
            }
          }
        } catch {
          // ignore parse error
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 2000);
        }
      };
    };

    connectWs();
    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [playTurn]);

  const isRenderHost = window.location.hostname.includes('onrender.com');
  const apiBase = (
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
    (isRenderHost ? 'https://hermanos-podcast-ia-backend.onrender.com' : '')
  ).replace(/\/$/, '');

  const apiPost = async <T,>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as T;
  };

  const handleStart = async () => {
    const next = await apiPost<PodcastState>('/api/podcast/start');
    setState(next);
  };

  const handleStop = async () => {
    stopPlayback();
    const next = await apiPost<PodcastState>('/api/podcast/stop');
    setState(next);
  };

  const handleNextTurn = async () => {
    const next = await apiPost<PodcastState>('/api/podcast/next-turn');
    setState(next);
  };

  const handleClearHistory = async () => {
    const next = await apiPost<PodcastState>('/api/podcast/clear-history');
    setState(next);
  };

  const handleRefreshResearch = async () => {
    const next = await apiPost<PodcastState>('/api/research/refresh');
    setState(next);
  };

  const handleUpdateConfig = async (partial: {
    topic?: TopicConfig;
    characters?: { A: CharacterConfig; B: CharacterConfig };
    stage?: StageConfig;
    autoResearchEveryTurns?: number;
  }) => {
    const next = await apiPost<PodcastState>('/api/config', partial);
    setState(next);
  };

  const handleSaveKeys = async (keys: {
    groqApiKey?: string;
    fishAudioApiKey?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  }) => {
    const next = await apiPost<PodcastState>('/api/keys', keys);
    setState(next);
  };

  const handleScrapeYoutube = async (query: string): Promise<{ message: string }> => {
    const res = await apiPost<{ message: string; state: PodcastState }>('/api/knowledge/scrape', {
      query,
    });
    if (res.state) setState(res.state);
    return { message: res.message };
  };

  const handleSyncSupabase = async (creds?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  }): Promise<{ message: string }> => {
    const res = await apiPost<{ message: string; state: PodcastState }>(
      '/api/knowledge/supabase-sync',
      creds
    );
    if (res.state) setState(res.state);
    return { message: res.message };
  };

  const handleSuggestTopics = async (keyword: string): Promise<TopicConfig[]> => {
    const res = await apiPost<{ topics: TopicConfig[] }>('/api/topics/suggest', { keyword });
    return res.topics;
  };

  const handleConnectTikTok = async (username: string) => {
    return apiPost<{ connected: boolean; message: string }>('/api/tiktok/connect', { username });
  };

  const handleDisconnectTikTok = async () => {
    await apiPost('/api/tiktok/disconnect');
  };

  const handleSimulateEvent = async (payload: {
    type: 'gift' | 'chat' | 'member' | 'like';
    username: string;
    message: string;
    giftName?: string;
    giftCount?: number;
    immediate?: boolean;
  }) => {
    await apiPost('/api/tiktok/simulate', payload);
  };

  // Dedicated full-screen 9:16 OBS Browser Source view
  if (isObsMode) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden">
        <LivePreview
          state={state}
          activeSpeaker={activeSpeaker || state.activeSpeaker}
          lipSync={frame}
          isObsMode={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Studio Header */}
      <header className="border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Podcast Dual IA — VTuber 2.5D Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  0 GPU • FFT Lip-Sync
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Orquestador Groq + Fish Audio + Simulador Pre-Live & Conector TikTok Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                wsConnected
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                }`}
              />
              {wsConnected ? 'Backend Conectado' : 'Reconectando Backend...'}
            </span>

            <a
              href="/?obs=true"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 transition-all"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Vista OBS (9:16)
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 9:16 Vertical Stage Preview (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-20">
          <LivePreview
            state={state}
            activeSpeaker={activeSpeaker || state.activeSpeaker}
            lipSync={frame}
          />
        </div>

        {/* RIGHT COLUMN: Control Panel & VTuber Stage Manager (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setMainTab('control')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                mainTab === 'control'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Panel de Control & Simulador de Comentarios
            </button>
            <button
              onClick={() => setMainTab('stage')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                mainTab === 'stage'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Motor VTuber 2.5D / Live2D & Escenario OBS
            </button>
          </div>

          {mainTab === 'control' ? (
            <ControlPanel
              state={state}
              onStart={handleStart}
              onStop={handleStop}
              onNextTurn={handleNextTurn}
              onClearHistory={handleClearHistory}
              onRefreshResearch={handleRefreshResearch}
              onUpdateConfig={handleUpdateConfig}
              onSaveKeys={handleSaveKeys}
              onSuggestTopics={handleSuggestTopics}
              onScrapeYoutube={handleScrapeYoutube}
              onSyncSupabase={handleSyncSupabase}
              onConnectTikTok={handleConnectTikTok}
              onDisconnectTikTok={handleDisconnectTikTok}
              onSimulateEvent={handleSimulateEvent}
            />
          ) : (
            <StageManager
              state={state}
              micSpeaker={micSpeaker}
              onUpdateConfig={handleUpdateConfig}
              onToggleMicTest={toggleMicTest}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
