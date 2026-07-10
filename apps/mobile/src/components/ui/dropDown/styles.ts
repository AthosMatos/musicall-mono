import { colors } from "@/theme";
import { StyleSheet } from "react-native";

// Appearance for the animated list surfaces. Reanimated views don't take nativewind
// classNames cleanly, so these stay as inline styles using the app palette.
// Everything else in this component is styled with nativewind classNames.
export const dropDownStyles = StyleSheet.create({
    list: {
        position: "absolute",
        backgroundColor: colors.surface,
        borderColor: colors.borderStrong,
        borderWidth: 1,
        borderRadius: 12,
        zIndex: 99999,
        minWidth: "100%",
    },
    inlineList: {
        position: "absolute",
        top: "100%",
        marginTop: 4,
        backgroundColor: colors.surface,
        borderColor: colors.borderStrong,
        borderWidth: 1,
        borderRadius: 12,
        padding: 4,
        elevation: 12,
        zIndex: 99999,
        minWidth: 160,
    },
});
