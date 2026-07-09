import { Toast } from "toastify-react-native";

export const authToast = {
	wrongCredentials: (error: string) => {
		Toast.hide();
		Toast.show({
			type: "default",
			text1: error,
			text2: "Por favor, faça login novamente",
			useModal: false,
		});
	},
	passwordReset: () => {
		Toast.hide();
		Toast.show({
			type: "default",
			text1: "Senha redefinida com sucesso",
			text2: "Faça login com a nova senha",
			useModal: false,
		});
	},
	passwordResetError: (error: string) => {
		Toast.hide();
		Toast.show({
			type: "default",
			text1: error,
			text2: "Não foi possível redefinir a senha. Tente novamente.",
			useModal: false,
		});
	},
};
