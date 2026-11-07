import React from 'react';
import { CharacterConfig, LipSyncFrame } from '../types';
import { MouthCoordinates, VisemeMouth } from './VisemeMouth';

/**
 * Coordenadas absolutas de la boca de La Mole (CharacterRight)
 * dentro del sistema de coordenadas del estudio (viewBox 540x960).
 */
export const CHARACTER_RIGHT_MOUTH_COORDS: MouthCoordinates = {
  x: 396,
  y: 413,
  scale: 1.0,
};

interface CharacterRightProps {
  character: CharacterConfig;
  isSpeaking: boolean;
  isBlinking: boolean;
  lipSync: LipSyncFrame;
  timeSec: number;
}

/**
 * Componente <CharacterRight /> (La Mole):
 * Complexión robusta/pesada, sentado cómodamente en el sillón derecho detrás de la mesa.
 * Sudadera holgada café-gris con cierre sobre playera blanca, manos apoyadas sobre los muslos,
 * cabeza redonda con gorra curva, audífonos de estudio, barba cerrada tupida con recorte de piel
 * en los labios/mentón y coordenadas absolutas de boca para renderizar el sprite de visema.
 */
export const CharacterRight: React.FC<CharacterRightProps> = ({
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

  // Seguimiento de pupilas (mira hacia Adrián a la izquierda)
  const pupilX = isSpeaking ? (Math.sin(timeSec * 1.5) > -0.3 ? -3.8 : -1.0) : -4.2;
  const pupilY = 0.4;

  const skin = character.rigStyle.skinTone || '#ebb892';

  return (
    <g id="character-right-lamole">
      {/* =================================================================
          1. PIERNAS ROBUSTAS SENTADAS (JEANS DETRÁS DE LA MESA DE MADERA)
          ================================================================= */}
      <g id="lamole-legs">
        {/* Pelvis / Asiento amplio */}
        <path
          d="M 312 562 Q 396 582 480 562 L 486 616 Q 396 632 306 616 Z"
          fill="#263f5c"
          stroke="#141418"
          strokeWidth="2.6"
        />

        {/* Muslo y Rodilla Izquierda */}
        <path
          d="M 304 568 C 296 592, 300 642, 306 678 L 372 678 C 376 642, 376 602, 368 582 Z"
          fill="#355678"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Muslo y Rodilla Derecha */}
        <path
          d="M 420 582 C 412 602, 414 642, 418 678 L 484 678 C 490 642, 494 592, 486 568 Z"
          fill="#355678"
          stroke="#141418"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Pliegues de mezclilla */}
        <path
          d="M 318 594 Q 340 604 358 594 M 434 594 Q 456 604 474 594"
          fill="none"
          stroke="#1e344d"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* =================================================================
          2. TORSO ROBUSTO, HOODIE CON CIERRE Y MANOS APOYADAS EN MUSLOS
          ================================================================= */}
      <g id="lamole-torso-and-arms">
        {/* Capucha doblada detrás del cuello */}
        <path
          d="M 332 452 C 324 432, 468 432, 460 452 C 442 466, 350 466, 332 452 Z"
          fill="#4b433b"
          stroke="#141418"
          strokeWidth="2.6"
        />

        {/* Cuerpo principal del Hoodie (Hombros redondos continuos, CERO picos) */}
        <path
          d="M 294 558 C 288 494, 326 446, 396 446 C 466 446, 504 494, 498 558 C 492 574, 468 580, 396 580 C 324 580, 300 574, 294 558 Z"
          fill="#5c5249"
          stroke="#141418"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Playera blanca interior en el cuello (V-wedge) */}
        <path
          d="M 368 448 L 396 488 L 424 448 Q 396 458 368 448 Z"
          fill="#f8fafc"
          stroke="#141418"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Solapas del hoodie, línea central del cierre y bolsa canguro */}
        <path
          d="M 362 448 L 392 492 L 396 578 M 430 448 L 400 492"
          fill="none"
          stroke="#141418"
          strokeWidth="2.5"
        />
        {/* Costuras de bolsa frontal y pliegues del torso */}
        <path
          d="M 346 522 L 358 568 M 446 522 L 434 568 M 354 522 Q 396 528 438 522"
          fill="none"
          stroke="#3e3731"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Cordones del hoodie */}
        <path
          d="M 378 464 Q 376 492 379 508 M 414 464 Q 416 492 413 508"
          fill="none"
          stroke="#27221f"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Líneas internas de separación brazo-torso (suaves y curvas) */}
        <path
          d="M 332 496 C 326 518, 326 540, 336 558 M 460 496 C 466 518, 466 540, 456 558"
          fill="none"
          stroke="#141418"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Puños del hoodie */}
        <path
          d="M 304 548 Q 320 556 336 552 M 456 552 Q 472 556 488 548"
          fill="none"
          stroke="#3e3731"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* MANO IZQUIERDA (Apoyada sobre la rodilla izquierda) */}
        <g transform="translate(308, 552)">
          <path
            d="M 2 6 C 4 -2, 34 -2, 36 8 C 38 20, 30 28, 18 28 C 6 28, 0 20, 2 6 Z"
            fill={skin}
            stroke="#141418"
            strokeWidth="2.4"
          />
          <path
            d="M 10 12 L 9 25 M 18 13 L 18 27 M 26 12 L 27 25"
            stroke="#141418"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* MANO DERECHA (Apoyada sobre la rodilla derecha) */}
        <g transform="translate(448, 552)">
          <path
            d="M 2 8 C 4 -2, 34 -2, 36 6 C 38 20, 32 28, 20 28 C 8 28, 0 20, 2 8 Z"
            fill={skin}
            stroke="#141418"
            strokeWidth="2.4"
          />
          <path
            d="M 11 12 L 10 25 M 19 13 L 19 27 M 27 12 L 28 25"
            stroke="#141418"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* =================================================================
          3. CABEZA REDONDA, GORRA CURVA LISA, AUDÍFONOS, BARBA ORGÁNICA Y VISEMA
          ================================================================= */}
      <g id="lamole-head">
        {/* Diadema superior de los audífonos pasando sobre la gorra */}
        <path
          d="M 332 352 C 326 260, 466 260, 460 352"
          fill="none"
          stroke="#23242c"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 332 352 C 326 260, 466 260, 460 352"
          fill="none"
          stroke="#141418"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Copas de los audífonos de estudio a los lados de la cabeza */}
        <g transform="translate(320, 344) rotate(-4)">
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
            x="10"
            y="4"
            width="8"
            height="36"
            rx="4"
            fill="#18181f"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(454, 344) rotate(4)">
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
            x="0"
            y="4"
            width="8"
            height="36"
            rx="4"
            fill="#18181f"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* Papada / cuello redondo natural debajo de la barbilla */}
        <path
          d={`M 352 ${432 + jawDrop * 0.6} Q 396 ${460 + jawDrop * 0.8} 440 ${
            432 + jawDrop * 0.6
          } L 434 452 Q 396 464 358 452 Z`}
          fill={skin}
          stroke="#141418"
          strokeWidth="2.4"
        />

        {/* Contorno de cabeza redonda y orgánica (estilo South Park / Cartman) */}
        <path
          d={`M 334 338 C 334 290, 458 290, 458 338 C 467 366, 467 398, 448 ${
            422 + jawDrop
          } C 432 ${444 + jawDrop}, 414 ${450 + jawDrop}, 396 ${
            450 + jawDrop
          } C 378 ${450 + jawDrop}, 360 ${444 + jawDrop}, 344 ${
            422 + jawDrop
          } C 325 398, 325 366, 334 338 Z`}
          fill={skin}
          stroke="#141418"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* BARBA Y BIGOTE ORGÁNICOS Y REDONDOS (Con espacio abierto en el vello facial para enmarcar la boca) */}
        <g id="lamole-full-beard">
          {/* Relleno de barba con abertura interior (fillRule="evenodd", sin borde negro circular alrededor de la piel) */}
          <path
            fillRule="evenodd"
            d={`M 333 348 L 341 348 C 341 372, 348 392, 366 396 C 375 389, 385 387, 396 387 C 407 387, 417 389, 426 396 C 444 392, 451 372, 451 348 L 459 348 C 467 372, 466 400, 448 ${
              422 + jawDrop
            } C 432 ${444 + jawDrop}, 414 ${450 + jawDrop}, 396 ${
              450 + jawDrop
            } C 378 ${450 + jawDrop}, 360 ${444 + jawDrop}, 344 ${
              422 + jawDrop
            } C 326 400, 325 372, 333 348 Z M 371 403 C 379 397, 413 397, 421 403 C 423 ${
              420 + jawDrop
            }, 413 ${427 + jawDrop}, 396 ${427 + jawDrop} C 379 ${427 + jawDrop}, 369 ${
              420 + jawDrop
            }, 371 403 Z`}
            fill="#1f1512"
            stroke="none"
          />
          {/* Delineado negro únicamente en el contorno exterior de la barba y patillas */}
          <path
            d={`M 333 348 L 341 348 C 341 372, 348 392, 366 396 C 375 389, 385 387, 396 387 C 407 387, 417 389, 426 396 C 444 392, 451 372, 451 348 L 459 348 C 467 372, 466 400, 448 ${
              422 + jawDrop
            } C 432 ${444 + jawDrop}, 414 ${450 + jawDrop}, 396 ${
              450 + jawDrop
            } C 378 ${450 + jawDrop}, 360 ${444 + jawDrop}, 344 ${
              422 + jawDrop
            } C 326 400, 325 372, 333 348 Z`}
            fill="none"
            stroke="#141418"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Ojos redondos juntos estilo comedia mirando a Adrián */}
        {(
          [
            { cx: 379, cy: 365, rx: 15.5, ry: 15 },
            { cx: 412, cy: 365, rx: 15.5, ry: 15 },
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
                <circle cx={eye.cx + pupilX} cy={eye.cy + pupilY} r="3.4" fill="#141418" />
                <circle
                  cx={eye.cx + pupilX - 1}
                  cy={eye.cy + pupilY - 1}
                  r="1"
                  fill="#ffffff"
                />
                {/* Párpado superior ligero */}
                <path
                  d={`M ${eye.cx - eye.rx + 1} ${eye.cy - 6} Q ${eye.cx} ${eye.cy - 8} ${
                    eye.cx + eye.rx - 1
                  } ${eye.cy - 6}`}
                  fill="none"
                  stroke="#141418"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        ))}

        {/* Nariz redondeada entre los ojos */}
        <path
          d="M 396 365 L 392 381 C 391 386, 402 387, 403 382"
          fill={skin}
          stroke="#141418"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cejas negras arqueadas con frente amplia y despejada */}
        <path
          d={`M 361 ${343 - browLift * 0.8} Q 377 ${335 - browLift} 391 ${342 - browLift * 0.6}`}
          fill="none"
          stroke="#181311"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
        <path
          d={`M 401 ${342 - browLift * 0.6} Q 415 ${335 - browLift} 431 ${343 - browLift * 0.8}`}
          fill="none"
          stroke="#181311"
          strokeWidth="5.2"
          strokeLinecap="round"
        />

        {/* GORRA CLÁSICA CURVA DE COPA REDONDEADA Y LISA (Gris oscuro/negro, dejando ver la frente) */}
        <g id="lamole-baseball-cap">
          {/* Copa redondeada y lisa asentada sobre la parte alta de la cabeza (sin línea recta en la frente y sin gajos) */}
          <path
            d="M 332 340 C 330 268, 462 268, 460 340 C 444 308, 348 308, 332 340 Z"
            fill="#2b2c30"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Sombra suave bajo el arco de la visera sobre la parte alta de la frente */}
          <path
            d="M 335 340 C 352 308, 440 308, 457 340 C 440 318, 352 318, 335 340 Z"
            fill="#141418"
            opacity="0.24"
          />
          {/* Visera curva arqueada hacia arriba que deja descubierta la frente redonda */}
          <path
            d="M 330 342 C 348 296, 444 296, 462 342 C 444 312, 348 312, 330 342 Z"
            fill="#1f2024"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>

        {/* =================================================================
            4. SPRITE DE VISEMA EN COORDENADAS ABSOLUTAS (396, 413)
            ================================================================= */}
        <VisemeMouth
          coords={{
            x: CHARACTER_RIGHT_MOUTH_COORDS.x,
            y: CHARACTER_RIGHT_MOUTH_COORDS.y + jawDrop * 0.35,
            scale: CHARACTER_RIGHT_MOUTH_COORDS.scale,
          }}
          viseme={lipSync.viseme}
          mouthOpenY={mouthOpenY}
          mouthForm={mouthForm}
          isSpeaking={isSpeaking}
          variant="lamole"
        />
      </g>
    </g>
  );
};
