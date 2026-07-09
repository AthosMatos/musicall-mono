import { formatToBrazilianDate } from "@/utils/date.utils";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { TouchableOpacity } from "react-native";
import { InputContainer, InputError, InputLabel, InputText, TextInputContainer } from "./styled";



export type DateInputProps<T extends FieldValues> = {
	label: string;
	control: Control<T>;
	name: Path<T>;
	placeholder?: string;
};

export const FormDateInput = <T extends FieldValues>({ label, control, name, placeholder }: DateInputProps<T>) => {
	const [show, setShow] = useState(false);

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState: { error } }) => (
				<>
					<InputContainer>
						{label && <InputLabel>{label}</InputLabel>}
						{error && <InputError>{error.message}</InputError>}
						<TouchableOpacity activeOpacity={0.8} onPress={() => setShow(true)}>
							<TextInputContainer>
								<InputText isPlaceholder={!field.value}>
									{field.value
										? formatToBrazilianDate(new Date(field.value).toISOString())
										: placeholder || "Select a date"}
								</InputText>
							</TextInputContainer>
						</TouchableOpacity>

					</InputContainer>
					{show && (
						<DateTimePicker
							testID="dateTimePicker"
							value={field.value ? new Date(field.value) : new Date()}
							mode={"date"}
							is24Hour={true}
							onChange={(event, date) => {
								setShow(false);
								if (date) {
									field.onChange(date);
								}
							}}
						/>
					)}
				</>
			)}
		/>
	);
};


export type DateInputType = typeof FormDateInput;