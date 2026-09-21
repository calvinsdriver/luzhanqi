import type { PieceType } from "@/lib/rules/types";

function polygonPoints(r: number, sides: number, rotationDeg = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180;
    pts.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function starPoints(outerR: number, innerR: number, points: number, rotationDeg = -90): string {
  const pts: string[] = [];
  const step = 360 / (points * 2);
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = ((rotationDeg + step * i) * Math.PI) / 180;
    pts.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function GearGlyph({ size, color }: { size: number; color: string }) {
  const teeth = 8;
  return (
    <>
      {Array.from({ length: teeth }, (_, i) => (
        <rect
          key={i}
          x={-size * 0.12}
          y={-size * 1.05}
          width={size * 0.24}
          height={size * 0.35}
          fill={color}
          transform={`rotate(${(360 / teeth) * i})`}
        />
      ))}
      <circle cx={0} cy={0} r={size * 0.65} fill={color} />
      <circle cx={0} cy={0} r={size * 0.26} fill="var(--color-surface)" />
    </>
  );
}

function MineGlyph({ size, color }: { size: number; color: string }) {
  const spikes = 8;
  return (
    <>
      {Array.from({ length: spikes }, (_, i) => {
        const angle = ((360 / spikes) * i * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={Math.cos(angle) * size * 0.62}
            y1={Math.sin(angle) * size * 0.62}
            x2={Math.cos(angle) * size * 1.05}
            y2={Math.sin(angle) * size * 1.05}
            stroke={color}
            strokeWidth={size * 0.16}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={0} cy={0} r={size * 0.55} fill={color} />
    </>
  );
}

function BombGlyph({ size, color }: { size: number; color: string }) {
  return (
    <>
      <line
        x1={size * 0.3}
        y1={-size * 0.45}
        x2={size * 0.6}
        y2={-size * 0.85}
        stroke={color}
        strokeWidth={size * 0.15}
        strokeLinecap="round"
      />
      <circle cx={size * 0.65} cy={-size * 0.92} r={size * 0.14} fill={color} />
      <circle cx={0} cy={size * 0.08} r={size * 0.68} fill={color} />
    </>
  );
}

function FlagGlyph({ size, color }: { size: number; color: string }) {
  return (
    <>
      <line
        x1={-size * 0.45}
        y1={-size * 0.9}
        x2={-size * 0.45}
        y2={size * 0.9}
        stroke={color}
        strokeWidth={size * 0.16}
        strokeLinecap="round"
      />
      <polygon
        points={`${-size * 0.45},${-size * 0.85} ${size * 0.75},${-size * 0.42} ${-size * 0.45},${size * 0.02}`}
        fill={color}
      />
    </>
  );
}

/**
 * One distinct silhouette per piece type - the goal is "recognizable at a glance", not
 * heraldic accuracy. Officer ranks get an ascending sequence of simple polygon shapes;
 * the three special pieces get their own hand-built glyphs. `type: null` (an opponent's
 * unrevealed piece) renders as a plain "?" rather than any specific shape.
 */
export function PieceIcon({ type, color, size }: { type: PieceType | null; color: string; size: number }) {
  if (!type) {
    return (
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 1.3}
        fontFamily="var(--font-heading)"
        fill={color}
      >
        ?
      </text>
    );
  }

  switch (type) {
    case "FIELD_MARSHAL":
      return <polygon points={starPoints(size, size * 0.42, 5)} fill={color} />;
    case "GENERAL":
      return <polygon points={starPoints(size * 0.95, size * 0.5, 6)} fill={color} />;
    case "MAJOR_GENERAL":
      return <polygon points={polygonPoints(size, 4, -45)} fill={color} />;
    case "BRIGADIER_GENERAL":
      return <polygon points={polygonPoints(size * 0.95, 5)} fill={color} />;
    case "COLONEL":
      return <polygon points={polygonPoints(size * 0.9, 6)} fill={color} />;
    case "MAJOR":
      return <polygon points={polygonPoints(size, 3)} fill={color} />;
    case "CAPTAIN":
      return (
        <rect x={-size * 0.72} y={-size * 0.72} width={size * 1.44} height={size * 1.44} fill={color} />
      );
    case "LIEUTENANT":
      return <circle cx={0} cy={0} r={size * 0.65} fill={color} />;
    case "ENGINEER":
      return <GearGlyph size={size} color={color} />;
    case "LANDMINE":
      return <MineGlyph size={size} color={color} />;
    case "BOMB":
      return <BombGlyph size={size} color={color} />;
    case "FLAG":
      return <FlagGlyph size={size} color={color} />;
  }
}
