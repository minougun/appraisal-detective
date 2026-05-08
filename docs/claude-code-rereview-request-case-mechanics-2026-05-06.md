# Claude Code Re-Review Request: 鑑定探偵 差分再レビュー

Date: 2026-05-06  
Target URL: `http://127.0.0.1:44561/`  
Target path: `/mnt/c/Users/minou/appraisal-detective/`

## 依頼

`鑑定探偵 / Appraisal Detective` の現行版を、前回の辛口レビューからの差分中心で再レビューしてください。

今回の主な修正は、前回レビューで弱点とされた以下への対応です。さらに差分再レビューv2で指摘された「固有メカニクスが読んで選ぶだけ」「タイム補正が事後評価」「報告順序ボーナスが攻略暗記寄り」という弱点にも追加対応しています。

- `app.js` 肥大化への初手として、案件データを `case-data.js` に分離
- 3案件が「用語入替の同一ループ」に見える問題への対応として、資料照合フェーズに案件固有メカニクスを追加
- 資料照合の単純な正解クリック化への対応として、ダミー資料を追加
- 正解パス固定・スコア分散不足への対応として、時間補正と判断補正を追加
- 3日タスクとして、プレイ中タイマー、案件001/002の数値検算、`事実→分析→結論` の報告構成評価、Playwright上のスコア差検証を追加
- 1週間タスクとして、`scoring.js` 分離、case003の斜線・高度地区ビジュアル検算、調整幅選択、再反論カード選択を追加
- 95点ゴール継続タスクとして、調整幅を証拠カード2枚で支えるステップ、依頼者反論への根拠カード付き再反論、周回ごとの市場シナリオ差分を追加

現行の自動ゲートでは `persona_average=100.0` ですが、これは製品品質を保証するものではありません。前回同様、ゲートの過大評価と実ユーザー体験の弱さを疑ってください。

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
- CSP付き本番風ローカル静的サーバあり

## 今回の差分

### 1. `case-data.js` 分離

新規ファイル:

- `/mnt/c/Users/minou/appraisal-detective/case-data.js`

`case-data.js` に移したもの:

- `evidenceCatalog`
- `caseHotspots`
- `caseDecoyHotspots`
- `caseDocumentPanels`
- `caseDocumentIssues`
- `caseDocumentDecoys`
- `caseMechanics`
- `caseDefinitions`

`index.html` は `case-data.js` を `app.js` の前に読み込みます。

```html
<script src="./case-data.js"></script>
<script src="./app.js"></script>
```

レビュー観点:

- 分離境界として妥当か。
- `window.APPRAISAL_CASE_DATA` グローバルでよいか。
- CSP、テスト、将来の案件追加に対して扱いやすいか。
- まだ `app.js` に残っているべきでないデータ定義があるか。

### 2. 案件ごとの固有メカニクス

資料照合フェーズに、案件ごとに違う小さな判断メカニクスを追加しました。

- `case001`: `地積換算`
  - 依頼者説明60坪 vs 登記181.81平方メートルをどう扱うか。
  - `181.81 ÷ 3.3057 ≒ 55.0坪` の概算入力を追加。
- `case002`: `DCR確認`
  - 満室想定NOIではなく、空室・修繕後の安定純収益で見るか。
  - `1,620万円 - 空室損180万円 - 修繕費90万円 = 1,350万円` の概算入力を追加。
- `case003`: `用途地域マップ`
  - 依頼者の14階計画を、高度地区・道路後退・浸水履歴で切れるか。
  - 高度地区・北側斜線・道路後退を重ねた簡易図を見て、実現階数10階前後を概算入力する。

レビュー観点:

- 「案件ごとに違う体験」になっているか。
- 数値入力が「手計算作業」ではなく、専門職シムとしての手触りに寄与しているか。
- 鑑定評価の追体験として妥当か。
- 誤選択時の学びカードがドラマ/学習として機能しているか。

### 3. 資料照合のダミー資料

資料照合フェーズに、正しい資料ではあるが今回の価格形成要因として優先度が低いダミー資料を追加しました。

- `case001`: 室内リフォーム見積
- `case002`: 飲食店の週末売上メモ
- `case003`: 再開発のプレス資料

クリックすると証拠カードは増えず、`資料の関連性` の学びカードと先輩メモを返します。

レビュー観点:

- 「正しいが無関係/弱い資料」を見分ける体験になっているか。
- ダミーが露骨すぎて、すぐ罠だと分かってしまわないか。
- 専門職シムとしての判断の重みに寄与しているか。

### 4. スコア分散・タイム要素

結果画面に以下を追加しました。

- `時間補正`
  - 案件ごとの目標時間以内なら加点、超過なら減点。
  - 監査レビューでは許容時間を少し伸ばす。
  - ヘッダーの `#timer-meta` にプレイ中の経過時間と目標時間を常時表示。
- `判断補正`
  - 案件固有メカニクスの正誤
  - 案件001/002の数値検算の正誤
  - ダミーホットスポット
  - ダミー資料
  - 誤った査定方式
  - 弱い調整判断
  - 調整幅の選択
  - 再反論の適合性
  - 倫理で依頼者に寄せた選択
  - 報告カードが `事実→分析→結論` の論証構成になっているか

結果画面には `経過時間`、`時間補正`、`判断補正` が表示されます。

レビュー観点:

- スコア分散が本当にリプレイ動機になっているか。
- タイム要素が専門職追体験を壊していないか。
- 監査レビューとの役割分担が明確か。
- 「早く読むゲーム」になりすぎていないか。

### 5. `scoring.js` 分離

新規ファイル:

- `/mnt/c/Users/minou/appraisal-detective/scoring.js`

`scoring.js` に移したもの:

- `targetSeconds`
- `evaluateTimeAdjustment`
- `evaluateChallenge`
- `evaluateScoreVariance`
- `evaluateReportStructure`
- `clamp` / `signed` / `formatDuration`

`index.html` は `case-data.js`、`scoring.js`、`app.js` の順に読み込みます。

```html
<script src="./case-data.js"></script>
<script src="./scoring.js"></script>
<script src="./app.js"></script>
```

レビュー観点:

- `scoring.js` の責務境界は妥当か。
- グローバル `window.APPRAISAL_SCORING` は静的プロトタイプとして許容できるか。
- `app.js` に残っているべきでないスコアロジックがないか。

### 6. 調整幅と再反論

鑑定判断フェーズで、査定方式とリスク反映に加えて `調整幅` を選ぶ必要があります。弱すぎる/強すぎる調整は学びカードになり、判断補正にも反映されます。

今回さらに、調整幅の選択後に `調整根拠` として証拠カード2枚を選ぶ必要があります。選んだ2枚が、案件の調整幅定義とその周回の市場シナリオに合っているかを `scoring.js` の `evaluateAdjustmentSupport()` で評価します。

報告対決フェーズでは、証拠カード3枚を提示した後に、依頼者反論へ `再反論` します。再反論は、提示済み証拠から選ぶ `反論根拠カード` で支えられている必要があります。文面だけ正しくても、根拠カードがずれている場合は学びカードと減点になります。

レビュー観点:

- `professional/A/risk/neutral` の一本道感が薄まったか。
- 調整幅が「ただの3択」ではなく、根拠カード2枚と価格判断をつなげる体験になっているか。
- 再反論で報告対決が依頼者との往復に見えるか。
- 再反論の根拠カード選択が、論証の気持ちよさになっているか。
- P3鑑定プロシマにとって、計算・不確実性・説明責任の手触りが増えているか。

### 7. 周回ごとの市場シナリオ

各案件に `marketScenarios` を追加しました。案件完了回数に応じて次のプレイで市場条件が切り替わります。

- `case001`: 相続地合いが静かな回 / 買主が境界と道路に慎重な回
- `case002`: テナント入替リスクが強い回 / 修繕サイクルが価格に出る回
- `case003`: 住民合意の遅れが強い回 / 高度地区運用が厳格化する回

レビュー観点:

- 同じ案件をもう一度遊ぶ理由になっているか。
- 市場シナリオが、調整根拠カードの選び方に影響しているように見えるか。
- テキスト差分だけで終わっておらず、スコアと判断へ反映されているか。

## 重要ファイル

- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/boot.js`
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/package.json`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
- `/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/serve-production.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/verify-production-server.mjs`
- `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`

## 実行方法

標準起動:

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

## 直近の検証結果

直近で通した検証:

```bash
cd /mnt/c/Users/minou/appraisal-detective
node --check case-data.js
node --check scoring.js
node --check app.js
node --check scripts/persona-score-check.mjs
npm run test:persona
npm run test:production
npm run test:e2e
curl -I http://127.0.0.1:44561/
curl -I http://127.0.0.1:44561/case-data.js
curl -I http://127.0.0.1:44561/scoring.js
```

結果:

- `node --check boot.js && node --check case-data.js && node --check scoring.js && node --check app.js && node --check scripts/persona-score-check.mjs && node --check scripts/serve-production.mjs && node --check scripts/verify-production-server.mjs`: passed
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:e2e`: `37 passed`
- 95点ゴール継続差分後のE2Eは、調整根拠2枚、再反論根拠カード、市場シナリオ切替を含む
- `curl -I http://127.0.0.1:44561/`: `200 OK`
- `curl -I http://127.0.0.1:44561/case-data.js`: `200 OK`
- `curl -I http://127.0.0.1:44561/scoring.js`: `200 OK`

Playwrightで `NO_COLOR` と `FORCE_COLOR` の警告が出ることがありますが、テスト失敗ではありません。

## 今回追加されたE2E観点

`tests/appraisal-detective-flow.spec.js` に以下を追加しました。

- `case data is loaded from the separated data script`
  - `/case-data.js` が配信され、`index.html` が読み込んでいること。
- `case-specific document mechanics change the document phase`
  - `case002` の資料照合で `DCR確認` が表示され、正しい固有チェックを選べること。
- `play timer is visible during a case`
  - ケース開始後、ヘッダーに経過時間と目標時間が表示されること。
- `numeric document mechanic rewards a correct area conversion`
  - `case001` で55.0坪の概算入力が成功フィードバックになること。
- `numeric document mechanic teaches when NOI is overestimated`
  - `case002` で満室NOIを入れると学びカードと再検算表示が出ること。
- `bad judgment path scores meaningfully lower than a neutral evidence path`
  - 良い判断パスと悪い判断パスの最終スコア差が15点以上になること。
- `dummy document returns a learning card without adding evidence`
  - `case003` のダミー資料で学びカードが出て、証拠枚数が増えないこと。
- `normal result exposes next-run checklist`
  - 結果画面に `時間補正`、`判断補正`、`経過時間` が出ること。
- `scoring module is loaded before the app script`
  - `/scoring.js` が配信され、`window.APPRAISAL_SCORING` が利用可能なこと。
- `missing scoring module shows a recoverable error`
  - `scoring.js` 読込失敗時にユーザー向けエラーを表示し、JS例外を出さないこと。
- `case003 visual zoning mechanic accepts a realistic floor limit`
  - case003で斜線・高度地区の簡易図を表示し、10階前後の概算入力が成功すること。
- `adjustment band is required before report`
  - 調整幅を選ばないと報告対決へ進めないこと。
- `report rebuttal requires a supported evidence answer`
  - 提示済み証拠に基づく再反論を選べること。
- `adjustment band and support evidence are required before report`
  - 調整幅だけでなく、証拠カード2枚の調整根拠を選ばないと報告へ進めないこと。
- `market scenario changes the case briefing between replays`
  - 完了回数に応じて同じ案件の市場条件と重視すべき根拠が変わること。

## 前回レビューからの確認ポイント

前回の辛口レビューでは、実ユーザー評価なら65点前後という評価でした。特に以下が弱点でした。

1. 3案件が構造的に同一ループの用語入替
2. ホットスポットは番号付きボタンで発見の快感が弱い
3. 正解パスが `professional/A/risk/neutral` に固定されすぎ
4. リプレイ動機が記憶ゲーム止まり
5. `app.js` が大きく、案件追加時の保守性が悪い
6. 自動ペルソナゲートが文字列存在チェック寄りで甘い

今回の差分が、これらの問題をどこまで解消しているかを重点的に見てください。

## レビューで特に見てほしい観点

### 1. ゲーム体験

- 固有メカニクスは、実際に案件ごとの体験差になっているか。
- 資料照合は「読むだけ」から脱しているか。
- ダミー資料が判断の重みを作っているか。
- スコア分散は再挑戦したくなる構造か。
- タイム補正は緊張感として効くか、それとも邪魔か。

### 2. 不動産鑑定評価の追体験

- `地積換算`、`DCR確認`、`用途地域マップ` の扱いは、専門職シムとして自然か。
- 不動産鑑定評価基準の追体験として、誤学習リスクがないか。
- 専門用語が「飾り」ではなく、判断の武器として機能しているか。
- 計算を見せなさすぎて、鑑定士らしさが薄くなっていないか。

### 3. 保守性

- `case-data.js` 分離は最小コスト境界として妥当か。
- 次に分けるならどこか。
  - スコア計算
  - フェーズ描画
  - 音/演出
  - 保存/記録
  - レビュー/監査ロジック
- `window.APPRAISAL_CASE_DATA` 方式のまま完成形へ伸ばせるか。
- E2Eが仕様固定しすぎて、ゲーム改善を阻害しないか。

### 4. ペルソナゲート

- `scripts/persona-score-check.mjs` はまだ甘いか。
- 今回追加した `dataSplit`、`uniqueMechanics`、`dummyDocuments`、`scoreVariance` の判定は実態を見ているか。
- 文字列存在チェックではなく、どんなPlaywright実プレイ検証を追加すべきか。

### 5. アクセシビリティ / 低刺激 / 本番化

- 今回のタイム要素や補正表示が、支援技術利用者に分かるか。
- 低刺激モードと新しい演出/補正表示に矛盾がないか。
- `case-data.js` 追加でCSP、本番風サーバ、キャッシュ方針に問題が増えていないか。

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
- ImageGen系生成画像は同梱済みです。再生成には `OPENAI_API_KEY` または `/mnt/c/Users/minou/.openai-api-key` が必要です。APIキー値はログに出さないでください。
- 外部公開、push、PR、デプロイは行っていません。

## Claude Codeへの出力依頼

以下の形式で出してください。

1. 総評
   - 前回65点前後評価から、今回どこまで上がったか。
   - 自動ゲート100点との乖離は何点くらい残るか。
2. 差分評価
   - `case-data.js` 分離
   - 案件固有メカニクス
   - ダミー資料
   - 時間補正/判断補正
3. ブロッカー
   - 公開前に必ず直すべきもの。
   - ファイルパスと理由を明示。
4. 高優先度改善
   - 体験、鑑定追体験、アクセシビリティ、本番化、保守性の順に。
5. ペルソナ別再スコア
   - P1 ADV・捜査読み好き
   - P2 週1カジュアル
   - P3 鑑定プロシマ
   - P4 感覚過敏・配慮
   - P5 リプレイ・スコア厨
6. ペルソナゲート批判
   - `scripts/persona-score-check.mjs` がまだ甘い箇所。
   - 追加すべき実プレイE2E。
7. 次タスク
   - 1日でできるもの。
   - 3日でできるもの。
   - 1週間でできるもの。
8. 最終判断
   - HTML版を伸ばすべきか。
   - Unity等へ移るべきか。
   - その理由。

辛口で構いません。特に「今回の差分は表面的に見えるが、実は体験としてはまだ弱い」点があれば優先して指摘してください。
