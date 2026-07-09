import { inPrimaryPageAtom } from "@root/src/atoms/pages";
import { usePathname } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tab } from "./components/tab";
import { tabs } from "./tabs";

export default function BottomTabs() {
	const pathname = usePathname();
	const setInPrimaryPage = useSetAtom(inPrimaryPageAtom)

	const matchingTab = useMemo(() => tabs?.find((tab) => pathname.includes(tab.path.toString())), [pathname])
	const selectedTab = matchingTab ? matchingTab.path : null

	useEffect(() => {
		setInPrimaryPage(!!matchingTab)
	}, [matchingTab]);

	const { bottom } = useSafeAreaInsets();

	return (
		<View className="bg-white rounded-xl w-full items-center flex-row justify-evenly" style={{ paddingBottom: bottom + 12, paddingTop: 12 }}>
			{tabs?.map((tab) => (
				<Tab key={tab.path.toString()} {...tab} selected={selectedTab === tab.path} />
			))}
		</View>
	);
}
