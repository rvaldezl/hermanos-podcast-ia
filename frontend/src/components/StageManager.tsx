import React from 'react';
import { Eye, Image, Layers, Mic, MicOff, Sliders, Sparkles } from 'lucide-react';
import { AvatarMode, CharacterConfig, PodcastState, SpeakerId, StageConfig } from '../types';

interface StageManagerProps {
  state: PodcastState;
  micSpeaker: SpeakerId | null;
  onUpdateConfig: (partial: {
    characters?: { A: CharacterConfig; B: CharacterConfig };
    stage?: StageConfig;
  }) => void;
  onToggleMicTest: (speaker: SpeakerId) => void;
}

export const StageManager: React.FC<StageManagerProps> = ({
  state,
  micSpeaker,
  onUpdateConfig,
  onToggleMicTest,
}) => {
  const { characters, stage } = state;

  const updateChar = (id: SpeakerId, patch: Partial<CharacterConfig>) => {
    onUpdateConfig({
      characters: {
        ...characters,
        [id]: {
          ...characters[id],
          ...patch,
        },
      },
    });
  };

  const handleFileUpload = (
    callback: (dataUrl: string) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Microphone Live Lip-Sync Test Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-pink-950/60 border border-cyan-500/30 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Prueba de Lip-Sync & Visemas con tu Micrófono (0% GPU)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Habla por tu micrófono diciendo las vocales <span className="text-cyan-300 font-mono">A, E, I, O, U</span> para probar la deformación de boca y cabeza en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(['A', 'B'] as const).map((id) => {
              const active = micSpeaker === id;
              return (
                <button
                  key={id}
                  onClick={() => onToggleMicTest(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {active ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {active ? `Detener Mic (${characters[id].name})` : `Probar en ${characters[id].name}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Theme & Overlays */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Image className="w-4 h-4 text-cyan-400" />
          Escenario del Estudio & Capas OBS (1080×1920)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              { id: 'late-night-brick', label: '🧱 Estudio Ladrillo & Mesa' },
              { id: 'cyber-studio', label: 'Cyber Studio' },
              { id: 'neon-lounge', label: 'Neon Lounge' },
              { id: 'minimal-tech', label: 'Minimal Tech' },
              { id: 'chroma-green', label: 'Chroma Key (#00FF00)' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() =>
                onUpdateConfig({
                  stage: { ...stage, themePreset: preset.id, backgroundUrl: undefined },
                })
              }
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                stage.themePreset === preset.id && !stage.backgroundUrl
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>Subir fondo personalizado (.png/.jpg)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleFileUpload(
                  (url) => onUpdateConfig({ stage: { ...stage, backgroundUrl: url } }),
                  e
                )
              }
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={stage.showTopicBanner}
                onChange={(e) =>
                  onUpdateConfig({ stage: { ...stage, showTopicBanner: e.target.checked } })
                }
                className="rounded accent-cyan-400"
              />
              Banner de Tema
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={stage.showSubtitles}
                onChange={(e) =>
                  onUpdateConfig({ stage: { ...stage, showSubtitles: e.target.checked } })
                }
                className="rounded accent-cyan-400"
              />
              Subtítulos
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={stage.showTelemetry}
                onChange={(e) =>
                  onUpdateConfig({ stage: { ...stage, showTelemetry: e.target.checked } })
                }
                className="rounded accent-cyan-400"
              />
              Telemetría FFT / Visemas
            </label>
          </div>
        </div>
      </div>

      {/* Dual Avatar Engine Config (Rig 2.5D / Live2D / PNGTuber) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['A', 'B'] as const).map((id) => {
          const char = characters[id];
          return (
            <div
              key={id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Avatar {id}: {char.name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  {char.avatarMode.toUpperCase()}
                </span>
              </div>

              {/* Selector de Modo de Motor */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { mode: 'rig2d', label: 'Rig 2.5D' },
                    { mode: 'live2d', label: 'Live2D (.model3)' },
                    { mode: 'pngtuber', label: 'PNGTuber (4x)' },
                  ] as { mode: AvatarMode; label: string }[]
                ).map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => updateChar(id, { avatarMode: item.mode })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                      char.avatarMode === item.mode
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Opciones específicas del modo */}
              {char.avatarMode === 'rig2d' && (
                <div className="space-y-3 pt-1 text-xs">
                  <div>
                    <span className="block text-slate-400 mb-1.5 font-semibold">
                      Diseño de Personaje (Cuerpo Completo + Gestos):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'adrian', label: '🧔🏻 Estilo Adrián (Barba 3 días)' },
                          { id: 'lamole', label: '🧢 Estilo La Mole (Gorra + Barba)' },
                          { id: 'alex', label: '👓 Estilo Alex (Lentes Tech)' },
                          { id: 'sofi', label: '🎧 Estilo Sofi (Cabello Largo)' },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          onClick={() =>
                            updateChar(id, {
                              rigStyle: {
                                ...char.rigStyle,
                                preset: p.id,
                                glasses: p.id === 'alex' ? true : char.rigStyle.glasses,
                              },
                            })
                          }
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border text-left transition-all ${
                            char.rigStyle.preset === p.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col gap-1 text-slate-400">
                      <span>Color Principal</span>
                      <input
                        type="color"
                        value={char.rigStyle.primaryColor}
                        onChange={(e) =>
                          updateChar(id, {
                            rigStyle: { ...char.rigStyle, primaryColor: e.target.value },
                          })
                        }
                        className="w-full h-7 rounded cursor-pointer bg-slate-950 border border-slate-700"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-400">
                      <span>Cabello</span>
                      <input
                        type="color"
                        value={char.rigStyle.hairColor}
                        onChange={(e) =>
                          updateChar(id, {
                            rigStyle: { ...char.rigStyle, hairColor: e.target.value },
                          })
                        }
                        className="w-full h-7 rounded cursor-pointer bg-slate-950 border border-slate-700"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-400">
                      <span>Tono Piel</span>
                      <input
                        type="color"
                        value={char.rigStyle.skinTone}
                        onChange={(e) =>
                          updateChar(id, {
                            rigStyle: { ...char.rigStyle, skinTone: e.target.value },
                          })
                        }
                        className="w-full h-7 rounded cursor-pointer bg-slate-950 border border-slate-700"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={char.rigStyle.glasses}
                        onChange={(e) =>
                          updateChar(id, {
                            rigStyle: { ...char.rigStyle, glasses: e.target.checked },
                          })
                        }
                        className="rounded accent-cyan-400"
                      />
                      Lentes
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={char.rigStyle.headphones}
                        onChange={(e) =>
                          updateChar(id, {
                            rigStyle: { ...char.rigStyle, headphones: e.target.checked },
                          })
                        }
                        className="rounded accent-cyan-400"
                      />
                      Audífonos LED
                    </label>
                  </div>
                </div>
              )}

              {char.avatarMode === 'live2d' && (
                <div className="space-y-2 pt-1 text-xs">
                  <label className="block text-slate-400">
                    URL de modelo Live2D (`.model3.json` / `.model.json`):
                  </label>
                  <input
                    type="text"
                    value={char.live2dModelUrl || ''}
                    onChange={(e) => updateChar(id, { live2dModelUrl: e.target.value })}
                    placeholder="https://.../model.model3.json"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    Inyecta en tiempo real <code className="text-cyan-300">ParamMouthOpenY</code> y{' '}
                    <code className="text-cyan-300">ParamMouthForm</code>.
                  </p>
                </div>
              )}

              {char.avatarMode === 'pngtuber' && (
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  {(
                    [
                      { key: 'idleOpen', label: '1. Reposo (idle_open)' },
                      { key: 'idleBlink', label: '2. Parpadeo (idle_blink)' },
                      { key: 'talkHalf', label: '3. Habla suave (talk_half)' },
                      { key: 'talkOpen', label: '4. Habla fuerte (talk_open)' },
                    ] as const
                  ).map((sp) => (
                    <label
                      key={sp.key}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-dashed border-slate-700 hover:border-cyan-400 cursor-pointer text-center"
                    >
                      <span className="text-slate-300 font-medium">{sp.label}</span>
                      <span className="text-[10px] text-cyan-400 mt-0.5">
                        {char.pngSprites[sp.key] ? '✓ Cargado' : 'Subir .PNG'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/webp"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            (url) =>
                              updateChar(id, {
                                pngSprites: { ...char.pngSprites, [sp.key]: url },
                              }),
                            e
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              )}

              {/* Escala del personaje */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Escala ({char.position.scale.toFixed(2)}x)
                </span>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={char.position.scale}
                  onChange={(e) =>
                    updateChar(id, {
                      position: { ...char.position, scale: parseFloat(e.target.value) },
                    })
                  }
                  className="w-36 accent-cyan-400"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
