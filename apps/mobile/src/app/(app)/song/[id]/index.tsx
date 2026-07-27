import AppDropDown from "@/components/ui/dropDown";
import { MonoEditorModal } from "@/components/ui/mono-editor-modal";
import { CoverArt, formatTime, MetaChip, PlayButton, StatusPill, Waveform } from "@/components/ui/ui";
import {
  ChordChart,
  deleteLyricVersion,
  deleteMediaAsset,
  LyricVersion,
  MediaAsset,
  saveChordChart,
  saveTablature,
  Song,
  Tablature,
  trashSong,
  useObject,
  useQuery,
  useRealm,
} from "@/db";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { formatDuration, songStatusLabel, waveformSamples } from "@/lib/model";
import { useAudioImport } from "@/media/audio";
import { deleteFile } from "@/media/files";
import { useImageImport } from "@/media/images";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { parseLyricSections } from "@monorepo/core";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const tabKeys = ["lyrics", "chords", "tab", "audio", "images"] as const;
type Tab = (typeof tabKeys)[number];

const tabLabelKey: Record<Tab, string> = {
  lyrics: "song.tabLyrics",
  chords: "song.tabChords",
  tab: "song.tabTab",
  audio: "song.tabAudio",
  images: "song.tabImages",
};

function sectionColor(label: string): string {
  // Both languages mark the chorus the same way in the design.
  const lower = label.toLowerCase();
  return lower.startsWith("refrão") || lower.startsWith("chorus") ? colors.amber : colors.accent;
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

function BottomPlayer({ asset }: { asset: MediaAsset }) {
  const { t } = useTranslation();
  const playback = useAudioPlayback(asset.uri, asset.durationSec);
  return (
    <View style={styles.player}>
      <PlayButton isPlaying={playback.isPlaying} onPress={() => void playback.toggle()} />
      <View style={{ flex: 1 }}>
        <Waveform
          samples={waveformSamples(asset.id, 12)}
          progress={playback.progress}
          height={26}
          onSeek={(ratio) => void playback.seek(ratio)}
        />
      </View>
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 }}>
        {playback.error
          ? t("song.playbackError")
          : playback.elapsed > 0
            ? formatTime(playback.elapsed)
            : (formatDuration(playback.duration) ?? "—")}
      </Text>
    </View>
  );
}

export default function SongDetailScreen() {
  const { t } = useTranslation();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const realm = useRealm();
  const [activeTab, setActiveTab] = useState<Tab>("lyrics");
  const [chordEditorOpen, setChordEditorOpen] = useState(false);
  const [tabEditorOpen, setTabEditorOpen] = useState(false);

  const song = useObject(Song, id);
  const versions = useQuery(
    { type: LyricVersion, query: (c) => c.filtered("songId == $0 SORT(createdAt ASC)", id) },
    [id]
  );
  const chordCharts = useQuery(
    { type: ChordChart, query: (c) => c.filtered("songId == $0", id) },
    [id]
  );
  const tablatures = useQuery({ type: Tablature, query: (c) => c.filtered("songId == $0", id) }, [id]);
  const media = useQuery(
    { type: MediaAsset, query: (c) => c.filtered("songId == $0 SORT(createdAt ASC)", id) },
    [id]
  );

  const audioImport = useAudioImport(id);
  const imageImport = useImageImport({ songId: id });

  const primary = versions.find((v) => v.isPrimary) ?? versions[0];
  const chordChart = chordCharts[0];
  const tablature = tablatures[0];
  const audios = media.filter((m) => m.type === "audio");
  const images = media.filter((m) => m.type === "image");
  const audio = audios[0];

  if (!song || song.deletedAt != null) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>{t("song.notFound")}</Text>
      </SafeAreaView>
    );
  }

  function confirmDeleteLyrics() {
    if (!primary) return;
    const versionId = primary.id;
    Alert.alert(t("song.deleteLyricsTitle"), t("song.deleteLyricsMessage", { label: primary.label }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteLyricVersion(realm, versionId),
      },
    ]);
  }

  function confirmDeleteSong() {
    if (!song) return;
    const songId = song.id;
    Alert.alert(t("song.deleteSongTitle"), t("song.deleteSongMessage", { title: song.title }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          trashSong(realm, songId);
          router.back();
        },
      },
    ]);
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
          <Text style={styles.savedText}>{t("common.saved")}</Text>
        </View>
        <AppDropDown
          anchorSide="right"
          data={[
            {
              label: t("song.menuEditLyrics"),
              icon: <Ionicons name="pencil" size={16} color={colors.ink3} />,
              onPress: () =>
                router.push(
                  primary
                    ? `/song/${song.id}/edit?version=${primary.id}`
                    : `/song/${song.id}/edit?new=1`
                ),
            },
            {
              label: t("song.menuNewVersion"),
              icon: <Ionicons name="add" size={16} color={colors.ink3} />,
              onPress: () => router.push(`/song/${song.id}/edit?new=1`),
            },
            ...(primary
              ? [
                  {
                    label: t("song.menuDeleteLyrics"),
                    icon: <Ionicons name="trash-outline" size={16} color={colors.accentSoft} />,
                    textColor: colors.accentSoft,
                    onPress: confirmDeleteLyrics,
                  },
                ]
              : []),
            {
              label: t("song.menuDeleteSong"),
              icon: <Ionicons name="trash-outline" size={16} color={colors.highlight} />,
              textColor: colors.highlight,
              onPress: confirmDeleteSong,
            },
          ]}
        >
          <View hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={19} color={colors.ink2} />
          </View>
        </AppDropDown>
      </View>

      {/* title block */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Text style={styles.title}>{song.title}</Text>
          <StatusPill status={song.status} label={songStatusLabel(song.status, t)} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {song.key && <MetaChip>{t("song.keyChip", { key: song.key })}</MetaChip>}
          {song.bpm != null && <MetaChip>{t("song.bpmChip", { bpm: song.bpm })}</MetaChip>}
          {primary && (
            <Pressable onPress={() => router.push(`/song/${song.id}/edit?version=${primary.id}`)}>
              <MetaChip>{t("song.currentVersion", { label: primary.label })} ▾</MetaChip>
            </Pressable>
          )}
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {tabKeys.map((tab) => {
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
                {t(tabLabelKey[tab])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 12 }}>
        {activeTab === "lyrics" &&
          (primary ? (
            <LyricContent content={primary.content} />
          ) : (
            <EmptyState
              label={t("song.emptyLyrics")}
              action={t("song.emptyLyricsAction")}
              onPress={() => router.push(`/song/${song.id}/edit?new=1`)}
            />
          ))}

        {activeTab === "chords" &&
          (chordChart ? (
            <Pressable onPress={() => setChordEditorOpen(true)}>
              <Text style={styles.preText}>{chordChart.content}</Text>
            </Pressable>
          ) : (
            <EmptyState
              label={t("song.emptyChords")}
              action={t("song.emptyChordsAction")}
              onPress={() => setChordEditorOpen(true)}
            />
          ))}

        {activeTab === "tab" &&
          (tablature ? (
            <Pressable onPress={() => setTabEditorOpen(true)}>
              <Text style={styles.preText}>{tablature.content}</Text>
            </Pressable>
          ) : (
            <EmptyState
              label={t("song.emptyTab")}
              action={t("song.emptyTabAction")}
              onPress={() => setTabEditorOpen(true)}
            />
          ))}

        {activeTab === "audio" && (
          <View style={{ gap: 14 }}>
            {audios.length > 0 ? (
              <View style={{ gap: 8 }}>
                {audios.map((asset) => (
                  <View key={asset.id} style={styles.audioRow}>
                    <CoverArt variant="none" style={styles.audioThumb}>
                      <Ionicons name="mic-outline" size={16} color={colors.faint} />
                    </CoverArt>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.ink2 }}
                        numberOfLines={1}
                      >
                        {asset.label}
                      </Text>
                      <Text style={styles.assetMeta}>{formatDuration(asset.durationSec) ?? "—"}</Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => deleteFile(deleteMediaAsset(realm, asset.id))}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.faint2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.faint }}>
                {t("song.emptyAudio")}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Pressable style={styles.audioAction} onPress={() => router.push("/capture")}>
                <Ionicons name="mic-outline" size={15} color={colors.ink3} />
                <Text style={styles.audioActionText}>{t("song.recordIdea")}</Text>
              </Pressable>
              <Pressable
                style={[styles.audioAction, audioImport.isImporting && { opacity: 0.6 }]}
                onPress={() => void audioImport.pickAndImport()}
                disabled={audioImport.isImporting}
              >
                <Ionicons name="download-outline" size={15} color={colors.ink3} />
                <Text style={styles.audioActionText}>
                  {audioImport.isImporting ? t("song.importing") : t("song.importAudio")}
                </Text>
              </Pressable>
            </View>
            {audioImport.error && <Text style={styles.errorText}>{audioImport.error}</Text>}
          </View>
        )}

        {activeTab === "images" && (
          <View style={{ gap: 14 }}>
            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((asset) => (
                  <Pressable
                    key={asset.id}
                    onLongPress={() => deleteFile(deleteMediaAsset(realm, asset.id))}
                    style={styles.imageCell}
                  >
                    <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />
                  </Pressable>
                ))}
              </View>
            )}
            {images.length === 0 ? (
              <EmptyState
                label={t("song.emptyImages")}
                action={t("song.addImage")}
                onPress={() => void imageImport.pickAndImport()}
              />
            ) : (
              <Pressable
                style={[styles.audioAction, imageImport.isImporting && { opacity: 0.6 }]}
                onPress={() => void imageImport.pickAndImport()}
                disabled={imageImport.isImporting}
              >
                <Ionicons name="image-outline" size={15} color={colors.ink3} />
                <Text style={styles.audioActionText}>
                  {imageImport.isImporting ? t("song.importing") : t("song.addImage")}
                </Text>
              </Pressable>
            )}
            {imageImport.error && <Text style={styles.errorText}>{imageImport.error}</Text>}
          </View>
        )}
      </ScrollView>

      {/* player */}
      {audio && <BottomPlayer asset={audio} />}

      <MonoEditorModal
        visible={chordEditorOpen}
        title={t("chords.editTitle")}
        placeholder={t("chords.placeholder")}
        initialValue={chordChart?.content ?? ""}
        onClose={() => setChordEditorOpen(false)}
        onSave={(content) => {
          saveChordChart(realm, song.id, {
            id: chordChart?.id,
            label: t("chords.editTitle"),
            content,
          });
          setChordEditorOpen(false);
        }}
      />

      <MonoEditorModal
        visible={tabEditorOpen}
        title={t("tab.editTitle")}
        placeholder={t("tab.placeholder")}
        initialValue={tablature?.content ?? ""}
        onClose={() => setTabEditorOpen(false)}
        onSave={(content) => {
          saveTablature(realm, song.id, {
            id: tablature?.id,
            label: t("tab.editTitle"),
            content,
          });
          setTabEditorOpen(false);
        }}
      />
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
  assetMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 },
  audioAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  audioActionText: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink3 },
  errorText: { fontFamily: fonts.mono, fontSize: 12, color: colors.accentSoft },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageCell: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  image: { width: "100%", height: "100%" },
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
