import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, colors } from "../data";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient pulse
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo line (accent bar) slides in from left
  const lineWidth = spring({
    frame,
    fps,
    from: 0,
    to: 120,
    config: { damping: 12, stiffness: 80, mass: 0.8 },
    delay: 5,
  });

  // "COLECTIVO" slides up
  const word1Y = spring({
    frame,
    fps,
    from: 80,
    to: 0,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
    delay: 10,
  });
  const word1Opacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "MARKETERO" slides up with delay
  const word2Y = spring({
    frame,
    fps,
    from: 80,
    to: 0,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
    delay: 20,
  });
  const word2Opacity = interpolate(frame, [20, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline fades in
  const taglineOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [35, 55], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Location badge fades in
  const locationOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative circles
  const circleScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 20, stiffness: 60 },
    delay: 0,
  });

  // Particle dots stagger
  const dotOpacity = (delay: number) =>
    interpolate(frame, [delay, delay + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 40%, #1A0A2E 0%, ${colors.bg} 60%)`,
        opacity: bgOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)`,
          transform: `scale(${circleScale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(78,205,196,0.1) 0%, transparent 70%)`,
          transform: `scale(${circleScale})`,
        }}
      />

      {/* Dot grid pattern */}
      {[...Array(6)].map((_, row) =>
        [...Array(4)].map((_, col) => (
          <div
            key={`${row}-${col}`}
            style={{
              position: "absolute",
              top: 120 + row * 280,
              left: 60 + col * 270,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colors.accent,
              opacity: dotOpacity(row * 3 + col * 2) * 0.25,
            }}
          />
        ))
      )}

      {/* Main content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: lineWidth,
            height: 6,
            background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
            borderRadius: 3,
            marginBottom: 48,
          }}
        />

        {/* COLECTIVO */}
        <div
          style={{
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              transform: `translateY(${word1Y}px)`,
              opacity: word1Opacity,
              fontSize: 96,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              color: colors.white,
              letterSpacing: "0.08em",
              textAlign: "center",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            COLECTIVO
          </div>
        </div>

        {/* MARKETERO */}
        <div
          style={{
            overflow: "hidden",
            marginBottom: 56,
          }}
        >
          <div
            style={{
              transform: `translateY(${word2Y}px)`,
              opacity: word2Opacity,
              fontSize: 96,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.08em",
              textAlign: "center",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            MARKETERO
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontSize: 34,
            fontFamily: "Arial, sans-serif",
            fontWeight: 400,
            color: colors.grey,
            letterSpacing: "0.12em",
            textAlign: "center",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          {brand.tagline}
        </div>

        {/* Location pill */}
        <div
          style={{
            opacity: locationOpacity,
            background: "rgba(255,107,53,0.15)",
            border: `1px solid rgba(255,107,53,0.4)`,
            borderRadius: 40,
            padding: "12px 36px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>📍</span>
          <span
            style={{
              fontSize: 28,
              fontFamily: "Arial, sans-serif",
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.05em",
            }}
          >
            {brand.location}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
