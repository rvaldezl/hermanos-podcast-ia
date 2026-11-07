import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { PodcastOrchestrator } from './orchestrator';
import { DialogueTurn, PodcastState, TikTokEventItem } from './types';

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const orchestrator = new PodcastOrchestrator();

function broadcast(payload: unknown): void {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

orchestrator.on('state', (state: PodcastState) => {
  broadcast({ type: 'state', data: state });
});

orchestrator.on('turn', (turn: DialogueTurn) => {
  broadcast({ type: 'turn', data: turn });
});

orchestrator.on('tiktokEvent', (event: TikTokEventItem) => {
  broadcast({ type: 'tiktokEvent', data: event });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', data: orchestrator.getState() }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type: string; turnId?: string };
      if (msg.type === 'turn_completed') {
        orchestrator.completeTurn(msg.turnId);
      }
    } catch {
      // Ignore malformed messages
    }
  });
});

// REST API
app.get('/api/state', (_req, res) => {
  res.json(orchestrator.getState());
});

app.post('/api/config', (req, res) => {
  const updated = orchestrator.updateConfig(req.body);
  res.json(updated);
});

app.post('/api/keys', (req, res) => {
  orchestrator.updateApiKeys(req.body);
  res.json(orchestrator.getState());
});

app.post('/api/podcast/start', (_req, res) => {
  orchestrator.start();
  res.json(orchestrator.getState());
});

app.post('/api/podcast/stop', (_req, res) => {
  orchestrator.stop();
  res.json(orchestrator.getState());
});

app.post('/api/podcast/next-turn', async (_req, res) => {
  await orchestrator.forceNextTurn();
  res.json(orchestrator.getState());
});

app.post('/api/topics/suggest', async (req, res) => {
  const { keyword } = req.body as { keyword?: string };
  const suggestions = await orchestrator.suggestTopics(keyword || '');
  res.json({ topics: suggestions });
});

app.post('/api/research/refresh', async (_req, res) => {
  await orchestrator.refreshResearch();
  res.json(orchestrator.getState());
});

app.post('/api/knowledge/scrape', async (req, res) => {
  const { query } = req.body as { query?: string };
  const result = await orchestrator.scrapeYoutubeKnowledge(query || 'Cosas de mujeres');
  res.json({ ...result, state: orchestrator.getState() });
});

app.post('/api/knowledge/supabase-sync', async (req, res) => {
  const { supabaseUrl, supabaseKey } = req.body as {
    supabaseUrl?: string;
    supabaseKey?: string;
  };
  const result = await orchestrator.syncSupabaseKnowledge({ supabaseUrl, supabaseKey });
  res.json({ ...result, state: orchestrator.getState() });
});

app.post('/api/podcast/clear-history', (_req, res) => {
  res.json(orchestrator.clearHistory());
});

app.post('/api/voice/test', async (req, res) => {
  const { speaker } = req.body as { speaker?: 'A' | 'B' };
  const turn = await orchestrator.testCharacterVoice(speaker === 'B' ? 'B' : 'A');
  res.json({ turn, state: orchestrator.getState() });
});

app.post('/api/tiktok/connect', async (req, res) => {
  const { username } = req.body as { username?: string };
  const result = await orchestrator.connectTikTok(username || '');
  res.json(result);
});

app.post('/api/tiktok/disconnect', (_req, res) => {
  orchestrator.disconnectTikTok();
  res.json({ connected: false });
});

app.post('/api/tiktok/simulate', async (req, res) => {
  const { immediate, ...eventPayload } = req.body as {
    type: 'gift' | 'chat' | 'member' | 'like';
    username: string;
    message: string;
    giftName?: string;
    giftCount?: number;
    immediate?: boolean;
  };
  const event = orchestrator.simulateTikTokEvent(eventPayload);
  if (immediate) {
    await orchestrator.forceNextTurn();
  }
  res.json({ event, state: orchestrator.getState() });
});

server.listen(PORT, () => {
  console.log(`🎙️ [Podcast IA VTuber Backend] Corriendo en http://localhost:${PORT}`);
});
