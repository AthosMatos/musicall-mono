import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreateSongDto, lyricsCreate, songsCreateOptions } from "@monorepo/core/api";
import { MonoLabel, Waveform, formatTime } from "@/components/ui";
import { colors, fonts } from "@/theme";

const IDLE_SAMPLES = [30, 60, 90, 100, 70, 45, 80, 55, 35, 65];

export default function CaptureScreen() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [snippet, setSnippet] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState<number[]>(IDLE_SAMPLES);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    timer.current = setInterval(() => {
      setElapsed((t) => t + 0.2);
      setSamples((s) => [...s.slice(1), 25 + Math.round(Math.random() * 75)]);
    }, 200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isRecording]);

  const hasTake = elapsed > 0;

  const saveDraft = useMutation({
    ...songsCreateOptions(),
    onSuccess: async (song) => {
      if (snippet.trim()) {
        try {
          await lyricsCreate(song.id, { label: "v1", content: snippet, isPrimary: true });
        } catch {
          // the draft song exists; the snippet can be re-added in the editor
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["songs-list"] });
      router.back();
    },
  });

  function save() {
    if (saveDraft.isPending) return;
    setIsRecording(false);
    saveDraft.mutate({
      body: {
        title: title.trim() || "ideia sem nome",
        status: CreateSongDto.status.DRAFT,
      },
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.ink2} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova música</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.faint2 }}>Pular</Text>
        </Pressable>
      </View>

      {/* title */}
      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título (opcional)"
          placeholderTextColor={colors.faint}
          style={styles.titleInput}
        />
      </View>

      {/* record */}
      <View style={styles.recordArea}>
        <Pressable onPress={() => setIsRecording((r) => !r)} style={styles.recordOuter}>
          <View style={styles.recordHalo} />
          <View style={styles.recordButton}>
            {isRecording ? (
              <View style={styles.stopSquare} />
            ) : (
              <Ionicons name="mic" size={30} color={colors.onAccent} />
            )}
          </View>
        </Pressable>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <View style={{ width: 200 }}>
          <Waveform samples={samples} progress={isRecording ? 0.4 : 0} height={34} />
        </View>
        <Text style={styles.recordStatus}>
          {isRecording ? "gravando ideia…" : hasTake ? "gravação pausada" : "toque para gravar"}
        </Text>
      </View>

      {/* lyric snippet */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 14 }}>
        <View style={styles.snippetCard}>
          <MonoLabel style={{ marginBottom: 8 }}>trecho de letra</MonoLabel>
          <TextInput
            value={snippet}
            onChangeText={setSnippet}
            placeholder="anota uma frase enquanto grava…"
            placeholderTextColor={colors.meta}
            multiline
            style={styles.snippetInput}
          />
        </View>
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <Pressable style={styles.discard} onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.ink2 }}>Descartar</Text>
        </Pressable>
        <Pressable
          style={[styles.save, saveDraft.isPending && { opacity: 0.6 }]}
          onPress={save}
          disabled={saveDraft.isPending}
        >
          <Text style={{ fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent }}>
            {saveDraft.isPending ? "salvando…" : "Salvar rascunho"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.ink },
  titleInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingVertical: 10,
    fontFamily: fonts.uiSemiBold,
    fontSize: 24,
    color: colors.ink,
  },
  recordArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  recordOuter: { width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  recordHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 65,
    backgroundColor: "rgba(194,94,68,.14)",
  },
  recordButton: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  stopSquare: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.onAccent },
  timer: { fontFamily: fonts.mono, fontSize: 28, color: colors.ink },
  recordStatus: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 },
  snippetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  snippetInput: {
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink2,
    padding: 0,
    minHeight: 44,
  },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingBottom: 12 },
  discard: {
    flex: 1,
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    flex: 1.6,
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
