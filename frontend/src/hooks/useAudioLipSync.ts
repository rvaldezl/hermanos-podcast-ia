import { useCallback, useEffect, useRef, useState } from 'react';
import { DialogueTurn, LipSyncFrame, SpeakerId, VisemeType } from '../types';

const DEFAULT_FRAME: LipSyncFrame = {
  rms: 0,
  mouthOpenY: 0,
  mouthForm: 0,
  viseme: 'SIL',
  bands: { low: 0, midF1: 0, highF2: 0 },
  headPitch: 0,
  headRoll: 0,
  browLift: 0,
};

// Standard Spanish vowel formants (F1 & F2 in Hz) for acoustic synthesis & classification
const VOWEL_FORMANTS: Record<VisemeType, { f1: number; f2: number; open: number; form: number }> = {
  SIL: { f1: 300, f2: 1000, open: 0, form: 0 },
  A: { f1: 780, f2: 1350, open: 0.92, form: 0.1 },
  E: { f1: 500, f2: 2050, open: 0.62, form: 0.65 },
  I: { f1: 310, f2: 2550, open: 0.36, form: 0.95 },
  O: { f1: 520, f2: 920, open: 0.72, form: -0.65 },
  U: { f1: 330, f2: 750, open: 0.38, form: -0.95 },
};

export function useAudioLipSync(onTurnComplete?: (turnId: string) => void) {
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerId | null>(null);
  const [micSpeaker, setMicSpeaker] = useState<SpeakerId | null>(null);
  const [frame, setFrame] = useState<LipSyncFrame>(DEFAULT_FRAME);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const cleanupCurrentPlaybackRef = useRef<(() => void) | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const smoothRef = useRef({
    openY: 0,
    form: 0,
    rms: 0,
    phase: 0,
    latchedViseme: 'SIL' as VisemeType,
    lastStepMs: 0,
  });

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current! };
  }, []);

  // Continuous 60fps FFT & RMS spectral analyzer (0 GPU, <1% CPU)
  useEffect(() => {
    let mounted = true;
    const freqData = new Uint8Array(512);
    const timeData = new Uint8Array(1024);

    const updateLoop = () => {
      if (!mounted) return;
      const analyser = analyserRef.current;
      const ctx = audioCtxRef.current;

      if (analyser && ctx && (activeSpeaker || micSpeaker)) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // 1. Compute Time-Domain RMS
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const centered = (timeData[i] - 128) / 128;
          sumSquares += centered * centered;
        }
        const rawRms = Math.sqrt(sumSquares / timeData.length);
        const boostedRms = Math.min(1, rawRms * 4.2);

        // 2. Compute Spectral Energy across Formant Bands
        const nyquist = ctx.sampleRate / 2;
        const binHz = nyquist / freqData.length;

        const avgBand = (minHz: number, maxHz: number) => {
          const startBin = Math.max(1, Math.floor(minHz / binHz));
          const endBin = Math.min(freqData.length - 1, Math.ceil(maxHz / binHz));
          if (endBin <= startBin) return 0;
          let sum = 0;
          for (let b = startBin; b <= endBin; b++) {
            sum += freqData[b];
          }
          return sum / ((endBin - startBin + 1) * 255);
        };

        const lowE = avgBand(100, 450);      // Fundamental & rounded vowels (U, O)
        const midF1 = avgBand(450, 1300);    // F1 open vowels (A, O)
        const highF2 = avgBand(1300, 3200);  // F2 front spread vowels (E, I)

        const spectralEnergy = Math.max(boostedRms, (lowE * 0.7 + midF1 * 1.1 + highF2 * 1.2));
        const isSpeaking = spectralEnergy > 0.035;

        // 3. Classify Viseme (A, E, I, O, U, SIL) & Target Mouth Parameters
        let viseme: VisemeType = 'SIL';
        let targetOpen = 0;
        let targetForm = 0;

        if (isSpeaking) {
          targetOpen = Math.min(1, Math.max(0.18, (spectralEnergy - 0.03) * 1.85));

          // Formant ratio analysis
          const f2ToF1 = (highF2 + 0.01) / (midF1 + 0.01);
          const openRatio = (midF1 + 0.01) / (lowE + 0.01);

          if (highF2 > midF1 * 0.85 && f2ToF1 > 0.92) {
            // Front spread vowel: I or E
            if (openRatio > 0.78 || targetOpen > 0.55) {
              viseme = 'E';
              targetForm = 0.65;
            } else {
              viseme = 'I';
              targetForm = 0.95;
              targetOpen = Math.min(targetOpen, 0.48);
            }
          } else if (midF1 > lowE * 0.72) {
            // Open vowel: A or O
            if (highF2 < midF1 * 0.42) {
              viseme = 'O';
              targetForm = -0.68;
            } else {
              viseme = 'A';
              targetForm = 0.12;
              targetOpen = Math.min(1, targetOpen * 1.15);
            }
          } else {
            // Low frequency dominant -> rounded O or U
            if (targetOpen > 0.52) {
              viseme = 'O';
              targetForm = -0.65;
            } else {
              viseme = 'U';
              targetForm = -0.92;
              targetOpen = Math.min(targetOpen, 0.45);
            }
          }
        }

        // 4. Lógica Stop-Motion / Cutout (8 a 12 FPS -> muestreo escalonado cada 95 ms, cero lerp en visema)
        const prev = smoothRef.current;
        const nowMs = performance.now();
        const STEP_INTERVAL_MS = 95; // ~10.5 FPS estilo South Park cutout

        if (!isSpeaking) {
          prev.latchedViseme = 'SIL';
          prev.openY = 0;
          prev.form = 0;
          prev.rms = 0;
        } else if (nowMs - prev.lastStepMs >= STEP_INTERVAL_MS || prev.latchedViseme === 'SIL') {
          prev.latchedViseme = viseme;
          prev.openY = targetOpen;
          prev.form = targetForm;
          prev.rms = spectralEnergy;
          prev.lastStepMs = nowMs;
        }

        const browLift = prev.latchedViseme === 'A' || prev.latchedViseme === 'O' ? 1 : 0;

        setFrame({
          rms: Number(prev.rms.toFixed(3)),
          mouthOpenY: Number(prev.openY.toFixed(3)),
          mouthForm: Number(prev.form.toFixed(3)),
          viseme: prev.latchedViseme,
          bands: {
            low: Math.min(100, Math.round(lowE * 165)),
            midF1: Math.min(100, Math.round(midF1 * 185)),
            highF2: Math.min(100, Math.round(highF2 * 210)),
          },
          headPitch: 0,
          headRoll: 0,
          browLift,
        });
      } else {
        if (smoothRef.current.openY > 0 || smoothRef.current.latchedViseme !== 'SIL') {
          smoothRef.current = {
            openY: 0,
            form: 0,
            rms: 0,
            phase: 0,
            latchedViseme: 'SIL',
            lastStepMs: 0,
          };
          setFrame(DEFAULT_FRAME);
        }
      }

      rafRef.current = requestAnimationFrame(updateLoop);
    };

    rafRef.current = requestAnimationFrame(updateLoop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeSpeaker, micSpeaker]);

  // Play a dialogue turn (either Fish Audio MP3 or synchronized Formant + Browser TTS)
  const playTurn = useCallback(
    async (turn: DialogueTurn) => {
      if (cleanupCurrentPlaybackRef.current) {
        cleanupCurrentPlaybackRef.current();
        cleanupCurrentPlaybackRef.current = null;
      }

      const { ctx, analyser } = ensureAudioContext();
      setActiveSpeaker(turn.speaker);

      // Case 1: Real Fish Audio MP3 Base64
      if (!turn.useBrowserTTS && turn.audioBase64) {
        try {
          const binary = atob(turn.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyser);
          analyser.connect(ctx.destination);

          let ended = false;
          const finish = () => {
            if (ended) return;
            ended = true;
            try {
              source.disconnect();
            } catch {
              // ignore
            }
            setActiveSpeaker(null);
            onTurnComplete?.(turn.id);
          };

          source.onended = finish;
          cleanupCurrentPlaybackRef.current = () => {
            ended = true;
            try {
              source.stop();
              source.disconnect();
            } catch {
              // ignore
            }
          };

          source.start(0);
          return;
        } catch (err) {
          console.warn('[useAudioLipSync] Falló decodificación MP3, usando sintetizador formántico:', err);
        }
      }

      // Case 2: Demo / Fallback Mode (Browser SpeechSynthesis + Acoustic Formant Generator into AnalyserNode)
      // Since window.speechSynthesis does not connect to Web Audio AnalyserNode, we generate a real
      // formant-filtered signal matching each vowel in `turn.text` into `analyser` (at ultra-low audible gain)
      // while speaking aloud via speechSynthesis!
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = turn.speaker === 'A' ? 125 : 210; // Male vs Female fundamental pitch

      const f1Filter = ctx.createBiquadFilter();
      f1Filter.type = 'bandpass';
      f1Filter.Q.value = 4.5;

      const f2Filter = ctx.createBiquadFilter();
      f2Filter.type = 'bandpass';
      f2Filter.Q.value = 5.5;

      const envGain = ctx.createGain();
      envGain.gain.value = 0;

      const silentMonitor = ctx.createGain();
      silentMonitor.gain.value = 0.015; // Barely audible murmur if speechSynthesis is muted, full signal to AnalyserNode

      osc.connect(f1Filter);
      osc.connect(f2Filter);
      f1Filter.connect(envGain);
      f2Filter.connect(envGain);
      envGain.connect(analyser);
      analyser.connect(silentMonitor);
      silentMonitor.connect(ctx.destination);

      osc.start();

      // Step through characters in `turn.text` at ~62ms per character to drive real F1/F2 vowel formants
      const chars = turn.text.toUpperCase().split('');
      let charIndex = 0;
      const charInterval = setInterval(() => {
        if (charIndex >= chars.length) {
          envGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
          return;
        }
        const ch = chars[charIndex++];
        let v: VisemeType = 'SIL';
        if ('AÁ'.includes(ch)) v = 'A';
        else if ('EÉ'.includes(ch)) v = 'E';
        else if ('IÍY'.includes(ch)) v = 'I';
        else if ('OÓ'.includes(ch)) v = 'O';
        else if ('UÚW'.includes(ch)) v = 'U';
        else if (/[BCDFGHJKLMNÑPQRSTVXZ]/.test(ch)) {
          // Consonant: brief semi-open transition
          v = charIndex % 2 === 0 ? 'E' : 'O';
        }

        const spec = VOWEL_FORMANTS[v];
        f1Filter.frequency.setTargetAtTime(spec.f1, ctx.currentTime, 0.02);
        f2Filter.frequency.setTargetAtTime(spec.f2, ctx.currentTime, 0.02);
        const targetGain = v === 'SIL' ? 0.0 : /[AEIOUÁÉÍÓÚ]/.test(ch) ? 0.65 : 0.28;
        envGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.018);
      }, 62);

      let completed = false;
      const finishTurn = () => {
        if (completed) return;
        completed = true;
        clearInterval(charInterval);
        try {
          osc.stop();
          osc.disconnect();
          envGain.disconnect();
        } catch {
          // ignore
        }
        setActiveSpeaker(null);
        onTurnComplete?.(turn.id);
      };

      // Speak aloud with Web Speech API if available
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(turn.text);
        utter.lang = 'es-MX';
        utter.rate = 1.08;
        utter.pitch = turn.speaker === 'A' ? 0.92 : 1.18;

        const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('es'));
        if (voices.length > 0) {
          utter.voice = turn.speaker === 'A' ? voices[0] : voices[Math.min(1, voices.length - 1)];
        }

        utter.onend = finishTurn;
        utter.onerror = finishTurn;
        window.speechSynthesis.speak(utter);
      }

      const fallbackDuration = Math.max(2600, chars.length * 66);
      const timer = setTimeout(finishTurn, fallbackDuration + 600);

      cleanupCurrentPlaybackRef.current = () => {
        completed = true;
        clearInterval(charInterval);
        clearTimeout(timer);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        try {
          osc.stop();
          osc.disconnect();
          envGain.disconnect();
        } catch {
          // ignore
        }
      };
    },
    [ensureAudioContext, onTurnComplete]
  );

  // Live Microphone Test for either Avatar A or B
  const toggleMicTest = useCallback(
    async (speaker: SpeakerId) => {
      if (micSpeaker === speaker) {
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
        }
        setMicSpeaker(null);
        return;
      }

      try {
        const { ctx, analyser } = ensureAudioContext();
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const micSource = ctx.createMediaStreamSource(stream);
        micSource.connect(analyser);
        setMicSpeaker(speaker);
      } catch (err) {
        console.error('[useAudioLipSync] No se pudo acceder al micrófono:', err);
      }
    },
    [ensureAudioContext, micSpeaker]
  );

  const stopPlayback = useCallback(() => {
    if (cleanupCurrentPlaybackRef.current) {
      cleanupCurrentPlaybackRef.current();
      cleanupCurrentPlaybackRef.current = null;
    }
    setActiveSpeaker(null);
  }, []);

  return {
    activeSpeaker: micSpeaker || activeSpeaker,
    micSpeaker,
    frame,
    playTurn,
    stopPlayback,
    toggleMicTest,
  };
}
