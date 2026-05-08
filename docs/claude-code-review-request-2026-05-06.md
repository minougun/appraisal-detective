# Claude Code Review Request: 鑑定探偵

Date: 2026-05-06  
Target URL: `http://127.0.0.1:44561/`  
Target path: `/mnt/c/Users/minou/appraisal-detective/`

## 依頼

`鑑定探偵 / Appraisal Detective` の現行版を、Claude Code視点で辛口レビューしてください。

目標は「ペルソナレビュー平均95点以上を維持しながら、実際に製品初版として出せる水準へ近づけること」です。現行のローカル自動ゲートでは `persona_average=100.0` ですが、これは実ユーザー検証済みという意味ではありません。ゲートの過大評価、実プレイ時の弱点、設計負債を重点的に疑ってください。

## プロダクト概要

不動産鑑定士として、不動産鑑定評価をリアル寄りに追体験する「不動産探偵」型ゲームです。

- 3案件:
  - `case001`: 川辺町住宅地 / 相続時価把握
  - `case002`: 駅前商業地 / 収益還元法
  - `case003`: 南口再開発予定地 / 最有効使用
- 5フェーズ:
  - 依頼受付
  - 現地調査
  - 資料照合
  - 鑑定判断
  - 報告・対決
- 通常レビュー / 監査レビュー
- 案件別ローカル記録
- ImageGen系生成PNGによる現地調査ビジュアルと人物ポートレート
- 専門用語カード、学びカード、次周メモ、監査補正
- `prefers-reduced-motion` と低刺激モード対応
- 自己ホスト日本語フォント
- 本番風ローカル静的サーバあり

## 最近の主な変更

- `boot.js` を追加し、低刺激モードの初回同期をHTMLインラインから分離。
- `index.html` からインライン `<script>` を排除。
- `app.js` の動的 `style=` を排除し、ポートレートとホットスポット位置をCSSクラスへ移動。
- Claude Code辛口レビュー後、低刺激ON時の全SE抑制、`aria-live` 通知、`animation: none`、ダミーホットスポット、依頼者反論を追加。
- `scripts/serve-production.mjs` を追加。
  - `Content-Security-Policy`
  - `script-src 'self'`
  - `style-src 'self'`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy`
  - HTML `no-cache`
  - `assets/` immutable cache
- `scripts/verify-production-server.mjs` を追加し、ヘッダ検証とChromiumでのCSP下初期表示確認を行う。
- `scripts/persona-score-check.mjs` に本番風配信チェックを追加。

## 重要ファイル

- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/boot.js`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/package.json`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
- `/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/serve-production.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/verify-production-server.mjs`
- `/mnt/c/Users/minou/appraisal-detective/docs/persona-review-goal-95-2026-05-06.md`
- `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`
- `/mnt/c/Users/minou/appraisal-detective/docs/codex-app-handoff-2026-05-06.md`

## 実行方法

標準のローカル確認:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start
```

ブラウザ:

```text
http://127.0.0.1:44561/
```

SimpleHTTPで軽く確認:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start:dev
```

## 現行の検証結果

直近で通した検証:

```bash
cd /mnt/c/Users/minou/appraisal-detective
node --check boot.js
node --check app.js
node --check scripts/serve-production.mjs
node --check scripts/verify-production-server.mjs
node --check scripts/persona-score-check.mjs
npm run test:production
npm run test:persona
npm run test:e2e
curl -I http://127.0.0.1:44561/
curl -I http://127.0.0.1:44561/boot.js
```

結果:

- `npm run test:production`: `production_server_checks=passed`
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:e2e`: `22 passed`
- `curl -I http://127.0.0.1:44561/`: `200 OK`
- `curl -I http://127.0.0.1:44561/boot.js`: `200 OK`

Playwrightで `NO_COLOR` と `FORCE_COLOR` の警告が出ることがありますが、テスト失敗ではありません。

## レビューで特に見てほしい観点

### 1. ゲームとしての面白さ

- 3案件が本当に別体験になっているか。
- Hidden Object、資料照合、鑑定判断、報告対決が「ミニゲームの羅列」になっていないか。
- 証拠カード3枚提示に、プレイヤーの判断の重みがあるか。
- 監査レビューや記録保存が、二周目の動機として十分か。
- ペルソナ平均100点ゲートが甘すぎないか。

### 2. 不動産鑑定評価の追体験

- 専門用語が「飾り」ではなく、判断の武器として機能しているか。
- 取引事例比較法、収益還元法、開発法、最有効使用、事情補正、時点修正、独立性・中立性の扱いに誤学習リスクがないか。
- 実務・試験寄りのプレイヤーが見たときに、薄い/雑に見える箇所はどこか。
- 鑑定評価基準への準拠感とゲームテンポのバランスが取れているか。

### 3. UI / UX / アートディレクション

- 「暗い鑑定事務所の机上に置かれた事件ファイル」という方向が一貫しているか。
- 画面密度、文字量、余白、視線誘導に問題がないか。
- 初見プレイヤーが60秒以内に「何をすればいいか」を理解できるか。
- スクリーンショット映え、配信映えする瞬間があるか。
- カジュアル層にはまだ重すぎないか。

### 4. アクセシビリティ / 低刺激

- `prefers-reduced-motion` と手動低刺激モードの設計に矛盾がないか。
- 低刺激モードで、圧フラッシュ、低音効果、証拠ボード揺れが十分抑えられているか。
- `aria-label`、`aria-describedby`、`aria-live`、キーボード操作に問題がないか。
- 色だけで意味を伝えていないか。

### 5. 本番化 / セキュリティ / 配信

- `scripts/serve-production.mjs` のCSP、キャッシュ、パストラバーサル対策が十分か。
- `unsafe-inline` を使わない構造が維持できているか。
- 画像・フォント・JS・CSSの配信ヘッダが妥当か。
- `localStorage` 保存内容にプライバシーや破損時の問題がないか。
- 本番公開に向けて足りないものは何か。

### 6. 保守性

- `app.js` が大きくなりすぎていないか。
- 案件追加時の変更箇所が多すぎないか。
- 証拠カタログ、案件定義、UI描画、スコア計算、音、保存、監査が密結合しすぎていないか。
- 分割するならどの境界が最も費用対効果が高いか。
- いま分割すべきか、完成形の体験を優先してまだ単一ファイルでよいか。

## 既知の注意点

- `appraisal-detective/` は現時点で未追跡ディレクトリです。
- 親ディレクトリ `/mnt/c/Users/minou` では、以下の差分が見えます。

```text
 M .cursor/rules/llm-authored-code-security.mdc
 M AGENTS.md
?? appraisal-detective/
```

- `AGENTS.md` と `.cursor/rules/llm-authored-code-security.mdc` は今回のレビュー対象外です。勝手に戻さないでください。
- フォント `/mnt/c/Users/minou/appraisal-detective/assets/fonts/NotoSansJP-VF.ttf` はローカル完成判定用に `/mnt/c/Windows/Fonts/NotoSansJP-VF.ttf` から複製したものです。公開配布前にはライセンスと同梱可否の確認が必要です。
- ImageGen系生成画像は既に同梱済みです。再生成には `OPENAI_API_KEY` または `/mnt/c/Users/minou/.openai-api-key` が必要です。APIキー値はログに出さないでください。
- 外部公開、push、PR、デプロイは行っていません。

## Claude Codeへの出力依頼

以下の形式で出してください。

1. 総評
   - 95点以上の完成度に見えるか。
   - 実ユーザー評価なら何点くらいか。
2. ブロッカー
   - 公開前に必ず直すべきもの。
   - ファイルパスと理由を明示。
3. 高優先度の改善
   - 体験、アクセシビリティ、本番化、保守性の順に。
4. ペルソナ別再スコア
   - P1 ADV・捜査読み好き
   - P2 週1カジュアル
   - P3 鑑定プロシマ
   - P4 感覚過敏・配慮
   - P5 リプレイ・スコア厨
5. ペルソナゲートへの批判
   - `scripts/persona-score-check.mjs` が甘い/過学習している箇所。
   - 追加すべき自動チェック。
6. 具体的な次タスク
   - 1日でできるもの。
   - 3日でできるもの。
   - 1週間でできるもの。
7. 最終判断
   - このままHTML版を伸ばすべきか。
   - Unity等へ移るべきか。
   - その理由。

辛口で構いません。特に「自動ゲートでは100点だが、人間が遊ぶとまだ弱い」点を優先して指摘してください。
