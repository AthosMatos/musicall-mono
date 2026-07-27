import AppDropDown from "@/components/ui/dropDown";
import AppModal from "@/components/ui/modal";
import { AppText } from "@/components/ui/text";
import { CoverArt, MonoLabel, StatusDot } from "@/components/ui/ui";
import {
  addSongToCollection,
  Collection,
  deleteMediaAsset,
  NOT_TRASHED,
  removeSongFromCollection,
  reorderCollectionSongs,
  Song,
  trashCollection,
  updateCollection,
  useCollectionCovers,
  useCollectionImages,
  useObject,
  useQuery,
  useRealm,
} from "@/db";
import {
  collectionCover,
  collectionStatusLabel,
  collectionTypeLabel,
  songMeta,
  songStatusLabel,
} from "@/lib/model";
import { deleteFile } from "@/media/files";
import { useImageImport } from "@/media/images";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROW_GAP = 8;

function TrackRow({
  song,
  index,
  dragging,
  dragOffset,
  onStartDrag,
  onRemove,
}: {
  song: Song;
  index: number;
  dragging: boolean;
  dragOffset: number;
  onStartDrag: (index: number, dy: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  // the row's index changes while dragging reorders the list — handlers read
  // the latest value through refs instead of the creation-time closure
  const indexRef = useRef(index);
  indexRef.current = index;
  const startDragRef = useRef(onStartDrag);
  startDragRef.current = onStartDrag;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => startDragRef.current(indexRef.current, 0),
      onPanResponderMove: (_evt, gesture) => startDragRef.current(indexRef.current, gesture.dy),
      onPanResponderRelease: () => startDragRef.current(-1, 0),
      onPanResponderTerminate: () => startDragRef.current(-1, 0),
    })
  );

  const untitled = song.status === "draft" && !song.key;

  return (
    <Pressable
      onPress={() => router.push(`/song/${song.id}`)}
      onLongPress={onRemove}
      accessibilityHint={t("album.removeTrack")}
      style={[
        styles.trackRow,
        dragging && {
          backgroundColor: colors.surfaceDrag,
          borderColor: colors.borderDrag,
          transform: [{ translateY: dragOffset }, { scale: 1.01 }],
          zIndex: 10,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
      ]}
    >
      <View {...responder.current.panHandlers} hitSlop={8} style={{ paddingRight: 2 }}>
        <Ionicons name="reorder-two" size={18} color={dragging ? colors.accent : colors.faint2} />
      </View>
      <Text style={styles.trackIndex}>{index + 1}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.trackTitle, untitled && { color: colors.ink2 }]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={[styles.trackMeta, untitled && { color: colors.faint }]}>
          {song.key ? `${song.key} · ${songStatusLabel(song.status, t)}` : songMeta(song, t)}
        </Text>
      </View>
      <StatusDot status={song.status} />
    </Pressable>
  );
}

export default function AlbumDetailScreen() {
  const { t } = useTranslation();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const realm = useRealm();

  const album = useObject(Collection, id);
  const allSongs = useQuery({ type: Song, query: (c) => c.filtered(NOT_TRASHED) });
  const images = useCollectionImages(id);
  const coverFor = useCollectionCovers();
  const imageImport = useImageImport({ collectionId: id });

  // The stored order is a list of ids; resolve it against the live song table.
  const orderKey = album ? [...album.songIds].join("|") : "";
  const storedTracks = useMemo(() => {
    const byId = new Map(allSongs.map((song) => [song.id, song]));
    return orderKey
      .split("|")
      .filter(Boolean)
      .map((songId) => byId.get(songId))
      .filter((song): song is Song => !!song);
    // `orderKey` captures every change to the id list; `allSongs` is live.
  }, [orderKey, allSongs]);

  const [tracks, setTracks] = useState<Song[]>(storedTracks);
  const [dragIndex, setDragIndex] = useState(-1);
  const [dragOffset, setDragOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const drag = useRef({ start: -1, current: -1, rowHeight: 64 + ROW_GAP });

  // Adopt the stored order except while a drag is in flight. Comparing ids
  // rather than array identity keeps this from looping on every re-render.
  useEffect(() => {
    if (dragIndex !== -1) return;
    setTracks((current) =>
      current.length === storedTracks.length &&
      current.every((track, i) => track.id === storedTracks[i].id)
        ? current
        : storedTracks
    );
  }, [storedTracks, dragIndex]);

  if (!album || album.deletedAt != null) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>{t("album.notFound")}</Text>
      </SafeAreaView>
    );
  }

  function confirmDelete() {
    Alert.alert(t("album.deleteTitle"), t("album.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          trashCollection(realm, id);
          router.back();
        },
      },
    ]);
  }

  /** Long-pressing a picture offers to promote it to cover, or delete it. */
  function photoActions(assetId: string, isCover: boolean) {
    Alert.alert(t("album.photos"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      ...(isCover
        ? []
        : [
            {
              text: t("album.setCover"),
              onPress: () => updateCollection(realm, id, { coverMediaId: assetId }),
            },
          ]),
      {
        text: t("album.removePhoto"),
        style: "destructive" as const,
        onPress: () => deleteFile(deleteMediaAsset(realm, assetId)),
      },
    ]);
  }

  function confirmRemoveTrack(song: Song) {
    Alert.alert(song.title, t("album.removeTrack"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => removeSongFromCollection(realm, id, song.id),
      },
    ]);
  }

  function handleDrag(index: number, dy: number) {
    const d = drag.current;
    if (index === -1) {
      // drop: commit the new order
      if (d.start !== -1 && d.current !== d.start) {
        reorderCollectionSongs(
          realm,
          id,
          tracks.map((track) => track.id)
        );
      }
      d.start = d.current = -1;
      setDragIndex(-1);
      setDragOffset(0);
      return;
    }
    if (d.start === -1) {
      d.start = d.current = index;
      setDragIndex(index);
    }
    const target = Math.min(tracks.length - 1, Math.max(0, d.start + Math.round(dy / d.rowHeight)));
    if (target !== d.current) {
      setTracks((current) => {
        const next = [...current];
        const [moved] = next.splice(d.current, 1);
        next.splice(target, 0, moved);
        return next;
      });
      d.current = target;
      setDragIndex(target);
    }
    setDragOffset(dy - (d.current - d.start) * d.rowHeight);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* nav */}
      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.ink2} />
        </Pressable>
        <AppDropDown
          anchorSide="right"
          data={[
            {
              label: t("common.edit"),
              icon: <Ionicons name="pencil" size={16} color={colors.ink2} />,
              onPress: () => setEditOpen(true),
            },
            {
              label: t("common.delete"),
              icon: <Ionicons name="trash-outline" size={16} color={colors.highlight} />,
              textColor: colors.highlight,
              onPress: confirmDelete,
            },
          ]}
        >
          <View hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={19} color={colors.ink2} />
          </View>
        </AppDropDown>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 14 }} scrollEnabled={dragIndex === -1}>
        {/* cover header */}
        <View style={styles.coverHeader}>
          <CoverArt variant={collectionCover(album)} uri={coverFor(album)} style={styles.cover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.typeLabel}>
              {collectionTypeLabel(album, t)} · {collectionStatusLabel(album.status, t)}
            </Text>
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.meta}>{t("album.trackCount", { count: tracks.length })}</Text>
          </View>
        </View>

        {album.description && <Text style={styles.description}>{album.description}</Text>}

        {/* pictures — the first one is the cover shown everywhere else */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 18 }}>
          <MonoLabel style={{ paddingBottom: 10 }}>{t("album.photos")}</MonoLabel>
          <View style={styles.photoGrid}>
            {images.map((asset) => {
              const isCover = coverFor(album) === asset.uri;
              return (
                <Pressable
                  key={asset.id}
                  onLongPress={() => photoActions(asset.id, isCover)}
                  style={styles.photoCell}
                >
                  <Image source={{ uri: asset.uri }} style={styles.photo} contentFit="cover" />
                  {isCover && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>{t("album.coverBadge")}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => void imageImport.pickAndImport()}
              disabled={imageImport.isImporting}
              style={[styles.photoCell, styles.addPhoto, imageImport.isImporting && { opacity: 0.6 }]}
            >
              <Ionicons name="add" size={22} color={colors.accent} />
              <Text style={styles.addPhotoText}>
                {imageImport.isImporting ? t("song.importing") : t("album.addPhoto")}
              </Text>
            </Pressable>
          </View>
          {imageImport.error && <Text style={styles.photoError}>{imageImport.error}</Text>}
        </View>

        {/* track list */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <MonoLabel style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
            {t("album.tracksLabel")}
          </MonoLabel>
          {tracks.length === 0 ? (
            <View style={styles.emptyTracks}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.faint }}>
                {t("album.emptyTracks")}
              </Text>
            </View>
          ) : (
            <View style={{ gap: ROW_GAP }}>
              {tracks.map((song, index) => (
                <TrackRow
                  key={song.id}
                  song={song}
                  index={index}
                  dragging={index === dragIndex}
                  dragOffset={dragOffset}
                  onStartDrag={handleDrag}
                  onRemove={() => confirmRemoveTrack(song)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 14 }}>
        <Pressable style={styles.addTrack} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={18} color={colors.onAccent} />
          <Text style={{ fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent }}>
            {t("album.addTrack")}
          </Text>
        </Pressable>
      </View>

      <AddTrackModal
        visible={addOpen}
        existingIds={tracks.map((track) => track.id)}
        onClose={() => setAddOpen(false)}
        onAdd={(songId) => {
          addSongToCollection(realm, id, songId);
          setAddOpen(false);
        }}
      />

      <EditAlbumModal
        visible={editOpen}
        title={album.title}
        description={album.description ?? ""}
        onClose={() => setEditOpen(false)}
        onSave={(title, description) => {
          updateCollection(realm, id, { title, description: description || null });
          setEditOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/** Modal to edit the collection's title and description. */
function EditAlbumModal({
  visible,
  title,
  description,
  onSave,
  onClose,
}: {
  visible: boolean;
  title: string;
  description: string;
  onSave: (title: string, description: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);

  // reset the draft whenever the modal (re)opens so it reflects the current album
  useEffect(() => {
    if (visible) {
      setDraftTitle(title);
      setDraftDescription(description);
    }
  }, [visible, title, description]);

  const canSave = draftTitle.trim().length > 0;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t("album.editTitle")}
      useScrollView={false}
      padChildren
      footer={
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canSave}
          onPress={() => onSave(draftTitle.trim(), draftDescription.trim())}
          className="h-12 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.accent, opacity: canSave ? 1 : 0.5 }}
        >
          <AppText className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>
            {t("common.save")}
          </AppText>
        </TouchableOpacity>
      }
    >
      <View className="gap-1">
        <AppText className="text-sm font-semibold" style={{ color: colors.ink2 }}>
          {t("album.fieldTitle")}
        </AppText>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder={t("album.fieldTitlePlaceholder")}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          className="h-[50px] border rounded-lg px-4 text-sm"
          style={{
            color: colors.ink,
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.borderStrong,
          }}
        />

        <AppText className="text-sm font-semibold mt-4" style={{ color: colors.ink2 }}>
          {t("album.fieldDescription")}
        </AppText>
        <TextInput
          value={draftDescription}
          onChangeText={setDraftDescription}
          placeholder={t("album.fieldDescriptionPlaceholder")}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          multiline
          className="border rounded-lg px-4 py-3 text-sm"
          style={{
            color: colors.ink,
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.borderStrong,
            minHeight: 80,
            textAlignVertical: "top",
          }}
        />
      </View>
    </AppModal>
  );
}

/** Modal to add an existing song (not already in the collection) as a track. */
function AddTrackModal({
  visible,
  existingIds,
  onAdd,
  onClose,
}: {
  visible: boolean;
  existingIds: string[];
  onAdd: (songId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const q = query.trim();

  const songs = useQuery(
    {
      type: Song,
      query: (collection) =>
        q
          ? collection.filtered(`${NOT_TRASHED} AND title CONTAINS[c] $0 SORT(title ASC)`, q)
          : collection.filtered(`${NOT_TRASHED} SORT(title ASC)`),
    },
    [q]
  );

  const existing = new Set(existingIds);
  const candidates = songs.filter((song) => !existing.has(song.id));

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t("album.addTrack")}
      useScrollView={false}
      header={
        <View style={[styles.sheetSearch, { marginHorizontal: 20 }]}>
          <Ionicons name="search" size={15} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("album.searchSongs")}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            style={styles.sheetSearchInput}
          />
        </View>
      }
      footer={
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            onClose();
            router.push("/capture");
          }}
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl border"
          style={{ borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }}
        >
          <Ionicons name="add" size={18} color={colors.accent} />
          <AppText className="text-[15px] font-semibold" style={{ color: colors.ink }}>
            {t("album.createSong")}
          </AppText>
        </TouchableOpacity>
      }
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {candidates.length === 0 && (
          <Text style={styles.sheetEmpty}>
            {q ? t("album.noResults") : t("album.noCandidates")}
          </Text>
        )}
        {candidates.map((song) => {
          const untitled = song.status === "draft" && !song.key;
          return (
            <Pressable key={song.id} onPress={() => onAdd(song.id)} style={styles.candidateRow}>
              <StatusDot status={song.status} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.trackTitle, untitled && { color: colors.ink2 }]}
                  numberOfLines={1}
                >
                  {song.title}
                </Text>
              </View>
              <Text style={styles.trackMeta}>
                {song.key ? songMeta(song, t) : songStatusLabel(song.status, t)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </AppModal>
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
    paddingVertical: 8,
  },
  coverHeader: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 18,
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-end",
  },
  cover: { width: 108, height: 108, borderRadius: 14 },
  typeLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 27,
    color: colors.ink,
    letterSpacing: -0.54,
    marginTop: 5,
  },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 6 },
  description: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink3,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoCell: {
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  photo: { width: "100%", height: "100%" },
  coverBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(23,20,15,.78)",
  },
  coverBadgeText: { fontFamily: fonts.mono, fontSize: 10, color: colors.amber },
  addPhoto: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
  },
  addPhotoText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  photoError: { fontFamily: fonts.mono, fontSize: 12, color: colors.accentSoft, paddingTop: 8 },
  emptyTracks: {
    height: 90,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderDashed,
    alignItems: "center",
    justifyContent: "center",
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
  },
  trackIndex: { fontFamily: fonts.mono, fontSize: 13, color: colors.meta2, width: 18 },
  trackTitle: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.ink },
  trackMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta2, marginTop: 1 },
  addTrack: {
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetSearchInput: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  sheetEmpty: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.faint,
    textAlign: "center",
    paddingVertical: 28,
  },
  candidateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
  },
});
