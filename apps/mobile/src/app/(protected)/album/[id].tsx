import { CoverArt, MonoLabel, StatusDot } from "@/components/ui/ui";
import {
  collectionCover,
  collectionStatusLabel,
  collectionTypeLabel,
  songMeta,
  statusLabel,
} from "@/lib/model";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collectionsAddSongOptions,
  collectionsGetOptions,
  collectionsListSongsKey,
  collectionsListSongsOptions,
  collectionsReorderOptions,
  type SongResponseDto,
  songsSearchOptions,
} from "@monorepo/core/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
}: {
  song: SongResponseDto;
  index: number;
  dragging: boolean;
  dragOffset: number;
  onStartDrag: (index: number, dy: number) => void;
}) {
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
          {song.key ? `${song.key} · ${statusLabel[song.status]}` : songMeta(song)}
        </Text>
      </View>
      <StatusDot status={song.status} />
    </Pressable>
  );
}

export default function AlbumDetailScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const albumQuery = useQuery({ ...collectionsGetOptions(id), enabled: !!id });
  const tracksQuery = useQuery({ ...collectionsListSongsOptions(id), enabled: !!id });

  const [tracks, setTracks] = useState<SongResponseDto[]>([]);
  const [dragIndex, setDragIndex] = useState(-1);
  const [dragOffset, setDragOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const drag = useRef({ start: -1, current: -1, rowHeight: 64 + ROW_GAP });

  const serverTracks = tracksQuery.data;
  useEffect(() => {
    if (serverTracks) setTracks(serverTracks);
  }, [serverTracks]);

  const invalidateTracks = () =>
    queryClient.invalidateQueries({ queryKey: collectionsListSongsKey(id) });

  const reorder = useMutation({
    ...collectionsReorderOptions(),
    onSettled: invalidateTracks,
  });

  const addSong = useMutation({
    ...collectionsAddSongOptions(),
    onSuccess: invalidateTracks,
  });

  const album = albumQuery.data;

  if (albumQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>carregando…</Text>
      </SafeAreaView>
    );
  }
  if (!album) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>coleção não encontrada</Text>
      </SafeAreaView>
    );
  }

  function handleDrag(index: number, dy: number) {
    const d = drag.current;
    if (index === -1) {
      // drop: commit the new order to the API
      if (d.start !== -1 && d.current !== d.start) {
        reorder.mutate({ id, body: { songIds: tracks.map((t) => t.id) } });
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
      setTracks((t) => {
        const next = [...t];
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
        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={19} color={colors.ink2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 14 }} scrollEnabled={dragIndex === -1}>
        {/* cover header */}
        <View style={styles.coverHeader}>
          <CoverArt variant={collectionCover(album)} style={styles.cover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.typeLabel}>
              {collectionTypeLabel(album)} · {collectionStatusLabel[album.status]}
            </Text>
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.meta}>
              {tracks.length} faixa{tracks.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {album.description && <Text style={styles.description}>{album.description}</Text>}

        {/* track list */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <MonoLabel style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
            Faixas · arraste para reordenar{reorder.isPending ? " · salvando…" : ""}
          </MonoLabel>
          {tracks.length === 0 && !tracksQuery.isLoading ? (
            <View style={styles.emptyTracks}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.faint }}>
                nenhuma faixa ainda
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
            Adicionar faixa
          </Text>
        </Pressable>
      </View>

      <AddTrackModal
        visible={addOpen}
        existingIds={tracks.map((t) => t.id)}
        isAdding={addSong.isPending}
        onClose={() => setAddOpen(false)}
        onAdd={(songId) =>
          addSong.mutate({ id, body: { songId } }, { onSuccess: () => setAddOpen(false) })
        }
      />
    </SafeAreaView>
  );
}

/** Modal to add an existing song (not already in the collection) as a track. */
function AddTrackModal({
  visible,
  existingIds,
  isAdding,
  onAdd,
  onClose,
}: {
  visible: boolean;
  existingIds: string[];
  isAdding: boolean;
  onAdd: (songId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const songsQuery = useQuery({
    ...songsSearchOptions({ q: q || undefined, pageSize: 60 }),
    enabled: visible,
  });
  const existing = new Set(existingIds);
  const candidates = (songsQuery.data?.items ?? []).filter((s) => !existing.has(s.id));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Adicionar faixa</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.ink2} />
            </Pressable>
          </View>

          <View style={styles.sheetSearch}>
            <Ionicons name="search" size={15} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar músicas…"
              placeholderTextColor={colors.faint}
              selectionColor={colors.accent}
              style={styles.sheetSearchInput}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 8 }}>
            {songsQuery.isLoading && <Text style={styles.sheetEmpty}>carregando…</Text>}
            {!songsQuery.isLoading && candidates.length === 0 && (
              <Text style={styles.sheetEmpty}>
                {q ? "nenhuma música encontrada" : "todas as músicas já estão nesta coleção"}
              </Text>
            )}
            {candidates.map((song) => {
              const untitled = song.status === "draft" && !song.key;
              return (
                <Pressable
                  key={song.id}
                  disabled={isAdding}
                  onPress={() => onAdd(song.id)}
                  style={[styles.candidateRow, isAdding && { opacity: 0.5 }]}
                >
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
                    {song.key ? songMeta(song) : statusLabel[song.status]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: fonts.uiSemiBold, fontSize: 18, color: colors.ink },
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
