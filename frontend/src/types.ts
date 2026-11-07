export type SpeakerId = 'A' | 'B';

export type AvatarMode = 'rig2d' | 'live2d' | 'pngtuber';

export type VisemeType = 'SIL' | 'A' | 'E' | 'I' | 'O' | 'U';

export interface LipSyncFrame {
  rms: number;          // 0.0 - 1.0 smoothed amplitude
  mouthOpenY: number;   // 0.0 - 1.0 Live2D ParamMouthOpenY
  mouthForm: number;    // -1.0 (round O/U) to +1.0 (wide E/I), 0.2 (A)
  viseme: VisemeType;
  bands: {
    low: number;        // 0 - 100 (100-450 Hz)
    midF1: number;      // 0 - 100 (450-1300 Hz)
    highF2: number;     // 0 - 100 (1300-3200 Hz)
  };
  headPitch: number;    // -10 to +10 deg
  headRoll: number;     // -8 to +8 deg
  browLift: number;     // 0.0 to 1.0
}

export interface PNGTuberSprites {
  idleOpen?: string;
  idleBlink?: string;
  talkHalf?: string;
  talkOpen?: string;
}

export interface Rig2DStyle {
  primaryColor: string;
  accentColor: string;
  hairColor: string;
  skinTone: string;
  glasses: boolean;
  headphones: boolean;
  preset: 'adrian' | 'lamole' | 'alex' | 'sofi';
}

export interface CharacterConfig {
  id: SpeakerId;
  name: string;
  role: string;
  systemPrompt: string;
  fishVoiceId: string;
  avatarMode: AvatarMode;
  live2dModelUrl?: string;
  pngSprites: PNGTuberSprites;
  rigStyle: Rig2DStyle;
  position: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface StageConfig {
  backgroundUrl?: string;
  themePreset: 'late-night-brick' | 'cyber-studio' | 'neon-lounge' | 'minimal-tech' | 'chroma-green';
  showSubtitles: boolean;
  showTelemetry: boolean;
  showTopicBanner: boolean;
}

export interface ResearchSourceItem {
  id: string;
  sourceName: string;
  fact: string;
  subtopicAngle: string;
  url?: string;
}

export interface HermanosEpisodeEntry {
  id: string;
  videoId: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  adrianPosition: string;
  laMolePosition: string;
  transcriptExcerpts: string[];
  fullTranscriptSnippet?: string;
  sourceType: 'seed' | 'youtube-transcript' | 'supabase';
  createdAt: number;
}

export interface TopicConfig {
  title: string;
  premise: string;
}

export type TikTokEventPriority = 1 | 2 | 3;

export interface TikTokEventItem {
  id: string;
  type: 'gift' | 'chat' | 'member' | 'like';
  priority: TikTokEventPriority;
  username: string;
  message: string;
  giftName?: string;
  giftCount?: number;
  timestamp: number;
}

export interface DialogueTurn {
  id: string;
  speaker: SpeakerId;
  speakerName: string;
  text: string;
  audioBase64?: string;
  audioMimeType?: string;
  useBrowserTTS: boolean;
  triggeredByEvent?: TikTokEventItem;
  citedSource?: string;
  directorPhase?: string;
  timestamp: number;
}

export interface PodcastState {
  isRunning: boolean;
  activeSpeaker: SpeakerId | null;
  currentTurn: DialogueTurn | null;
  topic: TopicConfig;
  researchSources?: ResearchSourceItem[];
  isResearching?: boolean;
  autoResearchEveryTurns?: number;
  turnsSinceLastResearch?: number;
  prefetchStatus?: 'idle' | 'generating' | 'ready';
  prefetchedSpeaker?: SpeakerId | null;
  characters: {
    A: CharacterConfig;
    B: CharacterConfig;
  };
  stage: StageConfig;
  tiktokConnected: boolean;
  tiktokUsername: string;
  eventQueue: TikTokEventItem[];
  recentHistory: DialogueTurn[];
  hasGroqKey: boolean;
  hasFishKey: boolean;
  hasSupabase?: boolean;
  knowledgeBase?: HermanosEpisodeEntry[];
  isScrapingYoutube?: boolean;
}
