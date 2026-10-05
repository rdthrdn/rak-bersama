import type { CSSProperties } from "react";

export type KlimtMotif = "mosaic" | "medallion" | "flowers" | "stripes" | "tree" | "tiles";

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
              <rect x="0" y="0" width="28" height="28" fill={gold} />
              <rect x="31" y="0" width="27" height="28" fill="#776C58" />
              <rect x="61" y="0" width="29" height="28" fill="#333231" />
              <rect x="0" y="31" width="28" height="27" fill="#333231" />
              <rect x="31" y="31" width="27" height="27" fill="#776C58" />
              <rect x="61" y="31" width="29" height="27" fill={gold} />
              <rect x="0" y="61" width="28" height="29" fill="#776C58" />
              <rect x="31" y="61" width="27" height="29" fill={base} />
              <rect x="61" y="61" width="29" height="29" fill="#333231" />
              <path d="M29.5 0v90M59.5 0v90M0 29.5h90M0 59.5h90" stroke="#ECE9E2" strokeOpacity=".38" strokeWidth="1" />
              <circle cx="75" cy="45" r="3.2" fill="#8A3A32" />
            </>
          )}
          {motif === "medallion" && (
            <>
              <circle cx="45" cy="45" r="41" fill="none" stroke={gold} strokeWidth="2" />
              <circle cx="45" cy="45" r="33" fill="none" stroke="#ECE9E2" strokeOpacity=".72" strokeWidth="1" />
              <circle cx="45" cy="45" r="23" fill="none" stroke={gold} strokeWidth="5" />
              <circle cx="45" cy="45" r="10" fill={gold} />
              <path d="M45 3v13m0 58v13M3 45h13m58 0h13M15 15l9 9m42 42 9 9M75 15l-9 9m-42 42-9 9" stroke="#ECE9E2" strokeOpacity=".66" strokeWidth="1" />
              <circle cx="79" cy="13" r="3" fill="#2F5B45" />
            </>
          )}
          {motif === "flowers" && (
            <>
              {[0, 45].map((offset) => (
                <g key={offset} transform={`translate(${offset} ${offset})`}>
                  {Array.from({ length: 8 }, (_, index) => (
                    <ellipse key={index} cx="45" cy="25" rx="6" ry="14" fill={index % 2 ? "#776C58" : gold} transform={`rotate(${index * 45} 45 45)`} />
                  ))}
                  <circle cx="45" cy="45" r="8" fill="#A38D5D" />
                  <circle cx="45" cy="45" r="3" fill="#2F5B45" />
                </g>
              ))}
              <circle cx="8" cy="76" r="2.8" fill="#8A3A32" />
              <circle cx="75" cy="8" r="2.8" fill="#2F4B7C" />
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
