import { EventEmitter } from 'events';
import { WebcastPushConnection } from 'tiktok-live-connector';
import { TikTokEventItem } from '../types';

export class TikTokService extends EventEmitter {
  private connection: WebcastPushConnection | null = null;
  private currentUsername = (process.env.TIKTOK_USERNAME || '').replace(/^@/, '').trim();
  private isConnected = false;

  // Buffers for anti-spam
  private memberBuffer: string[] = [];
  private memberFlushTimer: NodeJS.Timeout | null = null;
  private totalLikes = 0;
  private nextLikeMilestone = 500;

  public getStatus(): { connected: boolean; username: string } {
    return {
      connected: this.isConnected,
      username: this.currentUsername,
    };
  }

  public async connect(username: string): Promise<{ connected: boolean; message: string }> {
    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser) {
      return { connected: false, message: 'Nombre de usuario vacío' };
    }

    this.disconnect();
    this.currentUsername = cleanUser;

    try {
      this.connection = new WebcastPushConnection(cleanUser, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
      });

      await this.connection.connect();
      this.isConnected = true;
      this.setupListeners();
      this.emit('status', this.getStatus());

      return {
        connected: true,
        message: `Conectado exitosamente al TikTok Live de @${cleanUser}`,
      };
    } catch (error: unknown) {
      this.isConnected = false;
      this.emit('status', this.getStatus());
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        connected: false,
        message: `No se pudo conectar a @${cleanUser} (¿está en vivo ahora?): ${errMsg}`,
      };
    }
  }

  public disconnect(): void {
    if (this.memberFlushTimer) {
      clearTimeout(this.memberFlushTimer);
      this.memberFlushTimer = null;
    }
    if (this.connection) {
      try {
        this.connection.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.connection = null;
    }
    this.isConnected = false;
    this.memberBuffer = [];
    this.emit('status', this.getStatus());
  }

  private setupListeners(): void {
    if (!this.connection) return;

    // 1. Member joins (Buffered to avoid token spam)
    this.connection.on('member', (data: { uniqueId?: string; nickname?: string }) => {
      const user = data.nickname || data.uniqueId || 'espectador';
      if (!this.memberBuffer.includes(user)) {
        this.memberBuffer.push(user);
      }
      if (!this.memberFlushTimer) {
        this.memberFlushTimer = setTimeout(() => this.flushMemberBuffer(), 25000);
      }
    });

    // 2. Chat messages (Filtered for relevance / questions)
    this.connection.on('chat', (data: { uniqueId?: string; nickname?: string; comment?: string }) => {
      const comment = (data.comment || '').trim();
      const username = data.uniqueId || data.nickname || 'usuario';

      if (!this.isRelevantComment(comment)) {
        return;
      }

      const eventItem: TikTokEventItem = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'chat',
        priority: 2,
        username,
        message: comment,
        timestamp: Date.now(),
      };

      this.emit('tiktokEvent', eventItem);
    });

    // 3. Gifts (Priority 1 - Highest)
    this.connection.on(
      'gift',
      (data: {
        uniqueId?: string;
        nickname?: string;
        giftType?: number;
        repeatEnd?: boolean;
        giftName?: string;
        repeatCount?: number;
      }) => {
        // Wait until streak ends for streakable gifts
        if (data.giftType === 1 && !data.repeatEnd) {
          return;
        }

        const username = data.uniqueId || data.nickname || 'donador';
        const giftName = data.giftName || 'Regalo';
        const giftCount = data.repeatCount || 1;

        const eventItem: TikTokEventItem = {
          id: `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'gift',
          priority: 1,
          username,
          message: `envió ${giftCount}x ${giftName}`,
          giftName,
          giftCount,
          timestamp: Date.now(),
        };

        this.emit('tiktokEvent', eventItem);
      }
    );

    // 4. Likes milestones (Every 500 likes)
    this.connection.on('like', (data: { likeCount?: number; totalLikeCount?: number }) => {
      if (typeof data.totalLikeCount === 'number') {
        this.totalLikes = data.totalLikeCount;
      } else {
        this.totalLikes += data.likeCount || 1;
      }

      if (this.totalLikes >= this.nextLikeMilestone) {
        const milestone = this.nextLikeMilestone;
        while (this.nextLikeMilestone <= this.totalLikes) {
          this.nextLikeMilestone += 500;
        }

        const eventItem: TikTokEventItem = {
          id: `like-${Date.now()}`,
          type: 'like',
          priority: 3,
          username: 'Comunidad',
          message: `${milestone} likes en el directo`,
          timestamp: Date.now(),
        };

        this.emit('tiktokEvent', eventItem);
      }
    });

    this.connection.on('streamEnd', () => {
      this.disconnect();
    });
  }

  private flushMemberBuffer(): void {
    this.memberFlushTimer = null;
    if (this.memberBuffer.length < 2) {
      return;
    }

    const sample = this.memberBuffer.slice(0, 4).map((u) => `@${u}`);
    this.memberBuffer = [];

    const eventItem: TikTokEventItem = {
      id: `member-${Date.now()}`,
      type: 'member',
      priority: 3,
      username: 'Nuevos Espectadores',
      message: sample.join(', '),
      timestamp: Date.now(),
    };

    this.emit('tiktokEvent', eventItem);
  }

  private isRelevantComment(comment: string): boolean {
    if (comment.length < 8) return false;
    // Strip emojis and check alphanumeric length
    const textOnly = comment.replace(/[^\p{L}\p{N}\s?¿!¡]/gu, '').trim();
    if (textOnly.length < 6) return false;

    const lower = textOnly.toLowerCase();
    const isQuestion =
      comment.includes('?') ||
      comment.includes('¿') ||
      /\b(que|qué|como|cómo|por que|por qué|creen|opinan|piensan|verdad|mito|futuro|mejor|peor)\b/i.test(lower);

    return isQuestion || textOnly.split(/\s+/).length >= 4;
  }

  public simulateEvent(partial: {
    type: 'gift' | 'chat' | 'member' | 'like';
    username: string;
    message: string;
    giftName?: string;
    giftCount?: number;
  }): TikTokEventItem {
    const priorityMap = {
      gift: 1 as const,
      chat: 2 as const,
      member: 3 as const,
      like: 3 as const,
    };

    const item: TikTokEventItem = {
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: partial.type,
      priority: priorityMap[partial.type],
      username: partial.username.replace(/^@/, '').trim() || 'usuario_tiktok',
      message: partial.message,
      giftName: partial.giftName,
      giftCount: partial.giftCount,
      timestamp: Date.now(),
    };

    this.emit('tiktokEvent', item);
    return item;
  }
}
