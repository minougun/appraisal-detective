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

## 正式本番にするための停止境界

次のどれかが必要。いずれも外部サービス作成、DNS変更、secret登録、またはdeploy先変更に該当するため、人間確認なしに実行しない。

1. Cloudflare PagesにGitHub repositoryを接続し、publish directoryをrepo rootにする。
2. NetlifyにGitHub repositoryを接続し、publish directoryをrepo rootにする。
3. VercelにGitHub repositoryを接続し、static projectとしてrepo rootを配信する。
4. GitHub PagesをCloudflare proxy/Workerの背後に置き、Workerで同等ヘッダを付与する。

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
公開URLの正式本番ヘッダ検証: GitHub Pagesでは失敗
残る外部作業: ヘッダ対応ホスティングへの切替
```
