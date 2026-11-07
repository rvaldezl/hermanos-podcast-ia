import React from 'react';
import { SpeakerId } from '../types';

interface StudioLayerProps {
  activeSpeaker: SpeakerId | null;
  mouthOpenY: number;
}

/**
 * LAYER 0 & 1: Back Brick Walls, Neon Signs, Wood Slats, Side Table & Studio Armchair Backrests
 */
export const StudioBackLayer: React.FC = () => {
  return (
    <svg
      viewBox="0 0 540 960"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
    >
      <defs>
        {/* Warm Dark Brick Pattern */}
        <pattern id="brick-pattern" width="64" height="32" patternUnits="userSpaceOnUse">
          <rect width="64" height="32" fill="#231210" />
          <rect x="2" y="2" width="28" height="12" rx="1.5" fill="#3d1e19" />
          <rect x="34" y="2" width="28" height="12" rx="1.5" fill="#331814" />
          <rect x="-14" y="18" width="28" height="12" rx="1.5" fill="#361a16" />
          <rect x="18" y="18" width="28" height="12" rx="1.5" fill="#42211c" />
          <rect x="50" y="18" width="28" height="12" rx="1.5" fill="#311713" />
        </pattern>

        {/* Center Wood Slat Pattern */}
        <pattern id="wood-slats" width="24" height="960" patternUnits="userSpaceOnUse">
          <rect width="24" height="960" fill="#140d0a" />
          <rect x="2" width="15" height="960" fill="#281a14" />
          <rect x="2" width="4" height="960" fill="#33221a" opacity="0.5" />
        </pattern>

        {/* Cyan Neon Glow Filter */}
        <filter id="neon-cyan" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur1" />
          <feGaussianBlur stdDeviation="16" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Red/Orange Neon Glow Filter */}
        <filter id="neon-red" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur1" />
          <feGaussianBlur stdDeviation="14" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Ambient Studio Vignette */}
        <radialGradient id="studio-vignette" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#090504" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#040202" stopOpacity="0.82" />
        </radialGradient>

        {/* Armchair Upholstery Gradient */}
        <linearGradient id="chair-fabric" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2e2e34" />
          <stop offset="100%" stopColor="#18181c" />
        </linearGradient>
      </defs>

      {/* 1. Left & Right Brick Walls */}
      <rect x="0" y="0" width="165" height="760" fill="url(#brick-pattern)" />
      <rect x="375" y="0" width="165" height="760" fill="url(#brick-pattern)" />

      {/* 2. Center Acoustic Wood Slat Wall & Heavy Studio Divider */}
      <rect x="160" y="0" width="220" height="760" fill="url(#wood-slats)" />
      <line x1="160" y1="0" x2="160" y2="760" stroke="#0c0806" strokeWidth="6" />
      <line x1="380" y1="0" x2="380" y2="760" stroke="#0c0806" strokeWidth="6" />
      <line x1="270" y1="0" x2="270" y2="760" stroke="#0c0806" strokeWidth="5" />

      {/* Ambient Lighting & Wall Vignette */}
      <rect x="0" y="0" width="540" height="760" fill="url(#studio-vignette)" />

      {/* 3. LEFT NEON SIGN (Cyan Circle + Red Script "Hermanos / Live") */}
      <g transform="translate(-18, 175)">
        {/* Dark Acrylic Backing Circle */}
        <circle
          cx="45"
          cy="85"
          r="66"
          fill="#120c0e"
          fillOpacity="0.8"
          stroke="#1f2937"
          strokeWidth="2"
        />
        {/* Glowing Cyan Outer Ring */}
        <circle
          cx="45"
          cy="85"
          r="56"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="4.5"
          filter="url(#neon-cyan)"
        />
        <circle cx="45" cy="85" r="56" fill="none" stroke="#cffafe" strokeWidth="1.5" />
        {/* Glowing Red Neon Script ("nos") */}
        <path
          d="M 8 92 C 16 74, 24 74, 26 92 C 28 76, 36 76, 38 92 M 44 84 C 44 74, 58 74, 58 84 C 58 94, 44 94, 44 84 M 66 77 C 60 77, 60 84, 68 85 C 76 86, 75 93, 64 93"
          fill="none"
          stroke="#fb7185"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neon-red)"
        />
        <path
          d="M 8 92 C 16 74, 24 74, 26 92 C 28 76, 36 76, 38 92 M 44 84 C 44 74, 58 74, 58 84 C 58 94, 44 94, 44 84 M 66 77 C 60 77, 60 84, 68 85 C 76 86, 75 93, 64 93"
          fill="none"
          stroke="#ffe4e6"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* 4. RIGHT NEON SIGN (Warm Red/Orange Neon Frame) */}
      <g transform="translate(495, 225)">
        <rect
          x="0"
          y="0"
          width="65"
          height="54"
          rx="8"
          fill="#180c0c"
          fillOpacity="0.8"
          stroke="#fb7185"
          strokeWidth="4"
          filter="url(#neon-red)"
        />
        <path
          d="M 14 36 L 22 18 L 30 36 M 17 30 L 27 30 M 38 18 L 38 36"
          fill="none"
          stroke="#fecdd3"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neon-red)"
        />
      </g>

      {/* 5. STUDIO FLOOR BASE */}
      <rect x="0" y="640" width="540" height="320" fill="#121010" />
      <line x1="0" y1="640" x2="540" y2="640" stroke="#261c18" strokeWidth="3" />

      {/* 6. FAR-LEFT WOODEN SIDE TABLE & COFFEE CUP */}
      <g transform="translate(-8, 535)">
        {/* Takeaway Coffee Cup */}
        <polygon
          points="14,0 38,0 34,38 18,38"
          fill="#f1f5f9"
          stroke="#141418"
          strokeWidth="2.2"
        />
        {/* Kraft Sleeve */}
        <polygon
          points="15,12 37,12 35,28 17,28"
          fill="#3f3f46"
          stroke="#141418"
          strokeWidth="1.8"
        />
        {/* Black Lid */}
        <rect
          x="11"
          y="-6"
          width="30"
          height="7"
          rx="2"
          fill="#18181b"
          stroke="#141418"
          strokeWidth="2"
        />
        {/* Side Table Top */}
        <rect
          x="0"
          y="38"
          width="54"
          height="14"
          rx="3"
          fill="#6b4226"
          stroke="#141418"
          strokeWidth="2.5"
        />
        <rect x="8" y="52" width="12" height="145" fill="#4a2c18" stroke="#141418" strokeWidth="2.2" />
      </g>

      {/* 7. LEFT STUDIO ARMCHAIR (Behind Character A) */}
      <g transform="translate(22, 430)">
        {/* Chair Backrest */}
        <rect
          x="18"
          y="0"
          width="195"
          height="165"
          rx="16"
          fill="url(#chair-fabric)"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Backrest Stitching Detail */}
        <line x1="34" y1="18" x2="196" y2="18" stroke="#3f3f46" strokeWidth="1.5" opacity="0.6" />
        {/* Left Outer Armrest */}
        <rect
          x="0"
          y="92"
          width="38"
          height="145"
          rx="10"
          fill="#27272c"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Right Inner Armrest */}
        <rect
          x="192"
          y="102"
          width="32"
          height="135"
          rx="10"
          fill="#222227"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Seat Cushion Base */}
        <rect
          x="26"
          y="155"
          width="178"
          height="65"
          rx="8"
          fill="#1f1f24"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Wooden Chair Legs */}
        <polygon points="18,235 30,235 26,285 14,285" fill="#4a2c18" stroke="#141418" strokeWidth="2" />
      </g>

      {/* 8. RIGHT STUDIO ARMCHAIR (Behind Character B) */}
      <g transform="translate(292, 430)">
        {/* Chair Backrest */}
        <rect
          x="16"
          y="0"
          width="205"
          height="165"
          rx="16"
          fill="url(#chair-fabric)"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Left Inner Armrest */}
        <rect
          x="0"
          y="102"
          width="32"
          height="135"
          rx="10"
          fill="#222227"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Right Outer Armrest */}
        <rect
          x="202"
          y="92"
          width="38"
          height="145"
          rx="10"
          fill="#27272c"
          stroke="#141418"
          strokeWidth="3"
        />
        {/* Seat Cushion Base */}
        <rect
          x="24"
          y="155"
          width="186"
          height="65"
          rx="8"
          fill="#1f1f24"
          stroke="#141418"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
};

/**
 * LAYER 3 & 4: Articulated Shure SM7B Boom Microphones + Foreground Wooden Coffee Table & Props
 */
export const StudioForegroundLayer: React.FC<StudioLayerProps> = ({
  activeSpeaker,
  mouthOpenY,
}) => {
  const pulseA = activeSpeaker === 'A' ? 0.55 + mouthOpenY * 0.45 : 0;
  const pulseB = activeSpeaker === 'B' ? 0.55 + mouthOpenY * 0.45 : 0;

  return (
    <svg
      viewBox="0 0 540 960"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
    >
      {/* 1. ARTICULATED STUDIO BOOM MICROPHONES (Shure SM7B Style) */}
      {/* Left Host Boom Arm & Mic (Extending from center-right stand toward Left Host) */}
      <g>
        {/* Dual-Bar Scissor Boom Arm for Left Host */}
        <line
          x1="322"
          y1="422"
          x2="246"
          y2="462"
          stroke="#1e1e24"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <line
          x1="322"
          y1="432"
          x2="246"
          y2="472"
          stroke="#2d2d35"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="322"
          y1="422"
          x2="322"
          y2="520"
          stroke="#18181c"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Joint Knob */}
        <circle cx="322" cy="426" r="7" fill="#18181b" stroke="#09090b" strokeWidth="2" />

        {/* Shure SM7B Capsule angled toward Left Host */}
        <g transform="translate(216, 434) rotate(-28)">
          {/* Yoke Mount */}
          <path
            d="M 16 0 L 16 28 M 6 12 L 26 12"
            stroke="#18181b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Capsule Body */}
          <rect
            x="0"
            y="10"
            width="32"
            height="62"
            rx="13"
            fill="#27272a"
            stroke="#09090b"
            strokeWidth="2.8"
          />
          {/* Foam Windscreen Top */}
          <rect
            x="2"
            y="12"
            width="28"
            height="34"
            rx="12"
            fill="#18181b"
            stroke="#09090b"
            strokeWidth="2"
          />
          {/* Reactive ON-AIR Collar Ring */}
          <rect
            x="1"
            y="45"
            width="30"
            height="5"
            fill={activeSpeaker === 'A' ? '#22d3ee' : '#3f3f46'}
            opacity={activeSpeaker === 'A' ? pulseA : 0.7}
          />
        </g>
      </g>

      {/* Right Host Boom Arm & Mic (Extending toward Right Host) */}
      <g>
        <line
          x1="322"
          y1="426"
          x2="365"
          y2="466"
          stroke="#1e1e24"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <g transform="translate(358, 444) rotate(26)">
          <rect
            x="0"
            y="10"
            width="32"
            height="62"
            rx="13"
            fill="#27272a"
            stroke="#09090b"
            strokeWidth="2.8"
          />
          <rect
            x="2"
            y="12"
            width="28"
            height="34"
            rx="12"
            fill="#18181b"
            stroke="#09090b"
            strokeWidth="2"
          />
          <rect
            x="1"
            y="45"
            width="30"
            height="5"
            fill={activeSpeaker === 'B' ? '#f43f5e' : '#3f3f46'}
            opacity={activeSpeaker === 'B' ? pulseB : 0.7}
          />
        </g>
      </g>

      {/* 2. FOREGROUND WOODEN COFFEE TABLE & ILLUSTRATED PROPS */}
      <g transform="translate(238, 608)">
        {/* Angled Wooden Table Legs */}
        <polygon
          points="36,52 54,52 38,145 20,145"
          fill="#4a2a16"
          stroke="#141418"
          strokeWidth="2.8"
        />
        <polygon
          points="62,54 76,54 68,125 54,125"
          fill="#381f10"
          stroke="#141418"
          strokeWidth="2.5"
        />
        <polygon
          points="262,52 280,52 292,145 274,145"
          fill="#4a2a16"
          stroke="#141418"
          strokeWidth="2.8"
        />

        {/* Tabletop Perspective Surface */}
        <polygon
          points="24,10 302,10 318,44 0,44"
          fill="#7c4a2b"
          stroke="#141418"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Subtle Wood Grain Lines on Tabletop */}
        <line x1="45" y1="22" x2="145" y2="22" stroke="#5c351d" strokeWidth="1.5" opacity="0.6" />
        <line x1="175" y1="31" x2="275" y2="31" stroke="#5c351d" strokeWidth="1.5" opacity="0.6" />

        {/* Tabletop Front Beveled Edge */}
        <rect
          x="0"
          y="44"
          width="318"
          height="14"
          rx="2"
          fill="#5c351d"
          stroke="#141418"
          strokeWidth="3"
        />

        {/* PROP 1: Left Red & Blue Beverage Can */}
        <g transform="translate(34, -18)">
          <rect
            x="0"
            y="4"
            width="24"
            height="42"
            rx="4"
            fill="#dc2626"
            stroke="#141418"
            strokeWidth="2.4"
          />
          {/* Blue Center Label Band */}
          <rect x="2" y="15" width="20" height="16" fill="#1d4ed8" />
          <circle cx="12" cy="23" r="5" fill="#f8fafc" opacity="0.85" />
          {/* Silver Can Rim */}
          <ellipse
            cx="12"
            cy="4"
            rx="11"
            ry="3.5"
            fill="#cbd5e1"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* PROP 2: Center-Left Green & Orange Can */}
        <g transform="translate(98, -22)">
          <rect
            x="0"
            y="4"
            width="25"
            height="42"
            rx="4"
            fill="#15803d"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <circle cx="13" cy="24" r="6.5" fill="#f97316" stroke="#141418" strokeWidth="1.5" />
          <ellipse
            cx="12.5"
            cy="4"
            rx="11.5"
            ry="3.5"
            fill="#cbd5e1"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>

        {/* PROP 3: Diagonal Ballpoint Pen */}
        <line
          x1="72"
          y1="34"
          x2="94"
          y2="25"
          stroke="#f8fafc"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="72"
          y1="34"
          x2="94"
          y2="25"
          stroke="#141418"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* PROP 4: Show Notes / Script Papers Stack */}
        <g transform="translate(132, 12)">
          <polygon
            points="10,2 68,0 78,24 0,26"
            fill="#e2e8f0"
            stroke="#141418"
            strokeWidth="2.2"
          />
          <polygon
            points="6,0 64,-2 74,22 -4,24"
            fill="#f8fafc"
            stroke="#141418"
            strokeWidth="2.2"
          />
          {/* Printed Text Lines on Script */}
          <line x1="12" y1="6" x2="54" y2="5" stroke="#475569" strokeWidth="2" />
          <line x1="10" y1="11" x2="58" y2="10" stroke="#64748b" strokeWidth="1.6" />
          <line x1="8" y1="16" x2="48" y2="15" stroke="#64748b" strokeWidth="1.6" />
        </g>

        {/* PROP 5: Studio Monitor Headphones Resting on Right of Table */}
        <g transform="translate(222, 12)">
          <path
            d="M 6 18 C 4 4, 34 4, 32 18"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="8"
            cy="20"
            rx="7"
            ry="5"
            fill="#334155"
            stroke="#141418"
            strokeWidth="2.2"
          />
          <ellipse
            cx="28"
            cy="20"
            rx="7"
            ry="5"
            fill="#334155"
            stroke="#141418"
            strokeWidth="2.2"
          />
          {/* Coiled Cable */}
          <path
            d="M 18 24 Q 26 30 34 26"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>

        {/* PROP 6: Far-Right Red/Amber Beverage Can */}
        <g transform="translate(268, -18)">
          <rect
            x="0"
            y="4"
            width="24"
            height="42"
            rx="4"
            fill="#c2410c"
            stroke="#141418"
            strokeWidth="2.4"
          />
          <rect x="2" y="14" width="20" height="18" fill="#ea580c" />
          <ellipse
            cx="12"
            cy="4"
            rx="11"
            ry="3.5"
            fill="#cbd5e1"
            stroke="#141418"
            strokeWidth="2"
          />
        </g>
      </g>
    </svg>
  );
};
