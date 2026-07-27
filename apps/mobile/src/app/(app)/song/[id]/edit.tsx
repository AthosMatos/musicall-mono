import {
  createLyricVersion,
  LyricVersion,
  Song,
  updateLyricVersion,
  updateSong,
  useObject,
  useQuery,
  useRealm,
} from "@/db";
import { colors, fonts } from "@/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditLyricsScreen() {
  const { t } = useTranslation();
  const {
    id = "",
    version,
    new: newParam,
  } = useLocalSearchParams<{ id: string; version?: string; new?: string }>();

  const song = useObject(Song, id);
  const versions = useQuery(
    { type: LyricVersion, query: (c) => c.filtered("songId == $0 SORT(createdAt ASC)", id) },
    [id]
  );

  if (!song || song.deletedAt != null) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loadingText}>{t("song.notFound")}</Text>
      </SafeAreaView>
    );
  }

  // `undefined` → create-a-new-version mode (?new=1 or no versions yet).
  const editing =
    newParam === "1"
      ? undefined
      : (versions.find((v) => v.id === version) ??
        versions.find((v) => v.isPrimary) ??
        versions[0]);

  return (
    <Editor
      songId={song.id}
      songTitle={song.title}
      versionCount={versions.length}
      editingId={editing?.id}
      initialLabel={editing?.label}
      initialContent={editing?.content}
    />
  );
}

function Editor({
  songId,
  songTitle,
  versionCount,
  editingId,
  initialLabel,
  initialContent,
}: {
  songId: string;
  songTitle: string;
  versionCount: number;
  editingId: string | undefined;
  initialLabel: string | undefined;
  initialContent: string | undefined;
}) {
  const { t } = useTranslation();
  const realm = useRealm();
  const [text, setText] = useState(initialContent ?? "");
  const inputRef = useRef<TextInput>(null);

  // Where the caret currently is. `onSelectionChange` never fires until the user
  // touches the field, so this starts at 0 and is only trusted while focused —
  // blurring can report a (0,0) selection we must not mistake for a real caret.
  const caret = useRef(0);
  const isFocused = useRef(false);

  // Selection is left uncontrolled while typing (controlling it fights the
  // Android keyboard) and forced for a single frame after a programmatic insert.
  const [pendingSelection, setPendingSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);

  useEffect(() => {
    if (!pendingSelection) return;
    const frame = requestAnimationFrame(() => setPendingSelection(undefined));
    return () => cancelAnimationFrame(frame);
  }, [pendingSelection]);

  const nextVersionNumber = versionCount + 1;
  const [label, setLabel] = useState(initialLabel ?? `v${nextVersionNumber}`);
  const [title, setTitle] = useState(songTitle);
  const [saveError, setSaveError] = useState(false);

  const insertableSections = [
    t("lyrics.sectionVerse"),
    t("lyrics.sectionChorus"),
    t("lyrics.sectionBridge"),
  ];

  /** Drops a `[section]` marker in at the caret, not at the end of the text. */
  function insertSection(name: string) {
    const at = Math.min(caret.current, text.length);
    const before = text.slice(0, at);
    const after = text.slice(at);

    // Markers need their own line, but without piling up blank lines when the
    // caret already sits on one.
    const lead =
      before.length === 0 || before.endsWith("\n\n")
        ? ""
        : before.endsWith("\n")
          ? "\n"
          : "\n\n";
    const marker = `${lead}[${name}]\n`;
    const position = at + marker.length;

    setText(before + marker + after);
    caret.current = position;
    // Leave the caret inside the new section so the user can type straight away.
    setPendingSelection({ start: position, end: position });
    inputRef.current?.focus();
  }

  // A blank title falls back to the stored one — the song must never lose its name.
  const finalTitle = title.trim();
  const titleChanged = finalTitle.length > 0 && finalTitle !== songTitle;
  const hasLyrics = text.trim().length > 0;

  function save() {
    if (!titleChanged && !hasLyrics) return;
    const finalLabel = label.trim() || `v${nextVersionNumber}`;
    try {
      if (titleChanged) {
        updateSong(realm, songId, { title: finalTitle });
      }
      if (hasLyrics) {
        if (editingId) {
          updateLyricVersion(realm, editingId, { label: finalLabel, content: text });
        } else {
          createLyricVersion(realm, songId, { label: finalLabel, content: text, isPrimary: true });
        }
      }
      router.back();
    } catch {
      setSaveError(true);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* The editor fills the screen, so it resizes around the keyboard rather
          than scrolling — that keeps the section toolbar pinned above it. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* edit top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.ink2 }}>
              {t("common.cancel")}
            </Text>
          </Pressable>
          <View style={styles.editingRow}>
            <View style={styles.editingDot} />
            <Text style={styles.editingText}>
              {saveError
                ? t("lyrics.saveError")
                : editingId
                  ? t("lyrics.editing")
                  : t("lyrics.newVersion")}
            </Text>
          </View>
          <Pressable onPress={save} hitSlop={10}>
            <Text style={{ fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.accent }}>
              {t("common.save")}
            </Text>
          </Pressable>
        </View>

        {/* editable title + version label */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("song.titlePlaceholder")}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            maxLength={200}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            style={styles.title}
          />
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
            </View>
          </View>
        </View>

        {/* mono editor */}
        <TextInput
          ref={inputRef}
          multiline
          value={text}
          onChangeText={setText}
          selection={pendingSelection}
          onSelectionChange={(e) => {
            // Ignore the (0,0) some platforms report as the field blurs.
            if (isFocused.current) caret.current = e.nativeEvent.selection.end;
          }}
          onFocus={() => {
            isFocused.current = true;
          }}
          onBlur={() => {
            isFocused.current = false;
          }}
          autoFocus
          placeholder={t("lyrics.placeholder")}
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
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 21,
    color: colors.ink,
    // Zero out the platform's default input padding so it sits where the
    // read-only title used to, and underline it as an edit affordance.
    padding: 0,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
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
