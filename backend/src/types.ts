export type SpeakerId = 'A' | 'B';

export type AvatarMode = 'rig2d' | 'live2d' | 'pngtuber';

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

export interface ApiKeysConfig {
  groqApiKey: string;
  fishAudioApiKey: string;
  tiktokUsername: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export type TikTokEventPriority = 1 | 2 | 3; // 1 = Gift, 2 = Relevant Chat Question, 3 = Member Join / Likes

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

export interface PersistedConfig {
  topic: TopicConfig;
  characters: {
    A: CharacterConfig;
    B: CharacterConfig;
  };
  stage: StageConfig;
  autoResearchEveryTurns: number;
  researchSources: ResearchSourceItem[];
}

export interface PodcastState {
  isRunning: boolean;
  activeSpeaker: SpeakerId | null;
  currentTurn: DialogueTurn | null;
  topic: TopicConfig;
  researchSources: ResearchSourceItem[];
  isResearching: boolean;
  autoResearchEveryTurns: number;
  turnsSinceLastResearch: number;
  prefetchStatus: 'idle' | 'generating' | 'ready';
  prefetchedSpeaker: SpeakerId | null;
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
