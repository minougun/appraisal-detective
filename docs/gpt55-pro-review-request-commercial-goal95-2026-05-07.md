# GPT-5.5 Pro レビュー依頼: 鑑定探偵 商用化ゴール95版

作成日: 2026-05-07  
対象URL: `http://127.0.0.1:44561/`  
対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 依頼

このゲーム「鑑定探偵」を、商用インディーゲーム初版として通用する水準かどうか、GPT-5.5 Proの視点で辛口レビューしてください。

内部の自動ペルソナゲートは `persona_average=100.0` まで到達していますが、それを信用せず、実ユーザー・Steam/itch.io・専門職シム・アクセシビリティ・保守性の観点で再評価してください。

最終ゴールは「ペルソナ平均95点以上の出来」です。現行版がそこに届いているか、届いていないなら何が不足しているかを明確にしてください。

## ゲーム概要

不動産鑑定士の仕事を「事件ファイル捜査ADV」として体験するブラウザゲームです。

プレイヤーは新人不動産鑑定士として、先輩鑑定士とともに依頼者の圧力、現地調査、資料照合、鑑定判断、報告対決を進めます。

基本ループ:

1. 事件ファイル選択
2. ノベルADV形式の導入会話
3. 依頼受付 / 受任面談
4. 現地調査: 画像内の違和感をタップして証拠カード取得
5. 資料照合: 書類・数値・ダミー資料を見分ける
6. 鑑定判断: 手法選択、調整幅、支援証拠、固有検算
7. 報告対決: 証拠3枚提示、依頼者反論、再反論、倫理選択
8. 最終レビュー: スコア、監査チェック、次周目標

## 現行版の到達点

### コンテンツ量

案件は10本あります。

- 001 川辺町住宅地 / 相続 / Easy
- 002 駅前商業地 / 収益 / Normal
- 003 南口再開発予定地 / 開発法・最有効使用 / Hard
- 004 港北工場跡地 / 担保評価
- 005 青葉台借地権付建物 / 借地権
- 006 白浜通り底地 / 底地
- 007 朝霧タワー区分所有 / 区分所有
- 008 湖畔リゾートホテル / ホテル
- 009 湾岸物流倉庫 / 物流倉庫
- 010 シンガポール海外案件 / 海外評価レビュー

### 直近の改善

- 追加7案件の現地画像使い回しを解消。
- 追加7案件それぞれにImage API生成の固有現地画像を追加。
- 追加7案件それぞれに固有依頼者ポートレートを追加。
- 事件ファイル選択、ノベル会話、発話ブロックで同じ依頼者ビジュアルを使うようにした。
- 追加案件が固有画像・固有ポートレートを使うことをE2Eテストで固定。

追加画像:

- `assets/kohoku-factory.generated.png`
- `assets/aobadai-leasehold.generated.png`
- `assets/shirahama-leasedland.generated.png`
- `assets/asagiri-condo.generated.png`
- `assets/lakeside-hotel.generated.png`
- `assets/bay-logistics.generated.png`
- `assets/singapore-overseas.generated.png`

追加依頼者:

- `assets/ehara-client.generated.png`
- `assets/kubo-client.generated.png`
- `assets/segawa-client.generated.png`
- `assets/tachibana-client.generated.png`
- `assets/hayami-client.generated.png`
- `assets/onuki-client.generated.png`
- `assets/kanzaki-client.generated.png`

## 主要ファイル

- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
- `/mnt/c/Users/minou/appraisal-detective/commercial-case-pack.js`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/boot.js`
- `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
- `/mnt/c/Users/minou/appraisal-detective/docs/commercial-content-expansion-2026-05-07.md`

## 検証済み

直近で以下は通過済みです。

```bash
node --check app.js
node --check commercial-case-pack.js
node --check scoring.js
node --check scripts/generate-image-assets.mjs
node --check scripts/persona-score-check.mjs
npm run test:persona
npm run test:e2e
npm run test:production
```

結果:

- `npm run test:persona`: `persona_average=100.0`
- `npm run test:e2e`: `59 passed`
- `npm run test:production`: `production_server_checks=passed`

補足:

- `http://127.0.0.1:44561/assets/kohoku-factory.generated.png` は `200 OK / image/png` で配信確認済み。
- `scripts/generate-image-assets.mjs` は既存画像をスキップし、不足分だけ生成する構成。
- OpenAI公式Docs上では画像生成APIの現行GPT Image系モデルとして `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini` が確認できたため、既存スクリプトは `gpt-image-1.5` を維持。

## レビューで特に見てほしいこと

### 1. 商用ゲームとしての完成度

「デモとして良い」ではなく、Steam/itch.ioで有料または強い無料版として出した場合に、初見ユーザーが納得するかを見てください。

評価してほしい観点:

- タイトル画面、案件選択、設定、実績、クレジット、記録一覧の製品感
- 10案件のコンテンツ量が十分か
- 1案件あたりのプレイ密度とテンポ
- ノベルADVと業務シミュレーションの統一感
- 画像・BGM・SE・カード演出の品質
- ストアスクリーンショット映え

### 2. ゲーム性

「正解ルートを覚えるだけ」になっていないかを見てください。

評価してほしい観点:

- 現地調査がHidden Objectとして気持ちいいか
- ダミーホットスポット・ダミー資料が判断を生んでいるか
- 固有検算がただの計算クイズではなく、鑑定士追体験になっているか
- 調整幅、支援証拠、報告構成、再反論に意味のある分岐があるか
- 監査モード、記録、実績がリプレイ動機になるか

### 3. 鑑定士追体験

専門用語を薄めずに、職業追体験として成立しているかを見てください。

評価してほしい観点:

- 不動産鑑定評価基準の用語運用が大きく逸脱していないか
- 「最有効使用」は全案件の前提として扱えているか
- 再開発予定地では「どの用途・規模で開発するのが最有効使用か」が価格判断の中心として表現できているか
- 更地評価、比準価格、土地残余法、開発法、収益還元法、借地権、底地、区分所有、ホテル、物流、海外レビューの扱いが浅すぎないか
- 計算を自動化しすぎて、専門職シムとしての手触りを失っていないか

### 4. ノベルADV・キャラクター

会話が教材口調に戻っていないか、キャラクターが継続ドラマを持てているかを見てください。

評価してほしい観点:

- 新人鑑定士、先輩鑑定士、依頼者に人間味があるか
- 主人公の不安・成長・判断の揺れが出ているか
- 先輩が説明役だけでなく、キャラとして立っているか
- 案件ごとの依頼者が「圧力装置」以上の存在になっているか
- スキップ機能が物語理解を壊していないか

### 5. UI / UX

「すべてゲーム画面内で操作する」方針が守れているか見てください。

評価してほしい観点:

- 案件選択以降もWebサイトっぽく戻っていないか
- 証拠ボード、フェーズ目標、スコア、BGM/SE/低刺激トグルの位置が自然か
- 「BGM ON/OFF」の表示が現在状態として分かるか
- カードポップアップ、案件選択アニメ、圧力演出が自然か
- Chrome/Firefoxでアニメーションの体感差がないか
- モバイルで縦長になりすぎないか

### 6. アクセシビリティ・低刺激

低刺激モード、reduced-motion、支援技術対応を見てください。

評価してほしい観点:

- 低刺激ONでBGM/SE/圧フラッシュ/証拠ボード揺れが適切に抑制されるか
- reduced-motionで情報欠落がないか
- live regionのpolite/assertive分離が適切か
- フォーカス管理が自然か
- 色だけで意味を伝えていないか

### 7. セキュリティ・配信準備

静的ゲームですが、公開配信前提で見てください。

評価してほしい観点:

- XSS対策: `innerHTML`由来の危険が残っていないか
- case data外部化時の入力信頼境界
- CSP / security headers / path traversal対策
- 画像・BGM・フォントのライセンス表記
- SimpleHTTPではなくproduction-like serverを使う構成の妥当性
- キャッシュ戦略がハッシュなしアセットに対して安全か

### 8. 保守性

10案件以上に拡張していく前提で見てください。

評価してほしい観点:

- `app.js` が肥大化しすぎていないか
- `case-data.js` / `commercial-case-pack.js` / `scoring.js` の分離境界は妥当か
- 次に分けるべきファイルは何か
- テストが実装詳細に寄りすぎていないか
- 追加案件を作るコストは許容範囲か

## 希望する出力形式

以下の形式でレビューしてください。

```markdown
# 鑑定探偵 GPT-5.5 Pro 商用水準レビュー

## 1. 総評

商用初版として見た結論。
95点ゴールに届いているか。

## 2. スコア

| 軸 | 点数 | コメント |
|---|---:|---|
| 第一印象・ストア映え |  |  |
| ゲーム手触り |  |  |
| 鑑定士追体験 |  |  |
| ノベルADV/キャラクター |  |  |
| UI/UX |  |  |
| アクセシビリティ |  |  |
| リプレイ性 |  |  |
| 保守性 |  |  |
| 商用配信準備 |  |  |
| 総合 |  |  |

## 3. ペルソナ別レビュー

| ペルソナ | 点数 | 刺さる点 | 離脱理由 | 95点に必要な改善 |
|---|---:|---|---|---|
| P1 ADV・捜査読み好き |  |  |  |  |
| P2 週1カジュアル |  |  |  |  |
| P3 鑑定プロシマ |  |  |  |  |
| P4 感覚過敏・配慮 |  |  |  |  |
| P5 リプレイ・スコア厨 |  |  |  |  |

## 4. ブロッカー

公開前に必ず直すべきもの。

## 5. 高優先度改善

1日 / 3日 / 1週間で分けてください。

## 6. コード・保守性レビュー

具体的なファイルパスと行番号付き。

## 7. 最終判断

HTML版継続か、Unity移行か、別方向か。
```

## 注意

- `AGENTS.md` と `.cursor/rules/llm-authored-code-security.mdc` は今回のレビュー対象外です。勝手に戻さないでください。
- APIキー、secret、ローカル秘密ファイルはレビュー本文に出さないでください。
- 外部公開、push、PR作成、デプロイは行わないでください。
- 自動ゲートの100点は参考値です。実ユーザー視点では遠慮なく下げてください。

