import { Toast } from "toastify-react-native";

const showError = (text1: string, text2: string) => {
	Toast.hide();
	Toast.show({ type: "default", text1, text2, useModal: false });
};

export const analysesToast = {
	error: {
		get: (error: string) =>
			showError(error, "Não foi possível carregar as análises. Tente novamente mais tarde."),
		getbyId: (error: string) =>
			showError(error, "Não foi possível carregar a análise. Tente novamente mais tarde."),
		post: (error: string) =>
			showError(error, "Não foi possível criar a análise. Tente novamente mais tarde."),
		put: (error: string) =>
			showError(error, "Não foi possível atualizar a análise. Tente novamente mais tarde."),
		patch: (error: string) =>
			showError(error, "Não foi possível atualizar a análise. Tente novamente mais tarde."),
		delete: (error: string) =>
			showError(error, "Não foi possível excluir a análise. Tente novamente mais tarde."),
	},
	success: {
		post: () => Toast.show({ type: "default", text1: "Análise criada com sucesso" }),
		put: () => Toast.show({ type: "default", text1: "Análise atualizada com sucesso" }),
		delete: () => Toast.show({ type: "default", text1: "Análise excluída com sucesso" }),
	},
};
