import { CoverArt, MonoLabel, StatusDot } from "@/components/ui/ui";
import { songCover, songMeta, type SongLike } from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { songsSearchOptions } from "@monorepo/core/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SongRowData extends SongLike {
  title: string;
}

function groupByLetter<T extends SongRowData>(list: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const song of [...list].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))) {
    const letter = song.title[0]?.toUpperCase() ?? "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(song);
  }
  return [...groups.entries()];
}

export default function SongsScreen() {
  const [query, setQuery] = useState("");
  const q = query.trim();

  const songsQuery = useQuery(songsSearchOptions({ q: q || undefined, pageSize: 60 }));
  const songs = songsQuery.data?.items ?? [];
  const total = songsQuery.data?.total ?? 0;

  const grouped = useMemo(() => groupByLetter(songs), [songs]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
        <Text style={styles.count}>
          {songsQuery.isLoading ? "carregando…" : `${total} música${total === 1 ? "" : "s"}`}
        </Text>
        <Text style={styles.title}>Músicas</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={15} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar…"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 100 }}>
        {songsQuery.isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>não foi possível carregar as músicas</Text>
            <Pressable onPress={() => void songsQuery.refetch()} hitSlop={8}>
              <Text style={[styles.errorText, { textDecorationLine: "underline" }]}>tentar de novo</Text>
            </Pressable>
          </View>
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
                      {songMeta(song)}
                    </Text>
                  </View>
                  <Ionicons name="play" size={16} color={colors.faint2} />
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
  screen: { flex: 1, },
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
  errorBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(194,94,68,.35)",
    backgroundColor: "rgba(194,94,68,.1)",
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 6,
  },
  errorText: { fontFamily: fonts.mono, fontSize: 12, color: colors.accentSoft },
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
