import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  lyricsCreateOptions,
  lyricsListKey,
  lyricsListOptions,
  songsGetOptions,
  type LyricVersionListDto,
  type SongResponseDto,
} from "@monorepo/core/api";
import { MetaChip } from "@/components/ui";
import { colors, fonts } from "@/theme";

const insertableSections = ["verso", "refrão", "ponte"];

export default function EditLyricsScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const songQuery = useQuery({ ...songsGetOptions(id), enabled: !!id });
  const lyricsQuery = useQuery({ ...lyricsListOptions(id), enabled: !!id });

  if (songQuery.isLoading || lyricsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>carregando…</Text>
      </SafeAreaView>
    );
  }
  if (!songQuery.data) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>música não encontrada</Text>
      </SafeAreaView>
    );
  }
  return <Editor song={songQuery.data} versions={lyricsQuery.data ?? []} />;
}

function Editor({ song, versions }: { song: SongResponseDto; versions: LyricVersionListDto }) {
  const queryClient = useQueryClient();
  const base = versions.find((v) => v.isPrimary) ?? versions[0];
  const [text, setText] = useState(base?.content ?? "");
  const selection = useRef({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const nextVersionNumber = versions.length + 1;
  const baseLabel = base ? `a partir de ${base.label}` : "primeira versão";

  const saveVersion = useMutation({
    ...lyricsCreateOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lyricsListKey(song.id) });
      router.back();
    },
  });

  function insertSection(name: string) {
    const at = selection.current.end || text.length;
    const marker = `\n\n[${name}]\n`;
    setText(text.slice(0, at) + marker + text.slice(at));
    inputRef.current?.focus();
  }

  function save() {
    if (!text.trim() || saveVersion.isPending) return;
    saveVersion.mutate({
      songId: song.id,
      body: { label: `v${nextVersionNumber}`, content: text, isPrimary: true },
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* edit top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.ink2 }}>Cancelar</Text>
          </Pressable>
          <View style={styles.editingRow}>
            <View style={styles.editingDot} />
            <Text style={styles.editingText}>
              {saveVersion.isError ? "erro ao salvar" : "editando"}
            </Text>
          </View>
          <Pressable onPress={save} hitSlop={10} disabled={saveVersion.isPending}>
            <Text
              style={{
                fontFamily: fonts.uiSemiBold,
                fontSize: 15,
                color: colors.accent,
                opacity: saveVersion.isPending ? 0.6 : 1,
              }}
            >
              {saveVersion.isPending ? "…" : "Salvar"}
            </Text>
          </Pressable>
        </View>

        {/* title + version */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <Text style={styles.title}>{song.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <MetaChip active>v{nextVersionNumber} · nova ▾</MetaChip>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 }}>{baseLabel}</Text>
          </View>
        </View>

        {/* mono editor */}
        <TextInput
          ref={inputRef}
          multiline
          value={text}
          onChangeText={setText}
          onSelectionChange={(e) => {
            selection.current = e.nativeEvent.selection;
          }}
          autoFocus
          placeholder={"[verso 1]\nescreva a primeira linha…"}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          style={styles.editor}
          textAlignVertical="top"
        />

        {/* section toolbar */}
        <View style={styles.toolbar}>
          {insertableSections.map((name) => (
            <Pressable key={name} onPress={() => insertSection(name)} style={styles.toolbarChip}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.ink3 }}>+ {name}</Text>
            </Pressable>
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loadingText: { fontFamily: fonts.mono, color: colors.meta, padding: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  editingRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  editingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  editingText: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 21, color: colors.ink },
  editor: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 28,
    color: colors.lyric,
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolbarChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
});
