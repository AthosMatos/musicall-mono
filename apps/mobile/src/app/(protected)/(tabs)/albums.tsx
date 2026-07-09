import { CoverArt } from "@/components/ui/ui";
import { collectionCover, collectionStatusLabel, collectionTypeLabel } from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collectionsCreateOptions,
  collectionsSearchOptions,
  CreateCollectionDto,
} from "@monorepo/core/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const filters = ["Todos", "EP / Álbum", "Singles"] as const;
type Filter = (typeof filters)[number];

const coverLabelColor: Record<string, string> = {
  EP: "#caa988",
  single: "#8fae97",
};

export default function AlbumsScreen() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const queryClient = useQueryClient();

  const type = filter === "EP / Álbum" ? "album" : filter === "Singles" ? "single" : undefined;
  const albumsQuery = useQuery(collectionsSearchOptions({ type, pageSize: 40 }));
  const albums = albumsQuery.data?.items ?? [];

  const createAlbum = useMutation({
    ...collectionsCreateOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections-list"] }),
  });

  function newAlbum() {
    const create = (title: string) =>
      createAlbum.mutate({ body: { type: CreateCollectionDto.type.ALBUM, title } });
    if (Platform.OS === "ios") {
      // Alert.prompt is iOS-only; Android gets a default name to rename later
      Alert.prompt("Novo álbum", "Nome do álbum:", (title) => {
        if (title?.trim()) create(title.trim());
      });
    } else {
      create("Novo álbum");
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>
            {albumsQuery.isLoading
              ? "carregando…"
              : `${albums.length} coleç${albums.length === 1 ? "ão" : "ões"}`}
          </Text>
          <Text style={styles.title}>Álbuns</Text>
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
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }}>
        <View style={styles.grid}>
          {albums.map((album) => {
            const typeLabel = collectionTypeLabel(album);
            return (
              <Pressable key={album.id} style={styles.cell} onPress={() => router.push(`/album/${album.id}`)}>
                <CoverArt variant={collectionCover(album)} style={styles.cover}>
                  <Text style={[styles.coverLabel, { color: coverLabelColor[typeLabel] ?? colors.meta2 }]}>
                    {typeLabel}
                  </Text>
                </CoverArt>
                <Text style={styles.albumTitle}>{album.title}</Text>
                <Text style={styles.albumMeta}>
                  {album.type === "single" ? "single" : "álbum"} · {collectionStatusLabel[album.status]}
                </Text>
              </Pressable>
            );
          })}

          <Pressable style={styles.cell} onPress={newAlbum}>
            <View style={styles.newAlbum}>
              <Ionicons name="add" size={24} color={colors.accent} />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.faint }}>Novo álbum</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  count: { fontFamily: fonts.mono, fontSize: 13, color: colors.meta },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 32, color: colors.ink, letterSpacing: -0.6, marginTop: 4 },
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
