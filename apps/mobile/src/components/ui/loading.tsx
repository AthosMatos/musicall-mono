import { appColors } from "@/theme/colors";
import { ActivityIndicator, ActivityIndicatorProps } from "react-native";

export const AppLoad = (props: ActivityIndicatorProps) => {
    return <ActivityIndicator color={appColors.secondary} {...props} />

}