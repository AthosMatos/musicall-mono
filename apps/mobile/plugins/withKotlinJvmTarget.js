const { withProjectBuildGradle } = require(
	require.resolve("@expo/config-plugins", { paths: [require.resolve("expo/package.json")] })
);

/**
 * Fixes inconsistent JVM target between Java (17) and Kotlin (21) in third-party
 * modules (e.g. react-native-image-colors) by aligning all Kotlin tasks to JVM 17.
 */
const withKotlinJvmTarget = (config) => {
	return withProjectBuildGradle(config, (mod) => {
		if (mod.modResults.language !== "groovy") return mod;

		const snippet = `
allprojects {
    plugins.withId("kotlin-android") {
        tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }
}`;

		if (!mod.modResults.contents.includes('jvmTarget = "17"')) {
			mod.modResults.contents += `\n${snippet}\n`;
		}

		return mod;
	});
};

module.exports = withKotlinJvmTarget;
