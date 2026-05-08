import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();

await run(process.execPath, ["scripts/export-switch-port-data.mjs"]);

const [index, controller, css, exportJson, handoff] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("platform-controller.js", "utf8"),
  readFile("styles.css", "utf8"),
  readFile("dist/switch-port/appraisal-detective-switch-data.json", "utf8"),
  readFile("docs/switch-port-handoff-2026-05-07.md", "utf8"),
]);

const exported = JSON.parse(exportJson);

assert(index.includes("./platform-controller.js"), "platform controller must be loaded");
assert(index.includes("controller-meta"), "controller hint must be visible in topbar");
assert(controller.includes("navigator.getGamepads"), "gamepad polling must use Gamepad API");
assert(controller.includes("confirm: 0"), "A button mapping must be documented in code");
assert(controller.includes("cancel: 1"), "B button mapping must be documented in code");
assert(css.includes(".controller-meta"), "controller hint styling must exist");
assert(css.includes("controller-evidence-open"), "controller evidence board mode must exist");
assert(exported.cases.length === 10, "Switch export must include all 10 cases");
assert(exported.assets.length >= 22, "Switch export must include generated image and portrait assets");
assert(exported.controls.confirm.includes("A"), "Switch export must include A confirm control");
assert(exported.saveData.recordFields.includes("scenarioRuns"), "Switch export must include replay save schema");
assert(exported.legalGate.nintendoDeveloperPortal === "https://developer.nintendo.com/", "Switch export must include Nintendo gate URL");
assert(handoff.includes("SDKなしでは生成できない"), "handoff must state SDK build boundary");
assert(handoff.includes("/mnt/c/Users/minou/appraisal-detective"), "handoff must include absolute local source path");

for (const asset of exported.assets) {
  const info = await stat(path.join(root, asset.file));
  assert(info.size === asset.bytes, `${asset.file} byte size mismatch`);
}

console.log("switch_readiness_checks=passed");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
