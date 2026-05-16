import { listPackage } from "@electron/asar";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const packageDir = process.argv[2] ?? "dist/desktop/linux-unpacked";
const asarPath = path.join(packageDir, "resources", "app.asar");

assert(existsSync(packageDir), `package directory does not exist: ${packageDir}`);
assert(existsSync(asarPath), `app.asar does not exist: ${asarPath}`);

const executable = readdirSync(packageDir).find((file) => {
  if (process.platform === "win32" || packageDir.includes("win-unpacked")) return file.endsWith(".exe");
  return file === "appraisal-detective";
});
assert(executable, `desktop executable was not found in ${packageDir}`);

const entries = listPackage(asarPath).join("\n");

for (const expected of ["/index.html", "/desktop/main.cjs", "/desktop/preload.cjs", "/assets/audio/mixkit-echoes-188.mp3"]) {
  assert(entries.includes(expected), `packaged app is missing ${expected}`);
}

for (const forbidden of ["visual-refresh-baseline", "asset-provenance"]) {
  assert(!entries.includes(forbidden), `packaged app must not include ${forbidden}`);
}

console.log(`desktop_package_checks=passed package=${packageDir} executable=${executable}`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
