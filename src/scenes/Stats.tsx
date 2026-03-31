import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { stats, colors } from "../data";

const StatCard: React.FC<{
  stat: (typeof stats)[0];
  index: number;
  frame: number;
  fps: number;
}> = ({ stat, index, frame, fps }) => {
  const delay = index * 12;

  const cardY = spring({
    frame,
    fps,
    from: 60,
    to: 0,
    config: { damping: 14, stiffness: 120, mass: 0.5 },
    delay,
  });

  const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleIn = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 12, stiffness: 200, mass: 0.4 },
    delay,
  });

  // Number count-up animation
  const numericValue = parseInt(stat.value.replace("+", ""), 10);
  const countFrame = Math.max(0, frame - delay - 5);
  const countedValue = Math.round(
    interpolate(countFrame, [0, 25], [0, numericValue], {
      extrapolateRight: "clamp",
    })
  );
  const displayValue = stat.value.includes("+")
    ? `${countedValue}+`
    : `${countedValue}`;

  const accentColors = [colors.accent, colors.accentAlt, "#FFD93D", "#A855F7"];
  const accentColor = accentColors[index % accentColors.length];

  return (
    <div
      style={{
        opacity: cardOpacity,
        transform: `translateY(${cardY}px) scale(${scaleIn})`,
        background: colors.bgCard,
        borderRadius: 24,
        padding: "40px 28px",
        border: `1px solid rgba(255,255,255,0.08)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top color bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: accentColor,
          borderRadius: "24px 24px 0 0",
        }}
      />

      <div
        style={{
          fontSize: 72,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          color: accentColor,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontSize: 24,
          fontFamily: "Arial, sans-serif",
          fontWeight: 500,
          color: colors.grey,
          textAlign: "center",
          lineHeight: 1.3,
          whiteSpace: "pre-line",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
};

export const Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateRight: "clamp",
  });

  // Glowing orb behind stats
  const orbScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 20, stiffness: 40 },
    delay: 5,
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${orbScale})`,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px",
          gap: 60,
        }}
      >
        {/* Section heading */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: "Arial, sans-serif",
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            ¿POR QUÉ ELEGIRNOS?
          </div>
          <div
            style={{
              fontSize: 60,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              color: colors.white,
              lineHeight: 1.1,
            }}
          >
            Resultados que{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              hablan
            </span>
          </div>
        </div>

        {/* Stats grid — 2×2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            width: "100%",
          }}
        >
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
