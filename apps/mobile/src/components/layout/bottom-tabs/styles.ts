import { appColors } from "@/theme/colors";
import { StyleSheet } from "react-native";

export const bottomTabStyles = StyleSheet.create({

	containerWrapper: {
		backgroundColor: 'white',
		borderRadius: 12,
		width: "100%",
		alignItems: "center",
		display: 'flex',
		flexDirection: "row",
		justifyContent: "space-evenly"
	},

	primaryTab: {
		backgroundColor: appColors.primary,
		aspectRatio: 1,
		bottom: 20,
	},
	tabLabel: {
		fontSize: 10,
		fontWeight: "600",
	},
});
