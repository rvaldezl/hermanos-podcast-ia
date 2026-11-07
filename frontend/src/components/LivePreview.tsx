import React, { useEffect, useState } from 'react';
import { Gift, Heart, MessageCircleQuestion, Radio, Sparkles, Users } from 'lucide-react';
import { LipSyncFrame, PodcastState, SpeakerId } from '../types';
import { PodcastBackground } from './PodcastBackground';
import { CharacterLeft } from './CharacterLeft';
import { CharacterRight } from './CharacterRight';

interface LivePreviewProps {
  state: PodcastState;
  activeSpeaker: SpeakerId | null;
  lipSync: LipSyncFrame;
  isObsMode?: boolean;
}

const THEME_BACKGROUNDS: Record<PodcastState['stage']['themePreset'], string> = {
  'late-night-brick': '#140c0a',
  'cyber-studio':
    'radial-gradient(circle at 50% 22%, rgba(14, 165, 233, 0.28) 0%, rgba(88, 28, 135, 0.25) 45%, rgba(2, 6, 23, 0.98) 100%)',
  'neon-lounge':
    'radial-gradient(circle at 50% 25%, rgba(236, 72, 153, 0.3) 0%, rgba(30, 27, 75, 0.85) 55%, rgba(9, 9, 11, 0.98) 100%)',
  'minimal-tech': 'linear-gradient(180deg, #0f172a 0%, #1e293b 55%, #020617 100%)',
  'chroma-green': '#00ff00',
};

export const LivePreview: React.FC<LivePreviewProps> = ({
  state,
  activeSpeaker,
  lipSync,
  isObsMode = false,
}) => {
  const { characters, stage, topic, currentTurn } = state;
  const activeEvent = currentTurn?.triggeredByEvent;

  // Reloj de animación compartido (30fps) y parpadeo natural independiente para cada personaje
  const [tick, setTick] = useState(0);
  const [blinkLeft, setBlinkLeft] = useState(false);
  const [blinkRight, setBlinkRight] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 7200);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const loopLeft = () => {
      t1 = setTimeout(() => {
        setBlinkLeft(true);
        t2 = setTimeout(() => {
          setBlinkLeft(false);
          loopLeft();
        }, 130);
      }, 2400 + Math.random() * 2300);
    };
    loopLeft();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const loopRight = () => {
      t1 = setTimeout(() => {
        setBlinkRight(true);
        t2 = setTimeout(() => {
          setBlinkRight(false);
          loopRight();
        }, 130);
      }, 2700 + Math.random() * 2400);
    };
    loopRight();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const timeSec = tick * 0.033;

  return (
    <div
      className={`relative overflow-hidden select-none flex flex-col justify-between ${
        isObsMode
          ? 'w-screen h-screen'
          : 'w-full max-w-[430px] aspect-[9/16] rounded-3xl border-2 border-slate-800 shadow-[0_0_55px_rgba(14,165,233,0.18)]'
      }`}
      style={{
        background: stage.backgroundUrl
          ? `url(${stage.backgroundUrl}) center/cover no-repeat`
          : THEME_BACKGROUNDS[stage.themePreset] || THEME_BACKGROUNDS['late-night-brick'],
      }}
    >
      {/* =====================================================================
          ESCENA EN 3 COMPONENTES SUPERPUESTOS (1080x1920 / viewBox 540x960):
          1. <PodcastBackground /> (Cabina acústica, sillones, mesa y micrófonos fijos)
          2. <CharacterLeft /> (Adrián Marcelo sentado e integrado)
          3. <CharacterRight /> (La Mole sentado e integrado)
          ===================================================================== */}
      <PodcastBackground
        activeSpeaker={activeSpeaker}
        mouthOpenY={activeSpeaker ? lipSync.mouthOpenY : 0}
      >
        <CharacterLeft
          character={characters.A}
          isSpeaking={activeSpeaker === 'A'}
          isBlinking={blinkLeft}
          lipSync={lipSync}
          timeSec={timeSec}
        />
        <CharacterRight
          character={characters.B}
          isSpeaking={activeSpeaker === 'B'}
          isBlinking={blinkRight}
          lipSync={lipSync}
          timeSec={timeSec}
        />
      </PodcastBackground>

      {/* SECCIÓN SUPERIOR: Banner de Tema y Tarjeta de Evento de TikTok */}
      <div className="relative z-30 p-3.5 space-y-2">
        {stage.showTopicBanner && (
          <div className="rounded-2xl bg-slate-950/88 border border-slate-700/80 p-3 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow">
                  <Radio className="w-3 h-3 animate-pulse" />
                  LIVE PODCAST IA
                </span>
                <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30">
                  VTuber 2.5D • 0 GPU
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1080×1920</span>
            </div>
            <h2 className="text-xs font-extrabold text-white leading-snug line-clamp-2">
              {topic.title}
            </h2>
            <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1 opacity-85">
              {topic.premise}
            </p>
          </div>
        )}

        {/* Tarjeta flotante de evento activo de TikTok Live */}
        {activeEvent && (
          <div
            className={`rounded-2xl p-2.5 border backdrop-blur-md shadow-xl transition-all duration-300 ${
              activeEvent.type === 'gift'
                ? 'bg-amber-950/90 border-amber-400/70 text-amber-100'
                : activeEvent.type === 'chat'
                ? 'bg-slate-900/92 border-cyan-400/70 text-cyan-50'
                : 'bg-slate-900/90 border-emerald-400/60 text-emerald-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-xl shrink-0 ${
                  activeEvent.type === 'gift'
                    ? 'bg-amber-500/30 text-amber-300'
                    : activeEvent.type === 'chat'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'bg-emerald-500/30 text-emerald-300'
                }`}
              >
                {activeEvent.type === 'gift' ? (
                  <Gift className="w-4 h-4" />
                ) : activeEvent.type === 'chat' ? (
                  <MessageCircleQuestion className="w-4 h-4" />
                ) : activeEvent.type === 'like' ? (
                  <Heart className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold truncate">@{activeEvent.username}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/50 font-mono">
                    {activeEvent.type === 'gift'
                      ? '🎁 Regalo P1'
                      : activeEvent.type === 'chat'
                      ? '💬 Pregunta Chat'
                      : '✨ Evento Live'}
                  </span>
                </div>
                <p className="text-xs font-medium leading-tight mt-0.5 break-words">
                  “{activeEvent.message}”
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN MEDIA-BAJA: Placas de Nombre, Visemas y Telemetría Espectral */}
      <div className="relative z-30 flex-1 flex flex-col justify-end pb-1">
        {/* Placas de nombre al pie de la mesa */}
        <div className="flex items-center justify-around px-3 mb-1.5">
          {(['A', 'B'] as const).map((id) => {
            const char = characters[id];
            const speaking = activeSpeaker === id;
            return (
              <div
                key={id}
                className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/92 border border-slate-700/90 shadow-xl backdrop-blur-md"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    speaking ? 'scale-125 animate-pulse' : 'opacity-45'
                  }`}
                  style={{ backgroundColor: speaking ? char.rigStyle.primaryColor : '#475569' }}
                />
                <span className="text-xs font-extrabold tracking-wide text-white">
                  {char.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/95 text-slate-300 font-semibold">
                  {speaking ? `Hablando [${lipSync.viseme}]` : 'Escuchando'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Barra de Visemas y Bandas FFT */}
        <div className="mx-3 rounded-2xl bg-slate-950/92 border border-slate-700/80 p-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                {activeSpeaker
                  ? `Hablando: ${characters[activeSpeaker].name}`
                  : 'En espera de turno'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {(['SIL', 'A', 'E', 'I', 'O', 'U'] as const).map((v) => {
                const isActive = (activeSpeaker ? lipSync.viseme : 'SIL') === v;
                return (
                  <span
                    key={v}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-extrabold scale-110 shadow'
                        : 'bg-slate-800/90 text-slate-400'
                    }`}
                  >
                    {v}
                  </span>
                );
              })}
            </div>
          </div>

          {stage.showTelemetry && (
            <div className="mt-2 pt-2 border-t border-slate-800/90 grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-300">
              <div>
                <div className="flex justify-between">
                  <span>Bajos (U/O)</span>
                  <span className="text-cyan-400">{lipSync.bands.low}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${lipSync.bands.low}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>F1 Med (A/O)</span>
                  <span className="text-emerald-400">{lipSync.bands.midF1}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${lipSync.bands.midF1}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>F2 Altos (E/I)</span>
                  <span className="text-pink-400">{lipSync.bands.highF2}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-pink-400 transition-all duration-75"
                    style={{ width: `${lipSync.bands.highF2}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Subtítulos Dinámicos y Fuente Citada */}
      <div className="relative z-30 px-3 pb-3.5 min-h-[104px] flex flex-col justify-end">
        {stage.showSubtitles && currentTurn ? (
          <div className="rounded-2xl bg-slate-950/92 border border-slate-700/90 p-3 shadow-2xl backdrop-blur-md space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-slate-950 shrink-0"
                  style={{
                    backgroundColor: characters[currentTurn.speaker].rigStyle.primaryColor,
                  }}
                >
                  {currentTurn.speakerName}
                </span>
                {currentTurn.directorPhase && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 truncate">
                    {currentTurn.directorPhase}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-mono shrink-0">
                {currentTurn.useBrowserTTS ? 'Voz Local' : 'Fish Audio HD'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
              “{currentTurn.text}”
            </p>

            {currentTurn.citedSource && (
              <div className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1 pt-0.5 border-t border-slate-800/80 truncate">
                <span>📚 Fuente en debate:</span>
                <span className="font-semibold text-amber-200 truncate">
                  {currentTurn.citedSource}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-950/85 border border-slate-800/90 p-3 text-center">
            <p className="text-xs text-slate-300">
              Presiona <span className="text-cyan-400 font-semibold">Iniciar Podcast</span> o envía un comentario simulado para ver a{' '}
              <span className="text-white font-semibold">{characters.A.name}</span> y{' '}
              <span className="text-white font-semibold">{characters.B.name}</span> en acción.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
