import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const icons = {
  index: "home-outline",
  songs: "musical-note-outline",
  albums: "disc-outline",
  profile: "person-outline",
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        animation: "shift",
        headerShown: false,
        /* 	tabBarStyle: { display: "none" }, */
        /* 	sceneStyle: { backgroundColor: "transparent" }, */
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.bgDeep,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 11,
          marginTop: 3,
        },
        tabBarIcon: ({ color }) => (
          <Ionicons name={icons[route.name as keyof typeof icons] ?? "ellipse-outline"} size={19} color={color} />
        ),
        sceneStyle: { backgroundColor: colors.bg },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="songs" options={{ title: "Músicas" }} />
      <Tabs.Screen name="albums" options={{ title: "Álbuns" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
