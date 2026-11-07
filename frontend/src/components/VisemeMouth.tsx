import React from 'react';
import { VisemeType } from '../types';

export interface MouthCoordinates {
  x: number;
  y: number;
  scale?: number;
}

interface VisemeMouthProps {
  coords: MouthCoordinates;
  viseme: VisemeType;
  mouthOpenY: number;
  mouthForm: number;
  isSpeaking: boolean;
  variant?: 'adrian' | 'lamole';
}

/**
 * Sprites de Boca Estilo South Park (Cutout Cartoon):
 * - Cero interpolación fluida (transition: none / formas discretas fijas por visema).
 * - Trazo negro grueso (#141418) + relleno negro (#111115) con dientes superiores blancos (#ffffff)
 *   y lengua roja/rosa (#e11d48).
 */
export const VisemeMouth: React.FC<VisemeMouthProps> = ({
  coords,
  viseme,
  isSpeaking,
}) => {
  const scale = coords.scale ?? 1;
  const activeViseme: VisemeType = isSpeaking ? viseme : 'SIL';

  return (
    <g
      transform={`translate(${coords.x}, ${coords.y}) scale(${scale})`}
      style={{ transition: 'none' }}
    >
      {/* =================================================================
          BOCA_CERRADA (SIL): Línea horizontal simple / leve curva negra gruesa
          ================================================================= */}
      {activeViseme === 'SIL' && (
        <path
          d="M -12 0 Q 0 2 12 0"
          fill="none"
          stroke="#141418"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )}

      {/* =================================================================
          BOCA_A: Óvalo vertical plano recortado, bloque blanco recto arriba
          para dientes superiores y semicírculo rojo/rosa abajo para lengua
          ================================================================= */}
      {activeViseme === 'A' && (
        <g>
          {/* Fondo negro del recorte de boca */}
          <path
            d="M -14 -6 L 14 -6 C 16 5, 10 12, 0 12 C -10 12, -16 5, -14 -6 Z"
            fill="#111115"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Lengua (semicírculo rojo/rosa abajo) */}
          <path
            d="M -9 10.5 C -7 4, 7 4, 9 10.5 Q 0 12 -9 10.5 Z"
            fill="#f43f5e"
          />
          {/* Bloque blanco recto arriba para los dientes superiores */}
          <path
            d="M -13.2 -5.5 L 13.2 -5.5 L 12.5 -0.5 L -12.5 -0.5 Z"
            fill="#ffffff"
            stroke="#141418"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Contorno exterior para sellar el borde tipo recorte */}
          <path
            d="M -14 -6 L 14 -6 C 16 5, 10 12, 0 12 C -10 12, -16 5, -14 -6 Z"
            fill="none"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* =================================================================
          BOCA_E: Óvalo horizontal ancho mostrando bloque de dientes blancos
          continuos de lado a lado y abertura negra inferior
          ================================================================= */}
      {activeViseme === 'E' && (
        <g>
          <path
            d="M -15 -5 L 15 -5 C 16 3.5, 10 7.5, 0 7.5 C -10 7.5, -16 3.5, -15 -5 Z"
            fill="#111115"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Lengua sutil al fondo */}
          <path d="M -7 6.5 Q 0 3 7 6.5 Z" fill="#f43f5e" />
          {/* Dientes blancos continuos de lado a lado */}
          <path
            d="M -14.2 -4.5 L 14.2 -4.5 L 13.5 0.5 L -13.5 0.5 Z"
            fill="#ffffff"
            stroke="#141418"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M -15 -5 L 15 -5 C 16 3.5, 10 7.5, 0 7.5 C -10 7.5, -16 3.5, -15 -5 Z"
            fill="none"
            stroke="#141418"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* =================================================================
          BOCA_I: Rectángulo/óvalo horizontal ancho mostrando dientes blancos
          continuos de lado a lado
          ================================================================= */}
      {activeViseme === 'I' && (
        <g>
          <rect
            x="-14.5"
            y="-4.5"
            width="29"
            height="9"
            rx="4"
            fill="#ffffff"
            stroke="#141418"
            strokeWidth="2.8"
          />
          {/* Línea negra horizontal continua dividiendo dientes */}
          <line
            x1="-13.5"
            y1="0.2"
            x2="13.5"
            y2="0.2"
            stroke="#141418"
            strokeWidth="2.2"
          />
        </g>
      )}

      {/* =================================================================
          BOCA_O: Círculo pequeño y simple con interior negro
          ================================================================= */}
      {activeViseme === 'O' && (
        <circle
          cx="0"
          cy="1"
          r="6.2"
          fill="#111115"
          stroke="#141418"
          strokeWidth="2.8"
        />
      )}

      {/* =================================================================
          BOCA_U: Círculo más pequeño y simple con interior negro
          ================================================================= */}
      {activeViseme === 'U' && (
        <circle
          cx="0"
          cy="1"
          r="4.5"
          fill="#111115"
          stroke="#141418"
          strokeWidth="2.8"
        />
      )}
    </g>
  );
};
