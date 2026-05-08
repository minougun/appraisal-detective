# 鑑定探偵 商用95点ゴール 再レビュー依頼

作成日: 2026-05-07

## 依頼

`鑑定探偵 Appraisal Detective` の現行版を、商用インディーゲーム水準で辛口に再レビューしてください。

前回レビューで指摘された未完了項目は、ローカル実装・テスト・文書化で閉じられる範囲について対応済みです。今回のレビューでは、単に実装項目が存在するかではなく、**実際に遊んだときに95点相当の商用体験になっているか**を判定してください。

## 対象

- URL: `http://127.0.0.1:44561/`
- ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`
- 重点確認ファイル:
  - `/mnt/c/Users/minou/appraisal-detective/index.html`
  - `/mnt/c/Users/minou/appraisal-detective/app.js`
  - `/mnt/c/Users/minou/appraisal-detective/app-utils.js`
  - `/mnt/c/Users/minou/appraisal-detective/audio-controller.js`
  - `/mnt/c/Users/minou/appraisal-detective/game-state.js`
  - `/mnt/c/Users/minou/appraisal-detective/case-schema.js`
  - `/mnt/c/Users/minou/appraisal-detective/case-data.js`
  - `/mnt/c/Users/minou/appraisal-detective/commercial-case-pack.js`
  - `/mnt/c/Users/minou/appraisal-detective/scoring.js`
  - `/mnt/c/Users/minou/appraisal-detective/styles.css`
  - `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
  - `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`
  - `/mnt/c/Users/minou/appraisal-detective/docs/commercial-content-expansion-2026-05-07.md`
  - `/mnt/c/Users/minou/appraisal-detective/docs/human-commercial-review-checklist-2026-05-07.md`

## 現行版の到達点

### コンテンツ

- 案件数は10本。
  - 001 川辺町住宅地 / 相続 / イージー
  - 002 駅前商業地 / 収益 / ノーマル
  - 003 南口再開発予定地 / 開発法・最有効使用 / ハード
  - 004 港北工場跡地 / 担保評価
  - 005 青葉台借地権付建物 / 借地権
  - 006 白浜通り底地 / 底地
  - 007 朝霧タワー区分所有 / 区分所有
  - 008 湖畔リゾートホテル / ホテル
  - 009 湾岸物流倉庫 / 物流倉庫
  - 010 シンガポール海外案件 / 海外案件
- 追加7案件には固有の現地画像・依頼者ポートレートを追加済み。
- 通常レビューと監査レビューを搭載。
- 案件ごとに市場シナリオ、資料照合、固有検算、調整幅、再反論、監査観点を持つ。
- 案件001〜003には最有効使用マトリクスを追加。

### ゲーム体験

- 事件ファイル選択はゲーム画面内で完結。
- 案件ファイル選択時、選んだファイルが中央へ移動する演出を実装。
- 各フェーズ冒頭はノベルADV形式。
- 主人公の新人鑑定士、先輩鑑定士、依頼者の会話を表示。
- 現地調査では画像内の違和感をクリックして証拠カードを取得。
- 資料照合では正しい根拠と、今回の価格形成要因として弱いダミー資料を選別。
- 鑑定判断では検算、調整幅、最有効使用、根拠カードを扱う。
- 報告対決では証拠3枚提示、依頼者反論、再反論まで進む。
- プレイ中タイマー、目標時間超過表示、記録一覧、実績、設定、クレジットを搭載。

### アクセシビリティ・低刺激

- `prefers-reduced-motion` 対応。
- 低刺激モードを実装。
- 低刺激ONではBGM/SE、圧フラッシュ、証拠ボード演出などを抑制。
- BGM/SE/低刺激の状態表示を、上部バーと設定パネルで現在状態として表示。
- `aria-live` を polite / assertive で分離。
- フェーズ切替後のフォーカス復帰を実装。

### 安全性・保守性

- `tutorialMarkup()` のHTMLエスケープ境界を修正。
- `pressureLineHtml()` は `span.pressure-word` だけを許可する設計とし、テストで固定。
- 自動ペルソナゲートは商用品質ではなく仕様充足ゲートとして明記。
- `app.js` から以下を分離。
  - `app-utils.js`
  - `audio-controller.js`
  - `game-state.js`
  - `case-schema.js`
  - `scoring.js`
- `assets-manifest.json` で生成画像22件を台帳化。

## 検証済みコマンド

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run test:persona
```

結果:

```text
persona_gate_type=spec_coverage_not_human_commercial_quality
spec_coverage_gate_average=100.0
persona_average=100.0
```

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run test:e2e
```

結果:

```text
64 passed
```

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run test:production
```

結果:

```text
production_server_checks=passed
```

## 今回レビューで見てほしいこと

### 1. 95点水準に届いているか

自動ゲートの100点は仕様充足です。商用ゲームとしての95点ではありません。

以下を人間目線で採点してください。

- 初見10分で「商品」として見えるか。
- 案件001がチュートリアルとして機能しているか。
- 案件002で収益還元法・DCR・NOIの判断が自然に理解できるか。
- 案件003で「最有効使用は全鑑定の前提であり、再開発予定地では用途・規模判断が中心になる」ことが伝わるか。
- 10案件が単なる用語差し替えではなく、体験差を持っているか。
- ノベルADVとして、キャラクターが説明役だけになっていないか。
- 報告対決がクライマックスとして成立しているか。
- リプレイしたくなる動機があるか。

### 2. 鑑定士追体験として破綻していないか

特に以下を確認してください。

- 価格形成要因の扱い。
- 対象不動産の確定。
- 事情補正・時点修正・標準化補正・個別的要因の扱い。
- 最有効使用の説明。
- 比準価格、収益価格、開発法による価格の使い分け。
- 試算価格の調整理由。
- 鑑定評価基準に照らして誤学習になりそうな箇所。

### 3. UI/UXがゲーム画面として統一されているか

重点確認:

- 案件選択以降も、Webサイト風ではなくゲーム画面内で完結しているか。
- 事件ファイル選択演出がChrome/Firefoxで自然に見えるか。
- 証拠カード取得ポップアップが唐突ではないか。
- カード選択時に不要な証拠ボード拡大演出が残っていないか。
- BGM/SE/低刺激の状態表示が分かりやすいか。
- モバイルで縦長になりすぎていないか。

### 4. アクセシビリティ・低刺激

重点確認:

- 低刺激ONで音、揺れ、点滅、圧フラッシュが十分に抑えられるか。
- `prefers-reduced-motion: reduce` で情報欠落がないか。
- キーボードだけで案件001を完走できるか。
- スクリーンリーダー向けのライブリージョンが過剰または不足していないか。
- 色だけに依存して重要状態を伝えていないか。

### 5. セキュリティ・データ境界

重点確認:

- `innerHTML` / `insertAdjacentHTML` / テンプレート文字列で、外部化された案件データがHTMLとして混入しないか。
- `tutorialMarkup()` のエスケープが十分か。
- `pressureLineHtml()` の許可ルールが安全か。
- `assets-manifest.json` や生成画像プロンプトにsecretが混入していないか。
- CSP付きproduction-like serverが、現状の構成と矛盾していないか。

### 6. 保守性

重点確認:

- `app.js` は2323行まで縮小し主要責務を分離済みだが、まだ肥大化リスクがあるか。
- 次に分けるべき境界は何か。
  - `renderers/`
  - `dialogue-runner.js`
  - `field-survey.js`
  - `document-review.js`
  - `report-battle.js`
- `case-schema.js` は10案件以上の拡張に耐えるか。
- `commercial-case-pack.js` がコピペ量産構造になっていないか。

## ペルソナ別採点依頼

各ペルソナを100点満点で採点してください。

| ペルソナ | 見るべき軸 |
| --- | --- |
| P1 ADV・捜査読み好き | 会話、追及感、事件ファイル感、キャラの声 |
| P2 週1カジュアル | 初見導線、専門用語の負荷、1案件の疲労度 |
| P3 鑑定プロシマ | 鑑定評価基準との整合、専門用語の使われ方、誤学習リスク |
| P4 感覚過敏・配慮 | 低刺激、reduced-motion、キーボード操作、読み上げ |
| P5 リプレイ・スコア厨 | 監査、記録、別解、スコア詰め、2周目動機 |

出力には以下を含めてください。

- ペルソナ別スコア
- 平均点
- 95点未達の場合の主要理由
- P0/P1/P2の優先度付き改善リスト
- 「コード上の未完了」と「商用公開前の人間・権利確認待ち」の切り分け
- HTML版継続か、Unity等への移行が必要かの判断

## こちらの自己評価

現行版は、実装・自動検証で閉じられる未完了は完了しています。

ただし、以下はローカル実装だけでは完了扱いにできないため、人間レビュー・配信前確認として分離しています。

- 5人ペルソナの人間プレイテスト
- ストア用スクリーンショット・動画・カプセル相当画像の評価
- 生成画像、BGM、SE、フォントの最終権利確認
- 鑑定実務・法務監修

詳細チェックリスト:

- `/mnt/c/Users/minou/appraisal-detective/docs/human-commercial-review-checklist-2026-05-07.md`

## Issue / PR

- Issue: `not_applicable`
  - 理由: この作業は `/mnt/c/Users/minou/appraisal-detective/` のローカル作業で、GitHub Issue運用が未接続。
- PR: `not_applicable`
  - 理由: 外部公開、push、PR作成は未実施。
