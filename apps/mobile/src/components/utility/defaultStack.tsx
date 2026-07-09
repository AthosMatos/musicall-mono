import { appColors } from "@/theme/colors";
import { Stack } from "expo-router";

export const DefaultStack = () => {
    return (
        <Stack
            screenOptions={{
                animation: "slide_from_right",
                headerShown: false,
                contentStyle: {
                    backgroundColor: appColors.transparent,
                },
            }}
        />
    );
};
