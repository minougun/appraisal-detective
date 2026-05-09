# 正式本番リスク解消メモ

作成日: 2026-05-09

## ゴール

GitHub Pages公開βに残っている、HTTP response headerとしてのCSP等が返らないリスクを潰し、正式本番として扱える配信面を用意する。

## 解消済み

- `scripts/security-headers.mjs` に正式本番ヘッダを集約。
- `scripts/serve-production.mjs` は同じヘッダ定義を使ってローカルproduction-like配信を行う。
- `_headers` をCloudflare Pages / Netlify互換のヘッダ設定として整備。
- `netlify.toml` を追加し、Netlify配信時に同じヘッダとasset cacheを返す設定を追加。
- `vercel.json` を追加し、Vercel配信時に同じヘッダとasset cacheを返す設定を追加。
- `scripts/verify-deploy-config.mjs` を追加し、ローカル設定のヘッダ不一致を検出可能にした。
- `scripts/verify-public-headers.mjs` を追加し、公開URLが正式本番ヘッダを返すか検証可能にした。

## 現在の未解消リスク

2026-05-09 14:28 JSTにVercel正式本番URL `https://appraisal-detective.vercel.app/` でHTTP response header検証が通った。したがって、正式本番URLとして扱う対象はVercel URLに切り替える。

GitHub Pages公開βURLは残すが、正式本番とは扱わない。

`https://minougun.github.io/appraisal-detective/` はGitHub Pages配信のため、公開URLのHTTP response headerとして以下が返らない。

- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Permissions-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`

`index.html` のmeta CSPは残しているが、HTTP response headerの完全な代替ではない。特に `frame-ancestors` と `X-Frame-Options` は配信レイヤーでの強制が必要。

確認コマンド:

```bash
node scripts/verify-public-headers.mjs https://minougun.github.io/appraisal-detective/
```

現状の期待結果:

```text
public_header_checks=failed
index should set Content-Security-Policy: ...
```

これはアプリコード不足ではなく、現在の配信先が正式本番ヘッダを返せないことを示す。

## Vercel正式本番デプロイ

対象:

- Formal production URL: `https://appraisal-detective.vercel.app/`
- Deployment provider: Vercel
- Static project root: repository root

実施:

- Vercel CLIでproduction deployを実行。
- PC名に日本語が含まれる環境でVercel CLIがHTTP header valueエラーを起こしたため、`scripts/vercel-ascii-hostname.cjs` を `NODE_OPTIONS=--require ...` で読み込み、CLI実行時だけ `os.hostname()` をASCIIへ差し替えた。
- Vercelが作成する `.vercel/` はローカル環境情報のため `.gitignore` に追加。

検証:

```bash
node scripts/verify-public-headers.mjs https://appraisal-detective.vercel.app/
curl -I https://appraisal-detective.vercel.app/
curl -I https://appraisal-detective.vercel.app/app.js
curl -I https://appraisal-detective.vercel.app/assets/fonts/NotoSansJP-VF.ttf
npm run test:deploy-config
npm run test:production
```

結果:

- `public_header_checks=passed url=https://appraisal-detective.vercel.app/`
- `Content-Security-Policy`: present
- `Cross-Origin-Opener-Policy: same-origin`: present
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`: present
- `Referrer-Policy: no-referrer`: present
- `X-Content-Type-Options: nosniff`: present
- `X-Frame-Options: DENY`: present
- HTML `Cache-Control: no-cache`: present
- asset `Cache-Control: public, max-age=3600`: present
- Windows Chrome headlessで mobile `390x844` と desktop `1440x1000` を確認。

参照:

- Cloudflare Pages headers: `https://developers.cloudflare.com/pages/configuration/headers/`
- Netlify custom headers: `https://docs.netlify.com/routing/headers/`
- Vercel project configuration headers: `https://vercel.com/docs/project-configuration`

## 完了条件

新しい正式本番URLに対して、次が通ること。

```bash
node scripts/verify-public-headers.mjs https://<formal-production-url>/
npm run test:production
npm run test:deploy-config
npx playwright test tests --reporter=line --workers=1
```

さらに `curl -I https://<formal-production-url>/` で、少なくとも以下を確認する。

```text
Content-Security-Policy: default-src 'self'; ...
Cross-Origin-Opener-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cache-Control: no-cache
```

## 判定

```text
repo側の正式本番ヘッダ設定: 完了
Vercel正式本番デプロイ: 完了
公開URLの正式本番ヘッダ検証: 完了
GitHub Pages公開β: 継続。ただし正式本番扱いしない
残る外部作業: なし
```
