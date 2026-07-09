export type Environment = "development" | "production";

export const getEnvironment = (): Environment => {
	if (__DEV__ === false) {
		return "production";
	}

	return "development";
};

export const ENV = {
	environment: getEnvironment(),
	isDevelopment: getEnvironment() === "development",
	isProduction: getEnvironment() === "production",

	API_URL: {
		//development: process.env.EXPO_PUBLIC_API_URL_DEV,
		production: process.env.EXPO_PUBLIC_API_URL_PROD,
		//test: process.env.EXPO_PUBLIC_API_URL_TEST,
	},


	// Outras configurações podem ser adicionadas aqui
	// TIMEOUT: 30000,
	// ENABLE_LOGGING: getEnvironment() === "development",
} as const;

export const getApiBaseUrl = () => {
	return ENV.API_URL.production;
};

