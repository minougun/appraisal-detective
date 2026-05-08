# 鑑定探偵 Claude Code UIレビュー依頼 商用95点最終版

作成日: 2026-05-07

対象URL: `http://127.0.0.1:44561/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 目的

商用ゲームとして、UI/UXがペルソナ平均95点に届く水準かを辛口でレビューしてください。

今回はコード品質レビューではなく、**実際に画面を見たときのゲームUIとしての完成度**を中心に見てください。特に、以前の弱点だった「Webサイトっぽさ」「業務フォームっぽさ」「固定正解を一度なぞって終わる感じ」が解消されているかを確認したいです。

## 現行版の到達点

### ゲーム全体

- 10案件構成
- 事件ファイル選択からゲーム画面内で完結
- ノベルADV会話
- 現地調査Hidden Object
- 資料照合
- 案件固有メカニクス
- 最有効使用マトリクス
- 試算価格の調整幅選択
- 証拠3枚の報告対決
- 依頼者反論
- 再反論と反論根拠選択
- 倫理選択
- 通常レビュー / 監査レビュー
- ローカル記録
- 実績
- BGM / SE / 低刺激

### UI面の直近改善

- 案件選択を事件ファイル選択UIに変更
- 案件ファイル選択時に、選んだファイルが中央へ寄る演出を追加
- Firefoxでも自然に見えるよう、案件選択演出の溜めを調整
- ノベルADV風の会話UIを追加
- 主人公の新人鑑定士を会話画面に常時表示
- 依頼受付では、会話シーンが済んでから受任面談を出すように修正
- 各フェーズをゲーム画面内に収める方向へ変更
- 証拠カードポップアップを自然なフェードインに調整
- カード選択時の不要な証拠ボード拡大アニメを削除
- BGM状態表示を `待機中 / 再生中 / 停止中 / 低刺激で停止` の読める状態語彙に整理
- 低刺激モードでBGM/SE/圧フラッシュ/揺れを抑制
- 最終レビューに `別解ルート候補` と `スコア研究軸` を追加
- クリア記録一覧に案件別の次周目標を追加
- 実績に `Sランク論証` と `HBU審査官` を追加

## 重点的に見てほしい画面

1. タイトル/事件ファイル選択
2. case001 川辺町住宅地 / イージー
3. case002 駅前商業地 / ノーマル
4. case003 南口再開発予定地 / ハード
5. 現地調査で証拠カードが出る瞬間
6. 資料照合とダミー資料選択
7. 鑑定判断の最有効使用マトリクス
8. 報告対決と再反論
9. 最終レビュー
10. 記録 / 実績 / クレジット / 設定

## ストアスクショ候補

実ゲーム画面から切り出した1920x1080 PNGがあります。

保存先:

- `/mnt/c/Users/minou/appraisal-detective/docs/store-screenshots/`

作成済み:

- `01-title-case-files-1920x1080.png`
- `02-case001-field-evidence-1920x1080.png`
- `03-case002-income-appraisal-1920x1080.png`
- `04-case003-hbu-matrix-1920x1080.png`
- `05-case003-report-battle-1920x1080.png`
- `06-case003-final-audit-1920x1080.png`

レビューでは、これらがSteam/itchで「買いたくなるスクリーンショット」になっているかも評価してください。

## ペルソナ別に採点してほしい

各ペルソナを100点満点で採点し、平均95点に届くかを判定してください。

### P1 ADV・捜査読み好き

見る観点:

- 事件ファイルUIがADVとして刺さるか
- 会話が教材ではなくキャラの会話に見えるか
- 報告対決と再反論に緊張感があるか
- 主人公、先輩、依頼者が存在感を持っているか

### P2 週1カジュアル

見る観点:

- 初見で何をすればいいか分かるか
- case001がイージー導入として機能しているか
- 専門用語が多すぎて離脱しないか
- BGM/SE/スキップ/低刺激/次周目標が親切か

### P3 鑑定プロシマ

見る観点:

- 最有効使用、価格形成要因、試算価格調整が専門職シムとして納得できるか
- case003のHBUマトリクスが、このゲームの中核として十分か
- case004〜010の案件類型が単なる用語差し替えに見えないか
- 不動産鑑定士の仕事を追体験している感覚があるか

### P4 感覚過敏・配慮

見る観点:

- 低刺激モードが十分か
- `prefers-reduced-motion` 時に情報欠落がないか
- ポップアップ、圧力演出、BGM/SE、画面の明暗変化が過剰でないか
- キーボード/支援技術の導線に明らかな破綻がないか

### P5 リプレイ・スコア厨

見る観点:

- 2周目を遊ぶ理由があるか
- `別解ルート候補`、市場シナリオ、監査レビュー、実績がリプレイ動機になっているか
- 固定正解を暗記するだけに見えないか
- 90点以上やHBU審査官を狙う導線が分かるか

## 特に辛口で見てほしい論点

1. UIは本当に商用ゲームに見えるか。それともまだWebアプリ/教材に見えるか。
2. 案件選択以降も、ゲーム画面内に情報が収まっているか。
3. ノベルADV演出と鑑定判断UIが一体化しているか。
4. 証拠カード取得の演出は自然か。唐突なDOM通知に見えないか。
5. case001は専門知識なしでも理解できるか。
6. case002は収益還元法のノーマル案件として難しすぎないか。
7. case003のHBUは、商用レビューで「このゲームの価値」として伝わるか。
8. 記録/実績/別解ルート候補は、P5の評価を95点近くまで上げられるか。
9. ストアスクショ6枚は、Steam/itchでスクロールを止める力があるか。
10. 低刺激・アクセシビリティ配慮が、ゲーム演出と両立しているか。

## 既知の制約

- 実参加者を集めた人間プレイテストは未実施
- Steam/itchへの公開、外部アップロード、PR作成、pushは未実施
- `npm run test:persona` の `persona_average=100.0` は商用品質ではなく仕様充足ゲート
- 生成画像は事前生成アセット。ゲーム実行中にAI生成はしない

## 参照してほしいファイル

- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
- `/mnt/c/Users/minou/appraisal-detective/commercial-case-pack.js`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/renderers/hbu-renderer.js`
- `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`
- `/mnt/c/Users/minou/appraisal-detective/docs/goal95-commercial-readiness-2026-05-07.md`
- `/mnt/c/Users/minou/appraisal-detective/docs/gpt55-pro-review-request-commercial-average95-final-2026-05-07.md`
- `/mnt/c/Users/minou/appraisal-detective/docs/store-screenshots/`

## 検証済みコマンド

直近確認:

```bash
cd /mnt/c/Users/minou/appraisal-detective
node --check app.js
node --check tests/appraisal-detective-flow.spec.js
npm run test:persona
npm run test:production
npm run test:e2e
```

結果:

- `npm run test:persona`: `persona_average=100.0`
- `npm run test:production`: `production_server_checks=passed`
- `npm run test:e2e`: `69 passed`

## 期待する出力

以下の形式で返してください。

1. 総評
2. UI総合点
3. ペルソナ別スコア
4. 平均95点達成/未達の判定
5. まだ商用ゲームに見えない箇所
6. ストアスクショ評価
7. P0/P1/P2の残課題
8. HTML版継続かUnity移行かの判断
9. 次に直すべきUI改善を優先順で提示
