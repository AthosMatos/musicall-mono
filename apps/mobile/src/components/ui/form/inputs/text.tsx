import { appColors } from "@/theme/colors";
import { LucideIcon } from "lucide-react-native";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { TextInputProps, TouchableOpacity, View } from "react-native";
import { InputContainer, InputError, InputLabel, StyledInput, TextInputContainer } from "./styled";

export type FormInputProps<T extends FieldValues> = TextInputProps & {
	label: string;
	control: Control<T>;
	name: Path<T>;
	icon?: {
		left?: LucideIcon
		right?: LucideIcon
		onRightIconPress?: () => void
	}
};

export const FormInput = <T extends FieldValues>({ label, icon, control, name, ...rest }: FormInputProps<T>) => {
	const LeftIcon = icon?.left
	const RightIcon = icon?.right

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState: { error } }) => (
				<InputContainer>
					<View className="flex-row items-center gap-2">
						{label && <InputLabel>{label}</InputLabel>}
						{error && <InputError>{error.message}</InputError>}
					</View>
					<TextInputContainer>
						{LeftIcon ? <LeftIcon size={20} color={appColors.neutral.medium} /> : null}
						<StyledInput {...rest} {...field} onChangeText={field.onChange} />
						{RightIcon ? <TouchableOpacity hitSlop={6} onPress={icon.onRightIconPress} disabled={!icon.onRightIconPress}>
							<RightIcon size={20} color={appColors.neutral.medium} />
						</TouchableOpacity> : null}
					</TextInputContainer>
				</InputContainer>
			)}
		/>
	);
};

export type FormInputType = typeof FormInput;