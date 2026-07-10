import { AppIcon } from "@/components/icon";
import { colors } from "@/theme";
import { inPrimaryPageAtom } from "@root/src/atoms/pages";
import { router } from "expo-router";
import { useAtomValue } from "jotai";
import { ChevronLeft } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import Animated, { SlideInLeft, SlideOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logo = require('../../../assets/logo.png')

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export default function Header() {
    const isInPrimaryPage = useAtomValue(inPrimaryPageAtom)
    const { top } = useSafeAreaInsets()

    return <View
        className={`items-center justify-center border-b border-b-stone-300`}
        style={{ flex: 0, paddingTop: top, paddingBottom: top / 2 }}>
        {!isInPrimaryPage && <AnimatedTouchable
            entering={SlideInLeft.springify()}
            exiting={SlideOutLeft}
            style={{
                top
            }} className="absolute left-4 items-center justify-center h-full" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft size={24} color={'#262626'} />
        </AnimatedTouchable>}
        {/* <Image source={logo} style={{
            width: 120, aspectRatio: 4.13,
        }} /> */}
        <AppIcon stroke={colors.accent} size={80} />
    </View>



}