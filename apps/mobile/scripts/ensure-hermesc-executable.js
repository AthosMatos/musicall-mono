const fs = require("node:fs");
const path = require("node:path");

const reactNativeDir = path.dirname(require.resolve("react-native/package.json"));
const hermesCompilerDir = (() => {
	try {
		return path.dirname(
			require.resolve("hermes-compiler/package.json", {
				paths: [require.resolve("react-native/package.json")],
			})
		);
	} catch {
		return undefined;
	}
})();
const hermescBinByPlatform = {
	darwin: ["osx-bin", "hermesc"],
	linux: ["linux64-bin", "hermesc"],
	win32: ["win64-bin", "hermesc.exe"],
};
const hermescBin = hermescBinByPlatform[process.platform];

if (!hermescBin) {
	console.log(`No Hermes compiler chmod needed for platform: ${process.platform}`);
	process.exit(0);
}

const hermescPaths = [
	hermesCompilerDir ? path.join(hermesCompilerDir, "hermesc", ...hermescBin) : undefined,
	path.join(reactNativeDir, "sdks", "hermesc", ...hermescBin),
].filter(Boolean);
let chmoddedCount = 0;

for (const hermescPath of hermescPaths) {
	if (!fs.existsSync(hermescPath)) {
		console.log(`Hermes compiler not found, skipping: ${hermescPath}`);
		continue;
	}

	fs.chmodSync(hermescPath, 0o755);
	chmoddedCount += 1;
	console.log(`Ensured Hermes compiler is executable: ${hermescPath}`);
}

if (chmoddedCount === 0) {
	console.log("No Hermes compiler binaries were found to chmod.");
}
