import { useCallback, useState } from "react";
import { Modal, Pressable, type StyleProp, TouchableOpacity, View, type ViewStyle } from "react-native";
import Reanimated from "react-native-reanimated";
import { dropDownStyles } from "./styles";
import { type DropDownAnimation, useAppDropdown } from "./useAppDropdown";

export type AppDropDownItem = {
    icon?: React.ReactNode;
    label: string;
    onPress?: () => void;
    textColor?: string;
};

export type DropDownAnchorSide = "left" | "right";

interface AppDDropDownProps {
    children?: React.ReactNode;
    data: AppDropDownItem[];
    animationIn?: DropDownAnimation;
    animationOut?: DropDownAnimation;
    anchorSide?: DropDownAnchorSide;
    style?: StyleProp<ViewStyle>;
    disconsiderInsets?: boolean;
    /**
     * When true, renders the dropdown list inline (absolutely positioned next to the anchor)
     * instead of inside a Modal. Use this when the anchor lives inside a scrollable container
     * — the list will follow the anchor naturally as the user scrolls.
     */
    inline?: boolean;
}

export default function AppDropDown({
    data,
    children,
    animationIn = "fadeDown",
    animationOut = "fadeUp",
    style,
    anchorSide = "right",
    disconsiderInsets,
    inline,
}: AppDDropDownProps) {
    const { isOpen, close, entering, anchorListStyle, handleToggle, anchorRef, renderItem, exiting } =
        useAppDropdown({
            animationIn,
            animationOut,
            anchorSide,
            disconsiderInsets,
        });

    const [inlineOpen, setInlineOpen] = useState(false);
    const toggleInline = useCallback(() => setInlineOpen((p) => !p), []);
    const closeInline = useCallback(() => setInlineOpen(false), []);

    if (inline) {
        return (
            <View className="relative overflow-visible">
                <TouchableOpacity activeOpacity={0.8} hitSlop={4} onPress={toggleInline} style={style}>
                    {children}
                </TouchableOpacity>
                {inlineOpen ? (
                    <>
                        <Pressable
                            onPress={closeInline}
                            className="absolute -top-[10000px] -bottom-[10000px] -left-[10000px] -right-[10000px] z-[99998]"
                        />
                        <Reanimated.View
                            entering={entering}
                            exiting={exiting}
                            style={[
                                dropDownStyles.inlineList,
                                anchorSide === "left" ? { left: 0 } : { right: 0 },
                            ]}
                        >
                            {data.map((item) => (
                                <View key={item.label}>{renderItem({ item })}</View>
                            ))}
                        </Reanimated.View>
                    </>
                ) : null}
            </View>
        );
    }

    return (
        <View className="relative overflow-visible">
            <View ref={anchorRef} collapsable={false}>
                <TouchableOpacity activeOpacity={0.8} hitSlop={4} onPress={handleToggle} style={style}>
                    {children}
                </TouchableOpacity>
            </View>
            <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
                <Pressable className="flex-1" onPress={close} />
                <Reanimated.View entering={entering} exiting={exiting} style={anchorListStyle}>
                    <Reanimated.FlatList
                        contentContainerStyle={{ padding: 4 }}
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.label.toString()}
                    />
                </Reanimated.View>
            </Modal>
        </View>
    );
}
