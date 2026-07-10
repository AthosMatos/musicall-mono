import { jotaiStore } from "@/atoms/store";
import { initQueryPersistence, QueryProvider } from "@/query-provider";
import { colors } from "@/theme";
import "@root/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider } from "jotai";
import { useEffect } from "react";
import { Text } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import ToastManager from "toastify-react-native";
import { AuthProvider, useAuth } from "../auth/auth.provider";

// Custom toast configuration
const toastConfig = {
  default: (props: any) => (
    <Animated.View entering={SlideInUp.springify()} exiting={SlideOutUp} className="bg-white border-2 border-primary p-4 px-4 rounded-xl" >
      <Text className="text-primary font-bold text-xl">{props.text1}</Text>
      {props.text2 && <Text className="text-black" >{props.text2}</Text>}
    </Animated.View>
  ),
  // Override other toast types as needed
}

function RootNavigator() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    initQueryPersistence();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  return (
    <JotaiProvider store={jotaiStore}>
      <QueryProvider>
        <AuthProvider>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <ToastManager animationStyle={'slide'} config={toastConfig} position="top" useModal={false} showProgressBar showCloseIcon />
            {/* {modals.map((ModalComponent) => ModalComponent)} */}
          </KeyboardProvider>
        </AuthProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}

export default RootLayout;
