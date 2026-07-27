/**
 * Soft-deleted songs and collections: restore them, or clear them out for good.
 * Purging is the only place media files are removed from disk in bulk.
 */
import { MonoLabel } from "@/components/ui/ui";
import {
  Collection,
  purgeCollection,
  purgeSong,
  restoreCollection,
  restoreSong,
  Song,
  TRASHED,
  useQuery,
  useRealm,
} from "@/db";
import { currentLocaleTag } from "@/i18n";
import { collectionTypeName, shortDate, songStatusLabel } from "@/lib/model";
import { deleteFiles } from "@/media/files";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function TrashRow({
  title,
  meta,
  onRestore,
  onPurge,
}: {
  title: string;
  meta: string;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Pressable onPress={onRestore} hitSlop={8} accessibilityLabel={t("trash.restore")}>
        <Ionicons name="arrow-undo-outline" size={18} color={colors.ink3} />
      </Pressable>
      <Pressable onPress={onPurge} hitSlop={8} accessibilityLabel={t("trash.purge")}>
        <Ionicons name="trash-outline" size={18} color={colors.highlight} />
      </Pressable>
    </View>
  );
}

export default function TrashScreen() {
  const { t } = useTranslation();
  const realm = useRealm();
  const locale = currentLocaleTag();

  const songs = useQuery({ type: Song, query: (c) => c.filtered(TRASHED) });
  const collections = useQuery({ type: Collection, query: (c) => c.filtered(TRASHED) });

  function confirmPurge(title: string, purge: () => void) {
    Alert.alert(t("trash.purgeTitle"), t("trash.purgeMessage", { title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("trash.purge"), style: "destructive", onPress: purge },
    ]);
  }

  const isEmpty = songs.length === 0 && collections.length === 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.titleRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.ink2} />
        </Pressable>
        <Text style={styles.title}>{t("trash.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {isEmpty && <Text style={styles.empty}>{t("trash.empty")}</Text>}

        {songs.length > 0 && (
          <>
            <MonoLabel style={styles.sectionLabel}>{t("trash.songs")}</MonoLabel>
            <View style={{ gap: 8 }}>
              {songs.map((song) => (
                <TrashRow
                  key={song.id}
                  title={song.title}
                  meta={`${songStatusLabel(song.status, t)} · ${
                    song.deletedAt ? shortDate(song.deletedAt, locale) : ""
                  }`}
                  onRestore={() => restoreSong(realm, song.id)}
                  onPurge={() =>
                    confirmPurge(song.title, () => deleteFiles(purgeSong(realm, song.id)))
                  }
                />
              ))}
            </View>
          </>
        )}

        {collections.length > 0 && (
          <>
            <MonoLabel style={styles.sectionLabel}>{t("trash.collections")}</MonoLabel>
            <View style={{ gap: 8 }}>
              {collections.map((collection) => (
                <TrashRow
                  key={collection.id}
                  title={collection.title}
                  meta={`${collectionTypeName(collection, t)} · ${
                    collection.deletedAt ? shortDate(collection.deletedAt, locale) : ""
                  }`}
                  onRestore={() => restoreCollection(realm, collection.id)}
                  onPurge={() =>
                    confirmPurge(collection.title, () =>
                      deleteFiles(purgeCollection(realm, collection.id))
                    )
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 32, color: colors.ink, letterSpacing: -0.6 },
  sectionLabel: { paddingTop: 22, paddingBottom: 10 },
  empty: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.faint,
    textAlign: "center",
    paddingVertical: 60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
  },
  rowTitle: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.ink },
  rowMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 2 },
});
