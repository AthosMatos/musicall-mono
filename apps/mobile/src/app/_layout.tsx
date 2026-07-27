import { jotaiStore } from "@/atoms/store";
import { hasOnboarded, RealmProvider, useProfile } from "@/db";
import { changeLanguage, isLanguage } from "@/i18n";
import { colors } from "@/theme";
import "@root/global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider } from "jotai";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import ToastManager from "toastify-react-native";

SplashScreen.preventAutoHideAsync();

const toastConfig = {
  default: (props: any) => (
    <Animated.View
      entering={SlideInUp.springify()}
      exiting={SlideOutUp}
      className="bg-white border-2 border-primary p-4 px-4 rounded-xl"
    >
      <Text className="text-primary font-bold text-xl">{props.text1}</Text>
      {props.text2 && <Text className="text-black">{props.text2}</Text>}
    </Animated.View>
  ),
};

/** Shown while Realm opens the database file — the splash is still up. */
function DatabaseFallback() {
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}

function RootNavigator() {
  const profile = useProfile();
  const onboarded = hasOnboarded(profile);
  const language = profile?.language;

  // The stored choice wins over the device locale i18n booted with.
  useEffect(() => {
    if (isLanguage(language)) changeLanguage(language);
  }, [language]);

  // The database is open by the time this renders, so there is nothing left to
  // wait for before showing the first screen.
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  return (
    <JotaiProvider store={jotaiStore}>
      <RealmProvider fallback={DatabaseFallback}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootNavigator />
          <ToastManager
            animationStyle="slide"
            config={toastConfig}
            position="top"
            useModal={false}
            showProgressBar
            showCloseIcon
          />
        </KeyboardProvider>
      </RealmProvider>
    </JotaiProvider>
  );
}

export default RootLayout;
