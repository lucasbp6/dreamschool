// Enfeites no estilo das ilustrações: nuvens fofas e brilhos de quatro pontas.

export function Sparkle({ className = "", tone = "scene-sparkle" }: { className?: string; tone?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path className={tone} d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
    </svg>
  );
}

export function Cloud({ className = "", tone = "scene-cloud" }: { className?: string; tone?: string }) {
  return (
    <svg viewBox="0 0 120 60" aria-hidden className={className}>
      <path
        className={tone}
        d="M18 52 C6 52 2 40 10 33 C8 22 20 15 30 20 C34 8 52 4 62 14 C70 6 88 8 90 22 C102 20 114 30 108 42 C116 48 110 56 100 54 Z"
      />
    </svg>
  );
}

/** Banco de nuvens que serve de "chão" do cenário. */
export function CloudBank({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden className={className}>
      <path
        className="scene-cloud-deep"
        d="M0 60 V34 C20 18 44 18 60 28 C76 10 108 10 124 26 C140 12 170 12 184 28 C200 14 232 14 246 28 C262 12 292 12 306 28 C322 16 352 16 366 30 C378 22 392 24 400 30 V60 Z"
      />
      <path
        className="scene-cloud"
        d="M0 60 V44 C24 30 50 32 66 42 C84 28 112 28 128 42 C146 30 176 30 190 42 C208 30 236 30 252 42 C270 30 300 30 314 42 C332 32 360 32 374 42 C386 36 396 38 400 40 V60 Z"
      />
    </svg>
  );
}
