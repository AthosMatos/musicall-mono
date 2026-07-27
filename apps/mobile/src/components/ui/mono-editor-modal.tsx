/**
 * A monospaced free-text editor in a modal — used for chord charts and
 * tablature, where column alignment is the whole point.
 */
import AppModal from "@/components/ui/modal";
import { colors, fonts } from "@/theme";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export interface MonoEditorModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValue: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function MonoEditorModal({
  visible,
  title,
  placeholder,
  initialValue,
  onSave,
  onClose,
}: MonoEditorModalProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialValue);

  // Re-seed the draft each time the modal opens so it shows the stored content.
  useEffect(() => {
    if (visible) setDraft(initialValue);
  }, [visible, initialValue]);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={title}
      useScrollView={false}
      padChildren
      footer={
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSave(draft)}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>{t("common.save")}</Text>
        </TouchableOpacity>
      }
    >
      <View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.editor}
          textAlignVertical="top"
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  editor: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 22,
    color: colors.lyric,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent },
});
