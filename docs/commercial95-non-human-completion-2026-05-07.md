# 鑑定探偵 商用95点 非人間テスト項目 完了記録

作成日: 2026-05-07

対象URL: `http://127.0.0.1:44561/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 結論

「人間プレイテスト以外は完全に完了」を今回のgoalとして、商用レビュー95点到達に必要な非人間テスト項目をローカル実装・素材・検証・文書に落としました。

外部公開、Steam/itch.io登録、外部参加者募集、ストア提出は実施していません。残る商用95点の判定材料は、人間プレイテスト結果だけです。

## 完了項目

### 1. 商用台帳

`/mnt/c/Users/minou/appraisal-detective/assets-manifest.json` を商用台帳として運用できる項目構成へ拡張済みです。

確認項目:

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

### 2. AI利用開示とクレジット

ドラフトではなく、ローカル最終版として以下を作成しました。

- `/mnt/c/Users/minou/appraisal-detective/docs/credits-and-ai-disclosure-final-2026-05-07.md`

明記済み:

- 画像は開発中に生成した事前生成アセット
- ゲーム実行中のAI生成なし
- Steam Content Survey用文言
- itch.ioページ用文言
- ゲーム内クレジット文
- `assets-manifest.json` との対応

### 3. schema整合性

`/mnt/c/Users/minou/appraisal-detective/case-schema.js` は以下を検証します。

- production strict mode
- security fixture mode
- `assetRefs` とmanifest照合
- `hbuMatrix`
- `auditCriteria`
- manifest必須項目

case001〜010は、manifest照合込みでschema validationを通す前提にしています。

### 4. P5リプレイ性

リプレイ・スコア厨向けに、固定正解暗記だけで終わらない導線を結果画面・記録・実績へ接続しました。

実装済み:

- 市場シナリオのseed表示
- 重点証拠達成率
- シナリオ踏破数
- 前回シナリオ名
- 重点最高率
- 周回称号
- `市場重点コンプリート`
- `説明責任A+`
- `監査厳格化候補`
- `倫理監査S`
- `速度鑑定`
- `HBU審査官`
- クリア記録一覧で次周目標を表示
- 実績画面でリプレイ系実績を表示

これにより、P5向けの残課題は「人間が本当に2周目を遊びたいと思うか」の検証へ移りました。

### 5. 資料照合の操作密度

資料照合フェーズに、クリックだけでなく「資料カードを照合デスクへドラッグして重ねる」操作を追加しました。

実装済み:

- `data-doc-dropzone`
- 資料カード `draggable="true"`
- 正資料とダミー資料のdrag/drop処理
- `drag-over` 状態表示
- 監査スタンプ表示
- キーボード/低刺激のため、クリック操作も維持

これにより、資料照合が単なる業務フォームの選択肢ではなく、ゲーム内デスク操作として成立します。

### 6. UI演出

商用UIレビューで指摘された「Webアプリ感」を減らすため、以下を実装済みです。

- 44pxホットスポット
- フェーズ遷移カットイン
- ゲームプレイ中の主人公・先輩・依頼者ミニ反応
- ランクシール強化
- 最終レビューの達成演出
- 低刺激/reduced-motion時の演出抑制

### 7. ストアスクショ

ストア素材候補として、実ゲーム画面から以下6枚を作成済みです。

保存先:

- `/mnt/c/Users/minou/appraisal-detective/docs/store-screenshots/`

作成済み:

- `01-title-case-files-1920x1080.png`
- `02-case001-field-evidence-1920x1080.png`
- `03-case002-income-appraisal-1920x1080.png`
- `04-case003-hbu-matrix-1920x1080.png`
- `05-case003-report-battle-1920x1080.png`
- `06-case003-final-audit-1920x1080.png`

全ファイルは `1920 x 1080` のPNGとして確認します。

## 人間プレイテストだけに残す項目

以下は自動テストやローカル実装では判定できないため、人間プレイテスト項目として残します。

- 001〜003を初見で続けたいか
- スクショで買いたくなるか
- 2周目を遊びたいか
- 専門用語が重すぎないか
- ミニ反応が説明パネルではなくキャラ反応に見えるか
- case003のHBUが「専門職シムとして面白い」と感じられるか
- 低刺激/音/演出が実際に不快でないか

## 検証コマンド

完了判定では、最低限以下を通す。

```bash
node --check app.js game-state.js tests/appraisal-detective-flow.spec.js
npm run test:e2e
npm run test:persona
npm run test:production
git diff --check
```

## Stop Condition

この文書の範囲では、人間プレイテスト以外の商用95点要素は完了扱いです。以後の95点判定は、5人テストとスクショ購買力評価の結果で確定します。
