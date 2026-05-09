# 鑑定DE探偵 画像アセット運用ハードニング

作成日: 2026-05-08

## 対象

- Local path: `/mnt/c/Users/minou/appraisal-detective/`
- Public beta URL: `https://minougun.github.io/appraisal-detective/`
- Related docs:
  - `/mnt/c/Users/minou/appraisal-detective/README.md`
  - `/mnt/c/Users/minou/appraisal-detective/docs/credits-and-ai-disclosure-final-2026-05-07.md`

## 方針

ゲーム内グラフィック、背景、キャラクター、カード、サムネイル、ストア素材の新規制作は、app server 側の imagegen / ImageGen 実行面を標準入口にする。

OpenAI Images API の直接呼び出しは通常の新規制作入口ではなく、採用済み素材の対象指定刷新、A/B比較、台帳更新に限定する。従量課金を伴うため、対象ファイル、刷新理由、承認状態を明示する。

## 実装内容

- `scripts/refresh-image-assets.mjs`
  - `scripts/generate-image-assets.mjs` から実処理を分離。
  - 全22件一括刷新をデフォルト拒否。
  - `OPENAI_IMAGE_ASSET_FILES` または `IMAGE_REFRESH_ALL_CONFIRMED=true` を要求。
  - `UPDATE_ASSETS_MANIFEST_ONLY=true` で画像再生成なしの台帳再計算を許可。
  - API keyは `OPENAI_API_KEY` または明示された `OPENAI_API_KEY_FILE` のみから読む。
  - `gpt-image-2` 失敗時に黙って別モデルへfallbackしない。

- `scripts/generate-image-assets.mjs`
  - 後方互換wrapperに変更。
  - 通常制作では imagegen → adopt の流れを案内。

- `scripts/adopt-image-asset.mjs`
  - imagegen候補を正式assetへ採用する入口。
  - `assets/` へのコピー、sha256、width/height、bytes、公開manifest更新、非公開provenance更新を一括実行。

- `scripts/validate-assets-manifest.mjs`
  - 公開manifestの必須項目、sha256/dimension/bytes一致、未台帳生成画像、公開禁止項目混入を検証。
  - `prompt` と `sourceArtifactPath` が公開manifestへ入る場合は失敗。

- `assets-manifest.json`
  - `schemaVersion: 2` へ更新。
  - full promptを削除。
  - `promptHash`, `generationPath`, `sourceArtifactRef`, `copiedToAssetsAt`, `selectedBy`, `selectionReason`, `variantGroupId`, `variantId`, `postProcess` を追加。

- `.asset-provenance.private.json`
  - 非公開provenanceとして生成。
  - full prompt、source artifact path、rejected variants、review notesを入れる想定。
  - `.gitignore` 対象で、公開配布物には含めない。

## 公開manifestと非公開provenanceの境界

公開 `assets-manifest.json`:

- file
- hash / dimensions / bytes
- caseId / assetType / usage / altText
- promptSummary / promptHash
- model / generationPath
- aiDisclosureCategory
- reviewStatus / storeUseAllowed

非公開 `.asset-provenance.private.json`:

- full prompt
- local source path
- rejected variants
- provider request id
- selection notes
- cost notes

## 検証

```bash
node --check app.js
node --check case-schema.js
node --check scripts/generate-image-assets.mjs
node --check scripts/refresh-image-assets.mjs
node --check scripts/adopt-image-asset.mjs
node --check scripts/validate-assets-manifest.mjs
node --check scripts/export-switch-port-data.mjs
node --check tests/appraisal-detective-flow.spec.js
UPDATE_ASSETS_MANIFEST_ONLY=true npm run refresh:assets
npm run validate:assets
npm run test:production
npm run test:persona
npm run test:switch-readiness
npm run test:e2e
```

結果:

- `npm run validate:assets`: `asset_manifest_ok=true`, `asset_manifest_assets=22`
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:persona`: `persona_gate_type=spec_coverage_not_human_commercial_quality`, `persona_average=100.0`
- `npm run test:switch-readiness`: `switch_readiness_checks=passed`
- `npm run test:e2e`: `81 passed`

注記:

- 1回目のE2Eはproduction-like server未起動により `ERR_CONNECTION_REFUSED`。サーバ起動後の再実行で `81 passed`。
- `assets/visual-refresh-baseline-2026-05-08/` はローカルに存在するが `.gitignore` 対象で、公開配布物へ含めない。

## Issue / PR

- Issue: not_applicable（ローカル実装・運用ハードニングとして実施）
- PR: not_applicable（未push・未PR）
