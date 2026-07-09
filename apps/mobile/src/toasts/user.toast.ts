import { Toast } from "toastify-react-native";

export const userToast = {
	success: {
		update: () => Toast.show({ type: "default", text1: "Perfil atualizado com sucesso" }),
	},
	error: {
		update: (error: string) => {
			Toast.hide();
			Toast.show({
				type: "default",
				text1: error,
				text2: "Não foi possível atualizar o perfil. Tente novamente.",
				useModal: false,
			});
		},
		galleryPermission: () => {
			Toast.hide();
			Toast.show({
				type: "default",
				text1: "Permissão negada",
				text2: "Permita o acesso à galeria para escolher uma foto.",
				useModal: false,
			});
		},
	},
};
