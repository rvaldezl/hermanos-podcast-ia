import { HermanosEpisodeEntry, ResearchSourceItem, TopicConfig } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class ResearchService {
  private apiKey: string;
  private model: string;

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
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - El "No tengo nada"',
        fact: 'Cuando tu pareja te dice "no tengo nada, haz lo que quieras", psicológicamente es una alerta roja y en realidad se acuerda de algo que hiciste hace 4 años.',
        subtopicAngle: 'El lenguaje secreto de las mujeres cuando se enojan',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
      {
        id: 'hdl-src-2',
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - FBI Femenino en Redes',
        fact: 'Con solo 5 minutos y una foto borrosa donde sale el reflejo de unos lentes, una mujer descubre con quién saliste, dónde cenaron y quién pagó la cuenta.',
        subtopicAngle: 'La capacidad de investigación del FBI femenino vs. el hombre distraído',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
      {
        id: 'hdl-src-3',
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - Transferencias SPEI de $1 peso',
        fact: 'El nivel máximo del despecho moderno es cuando te bloquean de WhatsApp e Instagram y mandas una transferencia de 1 peso solo para escribir "Contéstame" en el concepto.',
        subtopicAngle: 'Tácticas extremas de exs y relaciones tóxicas',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
      {
        id: 'hdl-src-4',
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - Mentiras en Primeras Citas',
        fact: 'En las primeras tres salidas todo el mundo finge ser fit, tranquilo y saludable, pero al mes ya están pidiendo tacos grasosos en pijama y peleando por qué ver en Netflix.',
        subtopicAngle: 'Expectativa vs. Realidad al empezar a salir con alguien',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
      {
        id: 'hdl-src-5',
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - El Amigo Cagapalos',
        fact: 'El 90% de las cachadas de hombres casados no son por culpa suya, sino por el amigo imprudente que grita o manda fotos al grupo de WhatsApp equivocado.',
        subtopicAngle: 'Los amigos cagapalos y las coartadas que salen mal',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
      {
        id: 'hdl-src-6',
        sourceName: 'Hermanos de Leche (@hermanosdelechemx) - Paz Matrimonial de Señor',
        fact: 'Llega una edad en el matrimonio donde el hombre prefiere dar la razón de inmediato y pedir perdón por adelantado con tal de poder prender el carbón y ver el partido en paz.',
        subtopicAngle: 'La sabiduría del señor casado para sobrevivir en pareja',
        url: 'https://www.youtube.com/@hermanosdelechemx',
      },
    ];
  }

  public async investigateTopic(
    topic: TopicConfig,
    previousSources: ResearchSourceItem[] = [],
    matchingEpisodes: HermanosEpisodeEntry[] = []
  ): Promise<ResearchSourceItem[]> {
    const wikiSnippets = await this.fetchWikipediaContext(topic.title);

    if (!this.apiKey) {
      return this.buildFallbackResearch(topic, wikiSnippets, matchingEpisodes);
    }

    try {
      const episodesText =
        matchingEpisodes.length > 0
          ? matchingEpisodes
              .map(
                (ep) =>
                  `- Episodio "${ep.title}": Adrián opina (${ep.adrianPosition}) | La Mole opina (${ep.laMolePosition})`
              )
              .join('\n')
          : 'Sin episodios específicos aún; usa el estilo clásico de comedia "Cosas de..." de Hermanos de Leche.';

      const wikiContextText =
        wikiSnippets.length > 0
          ? wikiSnippets.map((w) => `- ${w.title}: ${w.snippet} (${w.url})`).join('\n')
          : '';

      const prevAnglesText =
        previousSources.length > 0
          ? `\nSUBTEMAS YA USADOS ANTES (PROHIBIDO REPETIRLOS, GENERA SITUACIONES Y ÁNGULOS NUEVOS):\n${previousSources
              .slice(-6)
              .map((s) => `- ${s.subtopicAngle}`)
              .join('\n')}\n`
          : '';

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
              content: `Eres el guionista e investigador de mesa del podcast "Hermanos de Leche" (@hermanosdelechemx) de Adrián Marcelo y La Mole.
Tu tarea es armar una escaleta/dossier de 6 situaciones cotidianas muy reales, anécdotas típicas, datos curiosos o comportamientos humanos ("Cosas de...") sobre el tema del episodio para que Adrián y La Mole cotorreen, se tiren carrilla y no se ciclen.
Devuelve ÚNICAMENTE un arreglo JSON válido con 6 objetos con este formato exacto:
[
  {
    "sourceName": "Hermanos de Leche (@hermanosdelechemx) o fuente cultural real",
    "fact": "Situación cómica real, comportamiento típico o dato curioso en 1 oración clara",
    "subtopicAngle": "Subtema o situación específica para platicar en este turno",
    "url": "https://www.youtube.com/@hermanosdelechemx"
  }
]`,
            },
            {
              role: 'user',
              content: `Tema del episodio: "${topic.title}"
Premisa: "${topic.premise}"
${prevAnglesText}
Transcripts y posturas de @hermanosdelechemx relacionados:
${episodesText}
${wikiContextText ? `\nContexto adicional:\n${wikiContextText}` : ''}

Genera el JSON con 6 puntos/subtemas NUEVOS y muy divertidos al estilo Hermanos de Leche.`,
            },
          ],
          temperature: 0.8,
          max_tokens: 900,
        }),
      });

      if (!response.ok) {
        return this.buildFallbackResearch(topic, wikiSnippets, matchingEpisodes);
      }

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
          return parsed.slice(0, 6).map((item, idx) => ({
            id: `src-${Date.now()}-${idx}`,
            sourceName: item.sourceName || `Hermanos de Leche #${idx + 1}`,
            fact: item.fact || topic.premise,
            subtopicAngle: item.subtopicAngle || `Situación #${idx + 1}`,
            url: item.url || 'https://www.youtube.com/@hermanosdelechemx',
          }));
        }
      }

      return this.buildFallbackResearch(topic, wikiSnippets, matchingEpisodes);
    } catch (error) {
      console.warn('[ResearchService] Error al investigar fuentes:', error);
      return this.buildFallbackResearch(topic, wikiSnippets, matchingEpisodes);
    }
  }

  private async fetchWikipediaContext(
    query: string
  ): Promise<Array<{ title: string; snippet: string; url: string }>> {
    try {
      const cleanQuery = query
        .replace(/[¿?¡!]/g, '')
        .replace(/\b(el|la|los|las|de|del|a|en|por|que|como|es|un|una|cosas)\b/gi, ' ')
        .trim();

      const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQuery
      )}&utf8=1&format=json&srlimit=3`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'PodcastDualIA/1.0 (Local Research Engine)' },
      });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        query?: {
          search?: Array<{ title: string; snippet: string; pageid: number }>;
        };
      };

      const items = data.query?.search || [];
      return items.map((item) => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"'),
        url: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      }));
    } catch {
      return [];
    }
  }

  private buildFallbackResearch(
    topic: TopicConfig,
    wikiSnippets: Array<{ title: string; snippet: string; url: string }>,
    matchingEpisodes: HermanosEpisodeEntry[] = []
  ): ResearchSourceItem[] {
    if (matchingEpisodes.length > 0) {
      const items: ResearchSourceItem[] = [];
      for (const ep of matchingEpisodes) {
        items.push({
          id: `ep-a-${ep.id}`,
          sourceName: `${ep.title} (@hermanosdelechemx)`,
          fact: ep.adrianPosition,
          subtopicAngle: `La visión ácida de Adrián sobre ${ep.category}`,
          url: ep.url,
        });
        items.push({
          id: `ep-b-${ep.id}`,
          sourceName: `${ep.title} (@hermanosdelechemx)`,
          fact: ep.laMolePosition,
          subtopicAngle: `Las anécdotas de La Mole sobre ${ep.category}`,
          url: ep.url,
        });
      }
      return items.slice(0, 6);
    }
    if (wikiSnippets.length > 0) {
      return wikiSnippets.map((w, idx) => ({
        id: `wiki-${idx}`,
        sourceName: `Hermanos de Leche • ${w.title}`,
        fact: w.snippet,
        subtopicAngle: `Anécdotas sobre ${w.title}`,
        url: w.url,
      }));
    }
    return this.getDefaultSources();
  }
}
