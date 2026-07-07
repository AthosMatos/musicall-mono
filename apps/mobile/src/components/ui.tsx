import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SongStatus } from "@monorepo/core";
import type { CoverVariant } from "@/data/songbook";
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
  style,
  children,
}: {
  variant: CoverVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
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
}: {
  samples: number[];
  progress: number;
  height: number;
}) {
  const playedBars = Math.round(progress * samples.length);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height }}>
      {samples.map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            height: `${h}%`,
            backgroundColor:
              i < playedBars ? colors.wavePlayed : i === playedBars ? colors.waveWarm : colors.waveMuted,
          }}
        />
      ))}
    </View>
  );
}

/** Mock playback clock — advances progress while "playing". */
export function usePlayback(durationSeconds: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    timer.current = setInterval(() => {
      setElapsed((t) => {
        if (t + 0.25 >= durationSeconds) {
          setIsPlaying(false);
          return 0;
        }
        return t + 0.25;
      });
    }, 250);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isPlaying, durationSeconds]);

  return {
    isPlaying,
    elapsed,
    progress: durationSeconds ? elapsed / durationSeconds : 0,
    toggle: () => setIsPlaying((p) => !p),
  };
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
