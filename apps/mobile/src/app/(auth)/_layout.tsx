import { Stack } from "expo-router";

const LogoHorizontal = require("../../assets/logo_horizontal.png")

export default function ScreenLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "slide_from_right",
				contentStyle: { backgroundColor: "transparent" },
			}}
		/>
	);
}
