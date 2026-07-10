
import { colors } from "@/theme";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import type { TabProps } from "../types";

const tabColors = {
	textSelected: colors.highlight,
	textUnselected: "#ffffff",
};

export const Tab = (props: TabProps) => {
	const { path, icon, selected, onPress } = props;

	const handlePress = () => {
		onPress?.();
		if (!selected) {
			router.navigate(path);
		}
	}

	return (
		<TouchableOpacity
			activeOpacity={0.5}
			disabled={selected}
			hitSlop={10}
			onPress={() => {
				/* if (allowIcognito) { handlePress() }
				else { handleIsIcognito(() => handlePress()) } */

				handlePress()
			}}/* ${selected ? 'bg-primary/15 ' : ''} */
			className={`items-center justify-center rounded-xl p-4 `}
		>
			{icon({ color: selected ? tabColors.textSelected : tabColors.textUnselected, selected })}
		</TouchableOpacity>
	);
};
