const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld(
  "APPRAISAL_STEAM_DESKTOP",
  Object.freeze({
    platform: process.platform,
    packaged: process.defaultApp !== true,
    shell: "electron",
    distribution: "steam-ready-desktop",
  }),
);
