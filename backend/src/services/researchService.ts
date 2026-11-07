import { HermanosEpisodeEntry, ResearchSourceItem, TopicConfig } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class ResearchService {
  private apiKey: string;
  private model: string;
  private rotationOffset = 0;

  constructor(
    apiKey = process.env.GROQ_API_KEY || '',
    model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
  ) {
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
  }

  public getDefaultSources(): ResearchSourceItem[] {
    return [
      {
        id: 'hdl-src-1',
        sourceName: '📺 @hermanosdelechemx • Cosas de PRINCESAS DE BARRIO',
        fact: 'Adrián: Analiza a las morras que se creen de San Pedro pero viven en barrio bravo. | La Mole: Cuenta las anécdotas de los XV años en la calle cerrando la cuadra con cumbias.',
        subtopicAngle: 'Princesas de barrio y delirios de grandeza',
        url: 'https://www.youtube.com/watch?v=ZnUcI15LeqA',
      },
      {
        id: 'hdl-src-2',
        sourceName: '📺 @hermanosdelechemx • Cosas de EX',
        fact: 'Adrián: El nivel máximo de toxicidad es depositar $1 peso por SPEI para escribir "Contéstame" en el concepto. | La Mole: Las llamadas a la ex a las 3 AM con grupo Pesado de fondo.',
        subtopicAngle: 'Exs tóxicas, bloqueos de WhatsApp y despecho',
        url: 'https://www.youtube.com/watch?v=CBwlu52vk20',
      },
      {
        id: 'hdl-src-3',
        sourceName: '📺 @hermanosdelechemx • Cosas de INFIEL',
        fact: 'Adrián: Poner el celular boca abajo y meterse a bañar con teléfono es señal inequívoca de cuerno. | La Mole: Los amigos cagapalos que te hunden mandando audios en el grupo equivocado.',
        subtopicAngle: 'Coartadas de infieles y amigos cagapalos',
        url: 'https://www.youtube.com/watch?v=vdLTsXr8WkA',
      },
      {
        id: 'hdl-src-4',
        sourceName: '📺 @hermanosdelechemx • Cosas de PRIMERA CITA',
        fact: 'Adrián: En la primera cita van dos mentirosos fingiendo que son fit y tranquilos. | La Mole: Cuando invitabas a la huerca al cine y rezabas para que no pidiera combo grande.',
        subtopicAngle: 'Mentiras en primeras citas y quién paga la cuenta',
        url: 'https://www.youtube.com/watch?v=RT2g19JHoeQ',
      },
      {
        id: 'hdl-src-5',
        sourceName: '📺 @hermanosdelechemx • Cosas de BORRACHOS y CRUDA',
        fact: 'Adrián: Las peores pedas empiezan con un "nomás dos cheves tranquilos". | La Mole: La cruda moral del domingo revisando la cartera vacía y los mensajes enviados anoche.',
        subtopicAngle: 'Pedas épicas, el amigo mala copa y la cruda moral',
        url: 'https://www.youtube.com/watch?v=JWxweyLFUYk',
      },
      {
        id: 'hdl-src-6',
        sourceName: '📺 @hermanosdelechemx • Cosas de SEÑORES y REGIOS',
        fact: 'Adrián: Eres señor cuando ir al Home Depot te emociona más que ir al antro. | La Mole: El parásito de la carne asada que pone $50 pesos y se traga todo el ribeye.',
        subtopicAngle: 'Vida de señor casado y códigos de la carne asada regia',
        url: 'https://www.youtube.com/watch?v=6o8yUqwxZZ8',
      },
    ];
  }

  /**
   * Construye el Dossier de 6 subtemas EXCLUSIVAMENTE a partir de los transcripts y episodios
   * de @hermanosdelechemx almacenados en Supabase / Base de Conocimiento (CERO estudios universitarios falsos).
   */
  public async investigateTopic(
    topic: TopicConfig,
    previousSources: ResearchSourceItem[] = [],
    matchingEpisodes: HermanosEpisodeEntry[] = [],
    allEpisodes: HermanosEpisodeEntry[] = []
  ): Promise<ResearchSourceItem[]> {
    // Pool de episodios de @hermanosdelechemx: primero los que hacen match con el tema, luego el resto rotando
    const usedIds = new Set(previousSources.map((s) => s.id));
    const pool: HermanosEpisodeEntry[] = [...matchingEpisodes];
    const seenEpIds = new Set(pool.map((e) => e.id));

    if (allEpisodes.length > 0) {
      this.rotationOffset = (this.rotationOffset + 3) % allEpisodes.length;
      for (let i = 0; i < allEpisodes.length; i++) {
        const ep = allEpisodes[(i + this.rotationOffset) % allEpisodes.length];
        if (!seenEpIds.has(ep.id)) {
          pool.push(ep);
          seenEpIds.add(ep.id);
        }
      }
    }

    const selectedEpisodes = pool.slice(0, 6);

    if (!this.apiKey || selectedEpisodes.length === 0) {
      return this.buildSourcesFromEpisodes(topic, selectedEpisodes);
    }

    try {
      const episodesContext = selectedEpisodes
        .map(
          (ep, idx) =>
            `${idx + 1}. EPISODIO @hermanosdelechemx: "${ep.title}" (URL: ${ep.url})\n` +
            `   - Postura Adrián Marcelo: ${ep.adrianPosition}\n` +
            `   - Postura La Mole: ${ep.laMolePosition}\n` +
            `   - Citas del transcript: ${ep.transcriptExcerpts.join(' | ')}`
        )
        .join('\n\n');

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          reasoning_effort: 'low',
          messages: [
            {
              role: 'system',
              content: `Eres el productor de contenidos del podcast "Hermanos de Leche" (@hermanosdelechemx) de Adrián Marcelo y La Mole.
PROHIBIDO inventar estudios de universidades, institutos o estadísticas académicas.
TODAS las 6 fuentes del dossier DEBEN ser episodios reales de "@hermanosdelechemx" tomados de la lista proporcionada abajo, conectándolos con el tema actual ("${topic.title}").
Devuelve ÚNICAMENTE un arreglo JSON válido con 6 objetos con este formato exacto:
[
  {
    "sourceName": "📺 @hermanosdelechemx • [Nombre del Episodio]",
    "fact": "Adrián: [qué opina/bromea Adrián en ese transcript] | La Mole: [qué anécdota/opinión cuenta La Mole]",
    "subtopicAngle": "Anécdota o punto específico de comedia para platicar",
    "url": "URL de YouTube del episodio"
  }
]`,
            },
            {
              role: 'user',
              content: `Tema en mesa hoy: "${topic.title}" (${topic.premise})

EPISODIOS REALES DE @hermanosdelechemx EN SUPABASE PARA USAR COMO FUENTE:
${episodesContext}

Genera el JSON con los 6 puntos basados EXCLUSIVAMENTE en estos transcripts de @hermanosdelechemx.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 950,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = (data.choices?.[0]?.message?.content || '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .trim();
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Array<{
            sourceName?: string;
            fact?: string;
            subtopicAngle?: string;
            url?: string;
          }>;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 6).map((item, idx) => {
              const fallbackEp = selectedEpisodes[idx % selectedEpisodes.length];
              return {
                id: `hdl-ep-${fallbackEp?.videoId || idx}-${Date.now()}`,
                sourceName:
                  item.sourceName && item.sourceName.includes('hermanos')
                    ? item.sourceName
                    : `📺 @hermanosdelechemx • ${fallbackEp?.title || 'Episodio'}`,
                fact:
                  item.fact ||
                  `Adrián: ${fallbackEp?.adrianPosition} | La Mole: ${fallbackEp?.laMolePosition}`,
                subtopicAngle: item.subtopicAngle || fallbackEp?.category || topic.title,
                url: item.url || fallbackEp?.url || 'https://www.youtube.com/@hermanosdelechemx',
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn('[ResearchService] Usando mapeo directo de episodios Supabase:', err);
    }

    return this.buildSourcesFromEpisodes(topic, selectedEpisodes, usedIds);
  }

  public buildSourcesFromEpisodes(
    topic: TopicConfig,
    episodes: HermanosEpisodeEntry[],
    _usedIds?: Set<string>
  ): ResearchSourceItem[] {
    if (episodes.length === 0) {
      return this.getDefaultSources();
    }

    return episodes.slice(0, 6).map((ep, idx) => ({
      id: `hdl-db-${ep.videoId}-${idx}`,
      sourceName: `📺 @hermanosdelechemx • ${ep.title}`,
      fact: `Adrián: ${ep.adrianPosition} | La Mole: ${ep.laMolePosition}`,
      subtopicAngle: `${ep.title.replace(/^Hermanos de Leche\s*-\s*/i, '')} (${ep.category})`,
      url: ep.url,
    }));
  }
}
