import { inPrimaryPageAtom } from "@root/src/atoms/pages";
import BlurView from "@sbaiahmed1/react-native-blur";
import { usePathname } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tab } from "./components/tab";
import { tabs } from "./tabs";

export default function BottomTabs() {
	const pathname = usePathname();
	const [inPrimaryPage, setInPrimaryPage] = useAtom(inPrimaryPageAtom)

	const matchingTab = useMemo(() => tabs?.find((tab) => pathname.includes(tab.path.toString())), [pathname])
	const selectedTab = matchingTab ? matchingTab.path : null

	useEffect(() => {
		setInPrimaryPage(!!matchingTab)
	}, [matchingTab]);

	const { bottom } = useSafeAreaInsets();

	return (inPrimaryPage &&
		<Animated.View
			entering={FadeInDown.springify()}
			exiting={FadeOutDown}
			style={{
				// Modern string syntax
				boxShadow: '0px 0px 32px rgba(242, 88, 49, 0.162)',
				position: "absolute",
				bottom: bottom + 12,
				borderRadius: 34,
				alignSelf: "center",
				width: "50%",
				height: 68,
				overflow: "hidden",


			}}>
			<View style={{
				// Modern string syntax
				/* boxShadow: '0px 0px 32px rgba(242, 88, 49, 0.162)', */
				boxShadow: [{
					offsetX: 0,
					offsetY: 0,
					blurRadius: 24,
					spreadDistance: 0,
					color: 'rgba(242, 88, 49, 0.415)',
					inset: true, // This enables the inner/inset shadow
				}],
				width: "100%",
				height: "100%",


			}}>
				<BlurView
					/* overlayColor={"rgba(255, 255, 255, 0.1)"} */
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-evenly",
						width: "100%",
						height: "100%",
					}} blurType="light" blurAmount={20} >


					{tabs?.map((tab) => (
						<Tab key={tab.path.toString()} {...tab} selected={selectedTab === tab.path} />
					))}

				</BlurView>
			</View>
		</Animated.View>



	);
}
