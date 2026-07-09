const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

const projectRoot = path.resolve(__dirname, "..");
const apkOutputRoot = path.join(projectRoot, "android", "app", "build", "outputs", "apk");
const destDir = path.join(projectRoot, "apk");

function askQuestion(prompt, defaultValue) {
	try {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

		return new Promise((resolve) => {
			rl.question(`${prompt} [${defaultValue}]: `, (answer) => {
				rl.close();
				const v = answer.trim();
				resolve(v === "" ? defaultValue : v);
			});
		});
	} catch (err) {
		return Promise.resolve(defaultValue);
	}
}

async function findApk(type) {
	async function walk(dir) {
		let entries;
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch (err) {
			console.error(`Error reading directory "${dir}": ${err.message || err}`);
			return null;
		}
		for (const e of entries) {
			const full = path.join(dir, e.name);
			if (e.isDirectory()) {
				const found = await walk(full);
				if (found) return found;
			} else if (e.isFile() && e.name.toLowerCase().endsWith(".apk")) {
				// prefer files with type in name or in parent folder
				const lower = (e.name + " " + dir).toLowerCase();
				if (lower.includes(type)) return full;
			}
		}
		return null;
	}
	return await walk(apkOutputRoot);
}

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

async function copyApk(type, targetName) {
	const src = await findApk(type);
	if (!src) {
		console.error(`No ${type} apk found under ${apkOutputRoot}`);
		return false;
	}
	const ext = path.extname(targetName).toLowerCase() === ".apk" ? "" : ".apk";
	const dest = path.join(destDir, targetName + ext);
	await fs.copyFile(src, dest);
	console.log(`Copied ${type} apk from "${src}" to "${dest}"`);
	return true;
}

(async () => {
	try {
		await ensureDir(destDir);
		const types = ["release", "debug"];
		for (const t of types) {
			const defaultName = `musicall-aep_${t}`;
			const name = await askQuestion(`Enter a version for ${t} apk`, defaultName);
			await copyApk(t, `musicall-aep_${t}_${name}`);
		}
		console.log("Done.");
	} catch (err) {
		console.error("Error:", err.message || err);
		process.exit(1);
	}
})();
