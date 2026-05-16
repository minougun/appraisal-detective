import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const main = readFileSync("desktop/main.cjs", "utf8");
const preload = readFileSync("desktop/preload.cjs", "utf8");
const steamReadme = readFileSync("steamworks/README.md", "utf8");
const appBuild = readFileSync("steamworks/app_build_template.vdf", "utf8");
const depotBuild = readFileSync("steamworks/depot_build_windows_template.vdf", "utf8");

assert(packageJson.main === "desktop/main.cjs", "package main must point to Electron desktop entry");
assert(packageJson.scripts["start:desktop"] === "electron .", "start:desktop script must launch Electron");
assert(packageJson.scripts["build:steam:win-dir"]?.includes("--win dir"), "Steam Windows dir build script must exist");
assert(packageJson.scripts["test:steam-readiness"] === "node scripts/verify-steam-readiness.mjs", "Steam readiness script must be wired");
assert(packageJson.devDependencies.electron, "Electron must be pinned as a dev dependency");
assert(packageJson.devDependencies["electron-builder"], "electron-builder must be pinned as a dev dependency");
assert(packageLock.packages["node_modules/electron"], "package-lock must pin Electron");
assert(packageLock.packages["node_modules/electron-builder"], "package-lock must pin electron-builder");

assert(packageJson.build?.appId === "com.minougun.appraisal-detective", "desktop app id must be stable");
assert(packageJson.build?.asar === true, "desktop package should use asar for a compact Steam depot");
assert(packageJson.build?.files?.includes("desktop/**"), "desktop files must be packaged");
assert(packageJson.build?.files?.includes("assets/**"), "runtime assets must be packaged");
assert(packageJson.build?.files?.includes("!assets/visual-refresh-baseline-2026-05-08/**"), "unpublished visual baseline assets must be excluded");
assert(packageJson.build?.files?.includes("docs/third-party-audio-notices.md"), "third-party audio notices must be packaged");
assert(!packageJson.build?.files?.includes(".asset-provenance.private.json"), "private asset provenance must not be packaged");

assert(main.includes("contextIsolation: true"), "Electron window must isolate renderer context");
assert(main.includes("nodeIntegration: false"), "Electron renderer must not expose Node integration");
assert(main.includes("sandbox: true"), "Electron renderer sandbox must stay enabled");
assert(main.includes("setWindowOpenHandler"), "new windows must be denied or routed through shell");
assert(main.includes("will-navigate"), "navigation away from the local app must be controlled");
assert(main.includes("loadFile(path.join(__dirname, \"..\", \"index.html\"))"), "desktop shell must load the local game");
assert(preload.includes("APPRAISAL_STEAM_DESKTOP"), "preload must expose a minimal desktop marker");

for (const file of [
  "desktop/steam_appid.example.txt",
  "steamworks/app_build_template.vdf",
  "steamworks/depot_build_windows_template.vdf",
  "docs/steam-port-handoff-2026-05-16.md",
]) {
  assert(existsSync(file), `${file} must exist`);
}

assert(steamReadme.includes("Uploading a build is not the same as releasing it"), "Steamworks README must state release boundary");
assert(appBuild.includes("REPLACE_WITH_STEAM_APP_ID"), "app build template must keep app id placeholder");
assert(appBuild.includes("REPLACE_WITH_WINDOWS_DEPOT_ID"), "app build template must keep depot placeholder");
assert(depotBuild.includes("ContentRoot"), "depot build template must define content root");

console.log("steam_readiness_checks=passed");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
