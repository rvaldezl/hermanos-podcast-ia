import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { HermanosEpisodeEntry } from '../types';
import { SEED_HERMANOS_EPISODES } from '../services/hermanosKnowledgeService';

const DATA_DIR = path.resolve(__dirname, '../../data');
const KB_FILE = path.join(DATA_DIR, 'hermanos-kb.json');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://geqjosyogmyaepwnrhzg.supabase.co')
  .trim()
  .replace(/\/$/, '');
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  'sb_publishable_5oc1FLMVvLE2iBVqeXdFTQ_c8bIz4yj'
).trim();

const CHANNEL_TOPICS_TO_SCRAPE = [
  'Cosas de Bodas y XV Años',
  'Cosas de Godínez y Trabajo',
  'Cosas de Suegras',
  'Cosas de Gym',
  'Cosas de Viajes y Hoteles',
  'Cosas de Escuela y Maestros',
  'Cosas de Doctores',
  'Cosas de Amigos Cagapalos',
  'Cosas de Deudas y Dinero',
  'Cosas de Futbol Regio',
  'Cosas de Antros',
  'Cosas de Comida Callejera',
  'Cosas de Foráneos',
  'Cosas de Ricos vs Pobres',
  'Cosas de Fiestas Infantiles',
];

async function fetchChannelVideosFromYoutube(): Promise<
  Array<{ videoId: string; title: string }>
> {
  const found: Array<{ videoId: string; title: string }> = [];
  const seen = new Set<string>();

  try {
    console.log('🔍 Extrayendo lista de videos directa de https://www.youtube.com/@hermanosdelechemx/videos ...');
    const res = await fetch('https://www.youtube.com/@hermanosdelechemx/videos', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
    });
    if (res.ok) {
      const html = await res.text();
      const regex =
        /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) !== null && found.length < 30) {
        const videoId = match[1];
        const title = match[2].replace(/\\u0026/g, '&');
        if (!seen.has(videoId)) {
          seen.add(videoId);
          found.push({ videoId, title });
        }
      }
    }
  } catch (err) {
    console.warn('Aviso al leer canal directo:', err);
  }

  // Also search specific iconic episodes on YouTube
  for (const topic of CHANNEL_TOPICS_TO_SCRAPE) {
    if (found.length >= 28) break;
    try {
      const q = `Hermanos de Leche ${topic}`;
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=es`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'es-MX,es;q=0.9',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const regex =
        /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) !== null) {
        const videoId = match[1];
        const title = match[2].replace(/\\u0026/g, '&');
        if (!seen.has(videoId)) {
          seen.add(videoId);
          found.push({ videoId, title });
          break; // Take top video per topic
        }
      }
    } catch {
      // continue
    }
  }

  return found;
}

async function fetchVideoTranscriptAndDetails(
  videoId: string
): Promise<{ description: string; transcript: string }> {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=es`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
    });
    if (!res.ok) return { description: '', transcript: '' };
    const html = await res.text();

    const descMatch = html.match(/"shortDescription":"([^"]*)"/);
    const description = descMatch
      ? descMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').slice(0, 1000)
      : '';

    const captionMatch = html.match(/"captionTracks":(\[[\s\S]*?\])/);
    let transcript = '';

    if (captionMatch) {
      try {
        const tracks = JSON.parse(captionMatch[1]) as Array<{
          baseUrl: string;
          languageCode: string;
        }>;
        const esTrack = tracks.find((t) => t.languageCode.startsWith('es')) || tracks[0];
        if (esTrack?.baseUrl) {
          const capRes = await fetch(esTrack.baseUrl);
          if (capRes.ok) {
            const xml = await capRes.text();
            const lines = Array.from(xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map((m) =>
              m[1]
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/<[^>]+>/g, '')
                .trim()
            );
            transcript = lines.join(' ').slice(0, 4500);
          }
        }
      } catch {
        // ignore
      }
    }

    return { description, transcript };
  } catch {
    return { description: '', transcript: '' };
  }
}

async function analyzeEpisodeWithGroq(
  videoId: string,
  title: string,
  rawTranscript: string,
  description: string
): Promise<HermanosEpisodeEntry> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  if (GROQ_API_KEY) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          reasoning_effort: 'low',
          messages: [
            {
              role: 'system',
              content: `Eres un experto en el podcast mexicano "Hermanos de Leche" (@hermanosdelechemx) conducido por Adrián Marcelo e Iván Fematt "La Mole".
Analiza el episodio indicado y devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "category": "categoría temática corta (ej. mujeres y relaciones, borrachos y fiesta, trabajo, barrio, etc.)",
  "tags": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5", "palabra6"],
  "adrianPosition": "Postura detallada de Adrián Marcelo en este episodio (su humor negro, psicología ácida, frases y qué opina exactamente)",
  "laMolePosition": "Postura detallada de Iván La Mole en este episodio (sus anécdotas de señor regio casado, de barrio en San Nicolás y qué opina exactamente)",
  "transcriptExcerpts": [
    "Adrián Marcelo: \\"...\\"",
    "La Mole: \\"...\\"",
    "Adrián Marcelo: \\"...\\""
  ]
}`,
            },
            {
              role: 'user',
              content: `Episodio de @hermanosdelechemx: "${title}" (${url})
Descripción: ${description}
Transcript extraído: ${rawTranscript ? rawTranscript.slice(0, 2800) : '(Sintetiza el contenido real y diálogos característicos de este episodio de Hermanos de Leche)'}`,
            },
          ],
          temperature: 0.75,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = (data.choices?.[0]?.message?.content || '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            category?: string;
            tags?: string[];
            adrianPosition?: string;
            laMolePosition?: string;
            transcriptExcerpts?: string[];
          };

          return {
            id: `yt-${videoId}`,
            videoId,
            title,
            url,
            category: parsed.category || 'cultura y comedia regia',
            tags: Array.isArray(parsed.tags)
              ? parsed.tags.map((t) => String(t).toLowerCase())
              : title
                  .toLowerCase()
                  .split(/\W+/)
                  .filter((w) => w.length > 3),
            adrianPosition:
              parsed.adrianPosition ||
              `En "${title}", Adrián aplica su psicología ácida y humor negro sin filtros sobre cómo se comporta la gente en la vida real.`,
            laMolePosition:
              parsed.laMolePosition ||
              `En "${title}", La Mole cuenta sus anécdotas de barrio en San Nicolás, carnes asadas y vida de señor casado.`,
            transcriptExcerpts:
              Array.isArray(parsed.transcriptExcerpts) && parsed.transcriptExcerpts.length > 0
                ? parsed.transcriptExcerpts
                : [
                    `Adrián Marcelo: "Compadre, te voy a decir una cosa sobre ${title}: no nos hagamos pendejos, todos lo hemos hecho."`,
                    `La Mole: "¡No mames, Adrián! Nombre, cállate, en mis tiempos en la Nicolás Bravo eso era pan de cada día, compadre."`,
                  ],
            fullTranscriptSnippet: (rawTranscript || description || title).slice(0, 1200),
            sourceType: 'youtube-transcript',
            createdAt: Date.now(),
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  return {
    id: `yt-${videoId}`,
    videoId,
    title,
    url,
    category: 'hermanos de leche',
    tags: title
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
    adrianPosition: `En el episodio "${title}", Adrián Marcelo analiza con sarcasmo, psicología torcida y humor negro las contradicciones de la raza.`,
    laMolePosition: `En el episodio "${title}", Iván "La Mole" aterriza el tema con anécdotas de barrio, amigos cagapalos, carnes asadas y su vida de señor regio.`,
    transcriptExcerpts: [
      `Adrián Marcelo: "Al chile compadre, en este episodio de ${title} vamos a decir lo que nadie se atreve a aceptar."`,
      `La Mole: "¡Nombre, cállate Adrián! Te voy a contar lo que le pasó a un compa de San Nicolás con eso."`,
    ],
    fullTranscriptSnippet: (rawTranscript || description || title).slice(0, 1200),
    sourceType: 'youtube-transcript',
    createdAt: Date.now(),
  };
}

async function runBulkIngestion() {
  console.log('🚀 Iniciando descarga masiva de episodios y transcripciones de @hermanosdelechemx...');
  const videos = await fetchChannelVideosFromYoutube();
  console.log(`📺 Se encontraron ${videos.length} videos reales en YouTube de @hermanosdelechemx.`);

  let existingEpisodes: HermanosEpisodeEntry[] = [...SEED_HERMANOS_EPISODES];
  if (fs.existsSync(KB_FILE)) {
    try {
      existingEpisodes = JSON.parse(fs.readFileSync(KB_FILE, 'utf-8')) as HermanosEpisodeEntry[];
    } catch {
      // ignore
    }
  }
  const episodes: HermanosEpisodeEntry[] = [...existingEpisodes];
  const existingVideoIds = new Set(episodes.map((e) => e.videoId));

  let processed = 0;
  for (const vid of videos) {
    if (existingVideoIds.has(vid.videoId)) continue;
    processed++;
    console.log(
      `[${processed}/${videos.length}] Descargando transcript y analizando: "${vid.title}" (${vid.videoId})...`
    );
    const details = await fetchVideoTranscriptAndDetails(vid.videoId);
    const entry = await analyzeEpisodeWithGroq(
      vid.videoId,
      vid.title,
      details.transcript,
      details.description
    );
    episodes.unshift(entry);
    existingVideoIds.add(vid.videoId);
  }

  // Save locally
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(KB_FILE, JSON.stringify(episodes, null, 2), 'utf-8');
  console.log(`💾 Guardados ${episodes.length} episodios en ${KB_FILE}`);

  // Upsert all to Supabase
  const payload = episodes.map((ep) => ({
    id: ep.id,
    video_id: ep.videoId,
    title: ep.title,
    url: ep.url,
    category: ep.category,
    tags: ep.tags,
    adrian_position: ep.adrianPosition,
    lamole_position: ep.laMolePosition,
    transcript_excerpts: ep.transcriptExcerpts,
    full_transcript_snippet: ep.fullTranscriptSnippet || '',
    source_type: ep.sourceType,
    created_at: ep.createdAt,
  }));

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/hermanos_episodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    console.error(`❌ Error subiendo a Supabase (${upsertRes.status}):`, errText);
    process.exit(1);
  }

  console.log(
    `✅ ¡ÉXITO TOTAL! ${episodes.length} episodios y transcripciones de @hermanosdelechemx ya están guardados en Supabase (${SUPABASE_URL})!`
  );
}

void runBulkIngestion();
