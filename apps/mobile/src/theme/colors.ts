// eslint-disable-next-line @typescript-eslint/no-require-imports
const appColors = {
	primary: "#2F54EB",
	primary_dark: "#002FBB",
	secondary: '#EFAC1E',
	feedback: {
		danger: '#D13342',
		success: '#2EAD4B'
	},
	neutral: {
		light: "#f5f5f5",
		light_medium: "#cfcfcf",
		medium: "#747474",
		dark: "#212121",
	},
	text: {
		primary: "#ffffff",
		secondary: "#b3b3b3",
	},

	transparent: "transparent",
}

export { appColors };
export type AppColors = typeof appColors;