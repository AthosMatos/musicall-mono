import { CoverArt } from "@/components/ui/ui";
import {
  Collection,
  createCollection,
  NOT_TRASHED,
  useCollectionCovers,
  useQuery,
  useRealm,
} from "@/db";
import { collectionCover, collectionStatusLabel, collectionTypeLabel, collectionTypeName } from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const filters = ["all", "albums", "singles"] as const;
type Filter = (typeof filters)[number];

const filterLabelKey: Record<Filter, string> = {
  all: "albums.filterAll",
  albums: "albums.filterAlbums",
  singles: "albums.filterSingles",
};

const coverLabelColor: Record<string, string> = {
  album: "#caa988",
  single: "#8fae97",
};

export default function AlbumsScreen() {
  const { t } = useTranslation();
  const realm = useRealm();
  const coverFor = useCollectionCovers();
  const [filter, setFilter] = useState<Filter>("all");

  const type = filter === "albums" ? "album" : filter === "singles" ? "single" : null;
  const albums = useQuery(
    {
      type: Collection,
      query: (collection) =>
        type
          ? collection.filtered(`${NOT_TRASHED} AND type == $0 SORT(updatedAt DESC)`, type)
          : collection.filtered(`${NOT_TRASHED} SORT(updatedAt DESC)`),
    },
    [type]
  );

  function newAlbum() {
    const create = (title: string) => {
      const created = createCollection(realm, { type: "album", title });
      router.push(`/album/${created.id}`);
    };
    if (Platform.OS === "ios") {
      // Alert.prompt is iOS-only; Android gets a default name to rename later.
      Alert.prompt(t("albums.new"), t("albums.newPrompt"), (title) => {
        if (title?.trim()) create(title.trim());
      });
    } else {
      create(t("albums.newDefaultTitle"));
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>{t("albums.count", { count: albums.length })}</Text>
          <Text style={styles.title}>{t("albums.title")}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={newAlbum}>
          <Ionicons name="add" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {filters.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={{
                  fontFamily: active ? fonts.uiSemiBold : fonts.ui,
                  fontSize: 13,
                  color: active ? colors.onAccent : colors.ink3,
                }}
              >
                {t(filterLabelKey[f])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 110 }}
      >
        <View style={styles.grid}>
          {albums.map((album) => (
            <Pressable
              key={album.id}
              style={styles.cell}
              onPress={() => router.push(`/album/${album.id}`)}
            >
              <CoverArt variant={collectionCover(album)} uri={coverFor(album)} style={styles.cover}>
                <Text style={[styles.coverLabel, { color: coverLabelColor[album.type] }]}>
                  {collectionTypeLabel(album, t)}
                </Text>
              </CoverArt>
              <Text style={styles.albumTitle} numberOfLines={1}>
                {album.title}
              </Text>
              <Text style={styles.albumMeta}>
                {collectionTypeName(album, t)} · {collectionStatusLabel(album.status, t)}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.cell} onPress={newAlbum}>
            <View style={styles.newAlbum}>
              <Ionicons name="add" size={24} color={colors.accent} />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.faint }}>
                {t("albums.new")}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  count: { fontFamily: fonts.mono, fontSize: 13, color: colors.meta },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surfaceActive,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 24, marginTop: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderChip,
  },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  cell: { width: "47%", flexGrow: 1 },
  cover: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
  },
  coverLabel: { fontFamily: fonts.mono, fontSize: 11 },
  albumTitle: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.ink, marginTop: 9 },
  albumMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 },
  newAlbum: {
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
    backgroundColor: "#1a1610",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
