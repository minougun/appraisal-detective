# 鑑定DE探偵 商用95点レビュー指摘対応記録 2026-05-08

## 目的

GPT-5.5 Pro 辛口レビューで浮き彫りになった、公開β後の主要な不足をコード・台帳・検証へ反映する。

対象URL:

- https://minougun.github.io/appraisal-detective/

対象ローカルパス:

- `/mnt/c/Users/minou/appraisal-detective/`

## 対応した指摘

### 1. imagegen 標準運用と画像台帳の破綻防止

新規のゲーム内グラフィック、背景、キャラクター、カード、サムネイル、ストア素材は、原則として app server 側の imagegen / ImageGen 実行面で実生成する運用を維持する。

一方で、採用済み素材の再生成、A/B、対象指定 refresh、manifest 更新は API スクリプト側の保守用途に限定した。

実装:

- `scripts/adopt-image-asset.mjs` を追加。
- `scripts/refresh-image-assets.mjs` を追加。
- `scripts/validate-assets-manifest.mjs` を追加。
- `scripts/generate-image-assets.mjs` は互換 wrapper に縮小。
- `assets-manifest.json` を schema v2 相当に整理。
- 公開 manifest からフルプロンプトとローカル絶対パスを外した。
- `.asset-provenance.private.json` を非公開 provenance 台帳として扱う方針にした。
- 全件 refresh は原則拒否し、対象指定と refresh reason を要求する。
- `gpt-image-2` 失敗時に黙って旧モデルへ fallback しない。

### 2. case006〜010 のテンプレ感

レビューでは、case006〜010 が案件名・論点差し替えに見えるリスクが指摘された。

`commercial-case-pack.js` に `compactCaseNarrative()` を追加し、後半5案件に案件固有の依頼受付、現地調査、資料照合、鑑定判断、報告対決、市場シナリオ、リプレイ目標を持たせた。

強化した案件:

- case006 底地: 借地人交渉、地代改定、処分市場、単独処分リスク。
- case007 区分所有: 修繕積立、長期修繕計画、管理組合説明、専有部だけでない価値判断。
- case008 ホテル: ADR、稼働率、季節性、PIP、事業収支。
- case009 物流倉庫: テナント退去、搬入口、投資利回り、再リーシング。
- case010 海外レビュー: 為替、現地権利、国内基準翻訳、レビューリスク。

### 3. P5 リプレイ研究余地

レビューでは、P5 が「シナリオ別固定正解暗記」で止まるリスクが指摘された。

`scoring.js` に `evaluateEvidenceRoute()` を追加し、報告証拠3枚を次のように評価する。

- 最適ルート
- 説明可能な別解
- 証拠は薄いが筋はあるルート
- 監査リスクが残るルート

`evaluateScoreVariance()` には、重点証拠、必須報告証拠、シナリオ優先証拠、監査厳格化を考慮した route 評価を接続した。

最終レビューでは、別解評価と次に詰める証拠カテゴリを表示する。

### 4. スマホ・タッチターゲット

レビューでは、42px ボタンが 44px 基準に届かない点が指摘された。

`styles.css` で主要インタラクティブ要素を 44px 以上に統一した。

対象:

- `.action-button`
- `.ghost-button`
- `.hotspot`
- `.option-button`
- `.doc-button`
- `.evidence-card`
- `.product-menu-button`
- `.product-close`
- `.desk-clear-button`
- `.discretion-track`

390px 幅の Playwright テストで、表示中の主要ボタンと hotspot が 44px 以上であることを固定した。

## 追加テスト

`tests/appraisal-detective-flow.spec.js` に次を追加した。

- 後半商用案件が compact template 文言ではなく、案件固有の phase text を持つこと。
- 証拠ルート評価が最適/薄い/監査厳格化の差を返すこと。
- モバイル幅で主要操作要素が 44px 以上の touch target を持つこと。

## 検証結果

2026-05-08 時点で次を確認した。

```text
node --check commercial-case-pack.js: passed
node --check scoring.js: passed
node --check app.js: passed
node --check tests/appraisal-detective-flow.spec.js: passed
npx playwright test ... targeted grep: 4 passed
npx playwright test ... mobile/numeric retest: 3 passed
npm run test:e2e: 84 passed
npm run test:production: production_server_checks=passed
npm run test:persona: persona_gate_type=spec_coverage_not_human_commercial_quality / persona_average=100.0
npm run test:switch-readiness: switch_readiness_checks=passed
npm run validate:assets: asset_manifest_ok=true / asset_manifest_assets=22
git diff --check: passed
```

`npm run validate:assets` は、ローカルに `assets/visual-refresh-baseline-2026-05-08/` が存在するため警告を出す。このディレクトリは比較用退避素材であり、`.gitignore` により公開対象外に維持する。

## まだコードだけでは完了判定できない項目

次は実装ではなく人間評価・公開素材評価が必要。

- P1〜P5 の人間プレイテスト。
- 390px / 375px / 360px の実機スマホ通し確認。
- スクリーンリーダー、キーボードのみ、低刺激ONの実機通し確認。
- Steam/itch 用スクリーンショットの縮小可読性と購買力確認。
- Steam/itch 提出用 AI 開示とクレジット文言の最終フォーム化。

## 判定

今回の実装で、レビューで指摘された「imagegen採用品の台帳破綻リスク」「case006〜010のテンプレ層」「P5向け別解評価不足」「44px touch target不足」はコード・テスト上で改善した。

ただし、ペルソナ平均95点の最終判定は、まだ人間プレイテストと実ストア素材レビューを待つ。
