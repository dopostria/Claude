import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, colors } from "../data";

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient reveals
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Main headline
  const headlineScale = spring({
    frame,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
    delay: 5,
  });
  const headlineOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subheadline
  const subOpacity = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = spring({
    frame,
    fps,
    from: 30,
    to: 0,
    config: { damping: 14, stiffness: 100 },
    delay: 18,
  });

  // Divider line
  const lineWidth = spring({
    frame,
    fps,
    from: 0,
    to: 200,
    config: { damping: 12, stiffness: 80, mass: 0.8 },
    delay: 28,
  });

  // Contact items stagger in
  const contactItemOpacity = (delay: number) =>
    interpolate(frame, [delay, delay + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const contactItemY = (delay: number) =>
    spring({
      frame,
      fps,
      from: 20,
      to: 0,
      config: { damping: 14, stiffness: 120 },
      delay,
    });

  // Final tagline
  const finalOpacity = interpolate(frame, [70, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalScale = spring({
    frame,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 14, stiffness: 80 },
    delay: 70,
  });

  // Pulsing CTA button glow
  const glowOpacity = interpolate((frame * 2) % 60, [0, 30, 60], [0.4, 1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #0D0D2B 0%, ${colors.bg} 50%, #1A0A2E 100%)`,
        opacity: bgOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,60,172,0.12) 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 70px",
          gap: 0,
        }}
      >
        {/* Emoji spark */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            fontSize: 80,
            marginBottom: 28,
          }}
        >
          🚀
        </div>

        {/* Main headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              lineHeight: 1.05,
              color: colors.white,
            }}
          >
            ¡Transformamos
          </div>
          <div
            style={{
              fontSize: 76,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              lineHeight: 1.05,
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            tu marca!
          </div>
        </div>

        {/* Subheadline */}
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            fontSize: 30,
            fontFamily: "Arial, sans-serif",
            fontWeight: 400,
            color: colors.grey,
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          {brand.description}
        </div>

        {/* Divider */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
            marginBottom: 48,
          }}
        />

        {/* Contact info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            marginBottom: 56,
          }}
        >
          {[
            { icon: "🌐", text: brand.website, delay: 38 },
            { icon: "📧", text: brand.email, delay: 50 },
            { icon: "📞", text: brand.phone, delay: 62 },
          ].map(({ icon, text, delay }) => (
            <div
              key={text}
              style={{
                opacity: contactItemOpacity(delay),
                transform: `translateY(${contactItemY(delay)}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 50,
                padding: "14px 32px",
              }}
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <span
                style={{
                  fontSize: 28,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 500,
                  color: colors.white,
                  letterSpacing: "0.02em",
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Final CTA button */}
        <div
          style={{
            opacity: finalOpacity,
            transform: `scale(${finalScale})`,
            position: "relative",
          }}
        >
          {/* Glow behind button */}
          <div
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: 60,
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
              opacity: glowOpacity * 0.35,
              filter: "blur(12px)",
            }}
          />
          <div
            style={{
              position: "relative",
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.gradientEnd})`,
              borderRadius: 50,
              padding: "22px 60px",
              fontSize: 32,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              color: colors.white,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ¡Contáctanos hoy!
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
