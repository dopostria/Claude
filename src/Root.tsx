import { Composition } from "remotion";
import { ColectivoVideo } from "./ColectivoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ColectivoMarketero"
        component={ColectivoVideo}
        durationInFrames={900}  // 30 seconds × 30fps
        fps={30}
        width={1080}
        height={1920}           // 9:16 portrait
      />
    </>
  );
};
