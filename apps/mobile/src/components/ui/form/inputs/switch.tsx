import React, { useState } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Pressable } from "react-native";
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { InputContainer, InputError, InputLabel } from "./styled";

export interface SwitchProps<T extends FieldValues> {
    label: string;
    control: Control<T>;
    name: Path<T>;
}

export const FormSwitch = <T extends FieldValues>({ control, name, label }: SwitchProps<T>) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

    const height = useSharedValue(0);
    const width = useSharedValue(0);
    const trackColors = { on: "#82cab2", off: "#fa7f7c" };
    const trackAnimatedStyle = useAnimatedStyle(() => {
        const color = interpolateColor(isEnabled ? 1 : 0, [0, 1], [trackColors.off, trackColors.on]);
        const colorValue = withSpring(color);

        return {
            backgroundColor: colorValue,
            borderRadius: height.value / 2,
        };
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => {
        const moveValue = interpolate(isEnabled ? 1 : 0, [0, 1], [0, width.value - height.value]);
        const translateValue = withSpring(moveValue);

        return {
            transform: [{ translateX: translateValue }],
            borderRadius: height.value / 2,
        };
    });

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <InputContainer>
                    {label && <InputLabel>{label}</InputLabel>}
                    {error && <InputError>{error.message}</InputError>}

                    <Pressable
                        onPress={() => {
                            field.onChange(!isEnabled);
                            toggleSwitch();
                        }}
                    >
                        <Animated.View
                            onLayout={(e) => {
                                height.value = e.nativeEvent.layout.height;
                                width.value = e.nativeEvent.layout.width;
                            }}
                            className="w-20 h-10 p-1"
                            style={trackAnimatedStyle}
                        >
                            <Animated.View
                                className="h-full aspect-square bg-white"
                                style={thumbAnimatedStyle}
                            ></Animated.View>
                        </Animated.View>
                    </Pressable>
                </InputContainer>
            )}
        />
    );
};

export type FormSwitchType = typeof FormSwitch;