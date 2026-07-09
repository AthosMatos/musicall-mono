import type { Href } from "expo-router";

export interface TabType {
	path: Href;
	icon: ({ color }: { color: string }) => React.JSX.Element;
	isPrimary?: boolean;
	allowIcognito?: boolean;
}

export interface TabProps extends TabType {
	selected?: boolean;
	onPress?: () => void;
}
