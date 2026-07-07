import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MonoLabel } from "@/components/ui";
import { songs, userName } from "@/data/songbook";
import { colors, fonts } from "@/theme";

function Row({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row}>
      <Ionicons name={icon} size={17} color={danger ? colors.accentSoft : colors.meta} />
      <Text style={[styles.rowLabel, danger && { color: colors.accentSoft }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={15} color={colors.faint2} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userMeta}>{songs.length} músicas · 3 coleções</Text>
          </View>
          <View style={styles.syncBadge}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>sincronizado</Text>
          </View>
        </View>

        <MonoLabel style={styles.sectionLabel}>Conta</MonoLabel>
        <View style={styles.group}>
          <Row icon="person-outline" label="Dados da conta" />
          <Row icon="cloud-outline" label="Armazenamento" value="128 MB de 1 GB" />
        </View>

        <MonoLabel style={styles.sectionLabel}>Aparência</MonoLabel>
        <View style={styles.group}>
          <Row icon="moon-outline" label="Tema" value="escuro" />
        </View>

        <MonoLabel style={styles.sectionLabel}>Seus dados</MonoLabel>
        <View style={styles.group}>
          <Row icon="download-outline" label="Exportar dados" />
          <Row icon="trash-outline" label="Lixeira" />
          <Row icon="alert-circle-outline" label="Excluir conta e dados" danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.6,
    paddingTop: 18,
  },
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
    backgroundColor: "#251f17",
    borderWidth: 1,
    borderColor: colors.borderChip,
  },
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
});
