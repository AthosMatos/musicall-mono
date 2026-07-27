import { Tabs } from "expo-router";

// `Tabs` is used for route grouping and the shift animation only — the visible
// bar is the custom `BottomTabs` rendered by the parent layout.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: "shift",
        headerShown: false,
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="albums" />
      <Tabs.Screen name="songs" />
    </Tabs>
  );
}
