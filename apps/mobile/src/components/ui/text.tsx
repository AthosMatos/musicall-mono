import { StyleSheet, Text, type TextProps } from "react-native";

export const AppText = (
	props: TextProps & { textColor?: "base" | "secondary" | "tertiary" | "quaternary" }
) => {
	return (
		<Text
			{...props}
			style={[styles.default, props.textColor && styles[props.textColor], props.style]}
		/>
	);
};

const styles = StyleSheet.create({
	default: {
		fontFamily: "FiraSans",
	},
	base: {
		color: "#000000",
	},
	secondary: {
		color: "#717172",
	},
	tertiary: {
		color: "#A1A1A1",
	},
	quaternary: {
		color: "#D0D0D0",
	},
});
