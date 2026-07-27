import { formatTime, MonoLabel, Waveform } from "@/components/ui/ui";
import { createLyricVersion, createSong, useRealm } from "@/db";
import { importAudioToSong } from "@/media/audio";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

const IDLE_SAMPLES = [30, 60, 90, 100, 70, 45, 80, 55, 35, 65];

export default function CaptureScreen() {
  const { t } = useTranslation();
  const realm = useRealm();
  const [title, setTitle] = useState("");
  const [snippet, setSnippet] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState<number[]>(IDLE_SAMPLES);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    timer.current = setInterval(() => {
      setElapsed((s) => s + 0.2);
      setSamples((s) => [...s.slice(1), 25 + Math.round(Math.random() * 75)]);
    }, 200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isRecording]);

  // Release the mic if we unmount mid-take.
  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const hasTake = recordedUri != null;

  async function startRecording() {
    setError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError(t("capture.errorPermission"));
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordedUri(null);
      setElapsed(0);
      setSamples(IDLE_SAMPLES);
      setIsRecording(true);
    } catch {
      setError(t("capture.errorStart"));
    }
  }

  async function stopRecording(): Promise<string | null> {
    const recording = recordingRef.current;
    if (!recording) return null;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {
      // fall through — we still try to read the URI below
    }
    const uri = recording.getURI() ?? null;
    recordingRef.current = null;
    setRecordedUri(uri);
    return uri;
  }

  function toggleRecording() {
    if (isRecording) void stopRecording();
    else void startRecording();
  }

  async function save() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const uri = isRecording ? await stopRecording() : recordedUri;
      const song = createSong(realm, {
        title: title.trim() || t("capture.untitled"),
        status: "draft",
      });
      if (snippet.trim()) {
        createLyricVersion(realm, song.id, { label: "v1", content: snippet, isPrimary: true });
      }
      if (uri) {
        await importAudioToSong(realm, song.id, {
          uri,
          name: title.trim() || t("capture.recordingName"),
        });
      }
      router.back();
    } catch {
      setError(t("capture.errorSave"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.ink2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("capture.title")}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.faint2 }}>
            {t("common.skip")}
          </Text>
        </Pressable>
      </View>

      {/* The snippet field sits just above the footer, so the scrollable middle
          lifts it clear of the keyboard while the actions stay pinned. */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* title */}
        <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("capture.titlePlaceholder")}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            style={styles.titleInput}
          />
        </View>

        {/* record */}
        <View style={styles.recordArea}>
          <Pressable onPress={toggleRecording} style={styles.recordOuter} disabled={isSaving}>
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
            {isRecording
              ? t("capture.recording")
              : hasTake
                ? t("capture.takeReady")
                : t("capture.tapToRecord")}
          </Text>
          {error && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.accentSoft }}>
              {error}
            </Text>
          )}
        </View>

        {/* lyric snippet */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 14 }}>
          <View style={styles.snippetCard}>
            <MonoLabel style={{ marginBottom: 8 }}>{t("capture.snippetLabel")}</MonoLabel>
            <TextInput
              value={snippet}
              onChangeText={setSnippet}
              placeholder={t("capture.snippetPlaceholder")}
              placeholderTextColor={colors.meta}
              selectionColor={colors.accent}
              multiline
              style={styles.snippetInput}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* footer */}
      <View style={styles.footer}>
        <Pressable style={styles.discard} onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: colors.ink2 }}>
            {t("capture.discard")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.save, isSaving && { opacity: 0.6 }]}
          onPress={() => void save()}
          disabled={isSaving}
        >
          <Text style={{ fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent }}>
            {isSaving ? t("common.saving") : t("capture.saveDraft")}
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
