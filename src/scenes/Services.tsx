import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { services, colors } from "../data";

const ServiceCard: React.FC<{
  service: (typeof services)[0];
  index: number;
  frame: number;
  fps: number;
}> = ({ service, index, frame, fps }) => {
  // Each card enters every 18 frames (0.6s)
  const delay = index * 18;

  const slideX = spring({
    frame,
    fps,
    from: -80,
    to: 0,
    config: { damping: 14, stiffness: 120, mass: 0.5 },
    delay,
  });

  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleIn = spring({
    frame,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 10, stiffness: 150, mass: 0.4 },
    delay,
  });

  // Progress bar fill
  const barWidth = interpolate(frame, [delay + 10, delay + 35], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideX}px) scale(${scaleIn})`,
        background: colors.bgCard,
        borderRadius: 20,
        padding: "28px 32px",
        border: `1px solid rgba(255,255,255,0.06)`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left color accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: service.color,
          borderRadius: "20px 0 0 20px",
        }}
      />

      {/* Icon circle */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: `${service.color}20`,
          border: `1.5px solid ${service.color}50`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          flexShrink: 0,
        }}
      >
        {service.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontSize: 30,
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 800,
            color: colors.white,
            marginBottom: 6,
            lineHeight: 1.1,
          }}
        >
          {service.title}
        </div>
        <div
          style={{
            fontSize: 22,
            fontFamily: "Arial, sans-serif",
            color: colors.grey,
            lineHeight: 1.3,
            marginBottom: 12,
          }}
        >
          {service.description}
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barWidth}%`,
              background: service.color,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const Services: React.FC = () => {
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
    config: { damping: 14, stiffness: 100, mass: 0.6 },
    delay: 0,
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        overflow: "hidden",
      }}
    >
      {/* Subtle background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 300,
          background: `linear-gradient(180deg, rgba(78,205,196,0.06) 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "70px 60px",
          gap: 28,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: "Arial, sans-serif",
              fontWeight: 600,
              color: colors.accentAlt,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            LO QUE HACEMOS
          </div>
          <div
            style={{
              fontSize: 58,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              color: colors.white,
              lineHeight: 1.05,
            }}
          >
            Nuestros{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${colors.accentAlt}, #22D3EE)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Servicios
            </span>
          </div>
        </div>

        {/* Service cards */}
        {services.map((service, i) => (
          <ServiceCard
            key={service.title}
            service={service}
            index={i}
            frame={frame}
            fps={fps}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
