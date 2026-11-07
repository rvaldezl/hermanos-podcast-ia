import fs from 'fs';
import path from 'path';
import { PersistedConfig } from '../types';

const DATA_DIR = path.resolve(__dirname, '../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'podcast-config.json');
const ENV_FILE = path.resolve(__dirname, '../../.env');

export class ConfigStore {
  public static load(): Partial<PersistedConfig> | null {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return null;
      }
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as Partial<PersistedConfig>;
    } catch (error) {
      console.warn('[ConfigStore] No se pudo leer podcast-config.json:', error);
      return null;
    }
  }

  public static save(config: PersistedConfig): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

      // Also keep FISH_VOICE_ID_A and FISH_VOICE_ID_B in sync in backend/.env if it exists
      if (fs.existsSync(ENV_FILE)) {
        let envText = fs.readFileSync(ENV_FILE, 'utf-8');
        const voiceA = config.characters.A.fishVoiceId.trim();
        const voiceB = config.characters.B.fishVoiceId.trim();

        if (voiceA) {
          if (/^FISH_VOICE_ID_A=/m.test(envText)) {
            envText = envText.replace(/^FISH_VOICE_ID_A=.*$/m, `FISH_VOICE_ID_A=${voiceA}`);
          } else {
            envText += `\nFISH_VOICE_ID_A=${voiceA}`;
          }
        }
        if (voiceB) {
          if (/^FISH_VOICE_ID_B=/m.test(envText)) {
            envText = envText.replace(/^FISH_VOICE_ID_B=.*$/m, `FISH_VOICE_ID_B=${voiceB}`);
          } else {
            envText += `\nFISH_VOICE_ID_B=${voiceB}`;
          }
        }
        fs.writeFileSync(ENV_FILE, envText, 'utf-8');
      }
    } catch (error) {
      console.error('[ConfigStore] Error guardando configuración persistente:', error);
    }
  }
}
