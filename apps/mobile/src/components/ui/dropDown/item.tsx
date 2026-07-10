import { colors } from "@/theme";
import { TouchableHighlight, View } from "react-native";
import type { AppDropDownItem } from ".";
import { AppText } from "../text";

export const Item = ({ item, onPress }: { item: AppDropDownItem; onPress: () => void }) => (
    <TouchableHighlight underlayColor={colors.surfaceActive} onPress={onPress} className="p-3 rounded-md">
        <View className="flex-row items-center justify-between gap-4">
            <AppText
                className="text-[15px] font-medium"
                style={{ color: item.textColor || colors.ink }}
            >
                {item.label}
            </AppText>
            {item.icon}
        </View>
    </TouchableHighlight>
);
