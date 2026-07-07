import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CoverArt,
  MetaChip,
  PlayButton,
  StatusPill,
  Waveform,
  formatTime,
  usePlayback,
} from "@/components/ui";
import { getSong, primaryVersion, statusLabel, type SeedSong } from "@/data/songbook";
import { colors, fonts } from "@/theme";

const tabs = ["Letra", "Cifra", "Tab", "Áudios", "Imagens"] as const;
type Tab = (typeof tabs)[number];

function sectionColor(label: string): string {
  return label.startsWith("refrão") ? colors.amber : colors.accent;
}

function LyricContent({ song }: { song: SeedSong }) {
  const version = primaryVersion(song);
  if (!version) {
    return <EmptyState label="sem letra ainda" action="escrever letra" onPress={() => router.push(`/song/${song.id}/edit`)} />;
  }
  return (
    <View>
      {version.sections.map((section, si) => (
        <View key={si} style={si > 0 ? { paddingTop: 18 } : undefined}>
          <Text style={[styles.sectionLabel, { color: sectionColor(section.label) }]}>
            [{section.label}]
          </Text>
          {section.lines.map((line, li) => (
            <Text key={li} style={styles.lyricLine}>
              {line}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function EmptyState({ label, action, onPress }: { label: string; action: string; onPress?: () => void }) {
  return (
    <View style={{ gap: 12, alignItems: "flex-start" }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.faint }}>{label}</Text>
      <Pressable onPress={onPress} style={styles.emptyAction}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.ink3 }}>+ {action}</Text>
      </Pressable>
    </View>
  );
}

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = getSong(id);
  const [activeTab, setActiveTab] = useState<Tab>("Letra");
  const playback = usePlayback(song?.audio?.durationSeconds ?? 0);

  if (!song) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ fontFamily: fonts.mono, color: colors.meta, padding: 24 }}>
          música não encontrada
        </Text>
      </SafeAreaView>
    );
  }

  const version = primaryVersion(song);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* nav row */}
      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.ink2} />
        </Pressable>
        <View style={styles.savedRow}>
          <View style={styles.savedDot} />
          <Text style={styles.savedText}>salvo</Text>
        </View>
        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={19} color={colors.ink2} />
        </Pressable>
      </View>

      {/* title block */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Text style={styles.title}>{song.title}</Text>
          <StatusPill status={song.status} label={statusLabel[song.status]} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {song.key && <MetaChip>Tom · {song.key}</MetaChip>}
          {song.bpm && <MetaChip>{song.bpm} BPM</MetaChip>}
          {version && (
            <Pressable onPress={() => router.push(`/song/${song.id}/edit`)}>
              <MetaChip>
                {version.label} · atual ▾
              </MetaChip>
            </Pressable>
          )}
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: active ? fonts.uiSemiBold : fonts.ui,
                  color: active ? colors.ink : "#7a7268",
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 12 }}>
        {activeTab === "Letra" && <LyricContent song={song} />}
        {activeTab === "Cifra" &&
          (song.chordChart ? (
            <Text style={styles.preText}>{song.chordChart}</Text>
          ) : (
            <EmptyState label="sem cifra ainda" action="adicionar cifra" />
          ))}
        {activeTab === "Tab" &&
          (song.tablature ? (
            <Text style={styles.preText}>{song.tablature}</Text>
          ) : (
            <EmptyState label="sem tablatura ainda" action="adicionar tab" />
          ))}
        {activeTab === "Áudios" &&
          (song.audio ? (
            <View style={styles.audioRow}>
              <CoverArt variant="none" style={styles.audioThumb}>
                <Ionicons name="mic-outline" size={16} color={colors.faint} />
              </CoverArt>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.ink2 }}>
                  {song.audio.filename}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 }}>
                  {song.audio.durationLabel}
                </Text>
              </View>
            </View>
          ) : (
            <EmptyState label="sem áudios ainda" action="gravar ideia" onPress={() => router.push("/capture")} />
          ))}
        {activeTab === "Imagens" && <EmptyState label="sem imagens ainda" action="adicionar imagem" />}
      </ScrollView>

      {/* player */}
      {song.audio && (
        <View style={styles.player}>
          <PlayButton isPlaying={playback.isPlaying} onPress={playback.toggle} />
          <View style={{ flex: 1 }}>
            <Waveform samples={song.audio.samples} progress={playback.progress} height={26} />
          </View>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 }}>
            {playback.elapsed > 0 ? formatTime(playback.elapsed) : song.audio.durationLabel}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  savedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  savedText: { fontFamily: fonts.mono, fontSize: 12, color: colors.success },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 28, color: colors.ink, letterSpacing: -0.56 },
  tabRow: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { paddingBottom: 11 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent, marginBottom: -1 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  lyricLine: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 28.7, color: colors.lyric },
  preText: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 24, color: colors.lyric },
  emptyAction: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    borderRadius: 14,
  },
  audioThumb: { width: 42, height: 42, borderRadius: 9 },
  player: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
});
