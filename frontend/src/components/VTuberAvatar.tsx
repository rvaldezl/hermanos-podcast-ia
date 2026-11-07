import React, { useEffect, useState } from 'react';
import { CharacterConfig, LipSyncFrame, VisemeType } from '../types';

interface VTuberAvatarProps {
  character: CharacterConfig;
  isSpeaking: boolean;
  lipSync: LipSyncFrame;
  partnerSide: 'left' | 'right';
}

export const VTuberAvatar: React.FC<VTuberAvatarProps> = ({
  character,
  isSpeaking,
  lipSync,
  partnerSide,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [tick, setTick] = useState(0);

  // Stochastic natural blinking (every 2.3s to 4.6s for 130ms)
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    let openTimeout: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const nextDelay = 2300 + Math.random() * 2300;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        openTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 130);
      }, nextDelay);
    };

    scheduleBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(openTimeout);
    };
  }, []);

  // 30fps animation clock for breathing, listening nods, eye saccades & hand gestures
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 7200);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  const timeSec = tick * 0.033;
  const phaseOffset = character.id === 'A' ? 0 : 1.7;

  // Breathing & Torso Lean
  const breathY = Math.sin(timeSec * 2.1 + phaseOffset) * 2.8;
  const listeningNod = !isSpeaking ? Math.sin(timeSec * 1.5 + phaseOffset) * 2.2 : 0;
  const torsoLeanX = isSpeaking
    ? (partnerSide === 'right' ? 3.5 : -3.5) + Math.sin(timeSec * 2.8) * 1.5
    : 0;

  // Lip-Sync & Viseme Parameters
  const mouthOpenY = isSpeaking ? lipSync.mouthOpenY : 0;
  const mouthForm = isSpeaking ? lipSync.mouthForm : 0.2;
  const activeViseme: VisemeType = isSpeaking ? lipSync.viseme : 'SIL';
  const jawDrop = mouthOpenY * 10.5;

  // Head Pitch, Roll & Eyebrow Dynamics
  const headPitch = isSpeaking ? lipSync.headPitch * 0.85 : listeningNod;
  const headRoll = isSpeaking
    ? lipSync.headRoll * 0.75
    : Math.sin(timeSec * 0.85 + phaseOffset) * 1.5;
  const browLift = isSpeaking ? lipSync.browLift * 5.5 : Math.sin(timeSec * 0.6) > 0.85 ? 2.5 : 0;
  const browAsymmetry = isSpeaking ? Math.sin(timeSec * 2.1) * 2.2 : 0;

  // Gaze Tracking (Looks at co-host when listening, alternates camera/co-host when speaking, occasional glance at table script)
  const partnerDir = partnerSide === 'right' ? 1 : -1;
  const glanceAtTable = !isSpeaking && Math.sin(timeSec * 0.45 + phaseOffset) > 0.92;
  const lookAtPartnerFactor = isSpeaking
    ? Math.sin(timeSec * 1.4) > -0.2
      ? 0.65
      : 0.1
    : 1.0;

  const pupilX =
    partnerDir * 4.8 * lookAtPartnerFactor + Math.sin(timeSec * 2.3 + phaseOffset) * 0.8;
  const pupilY = glanceAtTable
    ? 4.2
    : isSpeaking
    ? -mouthOpenY * 1.2 + Math.cos(timeSec * 1.7) * 0.8
    : 0.5;

  // Hand & Arm Conversational Gesture Physics
  const gestureLift = isSpeaking
    ? 14 + mouthOpenY * 18 + Math.sin(timeSec * 4.2) * 6
    : Math.sin(timeSec * 1.6 + phaseOffset) * 1.5;
  const gestureWave = isSpeaking ? Math.cos(timeSec * 4.8) * 8 : 0;

  // Custom PNGTuber 4-Sprite Mode (if user uploaded custom PNGs)
  if (character.avatarMode === 'pngtuber' && character.pngSprites.idleOpen) {
    let activeSprite = character.pngSprites.idleOpen;
    if (isSpeaking) {
      if (mouthOpenY >= 0.45 && character.pngSprites.talkOpen) {
        activeSprite = character.pngSprites.talkOpen;
      } else if (mouthOpenY >= 0.12 && character.pngSprites.talkHalf) {
        activeSprite = character.pngSprites.talkHalf;
      } else if (isBlinking && character.pngSprites.idleBlink) {
        activeSprite = character.pngSprites.idleBlink;
      }
    } else if (isBlinking && character.pngSprites.idleBlink) {
      activeSprite = character.pngSprites.idleBlink;
    }

    return (
      <div
        className="relative select-none transition-transform duration-75"
        style={{
          transform: `translate(${torsoLeanX}px, ${breathY}px) rotate(${headRoll * 0.5}deg) scale(${
            1 - mouthOpenY * 0.015
          }, ${1 + mouthOpenY * 0.035})`,
        }}
      >
        <img
          src={activeSprite}
          alt={character.name}
          className="w-64 h-80 object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.75)]"
        />
      </div>
    );
  }

  const { preset, primaryColor, hairColor, skinTone, glasses, headphones } = character.rigStyle;
  const isStocky = preset === 'lamole';
  const hasFullBeard = preset === 'lamole';
  const hasStubble = preset === 'adrian' || preset === 'alex';
  const hasBaseballCap = preset === 'lamole';
  const isFemale = preset === 'sofi';

  // Mouth Geometry Calculation for 6 Visemes (SIL, A, E, I, O, U)
  const baseMouthW = isStocky ? 26 : 30;
  const mouthW = Math.max(14, Math.min(42, baseMouthW + mouthForm * 9));
  const mouthH = Math.max(3, mouthOpenY * 22);
  const isRoundedVowel = activeViseme === 'O' || activeViseme === 'U' || mouthForm < -0.35;

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Live2D Cubism Telemetry Overlay when in Live2D mode */}
      {character.avatarMode === 'live2d' && (
        <div className="absolute -top-12 z-30 px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white">Live2D Rig</span>
            <span className="text-amber-300">[{activeViseme}]</span>
          </div>
          <div className="flex gap-2 text-[8px] text-slate-300">
            <span>OpenY:{mouthOpenY.toFixed(2)}</span>
            <span>Form:{mouthForm.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* FULL-BODY SEATED ADULT-ANIMATION CHARACTER RIG */}
      <svg
        viewBox="0 0 280 430"
        className="w-[245px] sm:w-[260px] h-[395px] overflow-visible drop-shadow-[0_14px_24px_rgba(0,0,0,0.68)]"
      >
        <defs>
          {/* Stubble Pattern for Adrian / Alex */}
          <pattern
            id={`stubble-dots-${character.id}`}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="0.65" fill="#3d2b1f" opacity="0.55" />
            <circle cx="4" cy="3.8" r="0.6" fill="#2e1f15" opacity="0.5" />
          </pattern>

          {/* Mouth Interior Clip */}
          <clipPath id={`viseme-clip-${character.id}`}>
            {isRoundedVowel ? (
              <ellipse
                cx="140"
                cy={163 + mouthH * 0.32}
                rx={mouthW * 0.42}
                ry={mouthH * 0.55 + 2}
              />
            ) : (
              <path
                d={`M ${140 - mouthW / 2} 159 Q 140 ${156 - mouthForm * 2} ${
                  140 + mouthW / 2
                } 159 C ${140 + mouthW * 0.48} ${164 + mouthH}, ${
                  140 - mouthW * 0.48
                } ${164 + mouthH}, ${140 - mouthW / 2} 159 Z`}
              />
            )}
          </clipPath>
        </defs>

        {/* ============================================================
            LAYER 1: SEATED LEGS, DENIM JEANS & SNEAKERS
            ============================================================ */}
        <g transform="translate(0, 12)">
          {isStocky ? (
            /* Stocky Seated Jeans (La Mole style) */
            <g>
              {/* Pelvis / Lap Base */}
              <path
                d="M 56 292 Q 140 315 224 292 L 232 342 Q 140 355 48 342 Z"
                fill="#243b55"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Left Thigh & Knee */}
              <path
                d="M 48 302 C 42 325, 44 378, 52 412 L 116 412 C 118 378, 118 332, 112 312 Z"
                fill="#2b4c6f"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Right Thigh & Knee */}
              <path
                d="M 164 312 C 158 332, 158 378, 162 412 L 226 412 C 234 378, 236 325, 228 302 Z"
                fill="#2b4c6f"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Denim Folds & Highlights */}
              <path
                d="M 64 322 Q 82 332 98 324 M 182 324 Q 198 332 216 322"
                fill="none"
                stroke="#1e344d"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Slim Seated Jeans & Sneakers (Adrian / Alex / Sofi style) */
            <g>
              {/* Pelvis / Hips */}
              <path
                d="M 74 290 Q 140 308 206 290 L 210 332 Q 140 344 70 332 Z"
                fill="#233b54"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Left Leg */}
              <path
                d="M 68 302 C 62 328, 66 375, 72 405 L 118 405 C 122 375, 120 328, 114 308 Z"
                fill="#2d4f73"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Right Leg */}
              <path
                d="M 158 308 C 152 328, 152 375, 156 405 L 202 405 C 208 375, 210 328, 202 302 Z"
                fill="#2d4f73"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Denim Seam & Knee Creases */}
              <path
                d="M 80 318 Q 95 326 108 318 M 168 318 Q 182 326 196 318"
                fill="none"
                stroke="#1d3550"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Sneakers Peeking at Bottom */}
              <path
                d="M 68 402 L 122 402 L 126 418 L 64 418 Z"
                fill="#475569"
                stroke="#141418"
                strokeWidth="2.5"
              />
              <rect x="64" y="414" width="62" height="6" rx="2" fill="#f8fafc" stroke="#141418" strokeWidth="1.8" />
              <path
                d="M 154 402 L 206 402 L 212 418 L 150 418 Z"
                fill="#475569"
                stroke="#141418"
                strokeWidth="2.5"
              />
              <rect x="150" y="414" width="62" height="6" rx="2" fill="#f8fafc" stroke="#141418" strokeWidth="1.8" />
            </g>
          )}
        </g>

        {/* ============================================================
            LAYER 2: TORSO, CLOTHING & ARTICULATED ARMS/HANDS
            ============================================================ */}
        <g
          style={{
            transform: `translate(${torsoLeanX}px, ${breathY}px)`,
            transformOrigin: '140px 300px',
          }}
        >
          {/* Neck & Under-Chin Shadow */}
          <rect
            x={isStocky ? 116 : 122}
            y="168"
            width={isStocky ? 48 : 36}
            height="42"
            rx="14"
            fill={skinTone}
            stroke="#141418"
            strokeWidth="2.8"
          />
          <path
            d={`M ${isStocky ? 116 : 122} 182 Q 140 198 ${isStocky ? 164 : 158} 182 L ${
              isStocky ? 164 : 158
            } 198 L ${isStocky ? 116 : 122} 198 Z`}
            fill="rgba(0,0,0,0.18)"
          />

          {isStocky ? (
            /* STOCKY OLIVE-BROWN ZIP HOODIE OVER WHITE TEE (La Mole Style) */
            <g>
              {/* Folded Hood Behind Neck */}
              <path
                d="M 78 196 C 72 174, 208 174, 202 196 C 185 212, 95 212, 78 196 Z"
                fill="#4a423a"
                stroke="#141418"
                strokeWidth="2.8"
              />
              {/* Main Stocky Hoodie Torso */}
              <path
                d="M 42 308 C 36 232, 72 194, 140 194 C 208 194, 244 232, 238 308 Q 140 322 42 308 Z"
                fill="#5c5248"
                stroke="#141418"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* White Crew-Neck Undershirt Wedge */}
              <path
                d="M 112 196 L 140 242 L 168 196 Q 140 206 112 196 Z"
                fill="#f8fafc"
                stroke="#141418"
                strokeWidth="2.6"
              />
              {/* Hoodie Lapels & Center Zipper */}
              <path
                d="M 106 196 L 136 246 L 140 314 M 174 196 L 144 246"
                fill="none"
                stroke="#141418"
                strokeWidth="2.6"
              />
              {/* Kangaroo Pocket Seams */}
              <path
                d="M 86 266 L 102 304 M 194 266 L 178 304 M 96 266 L 184 266"
                fill="none"
                stroke="#3d352e"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Hoodie Drawstrings */}
              <path
                d="M 122 212 Q 120 238 123 254 M 158 212 Q 160 238 157 254"
                fill="none"
                stroke="#292524"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* LEFT ARM & HAND (Gestures when speaking, rests on knee when listening) */}
              <g
                style={{
                  transform: `translate(0px, ${-gestureLift * 0.7}px) rotate(${
                    isSpeaking ? gestureWave * 0.5 : 0
                  }deg)`,
                  transformOrigin: '64px 225px',
                }}
              >
                {/* Left Hoodie Sleeve */}
                <path
                  d="M 56 206 C 32 232, 28 276, 46 306 L 84 298 C 74 272, 74 242, 82 222 Z"
                  fill="#5c5248"
                  stroke="#141418"
                  strokeWidth="2.8"
                />
                {/* Left Cartoon Hand with 4 Fingers */}
                <g transform="translate(46, 294)">
                  <ellipse
                    cx="20"
                    cy="14"
                    rx="18"
                    ry="13"
                    fill={skinTone}
                    stroke="#141418"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 8 16 L 8 26 M 15 17 L 15 28 M 23 17 L 23 28 M 30 15 L 30 25"
                    stroke="#141418"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* RIGHT ARM & HAND (Rests on right knee with subtle rhythm) */}
              <g
                style={{
                  transform: `translate(0px, ${isSpeaking ? -mouthOpenY * 5 : 0}px)`,
                }}
              >
                <path
                  d="M 224 206 C 248 232, 252 276, 234 306 L 196 298 C 206 272, 206 242, 198 222 Z"
                  fill="#5c5248"
                  stroke="#141418"
                  strokeWidth="2.8"
                />
                <g transform="translate(194, 294)">
                  <ellipse
                    cx="20"
                    cy="14"
                    rx="18"
                    ry="13"
                    fill={skinTone}
                    stroke="#141418"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 10 15 L 10 25 M 17 17 L 17 28 M 25 17 L 25 28 M 32 16 L 32 26"
                    stroke="#141418"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            </g>
          ) : (
            /* FITTED LONG-SLEEVE CREWNECK SWEATER & GESTURING ARMS (Adrian / Alex / Sofi Style) */
            <g>
              {/* Main Torso Sweater */}
              <path
                d="M 68 304 C 64 234, 88 196, 140 196 C 192 196, 216 234, 212 304 Q 140 316 68 304 Z"
                fill={preset === 'adrian' ? '#18181c' : primaryColor}
                stroke="#141418"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Crewneck Ribbed Collar */}
              <path
                d="M 112 196 Q 140 214 168 196 Q 140 206 112 196 Z"
                fill="#27272a"
                stroke="#141418"
                strokeWidth="2.5"
              />
              {/* Subtle Chest & Torso Cloth Creases */}
              <path
                d="M 92 232 Q 112 242 122 236 M 188 232 Q 168 242 158 236"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* OUTER ARM (Rests on Left Knee like in the reference image) */}
              <g>
                <path
                  d="M 74 206 C 50 236, 48 276, 66 306 L 96 298 C 84 274, 86 244, 94 224 Z"
                  fill={preset === 'adrian' ? '#18181c' : primaryColor}
                  stroke="#141418"
                  strokeWidth="2.8"
                />
                {/* Detailed Hand Resting on Knee */}
                <g transform="translate(64, 296)">
                  <ellipse
                    cx="18"
                    cy="13"
                    rx="16"
                    ry="12"
                    fill={skinTone}
                    stroke="#141418"
                    strokeWidth="2.4"
                  />
                  <path
                    d="M 7 14 L 7 24 M 14 15 L 14 26 M 21 15 L 21 26 M 28 14 L 28 23"
                    stroke="#141418"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* INNER CONVERSATIONAL GESTURE ARM (Reaches toward co-host & gestures with voice!) */}
              <g
                style={{
                  transform: `translate(0px, ${-gestureLift * 0.55}px) rotate(${
                    isSpeaking ? -8 + gestureWave * 0.65 : 2
                  }deg)`,
                  transformOrigin: '198px 218px',
                }}
              >
                <path
                  d="M 198 206 C 218 234, 232 264, 256 276 L 248 298 C 218 288, 198 262, 188 228 Z"
                  fill={preset === 'adrian' ? '#18181c' : primaryColor}
                  stroke="#141418"
                  strokeWidth="2.8"
                />
                {/* Expressive Open Cartoon Hand Extending Right */}
                <g transform="translate(246, 272)">
                  <path
                    d="M 0 4 C 12 0, 26 2, 28 10 C 30 18, 18 26, 2 22 Z"
                    fill={skinTone}
                    stroke="#141418"
                    strokeWidth="2.4"
                  />
                  {/* Thumb & Fingers */}
                  <path
                    d="M 6 4 Q 14 -4 20 2 M 14 9 L 26 9 M 14 15 L 26 16"
                    fill="none"
                    stroke="#141418"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            </g>
          )}
        </g>

        {/* ============================================================
            LAYER 3: SCULPTED HEAD, BEARD/STUBBLE, EYES, CAP & 6-VISEME MOUTH
            ============================================================ */}
        <g
          style={{
            transform: `translate(${torsoLeanX * 1.15}px, ${
              breathY * 0.85 + headPitch
            }px) rotate(${headRoll}deg)`,
            transformOrigin: '140px 150px',
          }}
        >
          {/* Back Hair for Female / Long Hair Preset */}
          {isFemale && (
            <path
              d="M 74 82 C 54 135, 58 208, 82 228 L 198 228 C 222 208, 226 135, 206 82 Z"
              fill={hairColor}
              stroke="#141418"
              strokeWidth="2.8"
            />
          )}

          {/* Optional Over-Ear Studio Headphones (if enabled in StageManager) */}
          {headphones && !hasBaseballCap && (
            <path
              d="M 74 118 C 74 36, 206 36, 206 118"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />
          )}

          {/* Ears with Inner Tragus Detail */}
          <g>
            {/* Left Ear */}
            <ellipse
              cx={isStocky ? 74 : 80}
              cy="128"
              rx="11"
              ry="17"
              fill={skinTone}
              stroke="#141418"
              strokeWidth="2.6"
            />
            <path
              d={`M ${isStocky ? 71 : 77} 121 Q ${isStocky ? 78 : 84} 128 ${
                isStocky ? 72 : 78
              } 135`}
              fill="none"
              stroke="#8c5a3c"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Right Ear */}
            <ellipse
              cx={isStocky ? 206 : 200}
              cy="128"
              rx="11"
              ry="17"
              fill={skinTone}
              stroke="#141418"
              strokeWidth="2.6"
            />
            <path
              d={`M ${isStocky ? 209 : 203} 121 Q ${isStocky ? 202 : 196} 128 ${
                isStocky ? 208 : 202
              } 135`}
              fill="none"
              stroke="#8c5a3c"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Head & Dynamic Jaw Contour (Jaw drops with mouthOpenY!) */}
          {isStocky ? (
            /* Rounder Stocky Head Contour (La Mole style) */
            <path
              d={`M 78 88 C 78 44, 202 44, 202 88 L 204 136 C 204 ${178 + jawDrop}, 174 ${
                198 + jawDrop
              }, 140 ${198 + jawDrop} C 106 ${198 + jawDrop}, 76 ${
                178 + jawDrop
              }, 76 136 Z`}
              fill={skinTone}
              stroke="#141418"
              strokeWidth="2.8"
            />
          ) : (
            /* Sculpted Angular Jaw Head Contour (Adrian / Alex style) */
            <path
              d={`M 84 82 C 84 40, 196 40, 196 82 L 196 132 C 196 158, 174 ${
                192 + jawDrop
              }, 140 ${195 + jawDrop} C 106 ${192 + jawDrop}, 84 158, 84 132 Z`}
              fill={skinTone}
              stroke="#141418"
              strokeWidth="2.8"
            />
          )}

          {/* FACIAL HAIR LAYER 1: Light Stubble (Adrian / Alex) */}
          {hasStubble && !isFemale && (
            <g>
              {/* Shaded Stubble Jaw Mask */}
              <path
                d={`M 85 128 C 86 156, 108 ${190 + jawDrop}, 140 ${193 + jawDrop} C 172 ${
                  190 + jawDrop
                }, 194 156, 195 128 C 188 144, 174 148, 162 146 C 152 142, 128 142, 118 146 C 106 148, 92 144, 85 128 Z`}
                fill="#5c4028"
                fillOpacity="0.24"
              />
              <path
                d={`M 85 128 C 86 156, 108 ${190 + jawDrop}, 140 ${193 + jawDrop} C 172 ${
                  190 + jawDrop
                }, 194 156, 195 128 C 188 144, 174 148, 162 146 C 152 142, 128 142, 118 146 C 106 148, 92 144, 85 128 Z`}
                fill={`url(#stubble-dots-${character.id})`}
              />
              {/* Upper Lip Mustache Stubble Shadow */}
              <path
                d="M 110 154 Q 140 145 170 154 Q 140 150 110 154 Z"
                fill="#4a331f"
                fillOpacity="0.32"
              />
            </g>
          )}

          {/* FACIAL HAIR LAYER 2: Full Thick Dark Beard & Mustache (La Mole Style) */}
          {hasFullBeard && (
            <g>
              {/* Outer Full Beard Covering Jaw, Chin & Cheeks */}
              <path
                d={`M 76 116 L 84 116 L 86 138 C 92 152, 106 148, 116 146 C 128 143, 152 143, 164 146 C 174 148, 188 152, 194 138 L 196 116 L 204 116 L 204 142 C 204 ${
                  182 + jawDrop
                }, 176 ${200 + jawDrop}, 140 ${200 + jawDrop} C 104 ${
                  200 + jawDrop
                }, 76 ${182 + jawDrop}, 76 142 Z`}
                fill="#1c1614"
                stroke="#141418"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              {/* Thick Arched Mustache Framing the Mouth */}
              <path
                d="M 106 158 C 110 144, 130 142, 140 146 C 150 142, 170 144, 174 158 C 164 152, 150 151, 140 153 C 130 151, 116 152, 106 158 Z"
                fill="#1c1614"
                stroke="#141418"
                strokeWidth="2"
              />
              {/* Soul Patch Below Lower Lip */}
              <path
                d={`M 133 ${170 + jawDrop * 0.85} Q 140 ${182 + jawDrop} 147 ${
                  170 + jawDrop * 0.85
                } Z`}
                fill="#1c1614"
              />
            </g>
          )}

          {/* ADULT-ANIMATION EXPRESSIVE EYES (Close-set ovals with upper/lower eyelids & pupil tracking) */}
          {(['left', 'right'] as const).map((side) => {
            const cx = side === 'left' ? 121 : 159;
            const cy = 114;
            const rx = 16.5;
            const ry = 18;
            // Relaxed upper eyelid droop (lifts when speaking emphatically)
            const lidDroop = isSpeaking ? Math.max(2, 6 - mouthOpenY * 5) : 6.5;

            return (
              <g key={side}>
                {isBlinking ? (
                  /* Closed Cartoon Blink Line */
                  <g>
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={rx}
                      ry={ry}
                      fill={skinTone}
                      stroke="#141418"
                      strokeWidth="2.4"
                    />
                    <path
                      d={`M ${cx - rx} ${cy + 2} Q ${cx} ${cy + 8} ${cx + rx} ${cy + 2}`}
                      fill="none"
                      stroke="#141418"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                ) : (
                  <g>
                    {/* White Sclera */}
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={rx}
                      ry={ry}
                      fill="#f8fafc"
                      stroke="#141418"
                      strokeWidth="2.5"
                    />
                    {/* Subtle Sclera Top Shadow */}
                    <path
                      d={`M ${cx - rx + 1} ${cy - 4} Q ${cx} ${cy - 10} ${cx + rx - 1} ${cy - 4}`}
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="3"
                    />
                    {/* Crisp Cartoon Pupil */}
                    <circle
                      cx={cx + pupilX}
                      cy={cy + pupilY}
                      r="3.8"
                      fill="#0f172a"
                    />
                    {/* Tiny Specular Highlight */}
                    <circle
                      cx={cx + pupilX - 1.2}
                      cy={cy + pupilY - 1.2}
                      r="1.1"
                      fill="#ffffff"
                    />
                    {/* Expressive Upper Eyelid Mask (Gives that chill adult-cartoon look) */}
                    <path
                      d={`M ${cx - rx} ${cy - ry + lidDroop + 4} C ${cx - 10} ${
                        cy - ry - 2
                      }, ${cx + 10} ${cy - ry - 2}, ${cx + rx} ${
                        cy - ry + lidDroop + 4
                      } Z`}
                      fill={skinTone}
                    />
                    <path
                      d={`M ${cx - rx + 0.5} ${cy - ry + lidDroop + 4} Q ${cx} ${
                        cy - ry + lidDroop + 2
                      } ${cx + rx - 0.5} ${cy - ry + lidDroop + 4}`}
                      fill="none"
                      stroke="#141418"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Under-Eye Bags / Expression Lines */}
          <path
            d="M 110 135 Q 121 139 131 135 M 149 135 Q 159 139 170 135"
            fill="none"
            stroke="#8c5a3c"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* SCULPTED CARTOON NOSE (Overlapping slightly between the eyes) */}
          <path
            d="M 138 118 L 134 138 C 133 143, 146 144, 146 138"
            fill={skinTone}
            stroke="#141418"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* EXPRESSIVE THICK CARTOON EYEBROWS (With Asymmetric Tilt) */}
          <path
            d={`M 101 ${92 - browLift + browAsymmetry} Q 118 ${
              83 - browLift * 1.2 + browAsymmetry
            } 135 ${90 - browLift * 0.8}`}
            fill="none"
            stroke="#1c1614"
            strokeWidth={isStocky ? '6.5' : '5.5'}
            strokeLinecap="round"
          />
          <path
            d={`M 145 ${90 - browLift * 0.8} Q 162 ${
              83 - browLift * 1.2 - browAsymmetry
            } 179 ${92 - browLift - browAsymmetry}`}
            fill="none"
            stroke="#1c1614"
            strokeWidth={isStocky ? '6.5' : '5.5'}
            strokeLinecap="round"
          />

          {/* Optional Glasses */}
          {glasses && (
            <g>
              <rect
                x="100"
                y="98"
                width="38"
                height="30"
                rx="7"
                fill="rgba(56, 189, 248, 0.08)"
                stroke="#141418"
                strokeWidth="3.2"
              />
              <rect
                x="142"
                y="98"
                width="38"
                height="30"
                rx="7"
                fill="rgba(56, 189, 248, 0.08)"
                stroke="#141418"
                strokeWidth="3.2"
              />
              <line x1="138" y1="112" x2="142" y2="112" stroke="#141418" strokeWidth="3.2" />
            </g>
          )}

          {/* Cheek Smile Creases (Nasolabial Folds) */}
          {!hasFullBeard && (
            <path
              d={`M 106 148 Q 100 158 106 ${166 + jawDrop * 0.4} M 174 148 Q 180 158 174 ${
                166 + jawDrop * 0.4
              }`}
              fill="none"
              stroke="#7c4d32"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          )}

          {/* ============================================================
              6-VISEME CARTOON MOUTH ENGINE (SIL, A, E, I, O, U)
              ============================================================ */}
          <g>
            {mouthOpenY < 0.05 ? (
              /* SIL (Closed / Idle Confident Smirk or Teeth Hint) */
              hasFullBeard ? (
                /* La Mole Idle Mouth inside Beard */
                <g>
                  <path
                    d="M 124 159 Q 140 164 156 159"
                    fill="none"
                    stroke="#141418"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 131 164 Q 140 167 149 164"
                    fill="none"
                    stroke="#8c5a3c"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                /* Adrian Idle Confident Cartoon Smile with Upper Teeth Hint */
                <g>
                  <path
                    d="M 116 156 Q 140 162 164 156 C 160 168, 120 168, 116 156 Z"
                    fill="#f8fafc"
                    stroke="#141418"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </g>
              )
            ) : (
              /* ACTIVE SPEAKING VISEME MOUTH (A, E, I, O, U) */
              <g>
                {/* Oral Cavity */}
                {isRoundedVowel ? (
                  <ellipse
                    cx="140"
                    cy={163 + mouthH * 0.32}
                    rx={mouthW * 0.42}
                    ry={mouthH * 0.55 + 2}
                    fill="#450a0a"
                    stroke="#141418"
                    strokeWidth="2.6"
                  />
                ) : (
                  <path
                    d={`M ${140 - mouthW / 2} 159 Q 140 ${156 - mouthForm * 2} ${
                      140 + mouthW / 2
                    } 159 C ${140 + mouthW * 0.48} ${164 + mouthH}, ${
                      140 - mouthW * 0.48
                    } ${164 + mouthH}, ${140 - mouthW / 2} 159 Z`}
                    fill="#450a0a"
                    stroke="#141418"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  />
                )}

                {/* Clipped Teeth & Tongue Inside Oral Cavity */}
                <g clipPath={`url(#viseme-clip-${character.id})`}>
                  {/* Upper Teeth Row */}
                  <rect
                    x={140 - mouthW * 0.46}
                    y="155"
                    width={mouthW * 0.92}
                    height="7.5"
                    rx="2"
                    fill="#f8fafc"
                    stroke="#141418"
                    strokeWidth="1.5"
                  />
                  {/* Tongue */}
                  <ellipse
                    cx="140"
                    cy={165 + mouthH * 0.65}
                    rx={mouthW * 0.36}
                    ry={Math.max(5, mouthH * 0.42)}
                    fill="#e11d48"
                  />
                  {/* Lower Teeth Hint on Wide Visemes (I, E, A) */}
                  {!isRoundedVowel && (
                    <rect
                      x={140 - mouthW * 0.38}
                      y={161 + mouthH * 0.72}
                      width={mouthW * 0.76}
                      height="5"
                      rx="1.5"
                      fill="#f8fafc"
                      stroke="#141418"
                      strokeWidth="1.2"
                    />
                  )}
                </g>
              </g>
            )}
          </g>

          {/* HEADWEAR & HAIR LAYER (Top of Head) */}
          {hasBaseballCap ? (
            /* CURVED OLIVE-TAUPE BASEBALL CAP (La Mole Style) */
            <g>
              {/* Sideburn Hair Tufts Under Cap */}
              <path
                d="M 76 92 L 75 118 L 84 118 L 84 92 Z M 196 92 L 196 118 L 205 118 L 204 92 Z"
                fill="#1c1614"
              />
              {/* Cap Crown */}
              <path
                d="M 74 88 C 72 28, 208 28, 206 88 Z"
                fill="#5c5346"
                stroke="#141418"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Cap Crown Center Seam Lines */}
              <path
                d="M 140 38 L 140 74 M 102 46 Q 92 64 90 84 M 178 46 Q 188 64 190 84"
                fill="none"
                stroke="#3f382f"
                strokeWidth="2"
              />
              {/* Curved Cap Visor / Brim Casting Forehead Shadow */}
              <path
                d="M 74 88 Q 140 62 206 88 Q 140 76 74 88 Z"
                fill="#141418"
                opacity="0.28"
              />
              <path
                d="M 72 86 C 96 54, 184 54, 208 86 C 182 72, 98 72, 72 86 Z"
                fill="#473f35"
                stroke="#141418"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            /* SCULPTED LAYERED BROWN QUIFF HAIR (Adrian / Alex / Sofi Style) */
            <g>
              <path
                d="M 83 114 L 78 82 C 74 52, 92 34, 114 34 L 118 26 C 130 24, 146 24, 158 30 L 166 25 C 186 32, 204 52, 200 84 L 196 114 L 190 114 L 190 82 C 186 64, 166 56, 140 56 C 114 56, 94 64, 90 82 L 90 114 Z"
                fill={preset === 'adrian' ? '#3b2416' : hairColor}
                stroke="#141418"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              {/* Hair Texture & Volume Lines */}
              <path
                d="M 104 44 Q 124 36 146 44 M 122 34 Q 144 28 168 38"
                fill="none"
                stroke="#24150c"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      </svg>

      {/* FLOATING NAMEPLATE PILL (Matches the bottom of the coffee table in the reference image) */}
      <div className="relative z-30 -mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-700/90 shadow-xl backdrop-blur-md">
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isSpeaking ? 'scale-125 animate-pulse' : 'opacity-45'
          }`}
          style={{ backgroundColor: isSpeaking ? primaryColor : '#475569' }}
        />
        <span className="text-xs font-extrabold tracking-wide text-white">{character.name}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/95 text-slate-300 font-semibold">
          {isSpeaking ? `Hablando [${activeViseme}]` : 'Escuchando'}
        </span>
      </div>
    </div>
  );
};
