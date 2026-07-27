import AppModal from "@/components/ui/modal";
import { MonoLabel } from "@/components/ui/ui";
import {
  activeCollections,
  activeSongs,
  Collection,
  saveProfile,
  Song,
  useProfile,
  useQuery,
  useRealm,
} from "@/db";
import { changeLanguage, type Language, languages } from "@/i18n";
import { pickAvatar } from "@/media/images";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const languageLabel: Record<Language, string> = {
  pt: "Português",
  en: "English",
};

function Row({
  icon,
  label,
  value,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={17} color={danger ? colors.accentSoft : colors.meta} />
      <Text style={[styles.rowLabel, danger && { color: colors.accentSoft }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={15} color={colors.faint2} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const realm = useRealm();
  const profile = useProfile();

  const songs = useQuery({ type: Song, query: activeSongs });
  const collections = useQuery({ type: Collection, query: activeCollections });

  const [nameOpen, setNameOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const current = (profile?.language ?? i18n.resolvedLanguage) as Language;

  async function choosePhoto() {
    const uri = await pickAvatar(profile?.avatarUri ?? null);
    if (uri) saveProfile(realm, { avatarUri: uri });
  }

  function pickLanguage(language: Language) {
    saveProfile(realm, { language });
    changeLanguage(language);
    setLanguageOpen(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.ink2} />
          </Pressable>
          <Text style={styles.title}>{t("profile.title")}</Text>
        </View>

        <View style={styles.userCard}>
          <Pressable style={styles.avatar} onPress={() => void choosePhoto()}>
            {profile?.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="camera-outline" size={18} color={colors.meta} />
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{profile?.name ?? ""}</Text>
            <Text style={styles.userMeta}>
              {t("profile.stats", {
                songs: t("songs.count", { count: songs.length }),
                collections: t("albums.count", { count: collections.length }),
              })}
            </Text>
          </View>
          <View style={styles.syncBadge}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>{t("profile.storedLocally")}</Text>
          </View>
        </View>

        <MonoLabel style={styles.sectionLabel}>{t("profile.sectionProfile")}</MonoLabel>
        <View style={styles.group}>
          <Row
            icon="person-outline"
            label={t("profile.rowName")}
            value={profile?.name}
            onPress={() => setNameOpen(true)}
          />
          <Row
            icon="image-outline"
            label={t("profile.rowPhoto")}
            onPress={() => void choosePhoto()}
          />
        </View>

        <MonoLabel style={styles.sectionLabel}>{t("profile.sectionAppearance")}</MonoLabel>
        <View style={styles.group}>
          <Row
            icon="language-outline"
            label={t("profile.rowLanguage")}
            value={languageLabel[current] ?? current}
            onPress={() => setLanguageOpen(true)}
          />
          <Row icon="moon-outline" label={t("profile.rowTheme")} value={t("profile.rowThemeValue")} />
        </View>

        <MonoLabel style={styles.sectionLabel}>{t("profile.sectionData")}</MonoLabel>
        <View style={styles.group}>
          <Row
            icon="trash-outline"
            label={t("profile.rowTrash")}
            onPress={() => router.push("/trash")}
          />
        </View>
      </ScrollView>

      <NameModal
        visible={nameOpen}
        initialName={profile?.name ?? ""}
        onClose={() => setNameOpen(false)}
        onSave={(name) => {
          saveProfile(realm, { name });
          setNameOpen(false);
        }}
      />

      <AppModal
        visible={languageOpen}
        onClose={() => setLanguageOpen(false)}
        title={t("profile.languageTitle")}
        useScrollView={false}
        padChildren
      >
        <View style={{ gap: 8 }}>
          {languages.map((language) => {
            const active = language === current;
            return (
              <Pressable
                key={language}
                onPress={() => pickLanguage(language)}
                style={[styles.languageRow, active && styles.languageRowActive]}
              >
                <Text style={[styles.languageLabel, active && { color: colors.ink }]}>
                  {languageLabel[language]}
                </Text>
                {active && <Ionicons name="checkmark" size={18} color={colors.accent} />}
              </Pressable>
            );
          })}
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

function NameModal({
  visible,
  initialName,
  onSave,
  onClose,
}: {
  visible: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialName);

  useEffect(() => {
    if (visible) setDraft(initialName);
  }, [visible, initialName]);

  const canSave = draft.trim().length > 0;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t("profile.editTitle")}
      useScrollView={false}
      padChildren
      footer={
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canSave}
          onPress={() => onSave(draft.trim())}
          style={[styles.modalSave, { opacity: canSave ? 1 : 0.5 }]}
        >
          <Text style={styles.modalSaveText}>{t("common.save")}</Text>
        </TouchableOpacity>
      }
    >
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={t("onboarding.namePlaceholder")}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
        autoCapitalize="words"
        maxLength={60}
        style={styles.nameInput}
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12 },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 32, color: colors.ink, letterSpacing: -0.6 },
  userCard: {
    marginTop: 18,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#251f17",
    borderWidth: 1,
    borderColor: colors.borderChip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  userName: { fontFamily: fonts.uiSemiBold, fontSize: 17, color: colors.ink },
  userMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 2 },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  syncText: { fontFamily: fonts.mono, fontSize: 11, color: colors.meta },
  sectionLabel: { paddingTop: 24, paddingBottom: 10 },
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15, color: colors.ink2 },
  rowValue: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2 },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
  },
  languageRowActive: { borderColor: colors.borderActive, backgroundColor: colors.surfaceActive },
  languageLabel: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.ink3 },
  nameInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
  },
  modalSave: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent },
});
