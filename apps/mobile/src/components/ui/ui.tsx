import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SongStatus } from "@monorepo/core";
import type { CoverVariant } from "@/lib/model";
import { colors, coverGradients, fonts, statusDotColor } from "@/theme";

export function StatusDot({ status, size = 7 }: { status: SongStatus; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: statusDotColor[status],
      }}
    />
  );
}

const statusPillStyle: Record<SongStatus, { backgroundColor: string; color: string }> = {
  finished: { backgroundColor: "rgba(194,94,68,.16)", color: colors.accentSoft },
  in_progress: { backgroundColor: "rgba(207,155,63,.14)", color: colors.amber },
  draft: { backgroundColor: "rgba(131,122,110,.14)", color: colors.meta },
};

export function StatusPill({ status, label }: { status: SongStatus; label: string }) {
  const style = statusPillStyle[status];
  return (
    <View style={[styles.pill, { backgroundColor: style.backgroundColor }]}>
      <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 11, color: style.color }}>{label}</Text>
    </View>
  );
}

export function CoverArt({
  variant,
  uri,
  style,
  children,
}: {
  variant: CoverVariant;
  /** Real artwork. When set it wins over the generated gradient. */
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  if (uri) {
    return (
      <View style={style}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        {children}
      </View>
    );
  }
  if (variant === "none") {
    return <View style={[styles.coverNone, style]}>{children}</View>;
  }
  const [from, to] = coverGradients[variant];
  return (
    <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function MetaChip({
  children,
  active = false,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.metaChip, active && styles.metaChipActive, style]}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: active ? colors.ink : colors.ink3 }}>
        {children}
      </Text>
    </View>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tagChip}>
      <Text style={{ fontSize: 11, color: colors.meta, fontFamily: fonts.ui }}>{children}</Text>
    </View>
  );
}

export function MonoLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.monoLabel, style]}>{children}</Text>;
}

export function Waveform({
  samples,
  progress,
  height,
  onSeek,
}: {
  samples: number[];
  progress: number;
  height: number;
  /** Supplying this makes the waveform tappable and draggable to scrub. */
  onSeek?: (ratio: number) => void;
}) {
  const width = useRef(0);
  // While dragging, render the finger's position instead of playback's, so the
  // bar tracks the thumb rather than lagging behind the audio.
  const [scrub, setScrub] = useState<number | null>(null);

  // Handlers read through refs so the responder, created once, never goes stale.
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const ratioAt = (x: number) =>
    width.current > 0 ? Math.min(1, Math.max(0, x / width.current)) : 0;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!onSeekRef.current,
      onMoveShouldSetPanResponder: () => !!onSeekRef.current,
      onPanResponderGrant: (e) => setScrub(ratioAt(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setScrub(ratioAt(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        const ratio = ratioAt(e.nativeEvent.locationX);
        setScrub(null);
        onSeekRef.current?.(ratio);
      },
      onPanResponderTerminate: () => setScrub(null),
    })
  ).current;

  const shown = scrub ?? progress;
  const playedBars = Math.round(shown * samples.length);

  return (
    <View
      {...(onSeek ? responder.panHandlers : null)}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width;
      }}
      // The bars are only a couple of dozen points tall — widen the touch area.
      hitSlop={onSeek ? { top: 12, bottom: 12, left: 4, right: 4 } : undefined}
      style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height }}
    >
      {samples.map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            height: `${h}%`,
            backgroundColor:
              i < playedBars
                ? colors.wavePlayed
                : i === playedBars
                  ? colors.waveWarm
                  : colors.waveMuted,
          }}
        />
      ))}
    </View>
  );
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlayButton({
  isPlaying,
  onPress,
  size = 40,
}: {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={isPlaying ? "Pausar" : "Tocar"}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={size * 0.42}
        color={colors.onAccent}
        style={isPlaying ? undefined : { marginLeft: 2 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  coverNone: {
    backgroundColor: "#1a1610",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
    alignItems: "center",
    justifyContent: "center",
  },
  metaChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipActive: {
    backgroundColor: colors.surfaceActive,
    borderColor: colors.borderActive,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  monoLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.faint2,
  },
});
