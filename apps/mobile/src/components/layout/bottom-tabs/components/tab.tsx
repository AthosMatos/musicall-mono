
import { appColors } from "@/theme/colors";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import type { TabProps } from "../types";

const tabColors = {
	textSelected: appColors.primary,
	textUnselected: "#000000",
};

export const Tab = (props: TabProps) => {
	const { path, icon, selected, isPrimary, onPress, allowIcognito } = props;

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
			}}
			className={`items-center justify-center rounded-xl p-4 ${selected ? 'bg-primary/15 ' : ''}`}
		>
			{icon({ color: selected ? tabColors.textSelected : tabColors.textUnselected })}
		</TouchableOpacity>
	);
};
