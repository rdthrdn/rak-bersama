import type { CSSProperties } from "react";

export type KlimtMotif = "mosaic" | "medallion" | "flowers" | "stripes" | "tree" | "tiles" | "crimson" | "spirals" | "foliage";

export function KlimtPattern({
  motif,
  id,
  seed,
  className,
  base = "#424633",
  gold = "#A38D5D",
}: {
  motif: KlimtMotif;
  id: string;
  seed: number;
  className?: string;
  base?: string;
  gold?: string;
}) {
  const patternId = `klimt-${id.replace(/[^a-zA-Z0-9_-]/g, "")}-${motif}`;
  const shift = seed % 24;
  const jewelX = 42 + (seed % 4) * 28;
  const jewelY = 52 + (seed % 3) * 46;
  const style = { "--motif-gold": gold } as CSSProperties;

  return (
    <svg className={className} style={style} viewBox="0 0 180 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={patternId} width="90" height="90" patternUnits="userSpaceOnUse" patternTransform={`translate(${shift} 0)`}>
          <rect width="90" height="90" fill={base} />
          {motif === "mosaic" && (
            <>
              <rect width="90" height="90" fill="#C5A45A" />
              <rect x="2" y="2" width="24" height="38" fill="#1C1A17" />
              <rect x="28" y="2" width="18" height="22" fill="#78231E" />
              <rect x="48" y="2" width="22" height="18" fill="#ECE7DA" />
              <rect x="72" y="2" width="16" height="38" fill="#1C1A17" />
              <rect x="28" y="26" width="18" height="34" fill="#DFBE73" />
              <rect x="48" y="22" width="22" height="24" fill="#78231E" />
              <rect x="2" y="42" width="24" height="26" fill="#DFBE73" />
              <rect x="72" y="42" width="16" height="24" fill="#ECE7DA" />
              <rect x="2" y="70" width="14" height="18" fill="#78231E" />
              <rect x="18" y="70" width="28" height="18" fill="#1C1A17" />
              <rect x="48" y="48" width="22" height="40" fill="#DFBE73" />
              <rect x="72" y="68" width="16" height="20" fill="#78231E" />
              <path d="M0 0h90v90H0z" fill="none" stroke="#ECE7DA" strokeWidth="0.8" strokeOpacity="0.4" />
            </>
          )}
          {motif === "flowers" && (
            <>
              <rect width="90" height="90" fill="#153325" />
              <path d="M18 90V0M45 90V0M72 90V0" fill="none" stroke={gold} strokeWidth="1.5" strokeOpacity="0.8" />
              <path d="M18 65c12-8 12-22 0-30M45 75c12-8 12-22 0-30M72 55c-12-8-12-22 0-30" fill="none" stroke={gold} strokeWidth="1.2" strokeOpacity="0.7" />
              <g transform="translate(18 20)">
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse key={i} cx="0" cy="-7" rx="2.5" ry="5.5" fill="#F4EFE6" transform={`rotate(${i * 45})`} />
                ))}
                <circle cx="0" cy="0" r="3.5" fill={gold} />
              </g>
              <g transform="translate(45 58)">
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse key={i} cx="0" cy="-7" rx="2.5" ry="5.5" fill="#F4EFE6" transform={`rotate(${i * 45})`} />
                ))}
                <circle cx="0" cy="0" r="3.5" fill={gold} />
              </g>
              <g transform="translate(72 25)">
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse key={i} cx="0" cy="-7" rx="2.5" ry="5.5" fill="#F4EFE6" transform={`rotate(${i * 45})`} />
                ))}
                <circle cx="0" cy="0" r="3.5" fill={gold} />
              </g>
              <circle cx="18" cy="78" r="2.2" fill="#F4EFE6" />
              <circle cx="45" cy="12" r="2.2" fill="#F4EFE6" />
              <circle cx="72" cy="70" r="2.2" fill="#F4EFE6" />
            </>
          )}
          {motif === "crimson" && (
            <>
              <rect width="90" height="90" fill="#5E2520" />
              <path d="M25 90V0M65 90V0" fill="none" stroke={gold} strokeWidth="1.2" strokeOpacity="0.75" />
              <g transform="translate(25 32)">
                {Array.from({ length: 8 }, (_, i) => (
                  <circle key={i} cx={Math.cos((i * Math.PI) / 4) * 8.5} cy={Math.sin((i * Math.PI) / 4) * 8.5} r="2.8" fill="#F4EFE6" />
                ))}
                <circle cx="0" cy="0" r="4.5" fill={gold} />
              </g>
              <g transform="translate(65 65)">
                {Array.from({ length: 8 }, (_, i) => (
                  <circle key={i} cx={Math.cos((i * Math.PI) / 4) * 8.5} cy={Math.sin((i * Math.PI) / 4) * 8.5} r="2.8" fill="#F4EFE6" />
                ))}
                <circle cx="0" cy="0" r="4.5" fill={gold} />
              </g>
              <path d="M25 55c8-6 16-3 18 6M65 25c-8-6-16-3-18 6" fill="none" stroke={gold} strokeWidth="1.2" />
              <circle cx="43" cy="61" r="2.5" fill={gold} />
              <circle cx="47" cy="31" r="2.5" fill={gold} />
              <circle cx="25" cy="78" r="2" fill="#F4EFE6" />
              <circle cx="65" cy="12" r="2" fill="#F4EFE6" />
            </>
          )}
          {motif === "spirals" && (
            <>
              <rect width="90" height="90" fill="#3B3D3B" />
              <path d="M45 45m-22 0a22 22 0 1 0 44 0a22 22 0 1 0-44 0" fill="none" stroke={gold} strokeWidth="2.2" strokeOpacity="0.85" />
              <path d="M45 45m-14 0a14 14 0 1 0 28 0a14 14 0 1 0-28 0" fill="none" stroke={gold} strokeWidth="1.8" />
              <path d="M45 45m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0" fill={gold} />
              <rect x="0" y="0" width="8" height="14" fill={gold} />
              <rect x="0" y="16" width="8" height="14" fill="#1C1A17" />
              <rect x="0" y="32" width="8" height="14" fill="#C89242" />
              <rect x="0" y="48" width="8" height="14" fill="#1C1A17" />
              <rect x="0" y="64" width="8" height="14" fill={gold} />
              <rect x="82" y="0" width="8" height="14" fill="#1C1A17" />
              <rect x="82" y="16" width="8" height="14" fill={gold} />
              <rect x="82" y="32" width="8" height="14" fill="#C89242" />
              <rect x="82" y="48" width="8" height="14" fill={gold} />
              <rect x="82" y="64" width="8" height="14" fill="#1C1A17" />
              <circle cx="20" cy="80" r="3" fill="#A83228" />
              <circle cx="70" cy="15" r="3" fill="#A83228" />
            </>
          )}
          {motif === "foliage" && (
            <>
              <rect width="90" height="90" fill="#192A44" />
              <path d="M30 90Q15 45 30 0M60 90Q75 45 60 0" fill="none" stroke={gold} strokeWidth="1.6" strokeOpacity="0.9" />
              <path d="M26 20c-6-3-10-1-12 5 4 4 10 3 12-5zM34 38c6-3 10-1 12 5-4 4-10 3-12-5z" fill={gold} />
              <path d="M26 56c-6-3-10-1-12 5 4 4 10 3 12-5zM34 74c6-3 10-1 12 5-4 4-10 3-12-5z" fill={gold} />
              <path d="M56 12c-6-3-10-1-12 5 4 4 10 3 12-5zM64 30c6-3 10-1 12 5-4 4-10 3-12-5z" fill={gold} />
              <path d="M56 48c-6-3-10-1-12 5 4 4 10 3 12-5zM64 66c6-3 10-1 12 5-4 4-10 3-12-5z" fill={gold} />
              <circle cx="45" cy="45" r="2.5" fill="#E8D196" />
            </>
          )}
          {motif === "medallion" && (
            <>
              <rect width="90" height="90" fill="#4B4530" />
              <circle cx="45" cy="45" r="28" fill="#1C3829" stroke={gold} strokeWidth="2" />
              <circle cx="45" cy="45" r="20" fill="none" stroke="#EDE8DE" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="45" cy="45" r="10" fill={gold} />
              <circle cx="45" cy="45" r="4" fill="#1C3829" />
              <path d="M12 0v90M78 0v90" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
              <circle cx="12" cy="25" r="2" fill={gold} />
              <circle cx="12" cy="65" r="2" fill={gold} />
              <circle cx="78" cy="25" r="2" fill={gold} />
              <circle cx="78" cy="65" r="2" fill={gold} />
              <circle cx="45" cy="10" r="3" fill="#1C3829" stroke={gold} strokeWidth="1" />
              <circle cx="45" cy="80" r="3" fill="#1C3829" stroke={gold} strokeWidth="1" />
            </>
          )}
          {motif === "stripes" && (
            <>
              <rect x="11" width="7" height="90" fill={gold} />
              <rect x="23" width="2" height="90" fill="#ECE9E2" fillOpacity=".56" />
              <rect x="42" width="13" height="90" fill="#776C58" />
              <rect x="58" width="4" height="90" fill={gold} />
              <rect x="69" width="2" height="90" fill="#ECE9E2" fillOpacity=".62" />
              <rect x="79" width="5" height="90" fill={gold} fillOpacity=".7" />
              <circle cx="48" cy="45" r="4" fill="#2F5B45" />
            </>
          )}
          {motif === "tree" && (
            <>
              <path d="M45 90V56M45 62C32 53 24 47 24 36c0-8 5-13 11-13 7 0 10 5 10 11 0 7-4 10-9 10m9 16c12-8 21-14 21-25 0-8-5-13-11-13-7 0-10 5-10 11 0 7 4 10 9 10M45 57V28M45 31C35 22 33 17 35 9m10 20c10-8 12-13 10-21" fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="24" cy="36" r="2.5" fill="#ECE9E2" />
              <circle cx="66" cy="36" r="2.5" fill="#ECE9E2" />
              <rect x="39" y="78" width="12" height="12" fill="#776C58" />
            </>
          )}
          {motif === "tiles" && (
            <>
              <path d="M45 5 85 45 45 85 5 45z" fill="none" stroke={gold} strokeWidth="2" />
              <path d="M45 18 72 45 45 72 18 45z" fill="#776C58" />
              <path d="M45 30 60 45 45 60 30 45z" fill={gold} />
              <rect x="5" y="5" width="11" height="11" fill="#333231" stroke="#ECE9E2" strokeOpacity=".54" />
              <rect x="74" y="74" width="11" height="11" fill="#333231" stroke="#ECE9E2" strokeOpacity=".54" />
              <circle cx="15" cy="73" r="3" fill="#8A3A32" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="180" height="320" fill={base} />
      <rect width="180" height="320" fill={`url(#${patternId})`} />
      <circle cx={jewelX} cy={jewelY} r="3" fill={seed % 2 ? "#2F5B45" : "#8A3A32"} />
      <circle cx={164 - jewelX / 4} cy={246 - jewelY / 3} r="2.5" fill="#A38D5D" />
    </svg>
  );
}
