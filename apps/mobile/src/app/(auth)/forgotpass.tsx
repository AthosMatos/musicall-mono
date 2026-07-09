/* import { AppButton } from "@/components/app-defaults/app-button";
import { AppText } from "@/components/app-defaults/app-text";
import { AppForm } from "@/components/athos-components/form";
import { AppFormProvider, useAppFormContext } from "@/contexts/form.context";
import { authToast } from "@/toasts/auth.toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordInput, forgotPasswordSchema } from "@root/src-old/api/schemas/auth.schema";
import { useAuth } from "@root/src-old/auth/auth.provider";
import { router } from "expo-router";
import { Eye, EyeClosed, Lock, User } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";


function Form() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmVisible, setIsConfirmVisible] = useState(false);
	const { forgotPassword: { isPending } } = useAuth();
	const { control, isValid, submit } = useAppFormContext<forgotPasswordInput>();

	return (
		<View className="pl-24 pb-4 gap-4 pt-14 pr-8 justify-end h-full w-full">
			<View className="px-3 gap-1">
				<AppText className="text-black font-bold text-2xl">Redefinir senha</AppText>
				<AppText className="text-stone-500">
					Informe seu e-mail e escolha uma nova senha.
				</AppText>
			</View>

			<View className="gap-5">
				<AppForm
					control={control}
					render={({ Input }) => (
						<View className="px-3 gap-4 w-full">
							<Input placeholder="email@email.com" icon={{ left: User }} name="email" label="E-mail" autoCapitalize="none" />
							<Input
								placeholder="Digite a nova senha"
								icon={{ left: Lock, right: isPasswordVisible ? Eye : EyeClosed, onRightIconPress: () => setIsPasswordVisible((prev) => !prev) }}
								name="password"
								label="Nova senha"
								secureTextEntry={!isPasswordVisible}
							/>
							<Input
								placeholder="Confirme a nova senha"
								icon={{ left: Lock, right: isConfirmVisible ? Eye : EyeClosed, onRightIconPress: () => setIsConfirmVisible((prev) => !prev) }}
								name="confirmPassword"
								label="Confirmar senha"
								secureTextEntry={!isConfirmVisible}
							/>
						</View>
					)}
				/>

				<View>
					<AppButton isLoading={isPending} disabled={!isValid} className="w-52 self-center" variant="default" onPress={submit}>
						Redefinir senha
					</AppButton>

					<AppButton disabled={isPending} className="w-52 self-center" variant="transparent" onPress={() => router.back()}>
						Voltar ao login
					</AppButton>
				</View>
			</View>
		</View>
	);
}

export default function Screen() {
	const { forgotPassword: { resetPassword } } = useAuth();

	const onSubmit = async (formValues: forgotPasswordInput) => {
		try {
			await resetPassword(formValues);
			authToast.passwordReset();
			router.back();
		} catch (error) {
			authToast.passwordResetError(error as string);
		}
	};

	return (
		<AppFormProvider resolver={zodResolver(forgotPasswordSchema)} onSubmit={onSubmit}>
			<Form />
		</AppFormProvider>
	);
}
 */