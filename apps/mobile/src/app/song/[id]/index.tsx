import { Ionicons } from "@expo/vector-icons";
import { parseLyricSections } from "@monorepo/core";
import {
  chordsListOptions,
  lyricsListKey,
  lyricsListOptions,
  lyricsRemoveOptions,
  mediaListForSongOptions,
  songsGetOptions,
  tabsListOptions,
} from "@monorepo/core/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CoverArt, formatTime, MetaChip, PlayButton, StatusPill, Waveform } from "@/components/ui";
import { formatDuration, statusLabel, waveformSamples } from "@/lib/model";
import { useAudioPlayback } from "@/lib/playback";
import { colors, fonts } from "@/theme";

const tabs = ["Letra", "Cifra", "Tab", "Áudios", "Imagens"] as const;
type Tab = (typeof tabs)[number];

function sectionColor(label: string): string {
  return label.toLowerCase().startsWith("refrão") ? colors.amber : colors.accent;
}

function LyricContent({ content }: { content: string }) {
  const sections = parseLyricSections(content);
  return (
    <View>
      {sections.map((section, si) => (
        <View key={si} style={si > 0 ? { paddingTop: 18 } : undefined}>
          {section.label && (
            <Text style={[styles.sectionLabel, { color: sectionColor(section.label) }]}>
              [{section.label}]
            </Text>
          )}
          {section.content.split("\n").map((line, li) => (
            <Text key={li} style={styles.lyricLine}>
              {line || " "}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  label,
  action,
  onPress,
}: {
  label: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={{ gap: 12, alignItems: "flex-start" }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.faint }}>{label}</Text>
      <Pressable onPress={onPress} style={styles.emptyAction}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.ink3 }}>+ {action}</Text>
      </Pressable>
    </View>
  );
}

function BottomPlayer({ assetId, durationSec }: { assetId: string; durationSec: number | null }) {
  const playback = useAudioPlayback(assetId, durationSec);
  return (
    <View style={styles.player}>
      <PlayButton isPlaying={playback.isPlaying} onPress={() => void playback.toggle()} />
      <View style={{ flex: 1 }}>
        <Waveform samples={waveformSamples(assetId, 12)} progress={playback.progress} height={26} />
      </View>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 }}>
        {playback.error
          ? "erro"
          : playback.elapsed > 0
            ? formatTime(playback.elapsed)
            : (formatDuration(playback.duration) ?? "—")}
      </Text>
    </View>
  );
}

export default function SongDetailScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Letra");
  const [menuOpen, setMenuOpen] = useState(false);

  const songQuery = useQuery({ ...songsGetOptions(id), enabled: !!id });
  const lyricsQuery = useQuery({ ...lyricsListOptions(id), enabled: !!id });
  const chordsQuery = useQuery({ ...chordsListOptions(id), enabled: !!id });
  const tabsQuery = useQuery({ ...tabsListOptions(id), enabled: !!id });
  const mediaQuery = useQuery({ ...mediaListForSongOptions(id), enabled: !!id });

  const removeLyric = useMutation({
    ...lyricsRemoveOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lyricsListKey(id) }),
  });

  const song = songQuery.data;
  const versions = lyricsQuery.data ?? [];
  const primary = versions.find((v) => v.isPrimary) ?? versions[0];
  const chordChart = chordsQuery.data?.[0];
  const tablature = tabsQuery.data?.[0];
  const audios = (mediaQuery.data ?? []).filter((m) => m.type === "audio");
  const audio = audios[0];

  if (songQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>carregando…</Text>
      </SafeAreaView>
    );
  }
  if (!song) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>música não encontrada</Text>
      </SafeAreaView>
    );
  }

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
        <Pressable hitSlop={10} onPress={() => setMenuOpen(true)}>
          <Ionicons name="ellipsis-vertical" size={19} color={colors.ink2} />
        </Pressable>
      </View>

      {/* more menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(
                  primary
                    ? `/song/${song.id}/edit?version=${primary.id}`
                    : `/song/${song.id}/edit?new=1`
                );
              }}
            >
              <Ionicons name="pencil" size={17} color={colors.ink3} />
              <Text style={styles.menuText}>Editar letra</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/song/${song.id}/edit?new=1`);
              }}
            >
              <Ionicons name="add" size={17} color={colors.ink3} />
              <Text style={styles.menuText}>Nova versão</Text>
            </Pressable>
            <Pressable
              disabled={!primary}
              style={[styles.menuItem, !primary && { opacity: 0.4 }]}
              onPress={() => {
                if (!primary) return;
                setMenuOpen(false);
                Alert.alert("Excluir letra", `Excluir a versão "${primary.label}" da letra?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => removeLyric.mutate({ songId: song.id, id: primary.id }),
                  },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={17} color={colors.accentSoft} />
              <Text style={[styles.menuText, { color: colors.accentSoft }]}>Excluir letra</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* title block */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Text style={styles.title}>{song.title}</Text>
          <StatusPill status={song.status} label={statusLabel[song.status]} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {song.key && <MetaChip>Tom · {song.key}</MetaChip>}
          {song.bpm && <MetaChip>{song.bpm} BPM</MetaChip>}
          {primary && (
            <Pressable onPress={() => router.push(`/song/${song.id}/edit?version=${primary.id}`)}>
              <MetaChip>{primary.label} · atual ▾</MetaChip>
            </Pressable>
          )}
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
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
        {activeTab === "Letra" &&
          (primary ? (
            <LyricContent content={primary.content} />
          ) : (
            <EmptyState
              label="sem letra ainda"
              action="escrever letra"
              onPress={() => router.push(`/song/${song.id}/edit?new=1`)}
            />
          ))}
        {activeTab === "Cifra" &&
          (chordChart ? (
            <Text style={styles.preText}>{chordChart.content}</Text>
          ) : (
            <EmptyState label="sem cifra ainda" action="adicionar cifra" />
          ))}
        {activeTab === "Tab" &&
          (tablature ? (
            <Text style={styles.preText}>{tablature.content}</Text>
          ) : (
            <EmptyState label="sem tablatura ainda" action="adicionar tab" />
          ))}
        {activeTab === "Áudios" &&
          (audios.length > 0 ? (
            <View style={{ gap: 8 }}>
              {audios.map((asset) => (
                <View key={asset.id} style={styles.audioRow}>
                  <CoverArt variant="none" style={styles.audioThumb}>
                    <Ionicons name="mic-outline" size={16} color={colors.faint} />
                  </CoverArt>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.ink2 }}>
                      {asset.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        color: colors.meta2,
                        marginTop: 2,
                      }}
                    >
                      {formatDuration(asset.durationSec) ?? "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              label="sem áudios ainda"
              action="gravar ideia"
              onPress={() => router.push("/capture")}
            />
          ))}
        {activeTab === "Imagens" && (
          <EmptyState label="sem imagens ainda" action="adicionar imagem" />
        )}
      </ScrollView>

      {/* player */}
      {audio && <BottomPlayer assetId={audio.id} durationSec={audio.durationSec} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loadingText: { fontFamily: fonts.mono, color: colors.meta, padding: 24 },
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 54,
    paddingRight: 18,
    alignItems: "flex-end",
  },
  menu: {
    minWidth: 200,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    borderRadius: 14,
    paddingVertical: 4,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: { fontFamily: fonts.ui, fontSize: 15, color: colors.ink3 },
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
