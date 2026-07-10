import { colors } from "@/theme";
import { appColors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, TextInput, TouchableOpacity, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import AppModal from "./modal";
import { AppText } from "./text";

export type SelectOption = {
	id: string;
	name: string;
};

type AppSelectProps = {
	/** Label displayed above the select input */
	label?: string;
	/** Currently selected option ID */
	value?: string | null;
	/** Callback when an option is selected */
	onChange: (id: string | null) => void;
	/** List of options to display */
	options?: SelectOption[];
	/** Placeholder text when no value is selected */
	placeholder?: string;
	/** Title displayed in the modal header */
	modalTitle: string;
	/** Error message to display */
	error?: string;
	/** Whether the select is disabled */
	disabled?: boolean;
	/** Whether the field is required (shows asterisk) */
	required?: boolean;
	/** Custom container style */
	containerStyle?: ViewStyle;
	/** Whether to show a clear button when value is selected */
	clearable?: boolean;
	/** Whether to show search input in modal (default: true if options > 10) */
	searchable?: boolean;
	/** Placeholder for search input */
	searchPlaceholder?: string;
};

export const AppSelect = ({
	label,
	value,
	onChange,
	options,
	placeholder = "Selecione uma opção",
	modalTitle,
	error,
	disabled = false,
	required = false,
	containerStyle,
	clearable = false,
	searchable,
	searchPlaceholder = "Buscar...",
}: AppSelectProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const rotation = useSharedValue(0);

	const hasError = !!error;
	const selectedOption = options?.find((opt) => opt.id === value);
	const displayValue = selectedOption?.name;

	// Filter options based on search query
	const filteredOptions = useMemo(() => {
		if (!searchQuery.trim()) {
			return options || [];
		}
		const query = searchQuery.toLowerCase().trim();
		return options?.filter((opt) => opt.name.toLowerCase().includes(query)) || [];
	}, [options, searchQuery]);

	// Animate chevron rotation
	useEffect(() => {
		rotation.value = withTiming(isOpen ? 180 : 0, { duration: 200 });
	}, [isOpen, rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const handleOpen = useCallback(() => {
		if (!disabled) {
			setIsOpen(true);
		}
	}, [disabled]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setSearchQuery(""); // Clear search when closing
	}, []);

	const handleSelect = useCallback(
		(id: string) => {
			onChange(id);
			setIsOpen(false);
			setSearchQuery(""); // Clear search when selecting
		},
		[onChange]
	);

	const handleClear = useCallback(() => {
		onChange(null);
	}, [onChange]);

	return (
		<>
			{/* Select Input */}
			<View style={containerStyle}>
				{label && (
					<AppText className="text-sm font-semibold" style={{ color: appColors.neutral.dark }}>
						{label}
						{required && <AppText style={{ color: "#ff4444" }}> *</AppText>}
					</AppText>
				)}
				<TouchableOpacity
					className={[
						"h-[50px] border rounded-lg px-4 flex-row items-center justify-between bg-white",
						disabled ? "bg-[#F5F5F5] opacity-70" : "",
						hasError ? "border-[#ff4444]" : "border-[#E5E5E5]",
					].join(" ")}
					onPress={handleOpen}
					disabled={disabled}
					activeOpacity={0.7}
				>
					<AppText
						className="text-sm flex-1"
						style={{ color: displayValue ? appColors.neutral.dark : "#999" }}
						numberOfLines={1}
					>
						{displayValue || placeholder}
					</AppText>
					<View className="flex-row items-center gap-2">
						{clearable && value && (
							<TouchableOpacity
								onPress={handleClear}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								className="p-1"
							>
								<Ionicons name="close-circle" size={18} color="#999" />
							</TouchableOpacity>
						)}
						<Animated.View style={animatedStyle}>
							<Ionicons name="chevron-down" size={20} color="#999" />
						</Animated.View>
					</View>
				</TouchableOpacity>
				{hasError && (
					<AppText className="text-xs mt-1" style={{ color: "#ff4444" }}>
						{error}
					</AppText>
				)}
			</View>

			{/* Select Modal */}
			<AppModal visible={isOpen} onClose={handleClose} title={modalTitle} useScrollView={false}>
				{searchable && (
					<View
						className="flex-row items-center mb-4 px-4 mx-4 h-11 rounded-lg border"
						style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong }}
					>
						<Ionicons name="search" size={12} color={colors.faint} style={{ marginRight: 8 }} />
						<TextInput
							className="flex-1 h-full"
							placeholder={searchPlaceholder || "Buscar..."}
							placeholderTextColor={colors.faint}
							selectionColor={colors.accent}
							style={{ color: colors.ink }}
							value={searchQuery}
							onChangeText={setSearchQuery}
							autoCorrect={false}
							autoCapitalize="none"
						/>
						{searchQuery?.length > 0 && (
							<TouchableOpacity onPress={() => setSearchQuery("")}>
								<Ionicons name="close-circle" size={12} color={colors.faint} />
							</TouchableOpacity>
						)}
					</View>
				)}

				<FlatList
					data={filteredOptions}
					keyExtractor={(item) => item.id}
					keyboardShouldPersistTaps="handled"
					renderItem={({ item }) => (
						<TouchableOpacity
							className="flex-row items-center justify-between py-4 px-4"
							style={{
								backgroundColor: value === item.id ? colors.surfaceActive : "transparent",
							}}
							onPress={() => handleSelect(item.id)}
						>
							<AppText style={{ color: colors.ink }}>{item.name}</AppText>
							{value === item.id && (
								<Ionicons name="checkmark-circle" size={16} color={colors.accent} />
							)}
						</TouchableOpacity>
					)}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						searchable && searchQuery?.length > 0 ? (
							<View className="py-4 items-center">
								<AppText style={{ color: colors.meta }}>Nenhum resultado encontrado</AppText>
							</View>
						) : null
					}
					style={{ maxHeight: 600 }}
				/>
			</AppModal>
		</>
	);
};
