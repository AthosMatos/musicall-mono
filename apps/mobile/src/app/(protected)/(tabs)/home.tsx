import { userAtom } from "@/atoms/auth/user";
import { CoverArt, StatusDot } from "@/components/ui/ui";
import { collectionCover, collectionTypeLabel, songCover, songMeta, todayLabel } from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { collectionsSearchOptions, songsSearchOptions } from "@monorepo/core/api";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAtomValue } from "jotai";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Text style={styles.seeAll}>ver tudo</Text>
        <Ionicons name="chevron-forward" size={11} color={colors.meta2} />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const user = useAtomValue(userAtom);
  const recentsQuery = useQuery(songsSearchOptions({ sort: "updatedAt", order: "desc", pageSize: 4 }));
  const albumsQuery = useQuery(collectionsSearchOptions({ pageSize: 8 }));

  const recents = recentsQuery.data?.items ?? [];
  const albums = albumsQuery.data?.items ?? [];
  const continueSong = recents.find((s) => s.status === "in_progress") ?? recents[0];

  const { bottom } = useSafeAreaInsets()

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: bottom + 12 + 80 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{todayLabel()}</Text>
          <Text style={styles.greeting}>Olá, {user?.name ?? "…"}</Text>
        </View>
        <View style={styles.avatar} />
      </View>

      {/* continue where you left off */}
      {continueSong && (
        <View style={{
          paddingHorizontal: 24, paddingTop: 14,
          borderRadius: 8,
          padding: 16,

        }}>
          <Pressable onPress={() => router.push(`/song/${continueSong.id}`)}>
            <LinearGradient
              colors={["#2a2014", "#221b12"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueCard}
            >
              <View style={styles.continuePlay}>
                <Ionicons name="play" size={18} color={colors.onAccent} style={{ marginLeft: 2 }} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.continueLabel}>continuar onde parou</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>
                  {continueSong.title}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* recentes */}
      <SectionHeader title="Recentes" onSeeAll={() => router.push("/songs")} />
      {recents.length === 0 && !recentsQuery.isLoading ? (
        <Pressable onPress={() => router.push("/capture")} style={styles.emptyCard}>
          <Text style={{ color: colors.accent, fontSize: 20 }}>+</Text>
          <Text style={styles.emptyText}>sua primeira música começa aqui</Text>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
        >
          {recents.map((song) => {
            const cover = songCover(song);
            const untitledDraft = song.status === "draft" && !song.key;
            return (
              <Pressable key={song.id} style={{ width: 130 }} onPress={() => router.push(`/song/${song.id}`)}>
                <CoverArt variant={cover} style={styles.recentCover}>
                  {cover === "none" ? (
                    <Text style={styles.coverNoneText}>rascunho</Text>
                  ) : (
                    <View style={styles.recentDot}>
                      <StatusDot status={song.status} size={8} />
                    </View>
                  )}
                </CoverArt>
                <Text style={[styles.recentTitle, untitledDraft && { color: colors.ink2 }]} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={[styles.recentMeta, untitledDraft && { color: colors.faint }]}>
                  {songMeta(song)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* álbuns */}
      <SectionHeader title="Álbuns" onSeeAll={() => router.push("/albums")} />
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {albums.length === 0 && !albumsQuery.isLoading && (
          <Text style={styles.emptyText}>nenhuma coleção ainda</Text>
        )}
        {albums.map((album) => (
          <Pressable key={album.id} style={styles.albumRow} onPress={() => router.push(`/album/${album.id}`)}>
            <CoverArt variant={collectionCover(album)} style={styles.albumCover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.albumTitle}>
                {album.type === "album" ? `${album.title} · ${collectionTypeLabel(album)}` : album.title}
              </Text>
              <Text style={styles.albumMeta}>{album.type === "single" ? "single" : "álbum"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.faint2} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  date: { fontFamily: fonts.mono, fontSize: 13, color: colors.meta },
  greeting: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#251f17",
    borderWidth: 1,
    borderColor: colors.borderChip,
  },
  continueCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderActive,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  continuePlay: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  continueLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  continueTitle: { fontFamily: fonts.uiSemiBold, fontSize: 17, color: colors.ink, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.uiSemiBold, fontSize: 19, color: colors.ink },
  seeAll: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 },
  emptyCard: {
    marginHorizontal: 24,
    height: 120,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: { fontFamily: fonts.mono, fontSize: 12, color: colors.faint },
  recentCover: {
    height: 130,
    borderRadius: 13,
    overflow: "hidden",
  },
  recentDot: { position: "absolute", top: 9, right: 9 },
  coverNoneText: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint2 },
  recentTitle: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.ink, marginTop: 8 },
  recentMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 },
  albumRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  albumCover: { width: 58, height: 58, borderRadius: 11 },
  albumTitle: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.ink },
  albumMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 2 },
});
