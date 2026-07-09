import { FolderOpen, Home, Settings, User } from "lucide-react-native";
import type { TabType } from "./types";

const iconSize = 22;

export const tabs: TabType[] = [
	{
		path: "/home",
		icon: ({ color }) => <Home size={iconSize} color={color} />,
	},
	{
		path: "/analyses",
		icon: ({ color }) => <FolderOpen size={iconSize} color={color} />,
	},
	{
		path: "/config",
		icon: ({ color }) => <Settings size={iconSize} color={color} />,
	},
	{
		path: "/user",
		icon: ({ color }) => <User size={iconSize} color={color} />,
	},

];
