import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Bot,
  Check,
  Cpu,
  Flame,
  Gift,
  Heart,
  KeyRound,
  MessageSquarePlus,
  Play,
  Radio,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Square,
  StepForward,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { CharacterConfig, PodcastState, SpeakerId, TopicConfig } from '../types';

interface ControlPanelProps {
  state: PodcastState;
  onStart: () => void;
  onStop: () => void;
  onNextTurn: () => void;
  onClearHistory: () => void;
  onRefreshResearch: () => void;
  onUpdateConfig: (partial: {
    topic?: TopicConfig;
    characters?: { A: CharacterConfig; B: CharacterConfig };
    autoResearchEveryTurns?: number;
  }) => void;
  onSaveKeys: (keys: {
    groqApiKey?: string;
    fishAudioApiKey?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  }) => void;
  onSuggestTopics: (keyword: string) => Promise<TopicConfig[]>;
  onScrapeYoutube: (query: string) => Promise<{ message: string }>;
  onSyncSupabase: (creds?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  }) => Promise<{ message: string }>;
  onConnectTikTok: (username: string) => Promise<{ connected: boolean; message: string }>;
  onDisconnectTikTok: () => void;
  onSimulateEvent: (payload: {
    type: 'gift' | 'chat' | 'member' | 'like';
    username: string;
    message: string;
    giftName?: string;
    giftCount?: number;
    immediate?: boolean;
  }) => void;
}

const PRESET_TEST_COMMENTS = [
  {
    username: 'regio_curioso',
    message: '¿Por qué cuando una mujer te dice "no tengo nada, haz lo que quieras" ya valiste madre?',
    tag: 'Cosas de Mujeres',
  },
  {
    username: 'paco_san_nicolas',
    message: 'Mi ex me bloqueó de WhatsApp y me mandó 1 peso por SPEI nomás para reclamarme en el concepto.',
    tag: 'Cosas de Exs',
  },
  {
    username: 'fer_monterrey',
    message: '¿En la primera cita se divide la cuenta 50/50 o el vato tiene que pagar todo aunque ande bruja?',
    tag: 'Primeras Citas',
  },
  {
    username: 'tio_asador',
    message: 'En las carnes asadas nunca falta el compa que pone $50 pesos y se traga todo el ribeye.',
    tag: 'Carnes Asadas',
  },
  {
    username: 'karla_sincera',
    message: 'Adrián siempre aplicando psicología oscura y La Mole pidiendo perdón antes de saber qué hizo jajaja.',
    tag: 'Carrilla Hermanos',
  },
];

const FISH_SPANISH_VOICES = [
  { id: '3f45a7fd7a614655a61eb7027b955783', label: '🎙️ Locutor Radio K (Masculina ES)' },
  { id: 'a1fe2e1b6f324e27929d5088f2d09be3', label: '🎙️ Valentino (Masculina Profunda ES)' },
  { id: 'f53102becdf94a51af6d64010bc658f2', label: '🎙️ Narrador Estudio (Masculina ES)' },
  { id: 'bfed5c0810a347dbb62e8ccce7f59c48', label: '🎧 Voz Femenina Estudio (Femenina ES)' },
  { id: '35929683c49c4ec0bf779dc07d22620b', label: '🎧 Chica Streamer (Femenina Joven ES)' },
  { id: '26ff45fab722431c85eea2536e5c5197', label: '🎧 Idea Vilariño (Femenina Calma ES)' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  onStart,
  onStop,
  onNextTurn,
  onClearHistory,
  onRefreshResearch,
  onUpdateConfig,
  onSaveKeys,
  onSuggestTopics,
  onScrapeYoutube,
  onSyncSupabase,
  onConnectTikTok,
  onDisconnectTikTok,
  onSimulateEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'topics' | 'characters' | 'keys'>(
    'simulator'
  );

  // Simulator state
  const [simUsername, setSimUsername] = useState('compa_regio');
  const [simMessage, setSimMessage] = useState(
    '¿Qué opinan de las mujeres que te revisan hasta los likes de hace cuatro años?'
  );
  const [autoAudience, setAutoAudience] = useState(false);

  // Topic & Auto-Research state
  const [topicTitle, setTopicTitle] = useState(state.topic.title);
  const [topicPremise, setTopicPremise] = useState(state.topic.premise);
  const [autoResearchTurns, setAutoResearchTurns] = useState(state.autoResearchEveryTurns ?? 6);
  const [nicheKeyword, setNicheKeyword] = useState('Cosas de Mujeres y Parejas');
  const [suggestedTopics, setSuggestedTopics] = useState<TopicConfig[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // YouTube @hermanosdelechemx Transcript Scraper & Supabase state
  const [ytQueryInput, setYtQueryInput] = useState('Cosas de mujeres');
  const [kbStatusMsg, setKbStatusMsg] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  // Local editable drafts for Characters A and B so typing custom Voice IDs never gets overwritten by WS updates
  const [charDrafts, setCharDrafts] = useState<{ A: CharacterConfig; B: CharacterConfig }>(
    state.characters
  );
  const [savedToast, setSavedToast] = useState(false);

  // TikTok real connection state
  const [ttUsernameInput, setTtUsernameInput] = useState(state.tiktokUsername || '');
  const [ttStatusMsg, setTtStatusMsg] = useState('');

  // API keys state
  const [groqKey, setGroqKey] = useState('');
  const [fishKey, setFishKey] = useState('');

  useEffect(() => {
    setTopicTitle(state.topic.title);
    setTopicPremise(state.topic.premise);
  }, [state.topic.title, state.topic.premise]);

  useEffect(() => {
    if (typeof state.autoResearchEveryTurns === 'number') {
      setAutoResearchTurns(state.autoResearchEveryTurns);
    }
  }, [state.autoResearchEveryTurns]);

  // Sync character drafts when external config changes
  useEffect(() => {
    setCharDrafts(state.characters);
  }, [
    state.characters.A.fishVoiceId,
    state.characters.B.fishVoiceId,
    state.characters.A.name,
    state.characters.B.name,
  ]);

  // Automatic Audience Stress-Test Simulator
  useEffect(() => {
    if (!autoAudience) return;
    let idx = 0;
    const interval = setInterval(() => {
      const item = PRESET_TEST_COMMENTS[idx % PRESET_TEST_COMMENTS.length];
      idx++;
      onSimulateEvent({
        type: 'chat',
        username: item.username,
        message: item.message,
        immediate: !state.isRunning,
      });
    }, 11000);
    return () => clearInterval(interval);
  }, [autoAudience, onSimulateEvent, state.isRunning]);

  const triggerSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  const handleSaveCharacters = (nextChars = charDrafts) => {
    onUpdateConfig({ characters: nextChars });
    triggerSavedToast();
  };

  const handleSendCustomComment = (immediate: boolean) => {
    if (!simMessage.trim()) return;
    onSimulateEvent({
      type: 'chat',
      username: simUsername.trim() || 'espectador_live',
      message: simMessage.trim(),
      immediate,
    });
  };

  const handleSuggest = async () => {
    setLoadingTopics(true);
    try {
      const list = await onSuggestTopics(nicheKeyword);
      setSuggestedTopics(list);
    } finally {
      setLoadingTopics(false);
    }
  };

  const sources = state.researchSources || [];
  const turnsSinceResearch = state.turnsSinceLastResearch ?? 0;
  const maxTurnsResearch = state.autoResearchEveryTurns ?? 6;

  return (
    <div className="space-y-4">
      {/* MASTER TRANSPORT BAR: Start / Stop / Force Next Turn + Lookahead Pipeline Status */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                state.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                {state.isRunning
                  ? 'PODCAST EN AIRE (Respuesta Continua Activa)'
                  : 'Estudio Listo para Pruebas / En Vivo'}
                {savedToast && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                    <Check className="w-3 h-3" /> Guardado en disco
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {state.hasGroqKey ? 'Groq IA Activo' : 'Modo Demo'} •{' '}
                {state.hasFishKey ? 'Fish Audio HD Activo' : 'Voz Local'} • Fuentes rotan cada{' '}
                {maxTurnsResearch} turnos ({turnsSinceResearch}/{maxTurnsResearch})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!state.isRunning ? (
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Podcast en Vivo
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                Detener Podcast
              </button>
            )}

            <button
              onClick={onNextTurn}
              title="Forzar inmediatamente el siguiente turno de habla"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <StepForward className="w-4 h-4 text-cyan-400" />
              Siguiente Turno
            </button>

            <button
              onClick={onClearHistory}
              title="Limpiar historial de conversación para empezar de cero"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lookahead Pipeline Status Bar (Zero-Latency Audio Buffer) */}
        <div className="pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Pipeline Cero-Silencio:</span>
            {state.prefetchStatus === 'ready' && state.prefetchedSpeaker ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                ⚡ Respuesta y Audio de {state.characters[state.prefetchedSpeaker].name} YA PRE-CARGADOS (0s espera)
              </span>
            ) : state.prefetchStatus === 'generating' && state.prefetchedSpeaker ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold animate-pulse">
                ⏳ Pre-generando turno de {state.characters[state.prefetchedSpeaker].name} mientras habla el compañero...
              </span>
            ) : (
              <span className="text-slate-500">
                En espera (se activa automáticamente al hablar)
              </span>
            )}
          </div>

          <span className="text-slate-400 font-mono text-[10px]">
            Persistencia automática activa (JSON + .env)
          </span>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(
          [
            { id: 'simulator', label: '💬 Simulador Pre-Live', icon: MessageSquarePlus },
            { id: 'topics', label: '📚 Temas & Fuentes Auto', icon: Flame },
            { id: 'characters', label: '🤖 Bots & IDs de Voz', icon: Bot },
            { id: 'keys', label: '🔑 API Keys & TikTok', icon: KeyRound },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
              activeSubTab === tab.id
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: PRE-LIVE COMMENT & EVENT SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          {/* Custom Comment Box */}
          <div className="rounded-2xl bg-slate-900/95 border border-cyan-500/35 p-4 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
                  Simulador de Comentarios Entrantes (Prueba de Reacción Pre-Live)
                </h3>
                <p className="text-xs text-slate-400">
                  Al usar <b>⚡ Enviar y Hacer que Respondan AHORA</b>, el primer bot responde al usuario y el segundo bot pre-genera su contestación en paralelo para responderle sin pausas.
                </p>
              </div>

              <button
                onClick={() => setAutoAudience((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  autoAudience
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {autoAudience ? 'Auto-Audiencia: ACTIVA' : 'Simular Audiencia Automática'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Usuario de TikTok (@)
                </label>
                <input
                  type="text"
                  value={simUsername}
                  onChange={(e) => setSimUsername(e.target.value)}
                  placeholder="ej. carlos_dev"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Comentario o Pregunta para los Bots
                </label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendCustomComment(true);
                  }}
                  placeholder="Escribe una pregunta o crítica para ver cómo reaccionan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => handleSendCustomComment(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Enviar y Hacer que Respondan AHORA (Inicia Charla Continua)
              </button>
              <button
                onClick={() => handleSendCustomComment(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                Agregar a la Cola de Turnos ({state.eventQueue.length})
              </button>
            </div>
          </div>

          {/* 1-Click Preset Comments */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comentarios Rápidos de Prueba (1 Clic para disparar reacción)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_TEST_COMMENTS.map((preset, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400">@{preset.username}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 truncate mt-0.5">“{preset.message}”</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        onSimulateEvent({
                          type: 'chat',
                          username: preset.username,
                          message: preset.message,
                          immediate: true,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold transition-all"
                    >
                      ⚡ Probar Ahora
                    </button>
                    <button
                      onClick={() =>
                        onSimulateEvent({
                          type: 'chat',
                          username: preset.username,
                          message: preset.message,
                          immediate: false,
                        })
                      }
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all"
                    >
                      + Cola
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulate TikTok Gifts (Priority 1), Joins & Likes */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Simular Regalos (Prioridad 1), Likes y Nuevos Espectadores
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() =>
                  onSimulateEvent({
                    type: 'gift',
                    username: simUsername || 'fan_generoso',
                    message: 'envió 5x Rosa',
                    giftName: 'Rosa 🌹',
                    giftCount: 5,
                    immediate: true,
                  })
                }
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                🌹 5x Rosas
              </button>

              <button
                onClick={() =>
                  onSimulateEvent({
                    type: 'gift',
                    username: simUsername || 'vip_mecenas',
                    message: 'envió 1x León de TikTok',
                    giftName: 'León de TikTok 🦁',
                    giftCount: 1,
                    immediate: true,
                  })
                }
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-100 text-xs font-bold transition-all"
              >
                <Gift className="w-4 h-4 text-amber-300" />
                🦁 León VIP
              </button>

              <button
                onClick={() =>
                  onSimulateEvent({
                    type: 'member',
                    username: 'Nuevos Espectadores',
                    message: '@pedro_ia, @sofia_gamer y @luis_dev',
                    immediate: true,
                  })
                }
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-all"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                👋 Bienvenida Grupo
              </button>

              <button
                onClick={() =>
                  onSimulateEvent({
                    type: 'like',
                    username: 'Comunidad',
                    message: '1,500 likes acumulados en el live',
                    immediate: true,
                  })
                }
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-200 text-xs font-bold transition-all"
              >
                <Heart className="w-4 h-4 text-pink-400" />
                ❤️ +1,500 Likes
              </button>
            </div>
          </div>

          {/* Priority Queue & Dialogue History Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Cola de Prioridad TikTok ({state.eventQueue.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">P1 Regalos &gt; P2 Chat</span>
              </div>
              {state.eventQueue.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Cola vacía. Los bots progresan por las 6 fases del Director Conversacional.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {state.eventQueue.map((ev) => (
                    <div
                      key={ev.id}
                      className="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-bold text-cyan-400">@{ev.username}: </span>
                        <span className="text-slate-300">{ev.message}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 shrink-0">
                        P{ev.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Últimas Respuestas & Fuentes Citadas
                </span>
                <button
                  onClick={onClearHistory}
                  className="text-[10px] text-rose-400 hover:underline font-semibold"
                >
                  Limpiar
                </button>
              </div>
              {state.recentHistory.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Aún no hay diálogo registrado.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {state.recentHistory
                    .slice()
                    .reverse()
                    .map((turn) => (
                      <div
                        key={turn.id}
                        className="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-white">{turn.speakerName}</span>
                          {turn.directorPhase && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                              {turn.directorPhase}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 leading-snug">{turn.text}</p>
                        {turn.citedSource && (
                          <p className="text-[10px] text-amber-300/90 font-mono truncate">
                            📚 {turn.citedSource}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOPIC ENGINE & AUTOMATIC RESEARCH ROTATION */}
      {activeSubTab === 'topics' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Tema Activo del Debate (Se guarda automáticamente)
            </h3>
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Título del Debate</label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Premisa / Contexto</label>
                <textarea
                  rows={2}
                  value={topicPremise}
                  onChange={(e) => setTopicPremise(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onUpdateConfig({ topic: { title: topicTitle, premise: topicPremise } });
                    triggerSavedToast();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Tema e Investigar Fuentes
                </button>
              </div>
            </div>
          </div>

          {/* Automatic Source Rotation Parameter + Live Research Dossier */}
          <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Rotación Automática de Fuentes cada X Respuestas
                </h3>
                <p className="text-xs text-slate-400">
                  Cada {autoResearchTurns} turnos, el sistema busca automáticamente 6 nuevas fuentes y subtemas en segundo plano sin detener el podcast.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-300 font-semibold">Cada:</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={autoResearchTurns}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value || '0', 10));
                    setAutoResearchTurns(val);
                    onUpdateConfig({ autoResearchEveryTurns: val });
                    triggerSavedToast();
                  }}
                  className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 text-xs font-bold text-amber-300 text-center"
                />
                <span className="text-xs text-slate-400">respuestas</span>
                <div className="flex gap-1 ml-1">
                  {[4, 6, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setAutoResearchTurns(n);
                        onUpdateConfig({ autoResearchEveryTurns: n });
                        triggerSavedToast();
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        autoResearchTurns === n
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Dossier Activo ({sources.length} subtemas)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                   Contador actual: {turnsSinceResearch} / {maxTurnsResearch} respuestas
                </span>
              </div>
              <button
                onClick={onRefreshResearch}
                disabled={state.isResearching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${state.isResearching ? 'animate-spin' : ''}`}
                />
                {state.isResearching ? 'Investigando Web...' : 'Rotar Fuentes Ahora'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sources.map((src, i) => (
                <div
                  key={src.id}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300 truncate">
                      {i + 1}. {src.sourceName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0">
                      {src.subtopicAngle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{src.fact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Analizador de Tendencias (Generador de Temas Polémicos)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={nicheKeyword}
                onChange={(e) => setNicheKeyword(e.target.value)}
                placeholder="Ej. Criptomonedas, Videojuegos, IA, Trabajo Remoto..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <button
                onClick={handleSuggest}
                disabled={loadingTopics}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300"
              >
                {loadingTopics ? 'Generando...' : 'Sugerir 3 Temas'}
              </button>
            </div>

            {suggestedTopics.length > 0 && (
              <div className="space-y-2 pt-2">
                {suggestedTopics.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.premise}</p>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateConfig({ topic: item });
                        triggerSavedToast();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-bold shrink-0"
                    >
                      Usar e Investigar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =================================================================
              BASE DE CONOCIMIENTO DE TRANSCRIPTS @hermanosdelechemx (YouTube + Supabase)
              ================================================================= */}
          <div className="rounded-2xl bg-slate-900/95 border border-cyan-500/40 p-4 space-y-3 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  📺 Base de Conocimiento de Transcripts — @hermanosdelechemx
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    {(state.knowledgeBase || []).length} episodios indexados
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Descarga transcripciones del canal de YouTube de <b>Adrián Marcelo y La Mole</b> para que los bots adopten sus opiniones, anécdotas y forma exacta de hablar según el tema.
                </p>
              </div>
              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                  state.hasSupabase
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-700 text-slate-300'
                }`}
              >
                {state.hasSupabase ? '☁️ Supabase Sincronizado' : '💾 Base Local JSON Activa'}
              </span>
            </div>

            {/* Buscador / Extractor directo de YouTube @hermanosdelechemx */}
            <div className="flex flex-wrap gap-2 pt-1">
              <input
                type="text"
                value={ytQueryInput}
                onChange={(e) => setYtQueryInput(e.target.value)}
                placeholder="Tema o URL de YouTube de @hermanosdelechemx (ej. Cosas de mujeres, Cosas de infieles...)"
                className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
              />
              <button
                onClick={async () => {
                  setKbStatusMsg('Extrayendo transcript y posturas de @hermanosdelechemx en YouTube...');
                  const res = await onScrapeYoutube(ytQueryInput);
                  setKbStatusMsg(res.message);
                }}
                disabled={state.isScrapingYoutube}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow transition-all"
              >
                {state.isScrapingYoutube
                  ? '⏳ Descargando Transcript...'
                  : '⬇️ Descargar e Indexar de @hermanosdelechemx'}
              </button>
            </div>

            {/* Botones rápidos de episodios clásicos del canal */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">
                Descargar rápido del canal:
              </span>
              {[
                'Cosas de Mujeres',
                'Cosas de Exs',
                'Cosas de Infieles',
                'Cosas de Primeras Citas',
                'Cosas de Borrachos',
                'Cosas de Carnes Asadas',
                'Cosas de Señores Casados',
              ].map((presetTopic) => (
                <button
                  key={presetTopic}
                  onClick={async () => {
                    setYtQueryInput(presetTopic);
                    setKbStatusMsg(`Buscando "${presetTopic}" en @hermanosdelechemx...`);
                    const res = await onScrapeYoutube(presetTopic);
                    setKbStatusMsg(res.message);
                  }}
                  disabled={state.isScrapingYoutube}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-200 font-semibold transition-all"
                >
                  + {presetTopic}
                </button>
              ))}
            </div>

            {kbStatusMsg && (
              <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-xs text-cyan-200 font-medium">
                {kbStatusMsg}
              </div>
            )}

            {/* Lista de Episodios y Posturas en la Base de Datos */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 pt-1">
              {(state.knowledgeBase || []).map((ep) => (
                <div
                  key={ep.id}
                  className="p-3 rounded-xl bg-slate-950/95 border border-slate-800 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{ep.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        {ep.category}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateConfig({
                          topic: {
                            title: ep.title.replace(/^Hermanos de Leche\s*-\s*/i, ''),
                            premise: `Plática al estilo @hermanosdelechemx sobre ${ep.category}. Postura de Adrián vs. anécdotas de La Mole.`,
                          },
                        });
                        triggerSavedToast();
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold"
                    >
                      🎙️ Platicar de este Episodio
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="font-bold text-cyan-400 block mb-0.5">
                        🧠 Postura Adrián Marcelo:
                      </span>
                      <p className="text-slate-300 leading-snug">{ep.adrianPosition}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="font-bold text-rose-400 block mb-0.5">
                        🥩 Postura Iván &quot;La Mole&quot;:
                      </span>
                      <p className="text-slate-300 leading-snug">{ep.laMolePosition}</p>
                    </div>
                  </div>

                  {ep.transcriptExcerpts && ep.transcriptExcerpts.length > 0 && (
                    <div className="text-[10px] text-slate-400 italic bg-slate-900/50 p-2 rounded-lg border border-slate-800/70 space-y-1">
                      {ep.transcriptExcerpts.slice(0, 2).map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHARACTERS A & B CONFIG (WITH PERSISTENT CUSTOM VOICE IDS) */}
      {activeSubTab === 'characters' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B'] as const).map((id: SpeakerId) => {
              const char = charDrafts[id];
              const isCustomVoice = !FISH_SPANISH_VOICES.some((v) => v.id === char.fishVoiceId);

              const updateDraft = (patch: Partial<CharacterConfig>, saveImmediately = false) => {
                const next = {
                  ...charDrafts,
                  [id]: { ...charDrafts[id], ...patch },
                };
                setCharDrafts(next);
                if (saveImmediately) {
                  handleSaveCharacters(next);
                }
              };

              return (
                <div
                  key={id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      Presentador {id}: {char.name}
                    </span>
                    <button
                      onClick={() => handleSaveCharacters()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold"
                    >
                      <Save className="w-3 h-3" /> Guardar
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => updateDraft({ name: e.target.value })}
                      onBlur={() => handleSaveCharacters()}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rol / Postura</label>
                    <input
                      type="text"
                      value={char.role}
                      onChange={(e) => updateDraft({ role: e.target.value })}
                      onBlur={() => handleSaveCharacters()}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      System Prompt (Personalidad)
                    </label>
                    <textarea
                      rows={3}
                      value={char.systemPrompt}
                      onChange={(e) => updateDraft({ systemPrompt: e.target.value })}
                      onBlur={() => handleSaveCharacters()}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div className="pt-1 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-cyan-300">
                        ID de Voz Fish Audio (`reference_id`)
                      </label>
                      <button
                        onClick={() => {
                          handleSaveCharacters();
                          void fetch('/api/voice/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ speaker: id }),
                          });
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold transition-all"
                      >
                        🔊 Guardar y Probar Voz
                      </button>
                    </div>

                    <select
                      value={char.fishVoiceId}
                      onChange={(e) => updateDraft({ fishVoiceId: e.target.value }, true)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      {isCustomVoice && char.fishVoiceId && (
                        <option value={char.fishVoiceId}>
                          ✨ Tu ID Personalizado: {char.fishVoiceId}
                        </option>
                      )}
                      {FISH_SPANISH_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Pega aquí tu propio ID de Voz de Fish Audio (se guarda en disco y en `.env`):
                      </label>
                      <input
                        type="text"
                        value={char.fishVoiceId}
                        onChange={(e) => updateDraft({ fishVoiceId: e.target.value })}
                        onBlur={() => handleSaveCharacters()}
                        placeholder="Ej. 3f45a7fd7a614655a61eb7027b955783"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-cyan-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: API KEYS & REAL TIKTOK LIVE CONNECTOR */}
      {activeSubTab === 'keys' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">
              Conexión a TikTok Live Real (`tiktok-live-connector`)
            </h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={ttUsernameInput}
                onChange={(e) => setTtUsernameInput(e.target.value)}
                placeholder="@usuario_en_vivo"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              {!state.tiktokConnected ? (
                <button
                  onClick={async () => {
                    const res = await onConnectTikTok(ttUsernameInput);
                    setTtStatusMsg(res.message);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Conectar al Live
                </button>
              ) : (
                <button
                  onClick={() => {
                    onDisconnectTikTok();
                    setTtStatusMsg('Desconectado de TikTok Live');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  Desconectar (@{state.tiktokUsername})
                </button>
              )}
            </div>
            {ttStatusMsg && <p className="text-xs text-cyan-300">{ttStatusMsg}</p>}
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">
              Claves API en Caliente (Groq LLM + Fish Audio TTS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  GROQ_API_KEY ({state.hasGroqKey ? '✓ Configurada' : 'Modo Demo Activo'})
                </label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  FISH_AUDIO_API_KEY ({state.hasFishKey ? '✓ Configurada' : 'Voz Local Activa'})
                </label>
                <input
                  type="password"
                  value={fishKey}
                  onChange={(e) => setFishKey(e.target.value)}
                  placeholder="Clave de Fish Audio..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
            </div>
            <button
              onClick={() => {
                onSaveKeys({
                  groqApiKey: groqKey || undefined,
                  fishAudioApiKey: fishKey || undefined,
                });
                setGroqKey('');
                setFishKey('');
                triggerSavedToast();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Guardar Claves API
            </button>
          </div>

          {/* SUPABASE + RENDER.COM CLOUD CONFIGURATION */}
          <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/35 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                ☁️ Base de Datos en Supabase & Despliegue en Render.com
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {state.hasSupabase ? 'Conectado a Supabase' : 'Modo Local (hermanos-kb.json)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Para persistir todos los transcripts de <b>@hermanosdelechemx</b> en la nube al montar en <b>Render.com</b>, ejecuta el archivo <code>supabase/schema.sql</code> en tu proyecto de Supabase y coloca tus credenciales aquí o en las variables de entorno de Render (<code>render.yaml</code> incluido).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">SUPABASE_URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  SUPABASE_SERVICE_KEY / ANON_KEY
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={async () => {
                  const res = await onSyncSupabase({
                    supabaseUrl: supabaseUrl || undefined,
                    supabaseKey: supabaseKey || undefined,
                  });
                  setKbStatusMsg(res.message);
                  triggerSavedToast();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs"
              >
                ☁️ Guardar y Sincronizar Transcripts con Supabase
              </button>
              {kbStatusMsg && <span className="text-xs text-emerald-300">{kbStatusMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
