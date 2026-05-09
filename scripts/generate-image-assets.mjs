console.warn(
  [
    "scripts/generate-image-assets.mjs is retained as a compatibility wrapper.",
    "Use scripts/refresh-image-assets.mjs for targeted API refreshes.",
    "New creative image work should start from the app server imagegen workflow and be adopted with scripts/adopt-image-asset.mjs.",
  ].join(" "),
);

await import("./refresh-image-assets.mjs");
