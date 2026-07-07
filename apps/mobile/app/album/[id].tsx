import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CoverArt, MonoLabel, StatusDot } from "@/components/ui";
import { collectionStatusLabel, getCollection, getSong, type SeedTrack } from "@/data/songbook";
import { colors, fonts } from "@/theme";

const ROW_GAP = 8;

function TrackRow({
  track,
  index,
  dragging,
  dragOffset,
  onStartDrag,
}: {
  track: SeedTrack;
  index: number;
  dragging: boolean;
  dragOffset: number;
  onStartDrag: (index: number, dy: number) => void;
}) {
  const song = getSong(track.songId);
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
    }),
  );

  if (!song) return null;
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
          {untitled ? "faixa sem título" : song.title}
        </Text>
        <Text style={[styles.trackMeta, untitled && { color: colors.faint }]}>
          {untitled
            ? "rascunho · só áudio"
            : `${song.key} · ${song.status === "finished" ? "finalizada" : "em progresso"}`}
        </Text>
      </View>
      <StatusDot status={song.status} />
    </Pressable>
  );
}

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const album = getCollection(id);
  const [tracks, setTracks] = useState<SeedTrack[]>(album?.tracks ?? []);
  const [dragIndex, setDragIndex] = useState(-1);
  const [dragOffset, setDragOffset] = useState(0);
  const drag = useRef({ start: -1, current: -1, rowHeight: 64 + ROW_GAP });

  if (!album) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ fontFamily: fonts.mono, color: colors.meta, padding: 24 }}>
          coleção não encontrada
        </Text>
      </SafeAreaView>
    );
  }

  function handleDrag(index: number, dy: number) {
    const d = drag.current;
    if (index === -1) {
      d.start = d.current = -1;
      setDragIndex(-1);
      setDragOffset(0);
      return;
    }
    if (d.start === -1) {
      d.start = d.current = index;
      setDragIndex(index);
    }
    const target = Math.min(
      tracks.length - 1,
      Math.max(0, d.start + Math.round(dy / d.rowHeight)),
    );
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
          <CoverArt variant={album.cover} style={styles.cover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.typeLabel}>
              {album.typeLabel} · {collectionStatusLabel[album.status]}
            </Text>
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.meta}>
              {tracks.length} faixa{tracks.length === 1 ? "" : "s"} · {album.totalLabel}
            </Text>
          </View>
        </View>

        {album.description && <Text style={styles.description}>{album.description}</Text>}

        {/* track list */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <MonoLabel style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
            Faixas · arraste para reordenar
          </MonoLabel>
          <View style={{ gap: ROW_GAP }}>
            {tracks.map((track, index) => (
              <TrackRow
                key={track.songId}
                track={track}
                index={index}
                dragging={index === dragIndex}
                dragOffset={dragOffset}
                onStartDrag={handleDrag}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 14 }}>
        <Pressable style={styles.addTrack}>
          <Ionicons name="add" size={18} color={colors.onAccent} />
          <Text style={{ fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent }}>
            Adicionar faixa
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
});
