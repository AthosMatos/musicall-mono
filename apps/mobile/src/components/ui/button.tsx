import { appColors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
	ActivityIndicator,
	TouchableOpacity,
	type TouchableOpacityProps,
	View,
} from "react-native";
import { AppText } from "./text";

const variantStyles = {
	default: {
		backgroundColor: appColors.primary,
		textColor: "#FFFFFF",
		iconColor: "#FFFFFF",
		borderColor: "transparent",
		borderWidth: 0,
	},
	outline: {
		backgroundColor: "white",
		textColor: appColors.primary_dark,
		iconColor: appColors.primary_dark,
		borderColor: appColors.neutral.light_medium,
		borderWidth: 1,
	},
	disabled: {
		backgroundColor: appColors.neutral.light,
		textColor: appColors.neutral.medium,
		iconColor: appColors.neutral.medium,
		borderColor: appColors.neutral.light_medium,
		borderWidth: 1,
	},
	transparent: {
		backgroundColor: "transparent",
		textColor: appColors.primary_dark,
		iconColor: appColors.primary_dark,
		borderColor: "transparent",
		borderWidth: 0,
	},
	delete: {
		backgroundColor: "white",
		textColor: appColors.feedback.danger,
		iconColor: appColors.feedback.danger,
		borderColor: appColors.neutral.light_medium,
		borderWidth: 1,
	}
};

type ButtonVariant = keyof typeof variantStyles;

type AppButtonProps = Omit<TouchableOpacityProps, "children"> & {
	variant?: ButtonVariant;
	children?: string;
	customIcon?: ReactNode;
	icon?: keyof typeof Ionicons.glyphMap;
	iconColor?: string;
	isLoading?: boolean;
	fitWidth?: boolean;
	small?: boolean;
	textColor?: string;
};

export const AppButton = ({
	variant = "default",
	children,
	customIcon,
	isLoading = false,
	disabled,
	icon,
	style,
	iconColor,
	fitWidth,
	small,
	textColor,
	...props
}: AppButtonProps) => {
	const isIconOnly = (icon || customIcon) && !children;
	const isDisabled = disabled || isLoading;
	const variantStyle = isDisabled ? variantStyles.disabled : variantStyles[variant];

	return (
		<TouchableOpacity
			style={[
				{
					backgroundColor: variantStyle.backgroundColor,
					borderColor: variantStyle.borderColor,
					borderWidth: variantStyle.borderWidth,
				},
				style,
			]}
			disabled={isDisabled}
			activeOpacity={0.8}
			{...props}
			className={[
				props.className,
				"justify-center items-center",
				isIconOnly
					? "w-[50px] rounded-full p-3"
					: `rounded-lg`,
				small ? "h-10 px-2" : " h-[50px] px-4",
			]
				.join(" ")
				.trim()}
		>
			{isLoading ? (
				<ActivityIndicator size="small" color={textColor ?? variantStyle.textColor} />
			) : (
				<View className="flex-row items-center justify-center gap-2">
					{customIcon}
					{icon && <Ionicons name={icon} size={20} color={iconColor ?? variantStyle.iconColor} />}
					{children && (
						<AppText style={{ fontSize: 16, color: textColor ?? variantStyle.textColor, }}>{children}</AppText>
					)}
				</View>
			)}
		</TouchableOpacity>
	);
};
