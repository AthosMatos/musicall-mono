import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Platform, type View } from "react-native";
import {
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    FadeOutDown,
    FadeOutLeft,
    FadeOutRight,
    FadeOutUp,
    SlideInDown,
    SlideInLeft,
    SlideInRight,
    SlideInUp,
    SlideOutDown,
    SlideOutLeft,
    SlideOutRight,
    SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppDropDownItem } from ".";
import { Item } from "./item";
import { dropDownStyles } from "./styles";

export type DropDownAnimation =
    | "fadeDown"
    | "fadeUp"
    | "fadeLeft"
    | "fadeRight"
    | "slideInDown"
    | "slideInUp"
    | "slideInLeft"
    | "slideInRight";

interface UseAppDropdownProps {
    animationIn: DropDownAnimation;
    animationOut: DropDownAnimation;
    anchorSide?: "left" | "right";
    disconsiderInsets?: boolean;
}

export function useAppDropdown({
    animationIn,
    animationOut,
    anchorSide = "right",
    disconsiderInsets,
}: UseAppDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [childrenHeight, setChildrenHeight] = useState(0);

    const close = useCallback(() => setIsOpen(false), []);

    const entering = useMemo(() => {
        switch (animationIn) {
            case "fadeDown":
                return FadeInDown;
            case "fadeUp":
                return FadeInUp;
            case "fadeLeft":
                return FadeInLeft;
            case "fadeRight":
                return FadeInRight;
            case "slideInDown":
                return SlideInDown;
            case "slideInUp":
                return SlideInUp;
            case "slideInLeft":
                return SlideInLeft;
            case "slideInRight":
                return SlideInRight;
        }
    }, [animationIn]);

    const exiting = useMemo(() => {
        switch (animationOut) {
            case "fadeDown":
                return FadeOutDown;
            case "fadeUp":
                return FadeOutUp;
            case "fadeLeft":
                return FadeOutLeft;
            case "fadeRight":
                return FadeOutRight;
            case "slideInDown":
                return SlideOutDown;
            case "slideInUp":
                return SlideOutUp;
            case "slideInLeft":
                return SlideOutLeft;
            case "slideInRight":
                return SlideOutRight;
        }
    }, [animationOut]);

    const insets = useSafeAreaInsets();

    const anchorRef = useRef<View>(null);
    const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0, width: 0 });

    const handleToggle = useCallback(() => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }
        // Measure fresh on every open — anchor may have moved (FlatList scroll, layout changes).
        // Only open the modal after measurement completes so the entering animation
        // uses the up-to-date position instead of the stale one.
        anchorRef.current?.measureInWindow((x, y, width, height) => {
            // On iOS, measureInWindow already accounts for safe area, so don't add insets.top
            // On Android, we need to adjust for the top inset (status bar)
            const yOffset = Platform.OS === "ios" ? 0 : insets.top;
            setAnchorPosition({ x, y: y + (disconsiderInsets ? 0 : yOffset), width });
            setChildrenHeight(height);
            setIsOpen(true);
        });
    }, [isOpen, insets.top, disconsiderInsets]);

    const anchorListStyle = useMemo(() => {
        return [
            dropDownStyles.list,
            {
                top: anchorPosition.y + 8 + childrenHeight,
                minWidth: anchorPosition.width,
                ...(anchorSide === "left"
                    ? { left: anchorPosition.x }
                    : {
                        right: Dimensions.get("window").width - (anchorPosition.x + anchorPosition.width),
                    }),
            },
        ];
    }, [anchorPosition, anchorSide, childrenHeight]);

    const renderItem = useCallback(
        ({ item }: { item: AppDropDownItem }) => {
            return (
                <Item
                    item={item}
                    onPress={() => {
                        item.onPress?.();
                        close();
                    }}
                />
            );
        },
        [close]
    );

    return {
        isOpen,
        close,
        entering,
        exiting,
        anchorRef,
        anchorListStyle,
        renderItem,
        handleToggle,
    };
}
