import { TopicConfig } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class TopicEngine {
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

  public async suggestTopics(nicheOrKeyword: string): Promise<TopicConfig[]> {
    const cleanKeyword = nicheOrKeyword.trim() || 'Cosas de Mujeres y Parejas';

    if (!this.apiKey) {
      return this.getFallbackTopics(cleanKeyword);
    }

    try {
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
              content:
                'Eres el productor creativo del podcast de comedia "Hermanos de Leche" (@hermanosdelechemx) con Adrián Marcelo y La Mole. Devuelve ÚNICAMENTE un arreglo JSON válido con 3 episodios al estilo clásico del canal ({ "title": "Cosas de...", "premise": "..." }) sin texto adicional.',
            },
            {
              role: 'user',
              content: `Sugiere 3 temas de episodio muy divertidos, cotidianos y llenos de anécdotas al estilo "Hermanos de Leche" sobre: "${cleanKeyword}".`,
            },
          ],
          temperature: 0.85,
          max_tokens: 750,
        }),
      });

      if (!response.ok) {
        return this.getFallbackTopics(cleanKeyword);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const raw = (data.choices?.[0]?.message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as TopicConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3);
        }
      }
      return this.getFallbackTopics(cleanKeyword);
    } catch {
      return this.getFallbackTopics(cleanKeyword);
    }
  }

  private getFallbackTopics(keyword: string): TopicConfig[] {
    return [
      {
        title: `Cosas de ${keyword}: Lo que nadie acepta en público`,
        premise: `Adrián Marcelo y La Mole desmenuzan sin filtros las anécdotas, red flags y comportamientos reales alrededor de ${keyword}.`,
      },
      {
        title: `Cosas de Exs, Tóxicas y Drama en ${keyword}`,
        premise: `Cotorreo regio de compadres sobre las peores historias, mentiras piadosas y cachadas épicas en ${keyword}.`,
      },
      {
        title: `Barrio vs. Fresa en ${keyword}: ¿Quién se pasa más de lanza?`,
        premise: `Psicología ácida de Adrián contra las historias de calle y carne asada de La Mole hablando de ${keyword}.`,
      },
    ];
  }
}
