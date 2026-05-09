# 鑑定DE探偵 公開βデプロイ記録

作成日: 2026-05-08

## 対象

- Repository: `https://github.com/minougun/appraisal-detective`
- Public URL: `https://minougun.github.io/appraisal-detective/`
- Local path: `/mnt/c/Users/minou/appraisal-detective/`
- Commit: `ed46a388ca05ec84106a8f71b3a5818a767f00ca`

## 実施内容

- `appraisal-detective` を専用Git repositoryとして初期化し、`origin` を `https://github.com/minougun/appraisal-detective.git` に設定。
- GitHub Pages source が `main:/` であることを確認。
- `assets/visual-refresh-baseline-2026-05-08/` を `.gitignore` に追加し、比較用画像を公開対象から除外。
- `.claude/`, `.omx/`, `dist/`, `node_modules/`, `test-results/`, `playwright-report/` を公開対象から除外。
- AI利用開示とクレジットをアプリ内クレジットパネルおよび `docs/credits-and-ai-disclosure-final-2026-05-07.md` から確認可能にした。
- GitHub Pagesへpushし、公開URLへ反映。

## 検証

ローカル検証:

```bash
node --check app.js
node --check scoring.js
node --check scenario-engine.js
node --check gameplay-cast.js
node --check case-schema.js
node --check scripts/generate-image-assets.mjs
node --check scripts/refresh-image-assets.mjs
node --check scripts/adopt-image-asset.mjs
node --check scripts/validate-assets-manifest.mjs
node --check tests/appraisal-detective-flow.spec.js
npm run validate:assets
npm run test:e2e
npm run test:production
npm run test:persona
npm run test:switch-readiness
curl -I http://127.0.0.1:44561/
```

結果:

- `npm run test:e2e`: `81 passed`（2026-05-08 画像アセット運用ハードニング後）
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:persona`: `persona_gate_type=spec_coverage_not_human_commercial_quality`, `persona_average=100.0`
- `npm run test:switch-readiness`: `switch_readiness_checks=passed`
- local production-like server: `Content-Security-Policy`, `Cross-Origin-Opener-Policy`, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` を確認。

公開URL検証:

```bash
curl -I https://minougun.github.io/appraisal-detective/
curl -I https://minougun.github.io/appraisal-detective/app.js
curl -I https://minougun.github.io/appraisal-detective/assets/kawabe-estate.generated.png
curl -I https://minougun.github.io/appraisal-detective/assets/visual-refresh-baseline-2026-05-08/kawabe-estate.gpt-image-1.5.png
```

結果:

- GitHub Pages status: `built`
- `https://minougun.github.io/appraisal-detective/`: `200`
- `https://minougun.github.io/appraisal-detective/app.js`: `200`
- `https://minougun.github.io/appraisal-detective/assets/kawabe-estate.generated.png`: `200`
- `https://minougun.github.io/appraisal-detective/assets/visual-refresh-baseline-2026-05-08/kawabe-estate.gpt-image-1.5.png`: `404`

## 重要な残リスク

GitHub Pagesの `200` レスポンスでは、以下の本番想定ヘッダが確認できなかった。

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `X-Frame-Options`

したがって、現状のGitHub Pages公開は **公開βとしては利用可** だが、**CSP必須のproduction-like本番とは扱わない**。

2026-05-09追記: repo側には正式本番向けの `_headers`、`netlify.toml`、`vercel.json`、`scripts/verify-public-headers.mjs` を追加した。詳細は `docs/formal-production-risk-closure-2026-05-09.md` を参照。GitHub Pages公開URLは引き続きHTTP response header検証に失敗するため、正式本番化にはヘッダ対応ホスティングへの切替が必要。

## 推奨次アクション

1. CSP必須の正式本番にする場合は、Cloudflare Pages、Netlify、またはGitHub Pages + Cloudflare proxy/Workerへ移行する。
2. 移行先で `_headers` または同等設定がHTTP response headerとして反映されることを `curl -I` で確認する。
3. 人間プレイテスト前の公開形態は、正式版ではなく限定公開βとして扱う。
4. Steam/itch向けには、AI開示・クレジット・スクリーンショット・ストア文言を各プラットフォーム仕様に合わせて再確認する。

## 判定

```text
GitHub Pages公開β: 完了
CSP必須の正式本番: 未完了
Cloudflare/Netlify実デプロイ: 未実施（CLI/環境変数なし）
人間プレイテスト: 未実施
```

## 2026-05-09 UIレビュー修正デプロイ

対象:

- Branch: `main`
- Public URL: `https://minougun.github.io/appraisal-detective/`
- Cache-bust marker: `20260509-ui-review-fix`

実施内容:

- Chrome確認で見つかったモバイル上部メタ情報の折り返し、案件選択CTAの見え方、フェーズ切替表示、証拠ボードの縦詰まりを修正。
- `index.html` の `app.js` / `styles.css` 読み込みクエリを `20260509-ui-review-fix` に更新。
- 画像アセット検証、採用、再生成スクリプトと商業ケース拡張を公開対象に含めた。

ローカル検証:

```bash
node --check app.js
node --check scoring.js
node --check scenario-engine.js
node --check gameplay-cast.js
node --check case-schema.js
node --check scripts/validate-assets-manifest.mjs
node --check tests/appraisal-detective-flow.spec.js
npm run validate:assets
npm run test:production
npm run test:persona
npm run test:switch-readiness
npx playwright test tests --reporter=line --workers=1
```

結果:

- `npx playwright test tests --reporter=line --workers=1`: `85 passed`
- `npm run test:production`: `production_server_checks=passed`
- `npm run validate:assets`: `asset_manifest_ok=true`, `asset_manifest_assets=22`
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:switch-readiness`: `switch_readiness_checks=passed`
- Windows Chrome headlessで mobile `390x844` と desktop `1440x1000` を確認。

公開URL検証:

```bash
curl -I https://minougun.github.io/appraisal-detective/
curl -I 'https://minougun.github.io/appraisal-detective/app.js?v=20260509-ui-review-fix'
curl -I 'https://minougun.github.io/appraisal-detective/styles.css?v=20260509-ui-review-fix'
```

結果:

- `https://minougun.github.io/appraisal-detective/`: `200`
- `app.js?v=20260509-ui-review-fix`: `200`
- `styles.css?v=20260509-ui-review-fix`: `200`
- `20260509-ui-review-fix` marker の反映を確認。

残リスク:

- GitHub Pagesの制約により、HTTP response headerとしてのCSP等は引き続き未反映。公開βとして扱う。
