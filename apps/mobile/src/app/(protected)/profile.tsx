import { userAtom } from "@/atoms/auth/user";
import { useAuth } from "@/auth/auth.provider";
import { MonoLabel } from "@/components/ui/ui";
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { collectionsSearchOptions, songsSearchOptions } from "@monorepo/core/api";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={17} color={danger ? colors.accentSoft : colors.meta} />
      <Text style={[styles.rowLabel, danger && { color: colors.accentSoft }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={15} color={colors.faint2} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const user = useAtomValue(userAtom)
  const songsQuery = useQuery(songsSearchOptions({ pageSize: 1 }));
  const albumsQuery = useQuery(collectionsSearchOptions({ pageSize: 1 }));

  const songCount = songsQuery.data?.total ?? 0;
  const albumCount = albumsQuery.data?.total ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name ?? "…"}</Text>
            <Text style={styles.userMeta}>
              {songCount} música{songCount === 1 ? "" : "s"} · {albumCount} coleç
              {albumCount === 1 ? "ão" : "ões"}
            </Text>
          </View>
          <View style={styles.syncBadge}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>sincronizado</Text>
          </View>
        </View>

        <MonoLabel style={styles.sectionLabel}>Conta</MonoLabel>
        <View style={styles.group}>
          <Row icon="person-outline" label="Dados da conta" value={user?.email} />
          <Row icon="cloud-outline" label="Armazenamento" />
        </View>

        <MonoLabel style={styles.sectionLabel}>Aparência</MonoLabel>
        <View style={styles.group}>
          <Row icon="moon-outline" label="Tema" value="escuro" />
        </View>

        <MonoLabel style={styles.sectionLabel}>Seus dados</MonoLabel>
        <View style={styles.group}>
          <Row icon="download-outline" label="Exportar dados" />
          <Row icon="trash-outline" label="Lixeira" />
          <Row icon="log-out-outline" label="Sair da conta" danger onPress={() => void logout.signOut()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, },
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
