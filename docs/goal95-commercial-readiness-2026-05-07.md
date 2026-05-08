# 鑑定探偵 goal95 商用化残課題クローズ記録

作成日: 2026-05-07

対象URL: `http://127.0.0.1:44561/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 結論

今回のgoalは「商用95点へ向けた実装P1を閉じ、人間評価とストア素材制作へ渡せる状態にする」ことです。外部公開、Steam登録、実ユーザー募集は実施していません。

## 完了した4本

### 1. assets-manifest.json の商用台帳化

`/mnt/c/Users/minou/appraisal-detective/assets-manifest.json` を、単なる生成履歴から商用台帳へ拡張しました。

各assetに追加した項目:

- `caseId`
- `assetType`
- `usage`
- `altText`
- `promptSummary`
- `creditText`
- `regenerationPolicy`
- `modelRationale`
- `sha256`
- `width`
- `height`
- `bytes`
- `reviewStatus`
- `reviewedAt`
- `reviewer`
- `storeUseAllowed`
- `aiDisclosureCategory`

生成スクリプト `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs` は、既存画像を再生成せずmanifestだけ更新できるよう、API key読み込みを画像生成時まで遅延しました。

AI利用開示の暫定文:

> 本作の一部背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。ゲーム実行中にプレイヤー入力から画像を生成する機能はありません。

### 2. case-schema.js の整合性検証強化

`/mnt/c/Users/minou/appraisal-detective/case-schema.js` を、商用品質の整合性検証へ拡張しました。

追加検証:

- `imageAlt`
- `assetRefs.fieldImage`
- `assetRefs.clientPortrait`
- manifest内asset存在照合
- `client.name`
- `reportStructure.fact / analysis / conclusion`
- `hbuMatrix.title / lead / rows / conclusion`
- HBU rows: `法的可能性`, `物理的可能性`, `市場性`, `収益性・経済合理性`
- `auditCriteria.focus / risk / comment / requiredEvidence`
- production strict modeで、`image` が `assets/` 以外のローカルassetを指すcaseをreject
- security fixture modeで、XSS/fallback検証用の危険な `image` 値をアプリ側sanitizeテストへ通す
- manifest側assetの `sha256 / width / height / bytes / reviewStatus / storeUseAllowed / aiDisclosureCategory` 検証

case001〜010は、manifest照合込みで `ok: true` を確認済みです。

### 3. app.js の追加分割

`/mnt/c/Users/minou/appraisal-detective/renderers/hbu-renderer.js` を追加し、最有効使用マトリクスと監査コメント表示を `app.js` から分離しました。

分離した責務:

- `hbuMatrixMarkup(matrix)`
- `auditCriteriaMarkup(criteria, reportIds, evidenceLabels)`

`/mnt/c/Users/minou/appraisal-detective/index.html` では、`app.js` より前に `./renderers/hbu-renderer.js` を読み込んでいます。

追加レビューで指摘されたXSS境界は、`hbu-renderer.js` 内で `APPRAISAL_UTILS.htmlText/htmlAttr` を必須化し、Playwrightで `<script>`, `<img onerror>`, `<svg onload>`, `onclick` 混入時にactive nodeが生成されないことを固定しました。

`window.APPRAISAL_HBU_RENDERER` は `Object.freeze()` しています。未ロード時は `app.js` 起動時に明示エラーを投げます。

### 4. 案件001〜003の人間プレイテストとストア素材化

人間プレイテストは外部参加者を募集していないため未実施です。代わりに、すぐ実施できる評価プロトコルとストア素材ショットリストを固定しました。

#### 人間プレイテスト対象

- case001: 川辺町住宅地 / イージー
- case002: 駅前商業地 / ノーマル
- case003: 南口再開発予定地 / ハード

#### 参加者5名の割当

- P1: ADV・捜査読み好き
- P2: 週1カジュアル
- P3: 鑑定プロシマ
- P4: 感覚過敏・配慮
- P5: リプレイ・スコア厨

#### 測る項目

- 1件目の離脱点
- 理解不能語
- 「続きが気になるか」
- 「スクショで買う気になるか」
- 「2周目をやりたいか」
- 音・演出・点滅の不快
- 専門職らしさ

#### ストアスクショ候補

Steam要件に合わせ、1920x1080以上・16:9・実ゲーム画面で切り出す候補:

1. タイトル/事件ファイル選択
2. case001 現地調査で証拠カードが出る瞬間
3. case002 資料照合と収益価格判断
4. case003 最有効使用マトリクス
5. case003 報告対決と再反論
6. 最終レビューの監査コメント
7. 記録/実績/次周目標

このうち、外部アップロードなしのローカル候補として以下6枚を実ゲーム画面から作成しました。

保存先:

- `/mnt/c/Users/minou/appraisal-detective/docs/store-screenshots/`

作成済み:

- `01-title-case-files-1920x1080.png`
- `02-case001-field-evidence-1920x1080.png`
- `03-case002-income-appraisal-1920x1080.png`
- `04-case003-hbu-matrix-1920x1080.png`
- `05-case003-report-battle-1920x1080.png`
- `06-case003-final-audit-1920x1080.png`

全ファイルは `1920x1080` のPNGであることをPNGヘッダから確認済みです。

## case003 HBU中核化

case003は「95点サンプルの中核」として、最有効使用マトリクスを次の3点へ接続しました。

- 演出: 鑑定判断フェーズにHBUマトリクスを表示
- 判断分岐: `legalDiscount`、`legalConstraint`、`bestUseAdjustment` と接続
- 監査コメント: 最終レビューで `auditCriteria` として表示

監査焦点:

> 最有効使用マトリクスで、最大容積案を合法性・物理性・市場性・収益性の順に絞ったか。

監査リスク:

> 依頼者の14階案をそのまま販売総額へ入れ、斜線制限・道路後退・立退き・浸水リスクを後回しにしていないか。

## case004〜010 HBU/audit手書き化

追加レビューで「case004〜010のHBU matrix / audit criteria自動補完が形式だけ通る危険」が指摘されたため、商用拡張案件のHBUと監査基準を案件固有の手書き文言へ置き換えました。

対象:

- case004: 担保評価 / 土壌調査未了、正常価格、換金性リスク
- case005: 借地権評価 / 譲渡承諾、地代、増改築制限
- case006: 底地評価 / 地代収受権、借地人交渉、流動性減価
- case007: 区分所有 / 修繕積立、共用部、管理規約、眺望リスク
- case008: ホテル / 年間安定NOI、FF&E、運営契約、季節変動
- case009: 物流倉庫 / WALE、接車機能、床荷重、BCP、テナント集中
- case010: 海外案件 / IVS前提、為替時点、借地残存期間、限定条件

これにより、schema通過のための汎用補完ではなく、案件別の価格形成要因・最有効使用・監査焦点に接続する形へ寄せました。

## リプレイ性と商用レビュー95点向けの追加改善

商用レビューで最後まで弱点として残っていたP5「リプレイ・スコア厨」向けに、結果画面と製品画面を更新しました。

実装:

- 最終レビューの `次周メモ` に `別解ルート候補` を追加
- 同じ結論を別の3枚で支える周回目的を表示
- 案件ごとの `replayGoal` を結果画面と記録画面へ接続
- `クリア記録一覧` に各案件の次周目標を表示
- `実績` に `Sランク論証` と `HBU審査官` を追加

狙い:

- 固定正解を一度なぞって終わる体験から、証拠構成・監査・市場シナリオを変える再挑戦へ誘導する
- case003の最有効使用マトリクスを、単なる専門説明ではなく高得点・実績・次周目標の中核にする
- 商用レビューでP5だけが平均を下げる構造を局所的に補強する

## 検証

実施したローカル検証:

```bash
npm run generate:assets
node --check scripts/generate-image-assets.mjs
node --check case-schema.js
node --check renderers/hbu-renderer.js
node --check commercial-case-pack.js
node --check case-data.js
node --check app.js
```

追加で、Node VM上で以下を確認:

- `window.APPRAISAL_CASE_SCHEMA.validateCaseData(window.APPRAISAL_CASE_DATA, manifest, { mode: "production" })`
- 結果: `ok: true`, `caseCount: 10`, `errors: []`

追加Playwright検証:

```bash
npx playwright test tests/appraisal-detective-flow.spec.js --reporter=line --grep "generated image manifest|case schema separates|hbu renderer escapes|expanded commercial cases|case schema validates"
```

結果:

- `5 passed`

追加で確認した内容:

- 生成画像manifestが `sha256 / width / height / bytes / reviewStatus / storeUseAllowed / aiDisclosureCategory` を持つ
- schemaがproduction strict modeとsecurity fixture modeを分離する
- HBU rendererがcase data文字列をHTMLとして実行しない
- case004〜010が案件固有のHBU/audit文言を持つ

リプレイ性追加検証:

```bash
npx playwright test tests/appraisal-detective-flow.spec.js --reporter=line --grep "next-run checklist|records and achievements"
```

結果:

- `2 passed`

確認内容:

- 最終レビューに `別解ルート候補` と `スコア研究軸` が出る
- クリア記録一覧に次周目標が出る
- 実績に `Sランク論証` と `HBU審査官` が出る

## 残る外部作業

Codexがこのターンで実行しないもの:

- 実参加者を集めた人間プレイテスト
- Steam/itch.ioへの登録・公開
- ストア画像の外部アップロード
- 有料配信前の法務/プラットフォーム審査

これらは外部公開・外部募集を含むため、ユーザーの明示確認が必要です。

## Issue / PR

- GitHub Issue: `not_applicable`。この作業はローカル未接続ワークスペースで実施。
- PR: `not_applicable`。外部送信・push・PR作成はユーザーの明示確認なしに行わない。
