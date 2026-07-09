import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import type { StyleProp, ViewStyle } from "react-native";


type AppGradientViewProps = {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    colors: LinearGradientProps["colors"];
    start?: LinearGradientProps["start"];
    end?: LinearGradientProps["end"];
} & Omit<LinearGradientProps, "colors">;

export function AppGradientView({
    children,
    style,
    colors,
    start = { x: 0.5, y: 0 },
    end = { x: 0.5, y: 1 },
    ...rest
}: AppGradientViewProps) {
    return (
        <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={[{ flex: 1 }, style]}
            {...rest}
        >
            {children}
        </LinearGradient>
    );
}
