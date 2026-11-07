import {
  CharacterConfig,
  DialogueTurn,
  HermanosEpisodeEntry,
  ResearchSourceItem,
  SpeakerId,
  TikTokEventItem,
  TopicConfig,
} from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface DirectorCue {
  phaseName: string;
  instruction: (partnerName: string, source?: ResearchSourceItem, episode?: HermanosEpisodeEntry) => string;
}

const DIRECTOR_CUES: DirectorCue[] = [
  {
    phaseName: 'Carrilla y Anécdota Anidada',
    instruction: (partnerName, source, episode) =>
      `Agarra lo último que acaba de decir ${partnerName}, tírale tantita carrilla amistosa de compadres ("Nombre, ${partnerName}...", "Te mamaste con eso, compadre...") y cuéntale una observación o anécdota sobre "${source?.subtopicAngle || episode?.category || 'la vida real'}" (${source?.fact || ''}).`,
  },
  {
    phaseName: 'Estilo "Cosas de..." (@hermanosdelechemx)',
    instruction: (partnerName, source, episode) =>
      `Dale la razón en un punto a ${partnerName} ("Al chile en eso sí tienes razón, compadre...") y luego saca un clásico comportamiento cotidiano del estilo "${episode?.title || 'Cosas de la raza'}": menciona cómo actúa la gente en "${source?.subtopicAngle || 'estos casos'}" (${source?.fact || ''}).`,
  },
  {
    phaseName: 'Balconear / Sacarle la Sopa al Compadre',
    instruction: (partnerName, source) =>
      `Reacciona con humor a lo que dijo ${partnerName}, mete el tema de "${source?.subtopicAngle || 'lo que hace la raza'}" (${source?.fact || ''}) y ciérrale con una pregunta directa y picante a ${partnerName} para balconearlo o ver qué haría él en esa situación.`,
  },
  {
    phaseName: 'Psicología Callejera vs. Barrio Regio',
    instruction: (partnerName, source, episode) =>
      `Contrasta con humor lo que dijo ${partnerName} usando tu personalidad (${episode ? `inspírate en tu postura del episodio "${episode.title}"` : 'tu estilo regio irreverente'}) y aterriza el punto de "${source?.subtopicAngle || 'la vida diaria'}" con un ejemplo bien terrenal.`,
  },
  {
    phaseName: 'Complicidad y Subirle Dos Rayitas',
    instruction: (partnerName, source) =>
      `Ríete o celébrale el comentario a ${partnerName} ("Jajaja es que sí pasa, compadre, no nos hagamos...") y súbele dos rayitas al cotorreo hablando de "${source?.subtopicAngle || 'ese tema'}" (${source?.fact || ''}).`,
  },
  {
    phaseName: 'Cotorreo con la Raza del Chat',
    instruction: (partnerName, source) =>
      `Responde rápido a lo que dijo ${partnerName}, comenta con humor el punto de "${source?.fact || source?.subtopicAngle || 'este tema'}" y pregúntale a la raza del chat de TikTok si a ellos también les ha pasado o qué opinan.`,
  },
];

export class GroqService {
  private apiKey: string;
  private model: string;
  private turnCount = 0;

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

  public hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  public async generateNextTurn(params: {
    speaker: SpeakerId;
    characters: { A: CharacterConfig; B: CharacterConfig };
    topic: TopicConfig;
    researchSources: ResearchSourceItem[];
    relevantEpisodes?: HermanosEpisodeEntry[];
    recentHistory: DialogueTurn[];
    event?: TikTokEventItem;
  }): Promise<{ text: string; citedSource?: string; directorPhase?: string }> {
    const {
      speaker,
      characters,
      topic,
      researchSources,
      relevantEpisodes = [],
      recentHistory,
      event,
    } = params;
    const activeChar = characters[speaker];
    const partnerChar = characters[speaker === 'A' ? 'B' : 'A'];

    const currentTurnIdx = this.turnCount++;
    const activeSource =
      researchSources.length > 0
        ? researchSources[currentTurnIdx % researchSources.length]
        : undefined;
    const activeEpisode =
      relevantEpisodes.length > 0
        ? relevantEpisodes[currentTurnIdx % relevantEpisodes.length]
        : undefined;
    const cue = DIRECTOR_CUES[currentTurnIdx % DIRECTOR_CUES.length];

    // Keep last 10 turns so the model has full conversational continuity and avoids repeating itself
    const rollingTurns = recentHistory.slice(-10);
    const lastTurn = rollingTurns.length > 0 ? rollingTurns[rollingTurns.length - 1] : null;

    const historyText =
      rollingTurns.length > 0
        ? rollingTurns.map((t, i) => `[Turno ${i + 1}] ${t.speakerName}: "${t.text}"`).join('\n')
        : '(Primer turno del episodio: abre el cotorreo bien relajado saludando a tu compadre y metiendo el tema como en un episodio de Hermanos de Leche).';

    const sourcesSummary =
      researchSources.length > 0
        ? researchSources
            .map((s, idx) => `${idx + 1}. [${s.sourceName}] (${s.subtopicAngle}): ${s.fact}`)
            .join('\n')
        : '';

    const episodesContext =
      relevantEpisodes.length > 0
        ? relevantEpisodes
            .map(
              (ep) =>
                `📺 EPISODIO REFERENCIA (@hermanosdelechemx): "${ep.title}"\n` +
                `- Postura de Adrián Marcelo: ${ep.adrianPosition}\n` +
                `- Postura de La Mole: ${ep.laMolePosition}\n` +
                `- Frases/Extractos del Transcript:\n  ${ep.transcriptExcerpts.join('\n  ')}`
            )
            .join('\n\n')
        : '';

    let turnObjective = '';
    let phaseLabel = cue.phaseName;

    if (event) {
      if (event.type === 'gift') {
        phaseLabel = `🎁 Cotorreo por Regalo (@${event.username})`;
        turnObjective = `¡EVENTO EN VIVO! El compa @${event.username} se acaba de aventar un regalo (${event.giftCount || 1}x ${event.giftName || 'Regalo'}). Agradécele con cotorreo regio por su nombre y conéctalo con lo que estabas platicando con ${partnerChar.name} sobre "${activeSource?.subtopicAngle || topic.title}".`;
      } else if (event.type === 'chat') {
        phaseLabel = `💬 Respuesta a @${event.username}`;
        turnObjective = `¡COMENTARIO DE LA RAZA EN EL CHAT! @${event.username} comenta/pregunta: "${event.message}".
1. Menciona a @${event.username} como si estuviera cotorreando con ustedes en la mesa.
2. Respóndele con tu personalidad real de Hermanos de Leche (usando la postura y anécdotas de los transcripts sobre este tema) y tírale la bolita a ${partnerChar.name} para ver qué opina él.`;
      } else if (event.type === 'member') {
        phaseLabel = '👋 Saludo a la Raza + Plática';
        turnObjective = `Saluda de volada a la raza que va cayendo al live (${event.message}) y síguele el rollo a ${partnerChar.name}: ${cue.instruction(partnerChar.name, activeSource, activeEpisode)}`;
      } else if (event.type === 'like') {
        phaseLabel = '❤️ Likes de la Raza + Plática';
        turnObjective = `Agradece rápido que la raza ya le dio a ${event.message} y continúa cotorreando con ${partnerChar.name}: ${cue.instruction(partnerChar.name, activeSource, activeEpisode)}`;
      }
    } else if (!lastTurn) {
      phaseLabel = '🎬 Arranque de Hermanos de Leche';
      turnObjective = `Arranca el episodio con toda la actitud relajada de "Hermanos de Leche" saludando a tu compadre ${partnerChar.name}, presenta el tema de hoy ("${topic.title}") tirando una primera observación cómica o ácida sobre "${activeSource?.subtopicAngle || topic.premise}" y pregúntale a ${partnerChar.name} cómo lo ve él.`;
    } else {
      turnObjective = cue.instruction(partnerChar.name, activeSource, activeEpisode);
    }

    const specificPersonaGuide =
      speaker === 'A'
        ? `TU IDENTIDAD (ADRIÁN MARCELO):
- Eres Adrián Marcelo en el podcast "Hermanos de Leche" (@hermanosdelechemx).
- Tono: Relajado, irreverente, sarcástico, observador psicológico ácido, regio de Monterrey. Te encanta analizar el comportamiento humano (de mujeres, hombres, parejas, borrachos, regios) sin filtros, con humor negro inteligente y tirándole carrilla a tu compadre Iván "La Mole".
- Muletillas naturales que puedes usar con variedad (sin repetir la misma en cada turno): "compadre", "chaparrito", "te voy a decir una cosa, Iván", "al chile", "no nos hagamos pendejos", "psicológicamente hablando", "con todo respeto".`
        : `TU IDENTIDAD (IVÁN FEMATT "LA MOLE"):
- Eres Iván "La Mole" en el podcast "Hermanos de Leche" (@hermanosdelechemx).
- Tono: Comediante regio de barrio (orgulloso de San Nicolás / Nicolás Bravo), señor casado, bonachón, espontáneo, maestro de la anécdota cotidiana (carnes asadas, caguamas, amigos cagapalos, su esposa, cosas de señores). Cuando Adrián se pone muy elevado o pasado de lanza, lo bajas a tierra con carrilla regia.
- Muletillas naturales que puedes usar con variedad (sin repetir la misma en cada turno): "compadre", "no mames, Adrián", "nombre, cállate", "ya vas a empezar con tus mamadas", "te voy a contar una anécdota", "en mis tiempos", "mira compadrito".`;

    const systemMessage = `Estás en una transmisión en vivo del podcast de comedia y charla amena estilo "Hermanos de Leche" (@hermanosdelechemx) conducido por ${activeChar.name} y ${partnerChar.name}.
${specificPersonaGuide}
Configuración adicional del personaje: ${activeChar.systemPrompt}

REGLAS DE ORO PARA QUE SUENE 100% COMO EL PODCAST REAL "HERMANOS DE LECHE":
1. PLÁTICA AMENA, RELAJADA Y CON HUMOR: Olvida el tono robótico o de noticiero. Esto es una plática de compadres sentados frente al micrófono tomando algo, riéndose de la vida real, de las relaciones, las mujeres, las fiestas y las costumbres mexicanas/regias.
2. ESCUCHA Y REACCIONA A TU COMPADRE: Tu primera frase SIEMPRE debe reaccionar directamente a lo que acaba de decir ${partnerChar.name} (darle la razón, reírte de su ocurrencia, responder su pregunta o llevarle la contraria con carrilla).
3. USA LA BASE DE CONOCIMIENTO DE TRANSCRIPTS: Apóyate en las posturas, anécdotas y estilo de los episodios de @hermanosdelechemx incluidos abajo para opinar tal cual como opinan en el canal.
4. PROHIBIDO CICLARSE: No empieces todos los turnos con la misma muletilla. Varía el ritmo y haz que la conversación avance de una anécdota o subtema a otro.
5. FORMATO PARA VOZ (TTS): Escribe de 2 a 3 oraciones fluidas (entre 32 y 58 palabras). Sin emojis, sin asteriscos (*ríe*) y sin poner tu nombre al principio.`;

    const userPrompt = `TEMA DEL EPISODIO: ${topic.title} (${topic.premise})

BASE DE CONOCIMIENTO DE TRANSCRIPTS Y EPISODIOS DE @hermanosdelechemx (Usa estas posturas y estilo):
${episodesContext || '(Usa el estilo clásico de comedia, anécdotas y carrilla de Hermanos de Leche).'}

SUBTEMAS Y DATOS EN MESA PARA ESTE EPISODIO:
${sourcesSummary}

HISTORIAL RECIENTE DE LA PLÁTICA (NO repitas chistes ni frases ya dichas):
${historyText}

${lastTurn ? `LO QUE ACABA DE DECIR TU COMPADRE ${lastTurn.speakerName.toUpperCase()} (Respóndele a esto):\n"${lastTurn.text}"\n` : ''}
DIRECCIÓN PARA ESTE TURNO (${phaseLabel}):
${turnObjective}

Escribe únicamente lo que dirá ${activeChar.name} en voz alta con su tono auténtico:`;

    const citedLabel = activeEpisode
      ? `${activeEpisode.title}${activeSource ? ` • ${activeSource.subtopicAngle}` : ''}`
      : activeSource?.sourceName;

    if (!this.hasApiKey()) {
      return {
        text: this.generateDynamicFallback(
          speaker,
          activeChar,
          partnerChar,
          topic,
          activeSource,
          activeEpisode,
          event
        ),
        citedSource: citedLabel,
        directorPhase: phaseLabel,
      };
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
            { role: 'system', content: systemMessage },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.88,
          presence_penalty: 0.55,
          frequency_penalty: 0.45,
          max_tokens: 750,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`[GroqService] Error HTTP ${response.status}: ${errBody}.`);
        return {
          text: this.generateDynamicFallback(
            speaker,
            activeChar,
            partnerChar,
            topic,
            activeSource,
            activeEpisode,
            event
          ),
          citedSource: citedLabel,
          directorPhase: phaseLabel,
        };
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
      };

      const rawText = data.choices?.[0]?.message?.content?.trim();
      if (!rawText) {
        console.warn('[GroqService] Respuesta vacía del modelo, usando respaldo dinámico.');
        return {
          text: this.generateDynamicFallback(
            speaker,
            activeChar,
            partnerChar,
            topic,
            activeSource,
            activeEpisode,
            event
          ),
          citedSource: citedLabel,
          directorPhase: phaseLabel,
        };
      }

      return {
        text: this.cleanSpeechText(rawText, activeChar.name),
        citedSource: citedLabel,
        directorPhase: phaseLabel,
      };
    } catch (error) {
      console.error('[GroqService] Error conectando con Groq:', error);
      return {
        text: this.generateDynamicFallback(
          speaker,
          activeChar,
          partnerChar,
          topic,
          activeSource,
          activeEpisode,
          event
        ),
        citedSource: citedLabel,
        directorPhase: phaseLabel,
      };
    }
  }

  private cleanSpeechText(text: string, speakerName: string): string {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(new RegExp(`^${speakerName}\\s*:\\s*`, 'i'), '')
      .replace(/^(Adri[aá]n(\s+Marcelo)?|La\s+Mole|Iv[aá]n)\s*:\s*/i, '')
      .replace(/\*[^*]+\*/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/^["«“]|["»”]$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateDynamicFallback(
    speaker: SpeakerId,
    _activeChar: CharacterConfig,
    partnerChar: CharacterConfig,
    topic: TopicConfig,
    source?: ResearchSourceItem,
    episode?: HermanosEpisodeEntry,
    event?: TikTokEventItem
  ): string {
    if (event?.type === 'chat') {
      return speaker === 'A'
        ? `Mira compadre, aquí @${event.username} tira la neta en el chat diciendo "${event.message}". Al chile no nos hagamos, ${episode?.adrianPosition || 'a la raza le encanta el drama'}, ¿cómo la ves tú, ${partnerChar.name}?`
        : `¡Nombre, saludos a @${event.username}! Tiene toda la razón con eso de "${event.message}", compadre. En el barrio siempre pasa igualito, ¿o me vas a decir que a ti nunca te ha tocado, ${partnerChar.name}?`;
    }
    if (episode) {
      return speaker === 'A'
        ? `Te voy a decir una cosa, ${partnerChar.name}: hablando de ${topic.title.toLowerCase()}, ${episode.adrianPosition} ¿O me vas a negar que así funciona la psicología de la raza, chaparrito?`
        : `¡Nombre, cállate ${partnerChar.name}! ${episode.laMolePosition} Al final uno prefiere llevar la fiesta en paz y prender el carbón el domingo, compadre.`;
    }
    if (source) {
      return speaker === 'A'
        ? `Al chile tienes un punto ahí, ${partnerChar.name}, pero fíjate en esto sobre ${source.subtopicAngle.toLowerCase()}: ${source.fact} La raza nunca aprende, compadre.`
        : `No mames, ${partnerChar.name}, es que así es la vida real. Con eso de ${source.subtopicAngle.toLowerCase()}, a mí siempre me pasa con los compas de la cuadra.`;
    }
    return `Al chile este tema de ${topic.title.toLowerCase()} da para tres caguamas, ${partnerChar.name}, porque cada quien cuenta cómo le fue en la feria.`;
  }
}
