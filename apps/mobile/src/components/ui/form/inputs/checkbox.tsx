import { appColors } from "@/theme/colors";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Pressable, View } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    withSpring
} from "react-native-reanimated";
import { InputContainer, InputLabel } from "./styled";

export interface CheckBoxProps<T extends FieldValues> {
    label: string;
    control: Control<T>;
    name: Path<T>;
}

export const FormCheckBox = <T extends FieldValues>({ control, name, label }: CheckBoxProps<T>) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

    const trackColors = { on: appColors.primary, off: "transparent" };
    const trackAnimatedStyle = useAnimatedStyle(() => {
        const color = interpolateColor(isEnabled ? 1 : 0, [0, 1], [trackColors.off, trackColors.on]);
        const colorValue = withSpring(color);

        return {
            backgroundColor: colorValue,
        };
    });

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <View onLayout={() => {
                    setIsEnabled(field.value)
                }} className="flex-row gap-2 items-center">
                    <InputContainer>
                        <Pressable
                            onPress={() => {
                                field.onChange(!field.value);
                                toggleSwitch();
                            }}
                        >
                            <Animated.View
                                className="w-7 h-7 border border-gray-500 rounded-md items-center justify-center"
                                style={trackAnimatedStyle}
                            >
                                {field.value && <Check size={16} color={'white'} />}
                            </Animated.View>
                        </Pressable>
                    </InputContainer>
                    {label && <InputLabel>{label}</InputLabel>}
                </View>
            )}
        />
    );
};

export type FormCheckBoxType = typeof FormCheckBox;