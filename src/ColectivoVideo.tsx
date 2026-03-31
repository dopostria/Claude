import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Intro } from "./scenes/Intro";
import { Stats } from "./scenes/Stats";
import { Services } from "./scenes/Services";
import { Platforms } from "./scenes/Platforms";
import { CTA } from "./scenes/CTA";

// Scene durations in frames (30fps × seconds)
const SCENES = {
  INTRO: { start: 0, duration: 120 },       // 0–4s
  STATS: { start: 120, duration: 150 },      // 4–9s
  SERVICES: { start: 270, duration: 330 },   // 9–20s
  PLATFORMS: { start: 600, duration: 150 },  // 20–25s
  CTA: { start: 750, duration: 150 },        // 25–30s
};

export const ColectivoVideo: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#08081A", width, height }}>
      <Sequence
        from={SCENES.INTRO.start}
        durationInFrames={SCENES.INTRO.duration}
        name="Intro"
      >
        <Intro />
      </Sequence>

      <Sequence
        from={SCENES.STATS.start}
        durationInFrames={SCENES.STATS.duration}
        name="Stats"
      >
        <Stats />
      </Sequence>

      <Sequence
        from={SCENES.SERVICES.start}
        durationInFrames={SCENES.SERVICES.duration}
        name="Services"
      >
        <Services />
      </Sequence>

      <Sequence
        from={SCENES.PLATFORMS.start}
        durationInFrames={SCENES.PLATFORMS.duration}
        name="Platforms"
      >
        <Platforms />
      </Sequence>

      <Sequence
        from={SCENES.CTA.start}
        durationInFrames={SCENES.CTA.duration}
        name="CTA"
      >
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
