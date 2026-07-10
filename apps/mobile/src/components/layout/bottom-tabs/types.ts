import type { Href } from "expo-router";

export interface TabType {
	path: Href;
	icon: ({ color, selected }: { color: string, selected?: boolean }) => React.JSX.Element;
}

export interface TabProps extends TabType {
	selected?: boolean;
	onPress?: () => void;
}
