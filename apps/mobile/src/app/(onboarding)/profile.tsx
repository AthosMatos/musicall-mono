/**
 * Second onboarding screen: the name the app greets you with, plus an optional
 * photo. Saving a non-empty name is what ends onboarding — the root layout's
 * guard flips and the app group takes over.
 */
import { saveProfile, useProfile, useRealm } from "@/db";
import { pickAvatar } from "@/media/images";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingProfileScreen() {
  const { t } = useTranslation();
  const realm = useRealm();
  const profile = useProfile();

  const [name, setName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUri ?? null);
  const [photoError, setPhotoError] = useState(false);

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0;

  async function choosePhoto() {
    setPhotoError(false);
    try {
      const uri = await pickAvatar(avatarUri);
      if (uri) setAvatarUri(uri);
    } catch {
      setPhotoError(true);
    }
  }

  function finish() {
    if (!canContinue) return;
    saveProfile(realm, { name: trimmed, avatarUri });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.ink2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={{ gap: 8 }}>
            <Text style={styles.title}>{t("onboarding.profileTitle")}</Text>
            <Text style={styles.subtitle}>{t("onboarding.profileSubtitle")}</Text>
          </View>

          <Pressable onPress={() => void choosePhoto()} style={styles.avatarRow}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="camera-outline" size={24} color={colors.meta} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.photoLabel}>
                {avatarUri ? t("onboarding.photoChange") : t("onboarding.photoAdd")}
              </Text>
              <Text style={styles.photoHint}>
                {photoError ? t("onboarding.photoError") : t("onboarding.photoOptional")}
              </Text>
            </View>
          </Pressable>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("onboarding.namePlaceholder")}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            autoFocus
            autoCapitalize="words"
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={finish}
            style={styles.nameInput}
          />
        </View>

        <Pressable
          onPress={finish}
          disabled={!canContinue}
          style={[styles.cta, !canContinue && { opacity: 0.4 }]}
        >
          <Text style={styles.ctaText}>{t("onboarding.start")}</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  navRow: { paddingHorizontal: 22, paddingVertical: 10 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 12, gap: 32 },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: colors.meta },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderChip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  photoLabel: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.ink2 },
  photoHint: { fontFamily: fonts.mono, fontSize: 12, color: colors.faint, marginTop: 3 },
  nameInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingVertical: 10,
    fontFamily: fonts.uiSemiBold,
    fontSize: 24,
    color: colors.ink,
  },
  cta: {
    marginHorizontal: 28,
    marginBottom: 12,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.onAccent },
});
