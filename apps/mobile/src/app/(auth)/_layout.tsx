import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const LogoHorizontal = require("../../assets/logo_horizontal.png")

export default function ScreenLayout() {
	const { top } = useSafeAreaInsets()
	return (
		<View className="flex-1">
			{/* <Image style={{ width: 60, height: 254, top: top, right: 32, position: 'absolute' }} source={LogoHorizontal} /> */}


			<SafeAreaView className="flex-1">
				<Stack
					screenOptions={{
						headerShown: false,
						animation: "slide_from_right",
						contentStyle: { backgroundColor: "transparent" },
					}}
				/>
			</SafeAreaView>


		</View>
	);
}
