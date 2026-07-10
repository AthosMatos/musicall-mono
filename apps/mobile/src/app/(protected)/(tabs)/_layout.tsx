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
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: "transparent" },
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="albums" />
      <Tabs.Screen name="songs" />
    </Tabs>
  );
}
