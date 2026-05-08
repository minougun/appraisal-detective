# Claude Code Review Request: 鑑定探偵 95点ゴール到達版 最終辛口レビュー

Date: 2026-05-06  
Target URL: `http://127.0.0.1:44561/`  
Target path: `/mnt/c/Users/minou/appraisal-detective/`

## 依頼

`鑑定探偵 / Appraisal Detective` の現行版を、ペルソナ平均95点以上を目標にした最終到達版として辛口レビューしてください。

現行の自動ゲートでは `persona_average=100.0` ですが、これは製品品質を保証するものではありません。今回も、ゲートの過大評価、実ユーザー体験の弱さ、鑑定士追体験としての浅さを疑ってください。

特に見てほしいのは、直近レビューで弱点だった以下が本当に改善されたかです。

- 正解パスが `professional/A/risk/neutral` の一本道に見える問題
- 案件固有メカニクスが「読んで正解を選ぶだけ」に見える問題
- 調整幅がただの3択で、根拠カードと価格判断が接続していない問題
- 報告対決が一方通行で、依頼者との往復になっていない問題
- リプレイ動機が記憶ゲーム止まりになる問題

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
- 各フェーズ冒頭のノベルADV風シーン
- `prefers-reduced-motion` と低刺激モード対応
- 自己ホスト日本語フォント
- CSP付き本番風ローカル静的サーバあり

## 95点ゴールに向けた直近差分

### 0. ノベルADV風のストーリー進行

案件選択と各フェーズ冒頭に、背景画像、依頼者/先輩の立ち絵、台詞送りボタンを持つ `novel-scene` を追加しました。既存の調査・資料照合・鑑定判断のゲームロジックは維持しつつ、プレイヤーが事件ファイルを読み進めている感覚を強めています。

関連実装:

- `/mnt/c/Users/minou/appraisal-detective/app.js`
  - `phaseStoryLines()`
  - `novelSceneMarkup()`
  - `bindNovelScene()`
  - `state.storyIndex`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
  - `.novel-scene`
  - `.novel-character`
  - `.novel-box`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
  - `novel scene advances the story before each phase action`

レビュー観点:

- 以前の業務フォーム感から、ノベルゲーム/捜査ADVとしての読み心地に近づいたか。
- 台詞送りがゲーム進行の邪魔ではなく、事件の文脈理解に効いているか。
- 立ち絵と背景が雰囲気だけでなく、依頼者圧力・先輩指導のドラマを補強しているか。
- 本格的なノベルゲームにするには、まだどの程度シナリオ分岐や会話差分が足りないか。

### 1. 調整幅を証拠カード2枚で支える

鑑定判断フェーズで、査定方式、リスク反映、調整幅を選んだ後、`調整根拠` として証拠カード2枚を選ぶ必要があります。

関連実装:

- `/mnt/c/Users/minou/appraisal-detective/app.js`
  - `state.adjustmentSupport`
  - `adjustmentSupportMarkup()`
  - `[data-adjustment-support]`
  - 報告フェーズへ進む条件に `state.adjustmentSupport.size >= 2` を追加
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
  - `adjustmentBands[].supportEvidence`
  - `adjustmentBands[].supportPrompt`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
  - `evaluateAdjustmentSupport()`
  - `marketScenario.supportEvidence` との一致評価

レビュー観点:

- 調整幅が「ただの3択」から脱しているか。
- 証拠カード2枚選択が、鑑定評価の説明責任・限定条件・価格形成要因の整理として自然か。
- 正解カードを覚えるだけのゲームになっていないか。
- P3鑑定プロシマにとって、専門職シムとしての手触りが増えているか。

### 2. 再反論を根拠カード付きミニ対決に変更

報告対決フェーズでは、証拠カード3枚を提示した後、依頼者の反論に対して `再反論` を選びます。さらに、提示済み証拠から `反論根拠カード` を1枚選ぶ必要があります。

関連実装:

- `/mnt/c/Users/minou/appraisal-detective/app.js`
  - `state.rebuttalChoice`
  - `state.rebuttalEvidence`
  - `[data-rebuttal]`
  - `[data-rebuttal-evidence]`
  - 完了条件に `state.rebuttalChoice && state.rebuttalEvidence` を追加
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
  - `rebuttalOptions`
  - `requiredEvidence`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
  - `rebuttalOption`
  - `rebuttalEvidence`
  - 根拠適合時の加点、不適合時の減点

レビュー観点:

- 報告対決が依頼者との往復に見えるか。
- 再反論文と根拠カードの接続が、ADV的な「突きつける」快感になっているか。
- 間違った根拠カードを選んだときの学びカードが納得できるか。
- P1 ADV・捜査読み好きとP5リプレイ層に効いているか。

### 3. 周回ごとの市場シナリオを追加

各案件に `marketScenarios` を追加し、案件完了回数に応じて市場条件が切り替わるようにしました。同じ案件でも、周回ごとに重視すべき証拠が少し変わります。

関連実装:

- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
  - `caseDefinitions[].marketScenarios`
  - `marketScenarios[].supportEvidence`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
  - `state.marketScenario`
  - `activeMarketScenario()`
  - 依頼受付と鑑定判断フェーズで市場条件を表示
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
  - `marketScenario` を `evaluateAdjustmentSupport()` に反映

市場シナリオ例:

- `case001`: 相続地合いが静かな回 / 買主が境界と道路に慎重な回
- `case002`: テナント入替リスクが強い回 / 修繕サイクルが価格に出る回
- `case003`: 住民合意の遅れが強い回 / 高度地区運用が厳格化する回

レビュー観点:

- 同じ案件をもう一度遊ぶ理由になっているか。
- テキスト差分だけでなく、証拠選択とスコアに影響しているように感じられるか。
- 市場シナリオが自然な鑑定実務の不確実性として見えるか。
- P5リプレイ・スコア厨に十分刺さるか。

## 既存の重要改善

### 案件固有メカニクス

- `case001`: 地積換算
  - `181.81平方メートル ÷ 3.3057 ≒ 55.0坪` の概算入力
- `case002`: DCR確認
  - `満室NOI 1,620万円 - 空室損180万円 - 修繕費90万円 = 1,350万円` の概算入力
- `case003`: 用途地域マップ
  - 高度地区・北側斜線・道路後退を重ねた簡易図
  - 実現階数10階前後の概算入力

### スコア分散

`scoring.js` で以下を評価します。

- 時間補正
- 固有メカニクスの正誤
- 数値検算の正誤
- ダミーホットスポット
- ダミー資料
- 誤った査定方式
- 弱い調整判断
- 調整幅
- 調整根拠2枚
- 再反論
- 反論根拠カード
- 倫理で依頼者に寄せた選択
- `事実→分析→結論` の報告構成

### アクセシビリティ / 低刺激 / 本番化

- `prefers-reduced-motion` 対応
- 低刺激モードで全SE、圧フラッシュ、証拠ボード揺れを抑制
- `aria-live="polite"` と `aria-live="assertive"` の分離
- フェーズ切替時のフォーカス管理
- 自己ホスト日本語フォント
- CSP付き `scripts/serve-production.mjs`
- `case-data.js` / `scoring.js` 読込失敗時のユーザー向けエラー

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
- `/mnt/c/Users/minou/appraisal-detective/docs/persona-review-goal-95-2026-05-06.md`
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
node --check boot.js
node --check case-data.js
node --check scoring.js
node --check app.js
node --check scripts/persona-score-check.mjs
node --check scripts/serve-production.mjs
node --check scripts/verify-production-server.mjs
node --check tests/appraisal-detective-flow.spec.js
npm run test:persona
npm run test:production
npm run test:e2e
curl -I http://127.0.0.1:44561/
curl -I http://127.0.0.1:44561/case-data.js
curl -I http://127.0.0.1:44561/scoring.js
```

結果:

- `node --check ...`: passed
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:e2e`: `37 passed`
- `curl -I http://127.0.0.1:44561/`: `200 OK`
- `curl -I http://127.0.0.1:44561/case-data.js`: `200 OK`
- `curl -I http://127.0.0.1:44561/scoring.js`: `200 OK`

Playwrightで `NO_COLOR` と `FORCE_COLOR` の警告が出ることがありますが、テスト失敗ではありません。

## 自動ゲートへの疑い

`/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs` は `persona_average=100.0` を出しますが、まだ以下を疑ってください。

- 文字列存在チェックが多く、体験の質を測れていないのではないか。
- `base 75 + bonus` 型なので、まだ高得点に寄りすぎていないか。
- 調整根拠2枚や市場シナリオが、本当にプレイ上の戦略になっているか。
- P3鑑定プロシマ向けに、計算・不確実性・複数手法比較が十分か。
- P5リプレイ層向けに、ランダム性や分岐がまだ薄くないか。

追加すべきE2Eがあれば、具体的に提案してください。

## ペルソナ別に見てほしい観点

### P1 ADV・捜査読み好き

- 証拠提示、依頼者反論、再反論根拠カードがADV的な快感になっているか。
- 会話の緊張、誤提示への反応、学びカードがドラマとして機能しているか。
- 案件ごとの差が、物語差として見えるか。

### P2 週1カジュアル

- 初見15分以内で迷わず進めるか。
- 調整根拠2枚や再反論根拠カードが、手数過多に見えないか。
- フェーズ目標とチェックラインで負荷が抑えられているか。

### P3 鑑定プロシマ

- 不動産鑑定評価の追体験として、用語・判断・資料・数値検算が自然か。
- 調整幅と調整根拠が、鑑定評価の説明責任に近づいているか。
- 誤学習リスクがある表現や過度な単純化がないか。

### P4 感覚過敏・配慮

- 低刺激モードで新しい演出や通知も十分抑えられているか。
- ライブリージョン、フォーカス管理、SE抑制、reduced-motion が実プレイ上も破綻していないか。
- 色だけに依存した情報提示になっていないか。

### P5 リプレイ・スコア厨

- 市場シナリオ、監査レビュー、次周チェックリスト、スコア分散が再挑戦理由になるか。
- 最適パスがまだ簡単に固定されていないか。
- スコア差が「腕前」ではなく「暗記」になっていないか。

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

## 出力形式の依頼

以下の形式で出してください。

1. 総評
   - 現行版が実ユーザー評価で何点程度に見えるか。
   - 自動ゲート100点との乖離がどれくらい残るか。
2. 差分評価
   - 調整根拠2枚
   - 根拠付き再反論
   - 市場シナリオ
   - スコア分散
   - アクセシビリティ / 低刺激
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

辛口で構いません。特に「95点ゴールを自称しているが、実ユーザー体験ではまだ95点ではない」点があれば優先して指摘してください。
