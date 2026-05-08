# Claude Code UIレビュー依頼: 鑑定探偵 ゲーム画面内完結版

作成日: 2026-05-06  
レビュー対象URL: http://127.0.0.1:44561/  
レビュー対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 目的

`鑑定探偵` の現行UIを、Claude Codeに辛口でレビューしてほしい。

直近で、タイトル/案件選択だけでなく、案件開始後の全フェーズも「Webページ下部にフォームが続く」見え方をやめ、ゲーム画面内の机上操作盤として完結するように作り直した。

特に、以下が実際のUI体験として成立しているかを見てほしい。

- 案件選択から受任面談以降まで、画面全体がゲームUIに見えるか
- ノベル会話が済むまで、受任面談などの本体操作が見えないか
- 会話終了後に、自然にゲーム操作画面へ移れるか
- `最有効使用` の扱いが不動産鑑定評価として誤解を招かないか
- 専門職シムと推理ADVの両立ができているか

## 対象ファイル

主に以下を見ること。

- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
- `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`

## 現行UIの流れ

1. タイトルノベル
   - 左に `新人鑑定士`
   - 右に `先輩鑑定士`
   - `次へ` で進行

2. 案件選択
   - 机上に3枚の事件ファイルが並ぶ
   - `case001`: 川辺町住宅地 / 相続時価把握
   - `case002`: 駅前商業地 / 収益還元法
   - `case003`: 南口再開発予定地 / 開発法・最有効使用
   - 監査レビューは赤い監査スタンプとして表示

3. 案件開始後
   - まずノベル会話だけが表示される
   - 会話中は `受任面談` 操作盤などのフェーズ本体を非表示
   - `次へ` または `スキップ` で最後まで送る
   - 最終ボタン押下後、暗い机上操作画面 `phase-game-desk` にフェーズ本体が出る

4. 5フェーズ
   - 依頼受付 / 受任面談
   - 現地調査
   - 資料照合
   - 鑑定判断
   - 報告対決

5. 最終レビュー
   - 結果、スコア、証拠構成、再挑戦導線を表示

## 直近の主要変更

### 1. 案件選択をゲーム画面化

`renderCaseSelect()` で、タイトル会話終了後に `.case-file-desk` を表示するようにした。

以前のようなカード型リストではなく、机上に置かれた3枚の事件ファイルを直接開く構成。

### 2. 新人鑑定士ポートレート

タイトルシーンで、先輩鑑定士の隣に表示される人物を `新人鑑定士` に変更。

関連アセット:

- `/mnt/c/Users/minou/appraisal-detective/assets/player-novice-appraiser.generated.png`

### 3. 案件開始後もゲーム画面内に収容

`app.js` に `wrapPhaseGameDesk()` と `phase-game-*` 系のキーを追加。

各フェーズのDOMを `.phase-game-desk` に包み、暗い机上操作画面内に収める。

関連CSS:

- `.phase-game-desk`
- `.phase-game-header`
- `.phase-game-field`
- `.phase-game-documents`
- `.phase-game-appraisal`
- `.phase-game-report`
- `.phase-game-review`
- `body.operation-mode`

### 4. 会話完了までフェーズ本体を隠す

`applyStoryGate()` でノベルシーン以外を `hidden` / `aria-hidden` / `inert` にしている。

最近、`[hidden]` が `.phase-game-desk { display: grid; }` に負けて、会話中に `受任面談` 本体が見えていたため、`styles.css` に以下を追加した。

```css
[hidden] {
  display: none !important;
}
```

レビューでは、会話中に受任面談本体がまだ見えていないか、実機で確認してほしい。

### 5. ノベル操作

- 送りボタン: `次へ`
- 最後の台詞へのジャンプ: `スキップ`
- 最終台詞後のアクションラベル:
  - `事件ファイルを開く`
  - `受任判断へ`
  - `現地調査へ`
  - `資料照合へ`
  - `鑑定判断へ`
  - `報告対決へ`

### 6. 最有効使用の文言修正

以前は「住宅地は取引事例比較、商業地は収益還元法、再開発予定地は最有効使用が軸になる」と表示していた。

これは誤解を招くため修正した。

現行の考え方:

- `最有効使用` は全ての鑑定評価の前提
- 住宅地では、最有効使用を前提にしつつ取引事例比較法が中心になりやすい
- 商業地・収益物件では、最有効使用を前提にしつつ収益還元法が中心になりやすい
- 再開発予定地では、特に「どの用途・規模で開発するのが最有効使用か」が価格判断の中心になる
- 更地評価では、比準価格、土地残余法による収益価格、必要に応じて開発法による価格を関連づけ、比較考量するという理解に寄せたい

現行文言:

```text
案件を選べ。最有効使用は全ての鑑定評価の前提だ。住宅地は取引事例比較、商業地は収益還元法、再開発予定地はどの用途・規模で開発するのが最有効使用かを中心に見る。
```

## 現在の検証結果

直近のローカル検証:

- `node --check app.js && node --check case-data.js && node --check tests/appraisal-detective-flow.spec.js`: passed
- `npm run test:e2e -- --grep "novel scene advances|intake phase shows"`: 2 passed
- `npm run test:e2e`: 39 passed
- `npm run test:persona`: `persona_average=100.0`
- `npm run test:production`: `production_server_checks=passed`

確認済みスクリーンショット:

- `/tmp/appraisal-detective-case-file-desk.png`
- `/tmp/appraisal-detective-novice-appraiser-intro.png`
- `/tmp/appraisal-detective-operation-intake.png`
- `/tmp/appraisal-detective-operation-field.png`
- `/tmp/appraisal-detective-operation-documents.png`
- `/tmp/appraisal-detective-intake-story-after-fix.png`
- `/tmp/appraisal-detective-intake-revealed-after-fix.png`

補足:

- サーバーURL `http://127.0.0.1:44561/` はローカル検証用。
- 本番ホスティング、HTTPS、CSP、キャッシュ戦略は別論点。

## UIレビューで特に見てほしい論点

### A. ゲーム画面としての一体感

- タイトル、案件選択、受任面談以降が同じゲームの画面としてつながっているか
- 案件選択だけがよくて、受任面談以降が再びWebフォームに戻っていないか
- `.phase-game-desk` は「ゲーム画面内の操作盤」に見えるか
- サイドの証拠ボード、スコア、先輩メモと競合していないか

### B. 会話シーンと操作画面の主従

- 会話中は操作画面が出ず、物語に集中できるか
- 会話終了後に受任面談などの本体が出るタイミングは自然か
- `次へ` / `スキップ` / 最終アクションラベルの導線は自然か
- スキップしても文脈が壊れないか

### C. 画面密度

- デスクトップで情報が多すぎないか
- モバイルで縦スクロールが重すぎないか
- 現地調査の画像、資料照合のカード、鑑定判断の選択肢が一画面の中で読みやすいか
- `phase-game-desk` の内部スクロールがゲーム体験として自然か、それとも窮屈か

### D. ノベルADVとしての質

- 立ち絵、背景、台詞箱、人物名、章表示がADVとして機能しているか
- 台詞が説明・講義っぽすぎないか
- 依頼者の圧力、先輩の助言、新人鑑定士の立場がドラマとして立っているか
- P1のADV層に「続きを見たい」と思わせられるか

### E. 鑑定士追体験と専門性

- `最有効使用` の扱いに誤学習リスクがないか
- 住宅地・商業地・再開発予定地の説明が、手法の単純な当てはめに見えないか
- 不動産鑑定評価基準の考え方から見て、ゲーム化の省略が許容範囲か
- 専門用語が単なるラベルではなく、判断の武器として見えるか

### F. アクセシビリティ/低刺激

- `[hidden]`、`aria-hidden`、`inert` の組み合わせに問題がないか
- ノベル本文の `aria-live="polite"`、進行ボタンの `aria-label` は十分か
- `prefers-reduced-motion` と低刺激モードに矛盾がないか
- キーボードのみで会話から操作画面まで自然に進めるか

## ペルソナ別に評価してほしい

以下の5ペルソナで、辛口に点数をつけてほしい。

| ID | ペルソナ | 主な評価軸 |
|---|---|---|
| P1 | ADV・捜査読み好き | 会話のテンポ、追及感、物語の引き |
| P2 | 週1カジュアル | 初見のわかりやすさ、読む量、スキップ導線 |
| P3 | 鑑定プロシマ | 専門性、職業追体験、鑑定判断の納得感 |
| P4 | 感覚過敏・配慮ユーザー | 低刺激、音/動き/フォーカス、支援技術 |
| P5 | リプレイ・スコア厨 | スコア改善余地、監査モード、再訪理由 |

## 出力してほしい形式

Claude Codeには以下の形式で返してほしい。

```markdown
# 鑑定探偵 UIレビュー: ゲーム画面内完結版

## 1. 総評

## 2. UIスコア

| 軸 | スコア | コメント |
|---|---:|---|
| 第一印象 |  |  |
| ゲーム画面としての一体感 |  |  |
| ノベルADVとしての成立度 |  |  |
| 操作導線 |  |  |
| 鑑定士追体験 |  |  |
| モバイル/レスポンシブ |  |  |
| アクセシビリティ |  |  |
| 総合 |  |  |

## 3. ペルソナ別レビュー

## 4. 良くなった点

## 5. まだ弱い点

## 6. 会話シーンと操作画面の評価

## 7. 最有効使用・鑑定評価基準まわりの誤学習リスク

## 8. ブロッカー

| 優先度 | ファイル/箇所 | 問題 | 推奨修正 |
|---|---|---|---|

## 9. 優先改善タスク

### 1日で直す

### 3日で直す

### 1週間で直す

## 10. 最終判断
```

## 注意

単に自動テストやペルソナゲートが通っているかではなく、実際に画面を見たときのゲームUIとしての説得力を重視してほしい。

特に、以下は厳しく見ること。

- 案件選択以降がまたWebフォームに見えていないか
- 会話中に本体操作が見えてしまうバグが残っていないか
- 最有効使用を「再開発予定地だけの論点」と誤読させていないか
- 専門性の正しさとゲームテンポのバランスが取れているか
