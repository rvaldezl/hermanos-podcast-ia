import { EventEmitter } from 'events';
import {
  ApiKeysConfig,
  CharacterConfig,
  DialogueTurn,
  HermanosEpisodeEntry,
  PodcastState,
  ResearchSourceItem,
  SpeakerId,
  StageConfig,
  TikTokEventItem,
  TopicConfig,
} from './types';
import { GroqService } from './services/groqService';
import { DEFAULT_FISH_VOICES, FishAudioService } from './services/fishAudioService';
import { TikTokService } from './services/tiktokService';
import { TopicEngine } from './services/topicEngine';
import { ResearchService } from './services/researchService';
import { ConfigStore } from './services/configStore';
import { HermanosKnowledgeService } from './services/hermanosKnowledgeService';

export class PodcastOrchestrator extends EventEmitter {
  private isRunning = false;
  private isGenerating = false;
  private isResearching = false;
  private isScrapingYoutube = false;
  private activeSpeaker: SpeakerId | null = null;
  private nextSpeaker: SpeakerId = 'A';
  private currentTurn: DialogueTurn | null = null;
  private safetyTurnTimer: NodeJS.Timeout | null = null;
  private nextTurnDelayTimer: NodeJS.Timeout | null = null;

  // Lookahead Pipeline (Pre-generation of next turn text + audio while current turn plays)
  private prefetchedTurn: DialogueTurn | null = null;
  private prefetchStatus: 'idle' | 'generating' | 'ready' = 'idle';
  private prefetchedSpeaker: SpeakerId | null = null;
  private prefetchGenerationId = 0;
  private activePrefetchPromise: Promise<DialogueTurn | null> | null = null;

  // Automatic Research Rotation
  private autoResearchEveryTurns = 6;
  private turnsSinceLastResearch = 0;

  private topic: TopicConfig = {
    title: 'Cosas de Mujeres, Exs y Vida en Pareja',
    premise:
      'Plática amena y sin filtros al estilo Hermanos de Leche (@hermanosdelechemx) sobre el FBI femenino, las indirectas, primeras citas y cómo sobrevive el hombre casado.',
  };

  private researchSources: ResearchSourceItem[] = [];

  private characters: { A: CharacterConfig; B: CharacterConfig } = {
    A: {
      id: 'A',
      name: 'Adrián Marcelo',
      role: 'Conductor @hermanosdelechemx • Psicólogo Regio & Humor Ácido',
      systemPrompt:
        'Eres Adrián Marcelo en el podcast Hermanos de Leche. Hablas relajado, irreverente, con humor negro inteligente, sarcasmo regio y observaciones psicológicas cínicas sobre las mujeres, las parejas, la peda y la sociedad. Le dices "compadre", "Iván" o "chaparrito" a La Mole y te gusta sacarle la sopa o llevarle la contraria para armar el cotorreo.',
      fishVoiceId: DEFAULT_FISH_VOICES.A,
      avatarMode: 'rig2d',
      live2dModelUrl:
        'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
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
        'Eres Iván Fematt "La Mole" en el podcast Hermanos de Leche. Hablas como comediante regio de barrio (San Nicolás / Nicolás Bravo), señor casado, bonachón, directo y maestro de las anécdotas de carnes asadas, caguamas, amigos cagapalos y vida matrimonial. Le dices "compadre" o "¡No mames, Adrián! Nombre, cállate" cuando Adrián dice una barbaridad.',
      fishVoiceId: DEFAULT_FISH_VOICES.B,
      avatarMode: 'rig2d',
      live2dModelUrl:
        'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
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
  };

  private stage: StageConfig = {
    themePreset: 'late-night-brick',
    showSubtitles: true,
    showTelemetry: true,
    showTopicBanner: true,
  };

  private eventQueue: TikTokEventItem[] = [];
  private recentHistory: DialogueTurn[] = [];

  private groqService: GroqService;
  private fishAudioService: FishAudioService;
  private tiktokService: TikTokService;
  private topicEngine: TopicEngine;
  private researchService: ResearchService;
  private knowledgeService: HermanosKnowledgeService;

  constructor() {
    super();
    this.groqService = new GroqService();
    this.fishAudioService = new FishAudioService();
    this.tiktokService = new TikTokService();
    this.topicEngine = new TopicEngine();
    this.researchService = new ResearchService();
    this.knowledgeService = new HermanosKnowledgeService();

    this.researchSources = this.researchService.getDefaultSources();

    // Load persisted configuration from disk if available
    const saved = ConfigStore.load();
    if (saved) {
      if (saved.topic) {
        // If it still had the old default AI programmers title, upgrade to Hermanos de Leche default topic
        if (saved.topic.title.includes('reemplazará a los programadores')) {
          this.topic = {
            title: 'Cosas de Mujeres, Exs y Vida en Pareja',
            premise:
              'Plática amena y sin filtros al estilo Hermanos de Leche (@hermanosdelechemx) sobre el FBI femenino, las indirectas, primeras citas y cómo sobrevive el hombre casado.',
          };
        } else {
          this.topic = { ...this.topic, ...saved.topic };
        }
      }
      if (saved.characters) {
        const savedPromptA = saved.characters.A?.systemPrompt || '';
        const savedPromptB = saved.characters.B?.systemPrompt || '';
        const isOldGenericA =
          savedPromptA.includes('Sofi') ||
          savedPromptA.includes('estudios de ingeniería') ||
          savedPromptA.includes('hype tecnológico');
        const isOldGenericB =
          savedPromptB.includes('Alex') ||
          savedPromptB.includes('revolución tecnológica') ||
          savedPromptB.includes('futuro tecnológico');

        this.characters = {
          A: {
            ...this.characters.A,
            ...saved.characters.A,
            name:
              saved.characters.A?.name === 'Alex' || saved.characters.A?.name === 'Ardrian'
                ? 'Adrián Marcelo'
                : saved.characters.A?.name || 'Adrián Marcelo',
            role: isOldGenericA ? this.characters.A.role : saved.characters.A?.role || this.characters.A.role,
            systemPrompt: isOldGenericA
              ? this.characters.A.systemPrompt
              : savedPromptA || this.characters.A.systemPrompt,
            fishVoiceId:
              saved.characters.A?.fishVoiceId?.trim() ||
              this.characters.A.fishVoiceId ||
              DEFAULT_FISH_VOICES.A,
          },
          B: {
            ...this.characters.B,
            ...saved.characters.B,
            name:
              saved.characters.B?.name === 'Sofi' || saved.characters.B?.name === 'El Mole'
                ? 'La Mole'
                : saved.characters.B?.name || 'La Mole',
            role: isOldGenericB ? this.characters.B.role : saved.characters.B?.role || this.characters.B.role,
            systemPrompt: isOldGenericB
              ? this.characters.B.systemPrompt
              : savedPromptB || this.characters.B.systemPrompt,
            fishVoiceId:
              saved.characters.B?.fishVoiceId?.trim() ||
              this.characters.B.fishVoiceId ||
              DEFAULT_FISH_VOICES.B,
          },
        };
      }
      if (saved.stage) this.stage = { ...this.stage, ...saved.stage };
      if (typeof saved.autoResearchEveryTurns === 'number') {
        this.autoResearchEveryTurns = saved.autoResearchEveryTurns;
      }
      if (
        Array.isArray(saved.researchSources) &&
        saved.researchSources.length > 0 &&
        saved.researchSources[0].sourceName.includes('hermanosdelechemx')
      ) {
        this.researchSources = saved.researchSources;
      } else {
        const matching = this.knowledgeService.findRelevantEpisodes(
          `${this.topic.title} ${this.topic.premise}`,
          6
        );
        this.researchSources = this.researchService.buildSourcesFromEpisodes(this.topic, matching);
      }
      this.savePersistedConfig();
    } else {
      this.savePersistedConfig();
    }

    this.tiktokService.on('tiktokEvent', (event: TikTokEventItem) => {
      this.enqueueTikTokEvent(event);
    });

    this.tiktokService.on('status', () => {
      this.broadcastState();
    });
  }

  private savePersistedConfig(): void {
    ConfigStore.save({
      topic: this.topic,
      characters: this.characters,
      stage: this.stage,
      autoResearchEveryTurns: this.autoResearchEveryTurns,
      researchSources: this.researchSources,
    });
  }

  public getState(): PodcastState {
    const ttStatus = this.tiktokService.getStatus();
    return {
      isRunning: this.isRunning,
      activeSpeaker: this.activeSpeaker,
      currentTurn: this.currentTurn,
      topic: this.topic,
      researchSources: this.researchSources,
      isResearching: this.isResearching,
      autoResearchEveryTurns: this.autoResearchEveryTurns,
      turnsSinceLastResearch: this.turnsSinceLastResearch,
      prefetchStatus: this.prefetchStatus,
      prefetchedSpeaker: this.prefetchedSpeaker,
      characters: this.characters,
      stage: this.stage,
      tiktokConnected: ttStatus.connected,
      tiktokUsername: ttStatus.username,
      eventQueue: this.eventQueue,
      recentHistory: this.recentHistory.slice(-14),
      hasGroqKey: this.groqService.hasApiKey(),
      hasFishKey: this.fishAudioService.hasApiKey(),
      hasSupabase: this.knowledgeService.hasSupabase(),
      knowledgeBase: this.knowledgeService.getAllEpisodes(),
      isScrapingYoutube: this.isScrapingYoutube,
    };
  }

  public updateConfig(partial: {
    topic?: TopicConfig;
    characters?: { A: CharacterConfig; B: CharacterConfig };
    stage?: StageConfig;
    autoResearchEveryTurns?: number;
  }): PodcastState {
    const topicChanged =
      partial.topic &&
      (partial.topic.title !== this.topic.title || partial.topic.premise !== this.topic.premise);

    if (partial.topic) {
      this.topic = { ...this.topic, ...partial.topic };
    }
    if (partial.characters) {
      const nextA = { ...this.characters.A, ...partial.characters.A };
      const nextB = { ...this.characters.B, ...partial.characters.B };
      if (!nextA.fishVoiceId?.trim()) {
        nextA.fishVoiceId = this.characters.A.fishVoiceId || DEFAULT_FISH_VOICES.A;
      }
      if (!nextB.fishVoiceId?.trim()) {
        nextB.fishVoiceId = this.characters.B.fishVoiceId || DEFAULT_FISH_VOICES.B;
      }
      this.characters = { A: nextA, B: nextB };
    }
    if (partial.stage) {
      this.stage = { ...this.stage, ...partial.stage };
    }
    if (typeof partial.autoResearchEveryTurns === 'number') {
      this.autoResearchEveryTurns = Math.max(0, Math.min(50, partial.autoResearchEveryTurns));
    }

    this.savePersistedConfig();
    this.invalidatePrefetch();
    this.broadcastState();

    // Automatically research real sources & facts when topic changes
    if (topicChanged) {
      this.turnsSinceLastResearch = 0;
      void this.refreshResearch();
    }

    return this.getState();
  }

  public async refreshResearch(): Promise<ResearchSourceItem[]> {
    if (this.isResearching) return this.researchSources;
    this.isResearching = true;
    this.broadcastState();
    try {
      const matchingEpisodes = this.knowledgeService.findRelevantEpisodes(
        `${this.topic.title} ${this.topic.premise}`,
        6
      );
      const sources = await this.researchService.investigateTopic(
        this.topic,
        this.researchSources,
        matchingEpisodes,
        this.knowledgeService.getAllEpisodes()
      );
      this.researchSources = sources;
      this.turnsSinceLastResearch = 0;
      this.savePersistedConfig();
      return sources;
    } finally {
      this.isResearching = false;
      this.broadcastState();
    }
  }

  public async scrapeYoutubeKnowledge(
    queryOrUrl: string
  ): Promise<{ added: HermanosEpisodeEntry[]; message: string }> {
    if (this.isScrapingYoutube) {
      return { added: [], message: 'Ya hay una extracción de YouTube en curso.' };
    }
    this.isScrapingYoutube = true;
    this.broadcastState();
    try {
      const res = await this.knowledgeService.scrapeAndIngestFromYoutube(queryOrUrl);
      this.invalidatePrefetch();
      // Refresh research dossier using the newly ingested episodes
      void this.refreshResearch();
      return res;
    } finally {
      this.isScrapingYoutube = false;
      this.broadcastState();
    }
  }

  public async syncSupabaseKnowledge(credentials?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  }): Promise<{ synced: number; connected: boolean; message: string }> {
    if (credentials?.supabaseUrl || credentials?.supabaseKey) {
      this.knowledgeService.setSupabaseCredentials(
        credentials.supabaseUrl,
        credentials.supabaseKey
      );
    }
    const result = await this.knowledgeService.syncWithSupabase();
    this.broadcastState();
    return result;
  }

  public clearHistory(): PodcastState {
    this.recentHistory = [];
    this.currentTurn = null;
    this.invalidatePrefetch();
    this.broadcastState();
    return this.getState();
  }

  public updateApiKeys(keys: Partial<ApiKeysConfig>): void {
    if (typeof keys.groqApiKey === 'string') {
      this.groqService.setApiKey(keys.groqApiKey);
      this.topicEngine.setApiKey(keys.groqApiKey);
      this.researchService.setApiKey(keys.groqApiKey);
      this.knowledgeService.setGroqApiKey(keys.groqApiKey);
    }
    if (typeof keys.fishAudioApiKey === 'string') {
      this.fishAudioService.setApiKey(keys.fishAudioApiKey);
    }
    if (keys.supabaseUrl || keys.supabaseKey) {
      this.knowledgeService.setSupabaseCredentials(keys.supabaseUrl, keys.supabaseKey);
    }
    this.broadcastState();
  }

  public async suggestTopics(keyword: string): Promise<TopicConfig[]> {
    return this.topicEngine.suggestTopics(keyword);
  }

  public async connectTikTok(username: string): Promise<{ connected: boolean; message: string }> {
    return this.tiktokService.connect(username);
  }

  public disconnectTikTok(): void {
    this.tiktokService.disconnect();
  }

  public simulateTikTokEvent(partial: {
    type: 'gift' | 'chat' | 'member' | 'like';
    username: string;
    message: string;
    giftName?: string;
    giftCount?: number;
  }): TikTokEventItem {
    return this.tiktokService.simulateEvent(partial);
  }

  public enqueueTikTokEvent(event: TikTokEventItem): void {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.timestamp - b.timestamp;
    });
    if (this.eventQueue.length > 20) {
      this.eventQueue = this.eventQueue.slice(0, 20);
    }
    this.emit('tiktokEvent', event);

    // If a turn is currently playing and we had prefetched an organic turn without this new event,
    // re-prefetch immediately in the background so the next speaker reacts to this new event with 0 latency!
    if (
      this.isRunning &&
      this.activeSpeaker &&
      (!this.prefetchedTurn?.triggeredByEvent ||
        event.priority < this.prefetchedTurn.triggeredByEvent.priority)
    ) {
      // Put back any event that was consumed by the cancelled prefetch
      if (this.prefetchedTurn?.triggeredByEvent) {
        this.eventQueue.push(this.prefetchedTurn.triggeredByEvent);
        this.eventQueue.sort((a, b) => a.priority - b.priority || a.timestamp - b.timestamp);
      }
      this.invalidatePrefetch();
      void this.startBackgroundPrefetch(this.nextSpeaker);
    }

    this.broadcastState();
  }

  private invalidatePrefetch(): void {
    this.prefetchGenerationId++;
    this.prefetchedTurn = null;
    this.prefetchStatus = 'idle';
    this.prefetchedSpeaker = null;
    this.activePrefetchPromise = null;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.broadcastState();
    void this.dispatchOrGenerateTurn();
  }

  public stop(): void {
    this.isRunning = false;
    this.isGenerating = false;
    this.activeSpeaker = null;
    this.currentTurn = null;
    this.invalidatePrefetch();
    if (this.safetyTurnTimer) {
      clearTimeout(this.safetyTurnTimer);
      this.safetyTurnTimer = null;
    }
    if (this.nextTurnDelayTimer) {
      clearTimeout(this.nextTurnDelayTimer);
      this.nextTurnDelayTimer = null;
    }
    this.broadcastState();
  }

  public completeTurn(turnId?: string): void {
    if (turnId && this.currentTurn && this.currentTurn.id !== turnId) {
      return;
    }
    if (this.safetyTurnTimer) {
      clearTimeout(this.safetyTurnTimer);
      this.safetyTurnTimer = null;
    }
    this.activeSpeaker = null;
    this.broadcastState();

    if (this.isRunning) {
      if (this.nextTurnDelayTimer) clearTimeout(this.nextTurnDelayTimer);
      // Fast 150ms natural breath transition when prefetchedTurn is ready!
      const transitionMs = this.prefetchedTurn ? 150 : 350;
      this.nextTurnDelayTimer = setTimeout(() => {
        void this.dispatchOrGenerateTurn();
      }, transitionMs);
    }
  }

  public async forceNextTurn(autoStartPodcast = true): Promise<void> {
    if (autoStartPodcast && !this.isRunning) {
      // Automatically set isRunning = true so when Bot A asks Bot B a question, Bot B always answers!
      this.isRunning = true;
    }
    // If there is a priority event in queue and our prefetched turn didn't include it, invalidate prefetch
    // so the forced turn immediately addresses the new event!
    if (this.eventQueue.length > 0 && !this.prefetchedTurn?.triggeredByEvent) {
      this.invalidatePrefetch();
    }
    if (this.safetyTurnTimer) {
      clearTimeout(this.safetyTurnTimer);
      this.safetyTurnTimer = null;
    }
    if (this.nextTurnDelayTimer) {
      clearTimeout(this.nextTurnDelayTimer);
      this.nextTurnDelayTimer = null;
    }
    await this.dispatchOrGenerateTurn(true);
  }

  public async testCharacterVoice(speaker: SpeakerId): Promise<DialogueTurn> {
    const charConfig = this.characters[speaker];
    const sampleText =
      speaker === 'A'
        ? `Hola, soy ${charConfig.name}. Esta es mi voz fija guardada para el podcast en vivo.`
        : `¡Hola a todos! Soy ${charConfig.name}, lista con mi voz configurada para debatir en directo.`;

    const tts = await this.fishAudioService.synthesizeSpeech(
      sampleText,
      charConfig.fishVoiceId,
      speaker
    );

    const turn: DialogueTurn = {
      id: `voicetest-${Date.now()}`,
      speaker,
      speakerName: charConfig.name,
      text: sampleText,
      audioBase64: tts.audioBase64,
      audioMimeType: tts.audioMimeType,
      useBrowserTTS: tts.useBrowserTTS,
      directorPhase: '🔊 Prueba de Voz Fija',
      timestamp: Date.now(),
    };

    this.currentTurn = turn;
    this.activeSpeaker = speaker;
    this.emit('turn', turn);
    this.broadcastState();
    return turn;
  }

  /**
   * Dispatches the already-prefetched turn in <50ms if ready, or awaits/generates one and
   * immediately launches background lookahead prefetching for the following speaker.
   */
  private async dispatchOrGenerateTurn(force = false): Promise<void> {
    if ((!this.isRunning && !force) || this.isGenerating) return;
    this.isGenerating = true;

    try {
      let turnToPlay: DialogueTurn | null = null;

      // 1. Check if we already have a pre-generated turn ready in the buffer!
      if (this.prefetchedTurn) {
        turnToPlay = this.prefetchedTurn;
        this.prefetchedTurn = null;
        this.prefetchStatus = 'idle';
        this.prefetchedSpeaker = null;
        this.nextSpeaker = turnToPlay.speaker === 'A' ? 'B' : 'A';
      } else if (this.activePrefetchPromise) {
        // A prefetch is currently in flight—wait for it to finish rather than starting from scratch!
        turnToPlay = await this.activePrefetchPromise;
        this.prefetchedTurn = null;
        this.prefetchStatus = 'idle';
        this.prefetchedSpeaker = null;
        if (turnToPlay) {
          this.nextSpeaker = turnToPlay.speaker === 'A' ? 'B' : 'A';
        }
      }

      // 2. If no prefetched turn was available (e.g., very first turn of the stream), generate it now
      if (!turnToPlay) {
        const speaker = this.nextSpeaker;
        this.nextSpeaker = speaker === 'A' ? 'B' : 'A';
        turnToPlay = await this.createTurnWithEarlyLookahead(speaker);
      } else {
        // Commit the prefetched turn to history and immediately start prefetching the NEXT speaker's turn!
        this.commitAndEmitTurn(turnToPlay);
        if (this.isRunning) {
          void this.startBackgroundPrefetch(this.nextSpeaker);
        }
      }
    } catch (error) {
      console.error('[Orchestrator] Error en dispatchOrGenerateTurn:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generates a turn AND starts pre-generating the partner's response as soon as Groq finishes the text
   * (in parallel with Fish Audio synthesizing the first speaker's audio!).
   */
  private async createTurnWithEarlyLookahead(speaker: SpeakerId): Promise<DialogueTurn> {
    const charConfig = this.characters[speaker];
    const nextEvent = this.eventQueue.shift();
    const relevantEpisodes = this.knowledgeService.findRelevantEpisodes(
      `${this.topic.title} ${this.topic.premise} ${nextEvent?.message || ''}`,
      3
    );

    // Step A: Generate speaker's text via Groq (~0.9s)
    const generated = await this.groqService.generateNextTurn({
      speaker,
      characters: this.characters,
      topic: this.topic,
      researchSources: this.researchSources,
      relevantEpisodes,
      recentHistory: this.recentHistory,
      event: nextEvent,
    });

    const provisionalTurn: DialogueTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker,
      speakerName: charConfig.name,
      text: generated.text,
      useBrowserTTS: true,
      triggeredByEvent: nextEvent,
      citedSource: generated.citedSource,
      directorPhase: generated.directorPhase,
      timestamp: Date.now(),
    };

    // Add to recentHistory right away so the partner bot can ALREADY read this response
    // and start generating its reply in parallel while Fish Audio generates the MP3!
    this.recentHistory.push(provisionalTurn);
    if (this.recentHistory.length > 24) {
      this.recentHistory = this.recentHistory.slice(-24);
    }

    const partnerSpeaker: SpeakerId = speaker === 'A' ? 'B' : 'A';
    if (this.isRunning) {
      void this.startBackgroundPrefetch(partnerSpeaker);
    }

    // Step B: Synthesize speaker's MP3 audio via Fish Audio
    const tts = await this.fishAudioService.synthesizeSpeech(
      generated.text,
      charConfig.fishVoiceId,
      speaker
    );

    provisionalTurn.audioBase64 = tts.audioBase64;
    provisionalTurn.audioMimeType = tts.audioMimeType;
    provisionalTurn.useBrowserTTS = tts.useBrowserTTS;

    this.commitAndEmitTurn(provisionalTurn, true);
    return provisionalTurn;
  }

  /**
   * Pre-generates the next turn (Groq text + Fish Audio MP3) in the background while the current speaker is talking.
   */
  private startBackgroundPrefetch(speaker: SpeakerId): Promise<DialogueTurn | null> {
    const genId = ++this.prefetchGenerationId;
    this.prefetchStatus = 'generating';
    this.prefetchedSpeaker = speaker;
    this.broadcastState();

    const promise = (async (): Promise<DialogueTurn | null> => {
      try {
        const charConfig = this.characters[speaker];
        const nextEvent = this.eventQueue.shift();
        const relevantEpisodes = this.knowledgeService.findRelevantEpisodes(
          `${this.topic.title} ${this.topic.premise} ${nextEvent?.message || ''}`,
          3
        );

        const generated = await this.groqService.generateNextTurn({
          speaker,
          characters: this.characters,
          topic: this.topic,
          researchSources: this.researchSources,
          relevantEpisodes,
          recentHistory: this.recentHistory,
          event: nextEvent,
        });

        if (genId !== this.prefetchGenerationId) {
          return null;
        }

        const tts = await this.fishAudioService.synthesizeSpeech(
          generated.text,
          charConfig.fishVoiceId,
          speaker
        );

        if (genId !== this.prefetchGenerationId) {
          return null;
        }

        const readyTurn: DialogueTurn = {
          id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          speaker,
          speakerName: charConfig.name,
          text: generated.text,
          audioBase64: tts.audioBase64,
          audioMimeType: tts.audioMimeType,
          useBrowserTTS: tts.useBrowserTTS,
          triggeredByEvent: nextEvent,
          citedSource: generated.citedSource,
          directorPhase: generated.directorPhase,
          timestamp: Date.now(),
        };

        this.prefetchedTurn = readyTurn;
        this.prefetchStatus = 'ready';
        this.prefetchedSpeaker = speaker;
        this.broadcastState();
        return readyTurn;
      } catch (err) {
        console.error('[Orchestrator] Error en startBackgroundPrefetch:', err);
        if (genId === this.prefetchGenerationId) {
          this.prefetchStatus = 'idle';
          this.prefetchedSpeaker = null;
          this.broadcastState();
        }
        return null;
      } finally {
        if (genId === this.prefetchGenerationId) {
          this.activePrefetchPromise = null;
        }
      }
    })();

    this.activePrefetchPromise = promise;
    return promise;
  }

  private commitAndEmitTurn(turn: DialogueTurn, alreadyInHistory = false): void {
    this.currentTurn = turn;
    this.activeSpeaker = turn.speaker;

    if (!alreadyInHistory) {
      this.recentHistory.push(turn);
      if (this.recentHistory.length > 24) {
        this.recentHistory = this.recentHistory.slice(-24);
      }
    }

    // Track automatic research rotation every X turns
    this.turnsSinceLastResearch++;
    if (
      this.autoResearchEveryTurns > 0 &&
      this.turnsSinceLastResearch >= this.autoResearchEveryTurns &&
      !this.isResearching
    ) {
      void this.refreshResearch();
    }

    this.emit('turn', turn);
    this.broadcastState();

    // Safety fallback timeout in case frontend tab is closed/minimized
    const estimatedMs = Math.max(6000, Math.min(24000, turn.text.length * 95));
    if (this.safetyTurnTimer) clearTimeout(this.safetyTurnTimer);
    this.safetyTurnTimer = setTimeout(() => {
      this.completeTurn(turn.id);
    }, estimatedMs + 4500);
  }

  private broadcastState(): void {
    this.emit('state', this.getState());
  }
}
