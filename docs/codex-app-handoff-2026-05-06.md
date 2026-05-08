# Codex.app Handoff: 鑑定探偵

Date: 2026-05-06  
Local project: `/mnt/c/Users/minou/appraisal-detective/`  
Local URL: `http://127.0.0.1:44561/`

## 目的

不動産鑑定士として、不動産鑑定評価をリアル寄りに追体験できる「不動産探偵」型ゲームを作る。

現在のローカル完成判定ゴールは、ペルソナレビュー平均95点以上。実ユーザー調査ではなく、プロトタイプ完成度を測るローカル自動ゲートとして扱う。

## 現在の到達状況

- 3案件実装済み
  - `case001`: 川辺町住宅地 / 相続時価把握
  - `case002`: 駅前商業地 / 収益還元法
  - `case003`: 南口再開発予定地 / 開発法・最有効使用
- 5フェーズ構成
  - 依頼受付
  - 現地調査
  - 資料照合
  - 鑑定判断
  - 報告・対決
- 通常レビュー / 監査レビューあり
- 案件別ローカル記録あり
- ImageGen 2 API系の生成PNGを現地調査・人物ポートレートに使用
- `prefers-reduced-motion` 対応
- 低刺激モードあり
- SE ON/OFFあり
- Google Fonts依存は外し、`assets/fonts/NotoSansJP-VF.ttf` を自己ホスト

## ペルソナ95点ゲート

基準ファイル: `/mnt/c/Users/minou/appraisal-detective/docs/persona-review-goal-95-2026-05-06.md`

現在のゲート:

- P1 ADV・捜査読み好き
- P2 週1カジュアル
- P3 鑑定プロシマ
- P4 感覚過敏・配慮
- P5 リプレイ・スコア厨

最新結果:

```text
npm run test:persona
persona_average=100.0
```

この100点は、上記ローカル基準を満たしているという意味。実ユーザー検証済みという意味ではない。

## 実装済みの主な改善

- 初回画面の案件カードに生成PNGを表示
- 依頼者3名と先輩鑑定士のポートレートを表示
- 現地調査でホットスポットをクリックすると証拠カードを取得
- 証拠取得時に画面中央へカード演出
- 報告フェーズで証拠カードを3枚提示
- 証拠提示時に専門用語がフラッシュ表示
- 誤った鑑定判断を選ぶと「学びカード」を表示
- 各フェーズに「終了条件」を常時表示
- 結果画面にランクスタンプ、次周メモ、チェックリストを表示
- 監査レビューでは以下をチェック
  - 現地調査5/5
  - 重要3カード提示
  - 中立性維持
- 低刺激モードでは圧力フラッシュを無効化
- 低刺激モードでは証拠取得時の証拠ボード揺れも抑制
- 低刺激モードでは全SEを抑制
- 低刺激トグルに支援技術向け説明を付与
- 初回描画前に `prefers-reduced-motion` / 保存済み低刺激設定を同期する `boot.js` あり
- 低刺激設定の `localStorage` キーは `meta[name="appraisal-low-stimulus-storage-key"]` に集約
- 証拠取得、証拠提示、学びカードは `aria-live="assertive"` の `#sr-announcer` へ通知
- `prefers-reduced-motion` 時は `animation: none` / `transition: none`
- `npm run start` はCSP付き本番風サーバを起動。SimpleHTTPは `npm run start:dev`
- 現地調査に案件別ダミーホットスポットを追加。価格形成要因にならない対象を押すと学びカードで理由を返す。
- 報告対決で、提示した証拠に応じた依頼者反論を表示。
- 本番風ローカルサーバ `scripts/serve-production.mjs` あり
  - strict CSP: `script-src 'self'` / `style-src 'self'`
  - `unsafe-inline` 不使用
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - HTMLは `no-cache`、`assets/` はファイル名ハッシュ未導入のため短期cache
  - malformed percent-encoding は 400 で拒否し、サーバを継続稼働させる

## 重要ファイル

- `/mnt/c/Users/minou/appraisal-detective/index.html`
  - 静的HTML入口
- `/mnt/c/Users/minou/appraisal-detective/boot.js`
  - 低刺激モードの初回同期。CSP対応のためHTMLインラインから分離
- `/mnt/c/Users/minou/appraisal-detective/app.js`
  - 案件定義、証拠カタログ、ゲーム状態、全フェーズ描画、スコア計算
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
  - 机上捜査UI、紙質カード、証拠演出、低刺激対応、自己ホストフォント
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
  - 主要E2E
- `/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs`
  - ペルソナ95点ゲート
- `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs`
  - ImageGen 2 API系の画像生成スクリプト
- `/mnt/c/Users/minou/appraisal-detective/scripts/serve-production.mjs`
  - CSPとキャッシュヘッダ付きの本番風ローカル静的サーバ
- `/mnt/c/Users/minou/appraisal-detective/scripts/verify-production-server.mjs`
  - 本番風サーバのヘッダ、パストラバーサル耐性、キャッシュ設定を検証
- `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`
  - 実装ノートと検証履歴
- `/mnt/c/Users/minou/appraisal-detective/docs/persona-review-goal-95-2026-05-06.md`
  - ペルソナ基準と達成結果

## 生成・同梱アセット

画像:

- `/mnt/c/Users/minou/appraisal-detective/assets/kawabe-estate.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/ekimae-commercial.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/minamiguchi-redevelopment.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/tanaka-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/saeki-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/kurokawa-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/mentor-appraiser.generated.png`

フォント:

- `/mnt/c/Users/minou/appraisal-detective/assets/fonts/NotoSansJP-VF.ttf`

注意: フォントはローカル完成判定用に `/mnt/c/Windows/Fonts/NotoSansJP-VF.ttf` から複製した。外部配布・公開前にはライセンスと同梱可否を確認すること。

## 実行方法

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start
```

ブラウザ:

```text
http://127.0.0.1:44561/
```

既にサーバーが起動している場合は、そのまま上記URLで確認できる。

SimpleHTTPで軽く確認する場合:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start:dev
```

## 検証コマンド

```bash
cd /mnt/c/Users/minou/appraisal-detective
node --check app.js
node --check scripts/generate-image-assets.mjs
node --check scripts/persona-score-check.mjs
node --check scripts/serve-production.mjs
node --check scripts/verify-production-server.mjs
npm run test:persona
npm run test:production
npm run test:e2e
curl -I http://127.0.0.1:44561/
curl -I http://127.0.0.1:44561/assets/fonts/NotoSansJP-VF.ttf
```

最新検証結果:

- `node --check app.js && node --check scripts/persona-score-check.mjs`: passed
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:e2e`: `22 passed`
- `curl -I http://127.0.0.1:44561/`: `200 OK`
- `curl -I http://127.0.0.1:44561/assets/fonts/NotoSansJP-VF.ttf`: `200 OK / font/ttf`

Playwright実行時に `NO_COLOR` と `FORCE_COLOR` の警告が出ることがあるが、テスト失敗ではない。

追加確認:

- 低刺激ON時に `pressure-flash` と `evidence-flash` が付かないことをE2Eで確認済み。
- 低刺激ON時に `AudioContext.createOscillator()` が呼ばれないことをE2Eで確認済み。
- 証拠取得オーバーレイが `#sr-announcer` に通知されることをE2Eで確認済み。
- フェーズ遷移後に `#phase-title` へフォーカスが戻ることをE2Eで確認済み。
- `#stimulus-toggle` は `aria-label` と `aria-describedby` で、抑制対象を説明する。
- reduced motion時は初回表示から `低刺激 ON` / `aria-pressed="true"` になることをE2Eで確認済み。
- 低刺激設定キーをHTMLブート処理と `app.js` が同じ `meta` から読むことをE2Eで確認済み。

## 確認スクリーンショット

- `/tmp/appraisal-detective-p95-rebalanced-title-fixed.png`
- `/tmp/appraisal-detective-p95-rebalanced-field-fixed.png`
- `/tmp/appraisal-detective-p95-rebalanced-learning-fixed.png`

## 画像再生成

`OPENAI_API_KEY` または `/mnt/c/Users/minou/.openai-api-key` がある場合:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run generate:assets
```

スクリプトは既存画像をデフォルトでスキップする。再生成したい場合は:

```bash
FORCE_IMAGE_ASSETS=true npm run generate:assets
```

APIキー値はログに出さないこと。

OpenAI公式参照:

- `https://platform.openai.com/docs/guides/image-generation`
- `https://platform.openai.com/docs/api-reference/images/generate`
- `https://platform.openai.com/docs/models/gpt-image-1.5`

## Git / 作業状態

親ディレクトリ `/mnt/c/Users/minou` で見た状態:

```text
 M .cursor/rules/llm-authored-code-security.mdc
 M AGENTS.md
?? appraisal-detective/
```

`appraisal-detective/` は未追跡。`AGENTS.md` と `.cursor/rules/llm-authored-code-security.mdc` はこの作業と直接関係ない可能性があるため、勝手に戻さないこと。

## 既知の注意点

- 現在は静的HTML/JS/CSSのローカル版。バックエンド、認証、DB、外部公開はない。
- `localStorage` に案件記録とSE/低刺激設定を保存する。
- フォント同梱は外部配布前にライセンス確認が必要。
- ImageGen生成画像はローカル完成判定には十分だが、ストア公開や商用配布前には利用規約・権利・表現確認が必要。
- ペルソナ100点は自動ゲート上の達成であり、実プレイヤーテストではない。

## 次にCodex.appでやるなら

優先順:

1. `app.js` が大きいので、案件データ・描画・状態遷移・スコア計算を分割する。
2. フォント/画像アセットのライセンス確認と配布可否の記録を作る。
3. 実ユーザー向けに「初回チュートリアルをどこまで出すか」をプレイテストする。
4. 案件004以降を追加するなら、既存 `caseDefinitions` / `evidenceCatalog` / `caseHotspots` の構造に合わせる。
5. 公開を考える場合は、ビルド方式、アセット圧縮、ライセンス、クレジット表記、READMEの配布向け整理を先に行う。

## Issue / PR

- GitHub Issue: `not_applicable`
- PR: `not_applicable`
- 理由: ローカル作業で、外部公開・push・PR作成は行っていない。
