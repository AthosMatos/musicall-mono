/**
 * The very first screen of a fresh install: pick a language.
 *
 * Nothing here is translated — the point is that the user cannot read one of
 * the two paragraphs yet, so both languages are shown side by side and the
 * flags carry the meaning.
 */
import { BrazilFlag, UsaFlag } from "@/components/flags";
import { AppIcon } from "@/components/icon";
import { saveProfile, useRealm } from "@/db";
import { changeLanguage, type Language } from "@/i18n";
import { colors, fonts } from "@/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const options: { language: Language; label: string; Flag: typeof BrazilFlag }[] = [
  { language: "pt", label: "Português", Flag: BrazilFlag },
  { language: "en", label: "English", Flag: UsaFlag },
];

export default function LanguageScreen() {
  const realm = useRealm();

  function choose(language: Language) {
    // Creates the profile row with an empty name — the next screen fills it in,
    // and that name is what opens the gate into the app (see `db/profile.ts`).
    saveProfile(realm, { language });
    changeLanguage(language);
    router.push("/(onboarding)/profile");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.brand}>
        <AppIcon stroke={colors.accent} size={72} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.line}>Escolha o idioma do aplicativo.</Text>
        <Text style={styles.line}>Choose the app language.</Text>
      </View>

      <View style={styles.flags}>
        {options.map(({ language, label, Flag }) => (
          <Pressable
            key={language}
            onPress={() => choose(language)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.flagButton, pressed && styles.flagButtonPressed]}
          >
            <View style={styles.flagFrame}>
              <Flag size={96} />
            </View>
            <Text style={styles.flagLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: "center",
    gap: 44,
  },
  brand: { alignItems: "center" },
  copy: { gap: 10, alignItems: "center" },
  line: {
    fontFamily: fonts.ui,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink2,
    textAlign: "center",
  },
  flags: { flexDirection: "row", gap: 18, justifyContent: "center" },
  flagButton: {
    flex: 1,
    alignItems: "center",
    gap: 12,
    paddingVertical: 22,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  flagButtonPressed: {
    backgroundColor: colors.surfaceActive,
    borderColor: colors.borderActive,
  },
  flagFrame: {
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderChip,
  },
  flagLabel: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.ink },
});
