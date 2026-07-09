import {
  type LyricVersionListDto,
  type LyricVersionResponseDto,
  lyricsCreateOptions,
  lyricsListKey,
  lyricsListOptions,
  lyricsUpdateOptions,
  type SongResponseDto,
  songsGetOptions,
} from "@monorepo/core/api";
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
import { colors, fonts } from "@/theme";

const insertableSections = ["verso", "refrão", "ponte"];

export default function EditLyricsScreen() {
  const {
    id = "",
    version,
    new: newParam,
  } = useLocalSearchParams<{
    id: string;
    version?: string;
    new?: string;
  }>();
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

  const versions = lyricsQuery.data ?? [];
  // `undefined` → create-a-new-version mode (?new=1 or no versions yet).
  const editing =
    newParam === "1"
      ? undefined
      : (versions.find((v) => v.id === version) ??
        versions.find((v) => v.isPrimary) ??
        versions[0]);

  return <Editor song={songQuery.data} versions={versions} editing={editing} />;
}

function Editor({
  song,
  versions,
  editing,
}: {
  song: SongResponseDto;
  versions: LyricVersionListDto;
  editing: LyricVersionResponseDto | undefined;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(editing?.content ?? "");
  const selection = useRef({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const nextVersionNumber = versions.length + 1;
  const [label, setLabel] = useState(editing?.label ?? `v${nextVersionNumber}`);
  const trimmedLabel = label.trim();

  const onSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: lyricsListKey(song.id) });
    router.back();
  };
  const createVersion = useMutation({ ...lyricsCreateOptions(), onSuccess: onSaved });
  const updateVersion = useMutation({ ...lyricsUpdateOptions(), onSuccess: onSaved });
  const saving = createVersion.isPending || updateVersion.isPending;
  const saveError = createVersion.isError || updateVersion.isError;

  function insertSection(name: string) {
    const at = selection.current.end || text.length;
    const marker = `\n\n[${name}]\n`;
    setText(text.slice(0, at) + marker + text.slice(at));
    inputRef.current?.focus();
  }

  function save() {
    if (!text.trim() || saving) return;
    const finalLabel = trimmedLabel || `v${nextVersionNumber}`;
    if (editing) {
      updateVersion.mutate({
        songId: song.id,
        id: editing.id,
        body: { label: finalLabel, content: text },
      });
    } else {
      createVersion.mutate({
        songId: song.id,
        body: { label: finalLabel, content: text, isPrimary: true },
      });
    }
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
              {saveError ? "erro ao salvar" : editing ? "editando" : "nova versão"}
            </Text>
          </View>
          <Pressable onPress={save} hitSlop={10} disabled={saving}>
            <Text
              style={{
                fontFamily: fonts.uiSemiBold,
                fontSize: 15,
                color: colors.accent,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "…" : "Salvar"}
            </Text>
          </Pressable>
        </View>

        {/* title + editable version label */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <Text style={styles.title}>{song.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <View style={styles.labelChip}>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder={`v${nextVersionNumber}`}
                placeholderTextColor={colors.faint}
                selectionColor={colors.accent}
                maxLength={100}
                style={styles.labelInput}
              />
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.faint }}>
                {editing ? "· atual" : "· nova"}
              </Text>
            </View>
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
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.ink3 }}>
                + {name}
              </Text>
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
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceActive,
    borderWidth: 1,
    borderColor: colors.borderActive,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  labelInput: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
    padding: 0,
    minWidth: 44,
  },
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
