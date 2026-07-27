import { colors } from "@/theme";
import { ChevronLeft, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
	Dimensions,
	type DimensionValue,
	Keyboard,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
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
	const keyboardOffset = useSharedValue(0);

	const containerAnimatedStyle = useAnimatedStyle(() => {
		return {
			bottom: containerBottom.value,
			transform: [{ translateY: keyboardOffset.value }],
		};
	}, [containerBottom, keyboardOffset]);

	useEffect(() => {
		containerBottom.value = withTiming(visible ? "0%" : `-100%`, {
			duration,
		});
	}, [visible, containerBottom]);

	// The sheet is bottom-anchored inside a native Modal, so the keyboard covers
	// it. RN's own Keyboard events are used rather than react-native-keyboard-
	// controller because that library does not observe the keyboard inside a
	// separate Android modal window.
	useEffect(() => {
		if (!visible) return;
		const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

		const onShow = Keyboard.addListener(showEvent, (event) => {
			// The sheet already clears the bottom inset, so don't double-count it.
			const lift = Math.max(0, event.endCoordinates.height - insets.bottom);
			keyboardOffset.value = withTiming(-lift, { duration });
		});
		const onHide = Keyboard.addListener(hideEvent, () => {
			keyboardOffset.value = withTiming(0, { duration });
		});

		return () => {
			onShow.remove();
			onHide.remove();
		};
	}, [visible, insets.bottom, keyboardOffset]);

	const [headerContainerHeight, setHeaderContainerHeight] = useState(0);

	return (
		<Reanimated.View
			className="mx-4 rounded-3xl absolute left-0 right-0 overflow-hidden border"
			style={[
				containerAnimatedStyle,
				{
					marginBottom: insets.bottom + 10,
					maxHeight: height,
					backgroundColor: colors.bg,
					borderColor: colors.accentSoft,
					// inner accent glow — mirrors the bottom tabs inset shadow
					boxShadow: [
						{
							offsetX: 0,
							offsetY: 0,
							blurRadius: 24,
							spreadDistance: 0,
							color: "rgba(242, 88, 49, 0.415)",
							inset: true,
						},
					],
				},
			]}
		>
			<View
				className="absolute top-0 z-10 w-full"
				style={{ backgroundColor: "rgba(23, 20, 15, 0.92)" }}
				onLayout={(e) => setHeaderContainerHeight(e.nativeEvent.layout.height)}
			>
				{(title || rightComponent || icon) && (
					<View className="flex-row items-center justify-between px-4 py-4">
						<ChevronLeft opacity={0} size={28} color={colors.ink2} onPress={onClose} />
						{title && (
							<AppText
								className="shrink text-center text-lg font-bold"
								style={{ color: colors.ink }}
							>
								{title}
							</AppText>
						)}
						<TouchableOpacity
							onPress={onClose}
							className="p-2"
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<X size={28} color={colors.ink2} />
						</TouchableOpacity>
					</View>
				)}
				{subtitle && (
					<AppText
						style={{
							paddingHorizontal: padChildren ? 24 : undefined,
							color: colors.ink2,
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
