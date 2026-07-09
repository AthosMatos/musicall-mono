import BlurView from "@sbaiahmed1/react-native-blur";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { AppModalContent } from "./content";
import type { AppModalProps } from "./types";

const CLOSE_ANIMATION_DURATION = 500;

const ModalOverlay = ({ onClose }: { onClose: () => void }) => {
	return (
		<>
			<BlurView blurType="dark" style={[StyleSheet.absoluteFill]} blurAmount={20} />
			<TouchableWithoutFeedback onPress={onClose}>
				<View className="absolute inset-0" />
			</TouchableWithoutFeedback>
		</>
	);
};

export default function AppModal(props: AppModalProps) {
	const { visible, onClose, children } = props;
	const [modalMounted, setModalMounted] = useState(visible);

	useEffect(() => {
		if (visible) {
			setModalMounted(true);
		} else {
			const timer = setTimeout(() => setModalMounted(false), CLOSE_ANIMATION_DURATION);
			return () => clearTimeout(timer);
		}
	}, [visible]);

	return (
		<Modal
			visible={modalMounted}
			onRequestClose={onClose}
			animationType="fade"
			transparent
			statusBarTranslucent
		>
			<ModalOverlay onClose={onClose} />
			<AppModalContent {...props}>{children}</AppModalContent>
		</Modal>
	);
};
