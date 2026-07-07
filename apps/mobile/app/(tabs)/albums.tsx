import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CoverArt } from "@/components/ui";
import { collectionStatusLabel, collections } from "@/data/songbook";
import { colors, fonts } from "@/theme";

const filters = ["Todos", "EP / Álbum", "Singles"] as const;
type Filter = (typeof filters)[number];

const coverLabelColor: Record<string, string> = {
  EP: "#caa988",
  demos: colors.meta2,
  single: "#8fae97",
};

export default function AlbumsScreen() {
  const [filter, setFilter] = useState<Filter>("Todos");

  const visible = useMemo(() => {
    if (filter === "EP / Álbum") return collections.filter((c) => c.type === "album");
    if (filter === "Singles") return collections.filter((c) => c.type === "single");
    return collections;
  }, [filter]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>{visible.length} coleç{visible.length === 1 ? "ão" : "ões"}</Text>
          <Text style={styles.title}>Álbuns</Text>
        </View>
        <Pressable style={styles.addButton}>
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
          {visible.map((album) => (
            <Pressable key={album.id} style={styles.cell} onPress={() => router.push(`/album/${album.id}`)}>
              <CoverArt variant={album.cover} style={styles.cover}>
                <Text style={[styles.coverLabel, { color: coverLabelColor[album.typeLabel] ?? colors.meta2 }]}>
                  {album.typeLabel}
                </Text>
              </CoverArt>
              <Text style={styles.albumTitle}>{album.title}</Text>
              <Text style={styles.albumMeta}>
                {album.type === "single"
                  ? `single · ${collectionStatusLabel[album.status]}`
                  : `${album.tracks.length} faixas · ${collectionStatusLabel[album.status]}`}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.cell}>
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
