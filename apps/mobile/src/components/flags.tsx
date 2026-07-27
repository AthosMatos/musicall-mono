/**
 * The two flags used as language buttons on the first onboarding screen.
 *
 * They are drawn with `react-native-svg` rather than shipped as images or
 * rendered as emoji: emoji flags are missing from a number of Android system
 * fonts, and these stay crisp at any size.
 */
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from "react-native-svg";

const RATIO = 1.4;

/** Five-point star centred on the origin with radius 1. */
const STAR =
  "M0,-1 L0.225,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 " +
  "L0,0.382 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.225,-0.309 Z";

export interface FlagProps {
  /** Width in points; the height follows the 1.4 aspect ratio. */
  size?: number;
}

export function BrazilFlag({ size = 64 }: FlagProps) {
  return (
    <Svg width={size} height={size / RATIO} viewBox="0 0 28 20">
      <Defs>
        <ClipPath id="br-globe">
          <Circle cx={14} cy={10} r={5} />
        </ClipPath>
      </Defs>
      <Rect width={28} height={20} fill="#009C3B" />
      <Path d="M14 2.2 L25.4 10 L14 17.8 L2.6 10 Z" fill="#FFDF00" />
      <Circle cx={14} cy={10} r={5} fill="#002776" />
      <G clipPath="url(#br-globe)">
        <Path
          d="M7.4 12.1 C10.4 10.1 16.6 9.6 21.2 11.8 L21.2 13.4 C16.6 11.2 10.4 11.7 7.4 13.7 Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
}

const STRIPE_HEIGHT = 20 / 13;
const CANTON_WIDTH = 11.2;
const CANTON_HEIGHT = STRIPE_HEIGHT * 7;

/** Rows of 5 and 4 stars alternating, the way the real canton is laid out. */
function cantonStars() {
  const stars: { x: number; y: number }[] = [];
  const rows = 5;
  for (let row = 0; row < rows; row++) {
    const count = row % 2 === 0 ? 5 : 4;
    const gap = CANTON_WIDTH / (count + 1);
    for (let col = 0; col < count; col++) {
      stars.push({
        x: gap * (col + 1),
        y: (CANTON_HEIGHT / (rows + 1)) * (row + 1),
      });
    }
  }
  return stars;
}

const STARS = cantonStars();

export function UsaFlag({ size = 64 }: FlagProps) {
  return (
    <Svg width={size} height={size / RATIO} viewBox="0 0 28 20">
      <Rect width={28} height={20} fill="#FFFFFF" />
      {Array.from({ length: 7 }, (_, i) => (
        <Rect
          key={i}
          y={i * 2 * STRIPE_HEIGHT}
          width={28}
          height={STRIPE_HEIGHT}
          fill="#B22234"
        />
      ))}
      <Rect width={CANTON_WIDTH} height={CANTON_HEIGHT} fill="#3C3B6E" />
      {STARS.map((star, i) => (
        <Path
          key={i}
          d={STAR}
          fill="#FFFFFF"
          transform={`translate(${star.x}, ${star.y}) scale(0.5)`}
        />
      ))}
    </Svg>
  );
}
