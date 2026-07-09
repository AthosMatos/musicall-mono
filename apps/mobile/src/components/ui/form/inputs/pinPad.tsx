import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo, useState } from "react";
import {
	type Control,
	Controller,
	type FieldValues,
	type Path
} from "react-hook-form";
import { FlatList, StyleSheet } from "react-native";
import styled from "styled-components/native";

const Pad = styled.TouchableOpacity`
   flex: 1;
    aspect-ratio: 1;
   background-color: #a5a5a5;
    border-radius: 10px;
    justify-content: center;
    align-items: center;
`;

const FinishingPad = styled.TouchableOpacity`
   flex: 1;
   background-color: #a5a5a5;
    border-radius: 10px;
    justify-content: center;
    align-items: center;
	padding-vertical: 24px;
`;

const PadText = styled.Text`
    font-size: 24px;
    font-weight: bold;
`;

const PinContainer = styled.TouchableOpacity`
    background-color: #f0f0f0;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
`;

const PinDisplay = styled.Text`
    font-size: 32px;
    font-weight: bold;
    text-align: right;
    padding: 12px;`;

const Container = styled.View`
    padding: 12px;
    border-radius: 10px;
    background-color: #cacaca;
`;

type PinPadProps<T extends FieldValues> = {
	label: string;
	control: Control<T>;
	name: Path<T>;
};

export const PinPad = <T extends FieldValues>({ label, control, name }: PinPadProps<T>) => {
	const [value, setValue] = useState("0");
	const [padOpen, setPadOpen] = useState(false);

	const data = useMemo(() => {
		const arr = [];
		for (let i = 0; i < 9; i++) {
			arr.push(i + 1);
		}
		arr.push(".");
		arr.push(0);
		arr.push("delete");
		return arr;
	}, []);

	const onKeyPress = (key: string) => {
		if (key === "delete") {
			setValue((prev) => prev.slice(0, -1) || "0");
		} else if (key === ".") {
			if (!value.includes(".")) {
				setValue((prev) => `${prev}.`);
			}
		} else {
			setValue((prev) => (prev === "0" ? key : prev + key));
		}
	};

	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<Container style={{ borderRadius: 10, gap: 12 }}>
					<PinContainer onPress={() => setPadOpen((prev) => !prev)}>
						<PinDisplay>{value}</PinDisplay>
					</PinContainer>

					{padOpen && (
						<FlatList
							scrollEnabled={false}
							numColumns={3}
							style={styles.list}
							contentContainerStyle={styles.columnWrapper}
							columnWrapperStyle={styles.columnWrapper}
							data={data}
							renderItem={({ item, index }) => (
								<Pad
									key={index}
									onPress={() => {
										onKeyPress(item.toString());
										field.onChange(value);
									}}
								>
									{item === "delete" ? (
										<FontAwesome6 name="delete-left" size={24} color="black" />
									) : (
										<PadText>{item}</PadText>
									)}
								</Pad>
							)}
							ListFooterComponent={
								<FinishingPad onPress={() => setPadOpen(false)}>
									<FontAwesome6 name="check" size={24} color="black" />
								</FinishingPad>
							}
						/>
					)}
				</Container>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	list: {},
	columnWrapper: {
		gap: 12,
	},
});
