#!/usr/bin/env node

/**
 * Script to set the build version for APK releases.
 * Use arrow keys to select the desired version bump, then press Enter to confirm.
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const appJsonPath = path.join(rootDir, "app.json");
const buildVersionPath = path.join(rootDir, "build-version.json");
const androidBuildGradlePath = path.join(rootDir, "android", "app", "build.gradle");

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const CLEAR_LINE = "\x1b[2K\x1b[G";
const CURSOR_UP = (n) => `\x1b[${n}A`;
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

// ─── Version helpers ─────────────────────────────────────────────────────────
function bumpPatch(v) {
	const [major, minor, patch] = v.split(".").map(Number);
	return `${major}.${minor}.${patch + 1}`;
}

function bumpMinor(v) {
	const [major, minor] = v.split(".").map(Number);
	return `${major}.${minor + 1}.0`;
}

function bumpMajor(v) {
	const [major] = v.split(".").map(Number);
	return `${major + 1}.0.0`;
}

// ─── File readers ─────────────────────────────────────────────────────────────
function readFileIfExists(filePath) {
	return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function extractBuildNumberFromContent(content, pattern) {
	if (!content) return null;
	const match = content.match(pattern);
	if (!match) return null;
	const value = Number.parseInt(match[1], 10);
	return Number.isNaN(value) || value <= 0 ? null : value;
}

function getCurrentBuildNumber() {
	const appJsonContent = readFileIfExists(appJsonPath);
	const gradleContent = readFileIfExists(androidBuildGradlePath);
	const buildVersionContent = readFileIfExists(buildVersionPath);

	const candidates = [
		extractBuildNumberFromContent(appJsonContent, /"versionCode":\s*(\d+)/),
		extractBuildNumberFromContent(appJsonContent, /"buildNumber":\s*"(\d+)"/),
		extractBuildNumberFromContent(gradleContent, /versionCode\s+(\d+)/),
	];

	if (buildVersionContent) {
		try {
			const data = JSON.parse(buildVersionContent);
			if (Number.isInteger(data.buildNumber) && data.buildNumber > 0) {
				candidates.push(data.buildNumber);
			}
		} catch {
			// ignore
		}
	}

	return candidates.find((v) => Number.isInteger(v) && v > 0) ?? 1;
}

// ─── Arrow-key selector ───────────────────────────────────────────────────────
async function arrowSelect(options) {
	return new Promise((resolve) => {
		let selected = 0;

		const render = (isFirst) => {
			if (!isFirst) {
				process.stdout.write(CURSOR_UP(options.length));
			}
			options.forEach((opt, i) => {
				const prefix = i === selected ? `${GREEN}${BOLD} ❯ ${RESET}` : `${DIM}   ${RESET}`;
				const label = i === selected ? `${BOLD}${opt.label}${RESET}` : opt.label;
				process.stdout.write(`${CLEAR_LINE}${prefix}${label}\n`);
			});
		};

		process.stdout.write(HIDE_CURSOR);
		render(true);

		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding("utf8");

		const onData = (key) => {
			if (key === "\x1b[A") {
				// up arrow
				selected = (selected - 1 + options.length) % options.length;
				render(false);
			} else if (key === "\x1b[B") {
				// down arrow
				selected = (selected + 1) % options.length;
				render(false);
			} else if (key === "\r" || key === "\n") {
				// enter
				process.stdin.setRawMode(false);
				process.stdin.pause();
				process.stdin.removeListener("data", onData);
				process.stdout.write(SHOW_CURSOR);
				resolve(options[selected]);
			} else if (key === "\x03") {
				// ctrl+c
				process.stdout.write(SHOW_CURSOR);
				process.exit(0);
			}
		};

		process.stdin.on("data", onData);
	});
}

// ─── File writers ─────────────────────────────────────────────────────────────
function updateAppJsonVersion(filePath, newVersion, newBuildNumber) {
	let content = fs.readFileSync(filePath, "utf8");

	content = content.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);

	if (content.includes('"versionCode"')) {
		content = content.replace(/"versionCode":\s*\d+/, `"versionCode": ${newBuildNumber}`);
	} else {
		content = content.replace(
			/("package":\s*"[^"]+")(\s*)/,
			`$1,\n\t\t\t"versionCode": ${newBuildNumber}$2`
		);
	}

	if (content.includes('"buildNumber"')) {
		content = content.replace(/"buildNumber":\s*"[^"]+"/, `"buildNumber": "${newBuildNumber}"`);
	} else {
		content = content.replace(
			/("bundleIdentifier":\s*"[^"]+")(\s*)/,
			`$1,\n\t\t\t"buildNumber": "${newBuildNumber}"$2`
		);
	}

	fs.writeFileSync(filePath, content);
}

function updateAndroidBuildGradle(filePath, newVersion, newBuildNumber) {
	let content = fs.readFileSync(filePath, "utf8");
	content = content.replace(/versionCode\s+\d+/, `versionCode ${newBuildNumber}`);
	content = content.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
	fs.writeFileSync(filePath, content);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const currentVersion = packageJson.version;
	const currentBuildNumber = getCurrentBuildNumber();

	console.log(`\n${BOLD}${CYAN}Current version:${RESET} ${currentVersion}  ${DIM}(build #${currentBuildNumber})${RESET}\n`);
	console.log(`${DIM}Use ↑ ↓ arrow keys and press Enter to select:${RESET}\n`);

	const options = [
		{ label: `Patch  — ${currentVersion}  →  ${bumpPatch(currentVersion)}`, bump: "patch" },
		{ label: `Minor  — ${currentVersion}  →  ${bumpMinor(currentVersion)}`, bump: "minor" },
		{ label: `Major  — ${currentVersion}  →  ${bumpMajor(currentVersion)}`, bump: "major" },
		{ label: `Keep   — ${currentVersion}  (no version change)`, bump: "none" },
	];

	const choice = await arrowSelect(options);

	let newVersion;
	switch (choice.bump) {
		case "patch": newVersion = bumpPatch(currentVersion); break;
		case "minor": newVersion = bumpMinor(currentVersion); break;
		case "major": newVersion = bumpMajor(currentVersion); break;
		default:      newVersion = currentVersion;
	}

	// If version didn't change, increment build number; otherwise reset to 1
	const newBuildNumber = newVersion === currentVersion ? currentBuildNumber + 1 : 1;

	console.log(`\n${BOLD}${GREEN}→ ${newVersion}${RESET}  ${DIM}(build #${newBuildNumber})${RESET}\n`);

	// Update package.json
	packageJson.version = newVersion;
	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, "\t") + "\n");

	// Update app.json, gradle and build-version.json
	updateAppJsonVersion(appJsonPath, newVersion, newBuildNumber);
	updateAndroidBuildGradle(androidBuildGradlePath, newVersion, newBuildNumber);

	let buildVersionData = {};
	if (fs.existsSync(buildVersionPath)) {
		buildVersionData = JSON.parse(fs.readFileSync(buildVersionPath, "utf8"));
	}
	buildVersionData.buildNumber = newBuildNumber;
	buildVersionData.lastUpdated = new Date().toISOString();
	buildVersionData.version = newVersion;
	buildVersionData.updateVersion = 0;
	fs.writeFileSync(buildVersionPath, JSON.stringify(buildVersionData, null, "\t") + "\n");

	console.log(`✅ Version set to ${newVersion} (Build #${newBuildNumber})`);
	console.log(`📦 Updated: package.json, app.json, android/app/build.gradle, build-version.json`);
}

main().catch((error) => {
	process.stdout.write(SHOW_CURSOR);
	console.error("❌ Error:", error.message);
	process.exit(1);
});
