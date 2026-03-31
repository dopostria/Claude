import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { platforms, colors } from "../data";

const PlatformBadge: React.FC<{
  platform: (typeof platforms)[0];
  index: number;
  frame: number;
  fps: number;
}> = ({ platform, index, frame, fps }) => {
  const delay = 15 + index * 12;

  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 180, mass: 0.4 },
    delay,
  });

  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse ring animation
  const pulseScale = interpolate(
    (frame - delay - 20 + 1000) % 60,
    [0, 60],
    [1, 1.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const pulseOpacity = interpolate(
    (frame - delay - 20 + 1000) % 60,
    [0, 60],
    [0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const showPulse = frame > delay + 20;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        position: "relative",
      }}
    >
      {/* Pulse ring */}
      {showPulse && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 100,
            height: 100,
            transform: `translate(-50%, -70%) scale(${pulseScale})`,
            borderRadius: "50%",
            border: `2px solid ${platform.color}`,
            opacity: pulseOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icon circle */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${platform.color}25`,
          border: `2px solid ${platform.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          color: platform.color,
        }}
      >
        {platform.icon}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 24,
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          color: colors.white,
          letterSpacing: "0.04em",
        }}
      >
        {platform.name}
      </div>
    </div>
  );
};

export const Platforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = spring({
    frame,
    fps,
    from: -40,
    to: 0,
    config: { damping: 14, stiffness: 100 },
    delay: 0,
  });

  // Network line connecting the platforms
  const lineProgress = interpolate(frame, [25, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background rotating ring
  const ringRotation = interpolate(frame, [0, 150], [0, 360], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        overflow: "hidden",
      }}
    >
      {/* Decorative ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 900,
          height: 900,
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg)`,
          borderRadius: "50%",
          border: "1px dashed rgba(255,107,53,0.1)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 700,
          height: 700,
          transform: `translate(-50%, -50%) rotate(${-ringRotation * 0.7}deg)`,
          borderRadius: "50%",
          border: "1px dashed rgba(78,205,196,0.08)",
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
          gap: 70,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: "Arial, sans-serif",
              fontWeight: 600,
              color: "#A855F7",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            PRESENCIA DIGITAL
          </div>
          <div
            style={{
              fontSize: 60,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              color: colors.white,
              lineHeight: 1.05,
            }}
          >
            En todas las{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #A855F7, #EC4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              plataformas
            </span>
          </div>
        </div>

        {/* Connection line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 60,
            right: 60,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)`,
            transform: `scaleX(${lineProgress})`,
            transformOrigin: "left",
          }}
        />

        {/* Platform badges — 3 top, 2 bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 50,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              width: "100%",
            }}
          >
            {platforms.slice(0, 3).map((p, i) => (
              <PlatformBadge
                key={p.name}
                platform={p}
                index={i}
                frame={frame}
                fps={fps}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              width: "70%",
            }}
          >
            {platforms.slice(3).map((p, i) => (
              <PlatformBadge
                key={p.name}
                platform={p}
                index={i + 3}
                frame={frame}
                fps={fps}
              />
            ))}
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 28,
            fontFamily: "Arial, sans-serif",
            fontWeight: 400,
            color: colors.grey,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Streaming en vivo simultáneo en{" "}
          <span style={{ color: colors.white, fontWeight: 700 }}>
            todas las plataformas
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
