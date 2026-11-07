import React from 'react';
import { CharacterConfig, LipSyncFrame } from '../types';
import { MouthCoordinates, VisemeMouth } from './VisemeMouth';

/**
 * Coordenadas absolutas de la boca de Adrián Marcelo (CharacterLeft)
 * dentro del sistema de coordenadas del estudio (viewBox 540x960).
 */
export const CHARACTER_LEFT_MOUTH_COORDS: MouthCoordinates = {
  x: 141,
  y: 403,
  scale: 1.0,
};

interface CharacterLeftProps {
  character: CharacterConfig;
  isSpeaking: boolean;
  isBlinking: boolean;
  lipSync: LipSyncFrame;
  timeSec: number;
}

/**
 * Componente <CharacterLeft /> (Adrián Marcelo):
 * Cuerpo completo sentado e integrado en el sillón izquierdo del estudio.
 * Diseño 2D estilo comedia recortada (cutout animation refinada) con delineado limpio,
 * camisa oscura abierta sobre playera negra, audífonos de estudio, reloj en muñeca,
 * mano derecha expresiva al pecho y coordenadas absolutas de boca para el sprite de visema.
 */
export const CharacterLeft: React.FC<CharacterLeftProps> = ({
  character,
  isSpeaking,
  isBlinking,
  lipSync,
  timeSec,
}) => {
  const mouthOpenY = isSpeaking ? lipSync.mouthOpenY : 0;
  const mouthForm = isSpeaking ? lipSync.mouthForm : 0.15;
  const activeViseme = isSpeaking ? lipSync.viseme : 'SIL';

  // Micro-rebote instantáneo de mandíbula estilo South Park (2-3px en fonemas abiertos A/O, sin interpolación)
  const jawDrop = activeViseme === 'A' ? 3 : activeViseme === 'O' ? 2 : 0;
  const browLift = activeViseme === 'A' ? 2.5 : 0;

  // Seguimiento de pupilas (mira hacia La Mole a la derecha)
  const pupilX = isSpeaking ? (Math.sin(timeSec * 1.6) > -0.3 ? 3.8 : 1.2) : 4.2;
  const pupilY = 0.4;

  const skin = character.rigStyle.skinTone || '#ebb892';

  return (
    <g id="character-left-adrian">
      <defs>
        <pattern
          id="adrian-beard-stipple"
          width="4.5"
          height="4.5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.2" cy="1.2" r="0.6" fill="#3d271a" opacity="0.55" />
          <circle cx="3.4" cy="3.2" r="0.55" fill="#2e1c12" opacity="0.5" />
        </pattern>
      </defs>

      {/* =================================================================
          1. PIERNAS SENTADAS (JEANS Y TENIS ANCLADOS AL SILLÓN IZQUIERDO)
          ================================================================= */}
      <g id="adrian-legs">
        {/* Cadera / Base del pantalón en el asiento */}
        <path
          d="M 80 562 Q 138 578 194 562 L 198 596 Q 138 608 76 596 Z"
          fill="#263f5c"
          stroke="#141418"
          strokeWidth="2.6"
        />

        {/* Pierna Izquierda */}
        <path
          d="M 74 574 C 68 592, 72 638, 76 672 L 116 672 C 120 638, 120 596, 114 578 Z"
          fill="#355678"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Pliegues de mezclilla rodilla izquierda */}
        <path
          d="M 82 588 Q 96 596 108 588 M 84 654 L 110 654"
          fill="none"
          stroke="#1e344d"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pierna Derecha */}
        <path
          d="M 144 578 C 138 596, 140 638, 144 672 L 186 672 C 190 638, 192 592, 184 574 Z"
          fill="#355678"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M 150 588 Q 164 596 176 588 M 150 654 L 180 654"
          fill="none"
          stroke="#1e344d"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Tenis Izquierdo */}
        <g transform="translate(74, 668)">
          <path
            d="M 2 0 L 40 0 L 44 18 L -2 18 Z"
            fill="#374151"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <path d="M 6 6 L 34 6 M 8 11 L 32 11" stroke="#f8fafc" strokeWidth="1.8" />
          <rect
            x="-3"
            y="16"
            width="48"
            height="6"
            rx="2"
            fill="#f8fafc"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* Tenis Derecho (en ángulo) */}
        <g transform="translate(144, 668)">
          <path
            d="M 0 0 L 40 0 L 58 16 L 0 18 Z"
            fill="#374151"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <path d="M 18 5 L 38 9 M 20 10 L 40 13" stroke="#f8fafc" strokeWidth="1.8" />
          <path
            d="M 42 9 C 54 9, 60 13, 60 17 L 42 17 Z"
            fill="#f8fafc"
            stroke="#141418"
            strokeWidth="1.8"
          />
          <rect
            x="-2"
            y="16"
            width="62"
            height="6"
            rx="2"
            fill="#f8fafc"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>
      </g>

      {/* =================================================================
          2. TORSO, CAMISA ABIERTA, BRAZOS Y MANOS CON RELOJ Y GESTO (FIJOS AL SILLÓN)
          ================================================================= */}
      <g id="adrian-torso-and-arms">
        {/* Cuello anatómico con sombra bajo la barbilla */}
        <path
          d="M 122 418 L 122 452 L 156 452 L 156 418 Z"
          fill={skin}
          stroke="#141418"
          strokeWidth="2.6"
        />
        <path d="M 122 424 Q 139 438 156 424 L 156 436 L 122 436 Z" fill="rgba(0,0,0,0.18)" />

        {/* Torso Base: Playera negra interior + Camisa casual oscura de manga corta */}
        {/* Hombros redondeados continuos (sin picos) */}
        <path
          d="M 72 512 C 70 468, 92 442, 138 442 C 184 442, 206 468, 204 512 L 194 572 Q 138 580 82 572 Z"
          fill="#2b303c"
          stroke="#141418"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Playera negra interior al centro del pecho */}
        <path
          d="M 118 444 L 158 444 L 156 574 L 120 574 Z"
          fill="#16171d"
          stroke="#141418"
          strokeWidth="2.4"
        />

        {/* Solapas del cuello de la camisa abierta */}
        <path
          d="M 118 438 L 102 456 L 116 476 L 122 448 Z M 158 438 L 174 456 L 160 476 L 154 448 Z"
          fill="#222630"
          stroke="#141418"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* BRAZO DERECHO (Izquierda del espectador): Bajando natural con la mano descansando en la rodilla */}
        <g id="adrian-right-arm-on-knee">
          {/* Antebrazo derecho saliendo por debajo de la manga hacia la rodilla */}
          <path
            d="M 70 500 C 68 524, 74 544, 82 558 L 106 556 C 100 540, 96 520, 94 500 Z"
            fill={skin}
            stroke="#141418"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Mano derecha descansando sobre la rodilla */}
          <g transform="translate(78, 552)">
            <path
              d="M 2 6 C 4 -2, 30 -2, 34 6 C 37 18, 32 28, 18 28 C 6 28, 0 18, 2 6 Z"
              fill={skin}
              stroke="#141418"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M 10 12 L 9 25 M 18 13 L 18 27 M 26 12 L 27 25"
              stroke="#141418"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Manga corta derecha (izquierda del espectador, superpuesta al antebrazo) */}
        <path
          d="M 86 452 C 70 464, 64 486, 66 510 L 98 510 C 98 490, 98 468, 94 456 Z"
          fill="#2b303c"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Doblez de la manga derecha */}
        <line x1="66" y1="504" x2="98" y2="506" stroke="#141418" strokeWidth="2.2" />

        {/* BRAZO IZQUIERDO (Derecha del espectador): Codo descansando sobre el descansabrazos del sillón */}
        <g id="adrian-left-arm-on-armrest">
          {/* Codo apoyado en el descansabrazos (y=526) y antebrazo descansando horizontalmente */}
          <path
            d="M 196 504 C 202 518, 210 526, 220 527 L 256 527 C 258 520, 258 513, 254 511 C 240 511, 228 511, 224 509 C 222 504, 220 500, 218 496 Z"
            fill={skin}
            stroke="#141418"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Pliegue interior del codo flexionado */}
          <path
            d="M 224 509 L 218 515"
            fill="none"
            stroke="#141418"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Smartwatch negro en la muñeca izquierda */}
          <g transform="translate(242, 509)">
            <rect
              x="0"
              y="0"
              width="10"
              height="20"
              rx="2"
              fill="#18181b"
              stroke="#141418"
              strokeWidth="1.8"
            />
            <rect
              x="-2"
              y="3"
              width="14"
              height="14"
              rx="3"
              fill="#09090b"
              stroke="#3f3f46"
              strokeWidth="1.4"
            />
          </g>
          {/* Mano izquierda relajada en el extremo del descansabrazos */}
          <path
            d="M 254 512 C 268 511, 278 516, 279 524 C 279 532, 267 535, 252 527 Z"
            fill={skin}
            stroke="#141418"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M 263 517 L 275 519 M 263 522 L 276 524 M 261 527 L 273 529"
            stroke="#141418"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Manga corta izquierda (derecha del espectador, superpuesta al hombro/brazo superior) */}
        <path
          d="M 188 452 C 204 462, 218 482, 224 502 L 194 510 C 190 492, 184 470, 182 456 Z"
          fill="#2b303c"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <line x1="194" y1="504" x2="222" y2="497" stroke="#141418" strokeWidth="2.2" />
      </g>

      {/* =================================================================
          3. CABEZA, AUDÍFONOS, CABELLO, BARBA RECORTADA Y VISEMA DE BOCA (ANCLADOS)
          ================================================================= */}
      <g id="adrian-head">
        {/* Diadema superior de los audífonos de estudio */}
        <path
          d="M 80 356 C 76 262, 200 262, 194 356"
          fill="none"
          stroke="#23242c"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 80 356 C 76 262, 200 262, 194 356"
          fill="none"
          stroke="#141418"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Copa izquierda del audífono */}
        <g transform="translate(68, 336) rotate(-6)">
          <rect
            x="0"
            y="0"
            width="20"
            height="46"
            rx="9"
            fill="#2b2d38"
            stroke="#141418"
            strokeWidth="2.6"
          />
          <rect
            x="12"
            y="4"
            width="9"
            height="38"
            rx="4"
            fill="#18181f"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* Copa derecha del audífono */}
        <g transform="translate(184, 336) rotate(6)">
          <rect
            x="0"
            y="0"
            width="18"
            height="44"
            rx="8"
            fill="#2b2d38"
            stroke="#141418"
            strokeWidth="2.6"
          />
          <rect
            x="-2"
            y="4"
            width="8"
            height="36"
            rx="4"
            fill="#18181f"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* Contorno craneal y mandíbula angulada con caída reactiva (jawDrop) */}
        <path
          d={`M 86 322 C 86 282, 190 282, 190 322 L 190 368 C 190 396, 170 ${
            426 + jawDrop
          }, 140 ${429 + jawDrop} C 110 ${426 + jawDrop}, 86 396, 86 368 Z`}
          fill={skin}
          stroke="#141418"
          strokeWidth="2.7"
          strokeLinejoin="round"
        />

        {/* Barba recortada marcada con abertura limpia de piel alrededor de la boca */}
        <path
          d={`M 86 362 C 90 374, 98 386, 112 388 C 124 382, 156 382, 168 388 C 180 386, 186 374, 190 362 L 190 370 C 190 398, 170 ${
            426 + jawDrop
          }, 140 ${429 + jawDrop} C 110 ${426 + jawDrop}, 86 398, 86 370 Z`}
          fill="#9c7254"
          fillOpacity="0.48"
        />
        <path
          d={`M 86 362 C 90 374, 98 386, 112 388 C 124 382, 156 382, 168 388 C 180 386, 186 374, 190 362 L 190 370 C 190 398, 170 ${
            426 + jawDrop
          }, 140 ${429 + jawDrop} C 110 ${426 + jawDrop}, 86 398, 86 370 Z`}
          fill="url(#adrian-beard-stipple)"
        />
        {/* Abertura de piel clara alrededor de los labios para contraste del visema */}
        <ellipse
          cx="141"
          cy={404 + jawDrop * 0.35}
          rx="20"
          ry={10 + jawDrop * 0.35}
          fill={skin}
        />
        {/* Bigote recortado superior */}
        <path
          d="M 118 394 Q 141 386 164 394 Q 141 391 118 394 Z"
          fill="#7a543b"
          opacity="0.65"
        />

        {/* Cabello castaño con copete texturizado */}
        <path
          d="M 85 352 L 82 318 C 78 292, 94 274, 116 274 L 122 266 C 134 264, 150 266, 162 272 L 170 267 C 186 274, 198 292, 194 320 L 190 352 L 184 352 L 184 320 C 180 302, 164 294, 138 294 C 112 294, 96 302, 92 320 L 91 352 Z"
          fill="#382215"
          stroke="#141418"
          strokeWidth="2.7"
          strokeLinejoin="round"
        />
        {/* Mechones superiores del copete */}
        <path
          d="M 108 282 Q 128 274 148 282 M 126 273 Q 146 268 166 276"
          fill="none"
          stroke="#22140c"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Ojos expresivos estilo cutout con párpado superior relajado */}
        {(
          [
            { cx: 123, cy: 356, rx: 14.5, ry: 13.5 },
            { cx: 156, cy: 356, rx: 14.5, ry: 13.5 },
          ] as const
        ).map((eye, idx) => (
          <g key={idx}>
            {isBlinking ? (
              <g>
                <ellipse
                  cx={eye.cx}
                  cy={eye.cy}
                  rx={eye.rx}
                  ry={eye.ry}
                  fill={skin}
                  stroke="#141418"
                  strokeWidth="2.3"
                />
                <path
                  d={`M ${eye.cx - eye.rx} ${eye.cy + 1} Q ${eye.cx} ${eye.cy + 6} ${
                    eye.cx + eye.rx
                  } ${eye.cy + 1}`}
                  fill="none"
                  stroke="#141418"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <g>
                <ellipse
                  cx={eye.cx}
                  cy={eye.cy}
                  rx={eye.rx}
                  ry={eye.ry}
                  fill="#f8fafc"
                  stroke="#141418"
                  strokeWidth="2.4"
                />
                {/* Pupila mirando hacia su compañero */}
                <circle cx={eye.cx + pupilX} cy={eye.cy + pupilY} r="3.4" fill="#141418" />
                <circle
                  cx={eye.cx + pupilX - 1}
                  cy={eye.cy + pupilY - 1}
                  r="1"
                  fill="#ffffff"
                />
                {/* Párpado superior característico del estilo comedia */}
                <path
                  d={`M ${eye.cx - eye.rx} ${eye.cy - 4} C ${eye.cx - 8} ${
                    eye.cy - eye.ry - 2
                  }, ${eye.cx + 8} ${eye.cy - eye.ry - 2}, ${eye.cx + eye.rx} ${eye.cy - 4} Z`}
                  fill={skin}
                />
                <path
                  d={`M ${eye.cx - eye.rx + 0.5} ${eye.cy - 4} Q ${eye.cx} ${eye.cy - 5.5} ${
                    eye.cx + eye.rx - 0.5
                  } ${eye.cy - 4}`}
                  fill="none"
                  stroke="#141418"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        ))}

        {/* Nariz definida en 3/4 */}
        <path
          d="M 141 356 L 145 376 C 146 381, 136 382, 134 378"
          fill={skin}
          stroke="#141418"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cejas expresivas con arqueo asimétrico */}
        <path
          d={`M 106 ${336 - browLift * 0.7} Q 121 ${331 - browLift} 135 ${335 - browLift * 0.6}`}
          fill="none"
          stroke="#2b1a10"
          strokeWidth="4.8"
          strokeLinecap="round"
        />
        <path
          d={`M 145 ${333 - browLift} Q 159 ${326 - browLift * 1.2} 173 ${333 - browLift * 0.8}`}
          fill="none"
          stroke="#2b1a10"
          strokeWidth="4.8"
          strokeLinecap="round"
        />

        {/* =================================================================
            4. SPRITE DE VISEMA EN COORDENADAS ABSOLUTAS (141, 403)
            ================================================================= */}
        <VisemeMouth
          coords={{
            x: CHARACTER_LEFT_MOUTH_COORDS.x,
            y: CHARACTER_LEFT_MOUTH_COORDS.y + jawDrop * 0.35,
            scale: CHARACTER_LEFT_MOUTH_COORDS.scale,
          }}
          viseme={lipSync.viseme}
          mouthOpenY={mouthOpenY}
          mouthForm={mouthForm}
          isSpeaking={isSpeaking}
          variant="adrian"
        />
      </g>
    </g>
  );
};
