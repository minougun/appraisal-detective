# 鑑定探偵 GPT-5.5 Pro 商用95点到達レビュー依頼

作成日: 2026-05-07

対象URL: `http://127.0.0.1:44561/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## レビュー目的

商用ゲームとして、ペルソナレビュー平均95点に到達しているかを辛口で再判定してください。

今回のゴールは、前回レビューで残っていた4本の課題をローカルで完了し、さらにP5「リプレイ・スコア厨」の弱点を潰した状態を確認することです。

## 前回から閉じた残課題

### 1. `assets-manifest.json` の商用台帳化

`/mnt/c/Users/minou/appraisal-detective/assets-manifest.json` は、22件の画像アセットについて以下を持つ商用台帳になっています。

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

生成スクリプト:

- `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs`

### 2. `case-schema.js` の整合性検証強化

`/mnt/c/Users/minou/appraisal-detective/case-schema.js` は、production strict mode と security fixture mode を分離しています。

production modeでは、以下を検証します。

- `assetRefs.fieldImage / clientPortrait` がmanifestに存在する
- `image` がローカル `assets/` を参照する
- `hbuMatrix` に `法的可能性 / 物理的可能性 / 市場性 / 収益性・経済合理性` がある
- `auditCriteria.focus / risk / comment / requiredEvidence` がある
- manifest assetが `sha256 / width / height / bytes / reviewStatus / storeUseAllowed / aiDisclosureCategory` を持つ

Node VM検証では、case001〜010が `ok:true`、`caseCount:10`、`errors:[]` です。

### 3. `app.js` の追加分割

すでに分離済み:

- `/mnt/c/Users/minou/appraisal-detective/app-utils.js`
- `/mnt/c/Users/minou/appraisal-detective/audio-controller.js`
- `/mnt/c/Users/minou/appraisal-detective/game-state.js`
- `/mnt/c/Users/minou/appraisal-detective/case-schema.js`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/renderers/hbu-renderer.js`

`hbu-renderer.js` は `APPRAISAL_UTILS.htmlText/htmlAttr` を必須化し、`Object.freeze(window.APPRAISAL_HBU_RENDERER)` で公開しています。未ロード時は `app.js` 起動時に明示エラーを投げます。

### 4. 案件001〜003の人間プレイテストとストア素材化

実参加者募集や外部公開は未実施です。これはユーザーの明示確認が必要な外部作業のためです。

ただし、以下は完了済みです。

- 5ペルソナの人間プレイテストプロトコル
- case001〜003の評価観点
- Steam/itch向けショットリスト
- 実ゲーム画面から切り出した1920x1080 PNGスクリーンショット6枚

スクリーンショット保存先:

- `/mnt/c/Users/minou/appraisal-detective/docs/store-screenshots/`

作成済み:

- `01-title-case-files-1920x1080.png`
- `02-case001-field-evidence-1920x1080.png`
- `03-case002-income-appraisal-1920x1080.png`
- `04-case003-hbu-matrix-1920x1080.png`
- `05-case003-report-battle-1920x1080.png`
- `06-case003-final-audit-1920x1080.png`

## 今回さらに追加した改善

前回レビューで平均95点を阻害していた最大要因は、P5「リプレイ・スコア厨」の低評価でした。

今回、以下を追加しました。

- 最終レビューの `次周メモ` に `別解ルート候補` を表示
- 結果画面に `スコア研究軸` または案件別 `replayGoal` を表示
- `クリア記録一覧` に各案件の次周目標を表示
- `実績` に `Sランク論証` と `HBU審査官` を追加
- case003の最有効使用マトリクスを、高得点・実績・次周目標へ接続

狙いは、固定正解を1回なぞるだけのゲームではなく、証拠3枚の組み替え、監査レビュー、市場シナリオ差分、HBU説明力で再挑戦するゲームに寄せることです。

## 現行ゲーム内容

- 10案件
  - case001: 川辺町住宅地 / イージー
  - case002: 駅前商業地 / ノーマル
  - case003: 南口再開発予定地 / ハード
  - case004: 港北工場跡地 / 担保評価
  - case005: 借地権付建物
  - case006: 底地
  - case007: 区分所有
  - case008: ホテル
  - case009: 物流倉庫
  - case010: シンガポール海外案件
- 事件ファイル選択
- ノベルADV会話
- 現地調査Hidden Object
- ダミーホットスポット
- 資料照合
- ダミー資料
- 案件固有メカニクス
- 数値検算
- 最有効使用マトリクス
- 試算価格の調整幅選択
- 調整根拠2枚選択
- 証拠3枚の報告対決
- 依頼者反論
- 再反論と反論根拠選択
- 倫理選択
- 通常レビュー / 監査レビュー
- ローカル記録
- 実績
- BGM / SE / 低刺激
- `prefers-reduced-motion`
- CSP付きproduction-like local server

## 検証結果

実行済み:

```bash
npm run generate:assets
node --check scripts/generate-image-assets.mjs
node --check case-schema.js
node --check renderers/hbu-renderer.js
node --check commercial-case-pack.js
node --check case-data.js
node --check app.js
node --check tests/appraisal-detective-flow.spec.js
npx playwright test tests/appraisal-detective-flow.spec.js --reporter=line --grep "generated image manifest|case schema separates|hbu renderer escapes|expanded commercial cases|case schema validates"
npx playwright test tests/appraisal-detective-flow.spec.js --reporter=line --grep "next-run checklist|records and achievements"
npm run test:persona
npm run test:production
npm run test:e2e
```

最新確認:

- targeted HBU/schema/manifest: `5 passed`
- replay/records targeted: `2 passed`
- `npm run test:persona`: `persona_average=100.0`
- persona gate type: `spec_coverage_not_human_commercial_quality`
- `npm run test:production`: passed
- full E2E: `68 passed`

## レビュー時に見てほしい論点

1. 商用ゲームとして、5ペルソナ平均95点に届くか。
2. P5「リプレイ・スコア厨」がまだ足を引っ張るか。
3. case003の最有効使用マトリクスは、95点サンプルの中核として十分か。
4. case001はイージー導入として専門知識なしでも入れるか。
5. case002は収益還元法のノーマル案件として納得感があるか。
6. AI生成画像台帳とAI利用開示は、商用公開前レビューに耐えるか。
7. Steam/itch向け実スクリーンショット6枚は、ストアで買いたくなる画面になっているか。
8. まだUnity移行を検討する理由があるか。それともHTML版継続でよいか。

## 制約

- 外部公開、Steam/itch登録、実参加者募集、PR作成、pushは実施していません。
- 実参加者プレイテストは未実施です。プロトコルとスクリーンショット素材は作成済みです。
- `npm run test:persona` は商用品質ではなく仕様充足ゲートです。レビューでは人間ペルソナの観点で辛口採点してください。

## 期待する出力

- 総合点
- ペルソナ別点数
- 平均95点達成/未達の判定
- 未達の場合の残課題をP0/P1/P2で分類
- HTML版継続か、Unity移行かの最終判断
- Steam/itch公開前に必須の作業
