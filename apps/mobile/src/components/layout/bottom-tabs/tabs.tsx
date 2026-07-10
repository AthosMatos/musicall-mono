import { DiscAlbum, Home, Music4 } from "lucide-react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import type { TabType } from "./types";

const iconSize = 22;
const strokeWidth = 1;
const selectedStrokeWidth = 2;

const AnimatedIcon = ({ icon, selected }: { icon: React.ReactNode; selected?: boolean }) => {
	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: withTiming(selected ? 1.1 : 1, { duration: 200 }) }],
		}
	}, [selected])

	return (
		<Animated.View style={animatedStyle}>
			{icon}
		</Animated.View>
	);
}

export const tabs: TabType[] = [
	{
		path: "/home",
		icon: ({ color, selected }) => <AnimatedIcon icon={<Home stroke={color} strokeWidth={selected ? selectedStrokeWidth : strokeWidth} size={iconSize} color={color} />} selected={selected} />,
	},
	{
		path: "/albums",
		icon: ({ color, selected }) => <AnimatedIcon icon={<DiscAlbum stroke={color} strokeWidth={selected ? selectedStrokeWidth : strokeWidth} size={iconSize} color={color} />} selected={selected} />,
	},
	{
		path: "/songs",
		icon: ({ color, selected }) => <AnimatedIcon icon={<Music4 stroke={color} strokeWidth={selected ? selectedStrokeWidth : strokeWidth} size={iconSize} color={color} />} selected={selected} />,
	}
];
