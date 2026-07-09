import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import type { CurrencyInputProps } from "react-native-currency-input";
import { InputContainer, InputError, InputLabel, StyledCurrencyInput, TextInputContainer } from "./styled";

export type FormCurrencyInputProps<T extends FieldValues> = Omit<CurrencyInputProps, "value"> & {
	label: string;
	control: Control<T>;
	name: Path<T>;
};

export const FormCurrencyInput = <T extends FieldValues>({
	label,
	control,
	name,
	...rest
}: FormCurrencyInputProps<T>) => {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState: { error } }) => (
				<InputContainer>
					{label && <InputLabel>{label}</InputLabel>}
					{error && <InputError>{error.message}</InputError>}
					<TextInputContainer>
						<StyledCurrencyInput {...rest} {...field} value={field.value} /* onChangeText={field.onChange} */ onChangeValue={field.onChange} />
					</TextInputContainer>
				</InputContainer>
			)}
		/>
	);
};

export type FormCurrencyInputType = typeof FormCurrencyInput;
