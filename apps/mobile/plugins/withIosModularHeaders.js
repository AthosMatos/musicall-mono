const { withDangerousMod } = require(
	require.resolve("@expo/config-plugins", { paths: [require.resolve("expo/package.json")] })
);
const fs = require("fs");
const path = require("path");

/**
 * Adds `use_modular_headers!` to the iOS Podfile to resolve Swift static library
 * integration issues with AppCheckCore, GoogleUtilities, and RecaptchaInterop.
 *
 * Error: The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
 * `RecaptchaInterop`, which do not define modules. Setting `use_modular_headers!`
 * enables module map generation for these dependencies.
 */
module.exports = function withIosModularHeaders(config) {
	return withDangerousMod(config, [
		"ios",
		async (config) => {
			const podfilePath = path.join(
				config.modRequest.projectRoot,
				"ios",
				"Podfile"
			);

			if (fs.existsSync(podfilePath)) {
				let contents = fs.readFileSync(podfilePath, "utf-8");

				// Add use_modular_headers! after use_expo_modules! if not already present
				if (!contents.includes("use_modular_headers!")) {
					const targetRegex = /target\s+['"](.*?)['"]\s+do\s*\n\s*use_expo_modules!/;
					const match = contents.match(targetRegex);

					if (match) {
						const replacement = `target '${match[1]}' do
  use_expo_modules!
  use_modular_headers!`;
						contents = contents.replace(match[0], replacement);
						fs.writeFileSync(podfilePath, contents);
					}
				}
			}

			return config;
		},
	]);
};


