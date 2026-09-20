import React from "react";

interface TalkEasyLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function TalkEasyLogo({ className = "", size = 36, showText = true }: TalkEasyLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="TalkEasy AI logo"
      >
        <defs>
          <linearGradient id="teGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0072ff" />
            <stop offset="100%" stopColor="#5b42f3" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
        </defs>
        <g fill="url(#teGrad)">
          <path d="M 130 140 C 130 115 150 95 175 95 L 345 95 C 370 95 390 115 390 140 C 390 165 370 185 345 185 L 260 185 L 260 300 C 260 315 250 325 235 325 C 220 325 210 315 210 300 L 210 185 L 175 185 C 150 185 130 165 130 140 Z" />
          <path d="M 210 170 C 190 170 180 180 180 200 L 180 320 C 180 360 205 380 235 380 L 235 435 C 235 445 220 455 210 450 C 200 445 195 430 200 415 L 205 400 L 190 410 C 170 425 155 400 165 380 C 170 370 175 350 175 330 L 175 200 C 175 180 190 170 210 170 Z" />
          <path d="M 260 185 L 345 185 C 370 185 390 205 390 230 C 390 255 370 275 345 275 L 270 275 L 270 295 L 345 295 C 370 295 390 315 390 340 C 390 365 370 385 345 385 L 260 385 C 235 385 215 365 215 340 L 215 230 C 215 205 235 185 260 185 Z" />
        </g>
        <g fill="url(#leafGrad)">
          <path d="M 330 100 C 310 80 320 50 335 45 C 350 40 365 55 360 75 C 355 90 340 105 330 100 Z" />
          <path d="M 355 105 C 345 70 375 25 410 20 C 425 20 430 40 420 65 C 410 90 380 115 355 105 Z" />
        </g>
      </svg>
      {showText && (
        <div className="leading-tight">
          <div className="font-display font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontSize: `${size * 0.65}px` }}>
            Talk<span className="text-indigo-600 dark:text-indigo-400">Easy</span><span className="text-teal-600 dark:text-teal-400"> AI</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground">By Taha Shahud</div>
        </div>
      )}
    </div>
  );
}
