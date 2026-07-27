import { CoverArt, StatusDot } from "@/components/ui/ui";
import {
  activeCollections,
  activeSongs,
  Collection,
  Song,
  useCollectionCovers,
  useProfile,
  useQuery,
} from "@/db";
import { currentLocaleTag } from "@/i18n";
import {
  collectionCover,
  collectionTypeLabel,
  collectionTypeName,
  songCover,
  songMeta,
  todayLabel,
} from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable
        onPress={onSeeAll}
        hitSlop={8}
        style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
      >
        <Text style={styles.seeAll}>{t("common.seeAll")}</Text>
        <Ionicons name="chevron-forward" size={11} color={colors.meta2} />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const profile = useProfile();

  const songs = useQuery({ type: Song, query: activeSongs });
  const collections = useQuery({ type: Collection, query: activeCollections });
  const coverFor = useCollectionCovers();

  const recents = songs.slice(0, 4);
  const albums = collections.slice(0, 8);
  const continueSong = recents.find((s) => s.status === "in_progress") ?? recents[0];

  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: bottom + 12 + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{todayLabel(currentLocaleTag())}</Text>
          <Text style={styles.greeting}>{t("home.greeting", { name: profile?.name ?? "" })}</Text>
        </View>
        <Pressable onPress={() => router.push("/profile")} hitSlop={8} style={styles.avatar}>
          {profile?.avatarUri && (
            <Image
              source={{ uri: profile.avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          )}
        </Pressable>
      </View>

      {/* continue where you left off */}
      {continueSong && (
        <View style={{ paddingHorizontal: 24, paddingTop: 14, borderRadius: 8, padding: 16 }}>
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
                <Text style={styles.continueLabel}>{t("home.continueLabel")}</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>
                  {continueSong.title}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* recents */}
      <SectionHeader title={t("home.recents")} onSeeAll={() => router.push("/songs")} />
      {recents.length === 0 ? (
        <Pressable onPress={() => router.push("/capture")} style={styles.emptyCard}>
          <Text style={{ color: colors.accent, fontSize: 20 }}>+</Text>
          <Text style={styles.emptyText}>{t("home.emptyFirstSong")}</Text>
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
              <Pressable
                key={song.id}
                style={{ width: 130 }}
                onPress={() => router.push(`/song/${song.id}`)}
              >
                <CoverArt variant={cover} style={styles.recentCover}>
                  {cover === "none" ? (
                    <Text style={styles.coverNoneText}>{t("status.song.draft")}</Text>
                  ) : (
                    <View style={styles.recentDot}>
                      <StatusDot status={song.status} size={8} />
                    </View>
                  )}
                </CoverArt>
                <Text
                  style={[styles.recentTitle, untitledDraft && { color: colors.ink2 }]}
                  numberOfLines={1}
                >
                  {song.title}
                </Text>
                <Text style={[styles.recentMeta, untitledDraft && { color: colors.faint }]}>
                  {songMeta(song, t)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* collections */}
      <SectionHeader title={t("home.collections")} onSeeAll={() => router.push("/albums")} />
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {albums.length === 0 && <Text style={styles.emptyText}>{t("home.emptyCollections")}</Text>}
        {albums.map((album) => (
          <Pressable
            key={album.id}
            style={styles.albumRow}
            onPress={() => router.push(`/album/${album.id}`)}
          >
            <CoverArt
              variant={collectionCover(album)}
              uri={coverFor(album)}
              style={styles.albumCover}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.albumTitle}>
                {album.type === "album"
                  ? `${album.title} · ${collectionTypeLabel(album, t)}`
                  : album.title}
              </Text>
              <Text style={styles.albumMeta}>{collectionTypeName(album, t)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.faint2} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    overflow: "hidden",
    backgroundColor: "#251f17",
    borderWidth: 1,
    borderColor: colors.borderChip,
  },
  avatarImage: { width: "100%", height: "100%" },
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
  recentCover: { height: 130, borderRadius: 13, overflow: "hidden" },
  recentDot: { position: "absolute", top: 9, right: 9 },
  coverNoneText: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint2 },
  recentTitle: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.ink, marginTop: 8 },
  recentMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 },
  albumRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  albumCover: { width: 58, height: 58, borderRadius: 11 },
  albumTitle: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.ink },
  albumMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 2 },
});
