import { appColors } from "@/theme/colors";
import { ChevronLeft, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Dimensions, type DimensionValue, ScrollView, TouchableOpacity, View } from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../text";
import type { AppModalProps } from "./types";

const duration = 220;

export const AppModalContent = (props: AppModalProps) => {
	const {
		visible,
		onClose,
		title,
		children,
		footer,
		contentStyle,
		padChildren,
		footerStyle,
		subtitle,
		rightComponent,
		height = Dimensions.get("window").height * 0.9,
		icon,
		scrollEnabled,
		useScrollView = true,
		header,
		headerStyle,
		style,
		onScrollPercent,
	} = props;
	const insets = useSafeAreaInsets();
	const containerBottom = useSharedValue<DimensionValue>("-100%");

	const containerAnimatedStyle = useAnimatedStyle(() => {
		return {
			bottom: containerBottom.value,
		};
	}, [containerBottom]);

	useEffect(() => {
		containerBottom.value = withTiming(visible ? "0%" : `-100%`, {
			duration,
		});
	}, [visible, containerBottom]);

	const [headerContainerHeight, setHeaderContainerHeight] = useState(0);

	return (
		<Reanimated.View
			className="bg-white mx-4 rounded-3xl absolute left-0 right-0 overflow-hidden"
			style={[containerAnimatedStyle, { marginBottom: insets.bottom + 10, maxHeight: height }]}
		>
			<View
				className="absolute top-0 z-10 w-full"
				style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
				onLayout={(e) => setHeaderContainerHeight(e.nativeEvent.layout.height)}
			>
				{(title || rightComponent || icon) && (
					<View className="flex-row items-center justify-between px-4 py-4">
						<ChevronLeft opacity={0} size={28} color={appColors.neutral.dark} onPress={onClose} />
						{title && (
							<AppText
								className="shrink text-center text-lg font-bold"
								style={{ color: appColors.neutral.dark }}
							>
								{title}
							</AppText>
						)}
						<TouchableOpacity
							onPress={onClose}
							className="p-2"
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<X size={28} color={appColors.neutral.dark} />
						</TouchableOpacity>
					</View>
				)}
				{subtitle && (
					<AppText
						style={{
							paddingHorizontal: padChildren ? 24 : undefined,
							color: appColors.neutral.dark,
						}}
					>
						{subtitle}
					</AppText>
				)}
				{header && <View style={headerStyle}>{header}</View>}
			</View>
			{useScrollView ? (
				<ScrollView
					onScroll={(event) => {
						//percent scrolled
						const percentScrolled =
							(event.nativeEvent.contentOffset.y /
								(event.nativeEvent.contentSize.height -
									event.nativeEvent.layoutMeasurement.height)) *
							100;
						onScrollPercent?.(percentScrolled);
					}}
					scrollEnabled={scrollEnabled}
					showsVerticalScrollIndicator={false}
					style={[padChildren ? { padding: 24 } : null, style]}
					contentContainerStyle={[contentStyle, { paddingTop: headerContainerHeight }]}
				>
					{children}
				</ScrollView>
			) : (
				<View style={[padChildren ? { padding: 24 } : null, style]}>
					<View className="pb-4" style={[contentStyle, { paddingTop: headerContainerHeight }]}>
						{children}
					</View>
				</View>
			)}

			{footer && (
				<View className="pb-3 px-4 gap-2" style={footerStyle}>
					{footer}
				</View>
			)}
		</Reanimated.View>
	);
};
