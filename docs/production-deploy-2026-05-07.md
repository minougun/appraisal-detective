# 鑑定探偵 本番デプロイ記録 2026-05-07

## 公開先

- Production URL: https://minougun.github.io/appraisal-detective/
- GitHub repository: https://github.com/minougun/appraisal-detective
- GitHub repository homepage: https://minougun.github.io/appraisal-detective/
- GitHub Pages source: `main` branch, `/`
- Deploy artifact source: `/tmp/appraisal-detective-pages`
- Local source path: `/mnt/c/Users/minou/appraisal-detective`

## デプロイ内容

公開repoには、実行に必要な静的ファイルだけを含めた。

- `index.html`
- `boot.js`
- `app-utils.js`
- `audio-controller.js`
- `game-state.js`
- `case-data.js`
- `commercial-case-pack.js`
- `case-schema.js`
- `scoring.js`
- `renderers/hbu-renderer.js`
- `app.js`
- `styles.css`
- `assets/`
- `assets-manifest.json`
- `.nojekyll`

ローカルレビュー用docsは公開成果物から除外した。AI/credit詳細文書は、ローカル側の
`/mnt/c/Users/minou/appraisal-detective/docs/credits-and-ai-disclosure-final-2026-05-07.md`
で管理する。

## Commit

- Deploy repo commit: `32c71ed`
- Commit message intent: `Ship appraisal detective as a public static game`

## 検証

ローカル成果物:

- `/tmp/appraisal-detective-pages` を `python3 -m http.server 44563 --bind 127.0.0.1` で配信
- Playwright smoke: `deploy_artifact_smoke=passed`

GitHub Pages:

- Pages status: `built`
- Pages workflow: `pages build and deployment` completed successfully
- `curl -L https://minougun.github.io/appraisal-detective/`: HTTP 200
- Playwright smoke against production URL: `live_pages_smoke=passed`
- `assets/kawabe-estate.generated.png`: HTTP 200, PNG, `1536 x 1024`

## 既知の制約

GitHub Pagesは静的配信であり、ローカルの `scripts/serve-production.mjs` と同じ
`Content-Security-Policy` ヘッダーは返せない。現行の本番URLではHTTPSとGitHub Pagesの
標準ヘッダーで配信される。

2026-05-07追記: GitHub Pages上でもCSPを有効にするため、`index.html` に
`http-equiv="Content-Security-Policy"` のmeta CSPを追加した。これにより、スクリプト、
スタイル、画像、フォント、BGM、通信先はすべて同一オリジンへ制限される。

完全なHTTPヘッダーCSP、`frame-ancestors`、`X-Frame-Options` などを本番配信レイヤーで
強制する場合は、Cloudflare Pages、Netlify、Vercel、または自前Node配信へ切り替える。
将来移行用に `_headers` も追加済み。

## Issue / PR

- Issue: not_applicable
- PR: not_applicable

理由: ローカルonlyで準備した静的成果物を、ユーザーの明示指示に基づいて新規GitHub Pages
repoへ直接デプロイしたため。
