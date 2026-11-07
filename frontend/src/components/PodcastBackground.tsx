import React from 'react';
import { SpeakerId } from '../types';

interface PodcastBackgroundProps {
  activeSpeaker: SpeakerId | null;
  mouthOpenY: number;
  children?: React.ReactNode;
}

/**
 * Componente <PodcastBackground />:
 * Escena completa del estudio de podcast en proporción vertical 9:16 (viewBox 540x960, equiv. 1080x1920).
 * Renderiza:
 *  1) Cabina acústica con paneles verticales, ladrillo cálido, luces LED/neón y sillones de estudio.
 *  2) Acepta como `children` los componentes <CharacterLeft /> y <CharacterRight /> anclados en sus sillas.
 *  3) Superpone en primer plano la mesa de madera con latas, guion, pluma, audífonos y los micrófonos
 *     fijos de brazo articulado (Shure SM7B) apuntando a cada personaje.
 */
export const PodcastBackground: React.FC<PodcastBackgroundProps> = ({
  activeSpeaker,
  mouthOpenY,
  children,
}) => {
  const pulseA = activeSpeaker === 'A' ? 0.55 + mouthOpenY * 0.45 : 0;
  const pulseB = activeSpeaker === 'B' ? 0.55 + mouthOpenY * 0.45 : 0;

  return (
    <svg
      viewBox="0 0 540 960"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full select-none pointer-events-none"
    >
      <defs>
        {/* Patrón de ladrillo acústico oscuro */}
        <pattern id="studio-brick" width="68" height="34" patternUnits="userSpaceOnUse">
          <rect width="68" height="34" fill="#221210" />
          <rect x="2" y="2" width="30" height="13" rx="2" fill="#3b1d18" />
          <rect x="36" y="2" width="30" height="13" rx="2" fill="#321814" />
          <rect x="-15" y="19" width="30" height="13" rx="2" fill="#351915" />
          <rect x="19" y="19" width="30" height="13" rx="2" fill="#41201b" />
          <rect x="53" y="19" width="30" height="13" rx="2" fill="#2e1612" />
        </pattern>

        {/* Paneles acústicos verticales del set */}
        <pattern id="acoustic-panels" width="28" height="960" patternUnits="userSpaceOnUse">
          <rect width="28" height="960" fill="#161110" />
          <rect x="3" width="18" height="960" fill="#271d1a" />
          <rect x="3" width="4" height="960" fill="#332622" opacity="0.55" />
        </pattern>

        {/* Filtros de resplandor LED / Neón */}
        <filter id="led-cyan" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b1" />
          <feGaussianBlur stdDeviation="14" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="led-red" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b1" />
          <feGaussianBlur stdDeviation="12" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="room-lighting" cx="50%" cy="44%" r="65%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="72%" stopColor="#090606" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#040202" stopOpacity="0.82" />
        </radialGradient>
      </defs>

      {/* =================================================================
          CAPA 1: FONDO DE CABINA ACÚSTICA, LADRILLO, LUCES NEÓN Y SILLONES
          ================================================================= */}
      <g id="podcast-back-wall">
        {/* Paredes laterales de ladrillo y cabina acústica central */}
        <rect x="0" y="0" width="150" height="740" fill="url(#studio-brick)" />
        <rect x="390" y="0" width="150" height="740" fill="url(#studio-brick)" />
        <rect x="146" y="0" width="248" height="740" fill="url(#acoustic-panels)" />

        {/* Marcos divisores del set */}
        <line x1="146" y1="0" x2="146" y2="740" stroke="#0e0a09" strokeWidth="6" />
        <line x1="274" y1="0" x2="274" y2="740" stroke="#0e0a09" strokeWidth="5" />
        <line x1="394" y1="0" x2="394" y2="740" stroke="#0e0a09" strokeWidth="6" />

        {/* Iluminación ambiental de cabina */}
        <rect x="0" y="0" width="540" height="740" fill="url(#room-lighting)" />

        {/* Letrero Neón Izquierdo */}
        <g transform="translate(-16, 175)">
          <circle
            cx="42"
            cy="82"
            r="62"
            fill="#140d0f"
            fillOpacity="0.82"
            stroke="#1f2937"
            strokeWidth="2"
          />
          <circle
            cx="42"
            cy="82"
            r="52"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4.2"
            filter="url(#led-cyan)"
          />
          <circle cx="42" cy="82" r="52" fill="none" stroke="#cffafe" strokeWidth="1.4" />
          <path
            d="M 8 88 C 15 72, 22 72, 24 88 C 26 74, 34 74, 36 88 M 42 81 C 42 72, 55 72, 55 81 C 55 90, 42 90, 42 81 M 63 75 C 57 75, 57 81, 65 82 C 72 83, 71 89, 61 89"
            fill="none"
            stroke="#fb7185"
            strokeWidth="3.8"
            strokeLinecap="round"
            filter="url(#led-red)"
          />
        </g>

        {/* Letrero Neón Derecho */}
        <g transform="translate(498, 228)">
          <rect
            x="0"
            y="0"
            width="60"
            height="50"
            rx="8"
            fill="#180c0c"
            fillOpacity="0.82"
            stroke="#fb7185"
            strokeWidth="3.8"
            filter="url(#led-red)"
          />
          <path
            d="M 14 34 L 22 16 L 30 34 M 17 28 L 27 28"
            fill="none"
            stroke="#fecdd3"
            strokeWidth="2.4"
            strokeLinecap="round"
            filter="url(#led-red)"
          />
        </g>

        {/* Piso oscuro del estudio */}
        <rect x="0" y="620" width="540" height="340" fill="#121012" />

        {/* Mesita lateral izquierda con vaso de café */}
        <g transform="translate(-6, 518)">
          <polygon
            points="12,0 34,0 30,34 16,34"
            fill="#f1f5f9"
            stroke="#141418"
            strokeWidth="2.2"
          />
          <polygon
            points="13,11 33,11 31,25 15,25"
            fill="#3f3f46"
            stroke="#141418"
            strokeWidth="1.8"
          />
          <rect
            x="10"
            y="-5"
            width="26"
            height="6"
            rx="2"
            fill="#18181b"
            stroke="#141418"
            strokeWidth="2"
          />
          <rect
            x="0"
            y="34"
            width="48"
            height="12"
            rx="2"
            fill="#6b4226"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <rect
            x="8"
            y="46"
            width="10"
            height="135"
            fill="#4a2c18"
            stroke="#141418"
            strokeWidth="2.2"
          />
        </g>

        {/* SILLÓN IZQUIERDO (Respaldo y base donde se sienta Adrián) */}
        <g id="chair-left" transform="translate(20, 442)">
          {/* Respaldo acolchado */}
          <rect
            x="22"
            y="0"
            width="196"
            height="168"
            rx="14"
            fill="#27272d"
            stroke="#141418"
            strokeWidth="2.8"
          />
          {/* Descansabrazos exterior izquierdo */}
          <rect
            x="0"
            y="78"
            width="40"
            height="148"
            rx="8"
            fill="#2d2d35"
            stroke="#141418"
            strokeWidth="2.8"
          />
          <rect
            x="0"
            y="78"
            width="40"
            height="12"
            rx="6"
            fill="#383842"
            stroke="#141418"
            strokeWidth="2.4"
          />
          {/* Descansabrazos interior derecho (donde Adrián apoya el codo izquierdo) */}
          <rect
            x="194"
            y="84"
            width="48"
            height="142"
            rx="8"
            fill="#232329"
            stroke="#141418"
            strokeWidth="2.8"
          />
          <rect
            x="194"
            y="84"
            width="48"
            height="12"
            rx="6"
            fill="#32323c"
            stroke="#141418"
            strokeWidth="2.4"
          />
          {/* Cojín del asiento */}
          <rect
            x="34"
            y="152"
            width="170"
            height="58"
            rx="6"
            fill="#1e1e24"
            stroke="#141418"
            strokeWidth="2.8"
          />
          {/* Pata de madera visible */}
          <polygon
            points="16,226 28,226 24,268 12,268"
            fill="#4a2c18"
            stroke="#141418"
            strokeWidth="2.2"
          />
        </g>

        {/* SILLÓN DERECHO (Respaldo y base donde se sienta La Mole) */}
        <g id="chair-right" transform="translate(294, 442)">
          <rect
            x="18"
            y="0"
            width="204"
            height="168"
            rx="14"
            fill="#27272d"
            stroke="#141418"
            strokeWidth="2.8"
          />
          <rect
            x="202"
            y="78"
            width="40"
            height="148"
            rx="8"
            fill="#2d2d35"
            stroke="#141418"
            strokeWidth="2.8"
          />
          <rect
            x="26"
            y="152"
            width="182"
            height="58"
            rx="6"
            fill="#1e1e24"
            stroke="#141418"
            strokeWidth="2.8"
          />
        </g>
      </g>

      {/* =================================================================
          CAPA 2: PERSONAJES SENTADOS (<CharacterLeft /> y <CharacterRight />)
          ================================================================= */}
      {children}

      {/* =================================================================
          CAPA 3: MICRÓFONOS DE BRAZO ARTICULADO (SHURE SM7B) + MESA CON PROPS
          ================================================================= */}
      <g id="podcast-foreground-desk-and-mics">
        {/* Brazo articulado y Micrófono Izquierdo (Apuntando a Adrián) */}
        <g id="mic-left">
          {/* Barras paralelas del brazo de tijera */}
          <line
            x1="312"
            y1="428"
            x2="232"
            y2="466"
            stroke="#1f2028"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="312"
            y1="438"
            x2="235"
            y2="476"
            stroke="#2e303b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Poste vertical soporte central */}
          <line
            x1="312"
            y1="428"
            x2="312"
            y2="520"
            stroke="#18181f"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <circle cx="312" cy="432" r="6" fill="#27272a" stroke="#141418" strokeWidth="2" />

          {/* Cápsula Shure SM7B Izquierda */}
          <g transform="translate(198, 434) rotate(-28)">
            {/* Horquilla / Yoke mount */}
            <path
              d="M 15 4 L 15 32 M 4 18 L 26 18"
              stroke="#18181b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <rect
              x="0"
              y="10"
              width="30"
              height="60"
              rx="12"
              fill="#2a2b33"
              stroke="#141418"
              strokeWidth="2.6"
            />
            <rect
              x="2"
              y="12"
              width="26"
              height="32"
              rx="11"
              fill="#1b1c22"
              stroke="#141418"
              strokeWidth="2"
            />
            {/* Anillo indicador de voz activa */}
            <rect
              x="1"
              y="43"
              width="28"
              height="4.5"
              fill={activeSpeaker === 'A' ? '#22d3ee' : '#3f3f46'}
              opacity={activeSpeaker === 'A' ? pulseA : 0.75}
            />
          </g>
        </g>

        {/* Brazo articulado y Micrófono Derecho (Apuntando a La Mole) */}
        <g id="mic-right">
          <line
            x1="312"
            y1="432"
            x2="356"
            y2="472"
            stroke="#1f2028"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g transform="translate(352, 448) rotate(26)">
            <rect
              x="0"
              y="10"
              width="30"
              height="60"
              rx="12"
              fill="#2a2b33"
              stroke="#141418"
              strokeWidth="2.6"
            />
            <rect
              x="2"
              y="12"
              width="26"
              height="32"
              rx="11"
              fill="#1b1c22"
              stroke="#141418"
              strokeWidth="2"
            />
            <rect
              x="1"
              y="43"
              width="28"
              height="4.5"
              fill={activeSpeaker === 'B' ? '#f43f5e' : '#3f3f46'}
              opacity={activeSpeaker === 'B' ? pulseB : 0.75}
            />
          </g>
        </g>

        {/* MESA DE MADERA EN PRIMER PLANO CON LATAS, GUION, PLUMA Y AUDÍFONOS */}
        <g id="foreground-table" transform="translate(216, 610)">
          {/* Patas de madera anguladas */}
          <polygon
            points="38,52 56,52 40,145 22,145"
            fill="#4d2c18"
            stroke="#141418"
            strokeWidth="2.6"
          />
          <polygon
            points="64,54 78,54 70,126 56,126"
            fill="#382011"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <polygon
            points="272,52 290,52 302,145 284,145"
            fill="#4d2c18"
            stroke="#141418"
            strokeWidth="2.6"
          />

          {/* Superficie superior de la mesa en perspectiva */}
          <polygon
            points="26,12 314,12 330,44 0,44"
            fill="#7e4b2b"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Canto frontal de la mesa */}
          <rect
            x="0"
            y="44"
            width="330"
            height="14"
            rx="2"
            fill="#5e361e"
            stroke="#141418"
            strokeWidth="2.8"
          />

          {/* Lata 1 (Izquierda - Roja con etiqueta azul/blanca detallada) */}
          <g transform="translate(36, -16)">
            <path
              d="M 0 5 C 0 1, 24 1, 24 5 L 24 41 C 24 45, 0 45, 0 41 Z"
              fill="#cf2929"
              stroke="#141418"
              strokeWidth="2.3"
            />
            <path d="M 1 15 Q 12 18 23 15 L 23 31 Q 12 34 1 31 Z" fill="#2563eb" />
            <ellipse
              cx="12"
              cy="23"
              rx="6.5"
              ry="5"
              fill="#f8fafc"
              stroke="#141418"
              strokeWidth="1.3"
            />
            <ellipse
              cx="12"
              cy="5"
              rx="11.5"
              ry="3.2"
              fill="#cbd5e1"
              stroke="#141418"
              strokeWidth="2"
            />
          </g>

          {/* Lata 2 (Centro-Izquierda - Verde con detalle naranja) */}
          <g transform="translate(106, -22)">
            <path
              d="M 0 5 C 0 1, 24 1, 24 5 L 24 41 C 24 45, 0 45, 0 41 Z"
              fill="#3d7a47"
              stroke="#141418"
              strokeWidth="2.3"
            />
            <ellipse
              cx="12"
              cy="24"
              rx="6"
              ry="4.5"
              fill="#ea580c"
              stroke="#141418"
              strokeWidth="1.3"
            />
            <ellipse
              cx="12"
              cy="5"
              rx="11.5"
              ry="3.2"
              fill="#cbd5e1"
              stroke="#141418"
              strokeWidth="2"
            />
          </g>

          {/* Pluma / Bolígrafo sobre la mesa */}
          <line
            x1="76"
            y1="33"
            x2="96"
            y2="24"
            stroke="#141418"
            strokeWidth="4.8"
            strokeLinecap="round"
          />
          <line
            x1="78"
            y1="32"
            x2="94"
            y2="25"
            stroke="#d4a373"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Hojas de Guion / Notas del episodio */}
          <g transform="translate(145, 13)">
            <polygon
              points="10,2 72,0 82,23 0,25"
              fill="#cbd5e1"
              stroke="#141418"
              strokeWidth="2"
            />
            <polygon
              points="6,0 68,-2 78,21 -4,23"
              fill="#f8fafc"
              stroke="#141418"
              strokeWidth="2.2"
            />
            <line x1="12" y1="6" x2="56" y2="5" stroke="#475569" strokeWidth="1.8" />
            <line x1="10" y1="11" x2="60" y2="10" stroke="#64748b" strokeWidth="1.5" />
            <line x1="8" y1="16" x2="50" y2="15" stroke="#64748b" strokeWidth="1.5" />
          </g>

          {/* Audífonos descansando sobre la mesa */}
          <g transform="translate(242, 12)">
            <path
              d="M 6 18 C 4 4, 34 4, 32 18"
              fill="none"
              stroke="#27272a"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <ellipse
              cx="8"
              cy="20"
              rx="6.5"
              ry="5"
              fill="#3f3f46"
              stroke="#141418"
              strokeWidth="2.2"
            />
            <ellipse
              cx="28"
              cy="20"
              rx="6.5"
              ry="5"
              fill="#3f3f46"
              stroke="#141418"
              strokeWidth="2.2"
            />
          </g>

          {/* Lata 3 (Derecha - Roja/Naranja) */}
          <g transform="translate(284, -18)">
            <path
              d="M 0 5 C 0 1, 24 1, 24 5 L 24 41 C 24 45, 0 45, 0 41 Z"
              fill="#c2410c"
              stroke="#141418"
              strokeWidth="2.3"
            />
            <rect x="2" y="14" width="20" height="16" fill="#ea580c" />
            <ellipse
              cx="12"
              cy="5"
              rx="11.5"
              ry="3.2"
              fill="#cbd5e1"
              stroke="#141418"
              strokeWidth="2"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
