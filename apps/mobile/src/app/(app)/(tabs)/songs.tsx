import { CoverArt, MonoLabel, StatusDot } from "@/components/ui/ui";
import { NOT_TRASHED, Song, useQuery } from "@/db";
import { currentLocaleTag } from "@/i18n";
import { songCover, songMeta } from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function groupByLetter(list: Iterable<Song>, locale: string): [string, Song[]][] {
  const groups = new Map<string, Song[]>();
  const sorted = [...list].sort((a, b) => a.title.localeCompare(b.title, locale));
  for (const song of sorted) {
    const letter = song.title[0]?.toUpperCase() ?? "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(song);
  }
  return [...groups.entries()];
}

export default function SongsScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const q = query.trim();

  const songs = useQuery(
    {
      type: Song,
      query: (collection) =>
        q
          ? collection.filtered(`${NOT_TRASHED} AND title CONTAINS[c] $0`, q)
          : collection.filtered(NOT_TRASHED),
    },
    [q]
  );

  const locale = currentLocaleTag();
  const grouped = useMemo(() => groupByLetter(songs, locale), [songs, locale]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
        <Text style={styles.count}>{t("songs.count", { count: songs.length })}</Text>
        <Text style={styles.title}>{t("songs.title")}</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={15} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("common.search")}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {songs.length === 0 && (
          <Text style={styles.empty}>{q ? t("songs.emptySearch") : t("songs.empty")}</Text>
        )}

        {grouped.map(([letter, list]) => (
          <View key={letter}>
            <MonoLabel style={{ paddingTop: 14, paddingBottom: 4 }}>{letter}</MonoLabel>
            {list.map((song, i) => {
              const cover = songCover(song);
              const untitledDraft = song.status === "draft" && !song.key;
              return (
                <Pressable
                  key={song.id}
                  onPress={() => router.push(`/song/${song.id}`)}
                  style={[styles.row, i === list.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <CoverArt variant={cover} style={styles.thumb}>
                    {cover === "none" && (
                      <Ionicons name="musical-note" size={13} color={colors.faint2} />
                    )}
                  </CoverArt>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Text
                        style={[styles.rowTitle, untitledDraft && { color: colors.ink2 }]}
                        numberOfLines={1}
                      >
                        {song.title}
                      </Text>
                      <StatusDot status={song.status} />
                    </View>
                    <Text style={[styles.rowMeta, untitledDraft && { color: colors.faint }]}>
                      {songMeta(song, t)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.faint2} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push("/capture")}>
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  count: { fontFamily: fonts.mono, fontSize: 13, color: colors.meta },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 4,
    marginBottom: 14,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  empty: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.faint,
    textAlign: "center",
    paddingVertical: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumb: { width: 46, height: 46, borderRadius: 9, overflow: "hidden" },
  rowTitle: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  rowMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 2 },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
