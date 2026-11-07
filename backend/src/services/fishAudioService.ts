import { SpeakerId } from '../types';

export interface TTSResult {
  audioBase64?: string;
  audioMimeType?: string;
  useBrowserTTS: boolean;
}

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

export const DEFAULT_FISH_VOICES: Record<SpeakerId, string> = {
  A: process.env.FISH_VOICE_ID_A || '3f45a7fd7a614655a61eb7027b955783', // Locutor Masculino Español
  B: process.env.FISH_VOICE_ID_B || 'bfed5c0810a347dbb62e8ccce7f59c48', // Voz Femenina Español
};

export class FishAudioService {
  private apiKey: string;
  private model: string;

  constructor(
    apiKey = process.env.FISH_AUDIO_API_KEY || '',
    model = process.env.FISH_AUDIO_MODEL || 's2.1-pro-free'
  ) {
    this.apiKey = apiKey.trim();
    this.model = model.trim();
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
  }

  public hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  public async synthesizeSpeech(
    text: string,
    referenceId?: string,
    speaker: SpeakerId = 'A'
  ): Promise<TTSResult> {
    if (!this.hasApiKey()) {
      return { useBrowserTTS: true };
    }

    // Ensure every character ALWAYS has a deterministic voice reference_id so Fish Audio never randomizes voices
    const lockedVoiceId =
      referenceId && referenceId.trim().length > 0
        ? referenceId.trim()
        : DEFAULT_FISH_VOICES[speaker];

    try {
      const payload: Record<string, unknown> = {
        text,
        reference_id: lockedVoiceId,
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'balanced',
      };

      const response = await fetch(FISH_AUDIO_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          model: this.model,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[FishAudioService] HTTP ${response.status}: ${errText}. Usando sintetizador local.`);
        return { useBrowserTTS: true };
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

      return {
        audioBase64,
        audioMimeType: 'audio/mpeg',
        useBrowserTTS: false,
      };
    } catch (error) {
      console.error('[FishAudioService] Error al generar voz con Fish Audio:', error);
      return { useBrowserTTS: true };
    }
  }
}
