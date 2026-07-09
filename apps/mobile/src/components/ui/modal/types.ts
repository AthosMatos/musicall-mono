import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type AppModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children?: ReactNode;
    footer?: ReactNode;
    contentStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    padChildren?: boolean;
    footerStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    rightComponent?: ReactNode;
    height?: number;
    icon?: ReactNode;
    scrollEnabled?: boolean;
    useScrollView?: boolean;
    header?: ReactNode;
    onScrollPercent?: (percent: number) => void;
};
