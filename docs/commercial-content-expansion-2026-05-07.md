# 鑑定探偵 商用化ゴール95 イテレーション記録

作業日: 2026-05-07

## 目標

ペルソナ平均95点以上を目標に、現行版を「商用化できる核があるデモ」から、製品初版に近い構成へ引き上げる。

## 実装内容

- 案件数を3本から10本へ拡張。
  - 001 川辺町住宅地 / 相続
  - 002 駅前商業地 / 収益
  - 003 南口再開発予定地 / 開発法・最有効使用
  - 004 港北工場跡地 / 担保評価
  - 005 青葉台借地権付建物 / 借地権
  - 006 白浜通り底地 / 底地
  - 007 朝霧タワー区分所有 / 区分所有
  - 008 湖畔リゾートホテル / ホテル
  - 009 湾岸物流倉庫 / 物流倉庫
  - 010 シンガポール海外案件 / 海外案件
- `commercial-case-pack.js` を追加し、既存 `case-data.js` を壊さず商用版コンテンツパックとして追加案件を差し込む構成にした。
- 案件選択を固定3本から動的表示へ変更。
- 案件選択アニメーションを、複数行・10件表示でも選択ファイルが中央へ移動するように座標ベースへ変更。
- 現地ホットスポットをデータ座標で配置できるようにし、追加案件の調査ポイントに対応。
- 追加案件ごとの受任面談、現地根拠、資料照合、固有検算、調整幅、再反論、マーケットシナリオを追加。
- 案件選択画面内に製品メニューを追加。
  - 設定
  - 実績
  - クリア記録一覧
  - クレジット
- 報告対決で、再反論根拠選択後に「依頼者の二の句 → 新人鑑定士の返答 → 先輩の締め」を表示し、2往復目の会話として閉じる演出を追加。
- スコアの目標時間を10案件に対応。
- E2Eに担保評価と海外案件の通常・監査完走を追加。
- 追加7案件の現地画像と依頼者立ち絵をImage API生成アセットとして追加し、既存3枚の画像使い回しを解消。
  - 現地画像: `kohoku-factory.generated.png`, `aobadai-leasehold.generated.png`, `shirahama-leasedland.generated.png`, `asagiri-condo.generated.png`, `lakeside-hotel.generated.png`, `bay-logistics.generated.png`, `singapore-overseas.generated.png`
  - 依頼者立ち絵: `ehara-client.generated.png`, `kubo-client.generated.png`, `segawa-client.generated.png`, `tachibana-client.generated.png`, `hayami-client.generated.png`, `onuki-client.generated.png`, `kanzaki-client.generated.png`
- 追加案件データを各案件固有の画像・ポートレートCSSクラスへ差し替え、案件選択・ノベル会話・発話ブロックで同じ人物像を使うようにした。
- `assets-manifest.json` を生成し、同梱生成画像22件のファイル名、用途、モデル、サイズ、生成時刻、プロンプトをsecretなしで記録するようにした。
- GPT-5.5 Pro差分レビューを受け、チュートリアル文言のHTMLエスケープ境界を追加し、`pressure-word` だけを許可する圧力台詞のサニタイズ挙動をE2Eで固定した。
- 設定パネル内のBGM/SE/低刺激表示を、上部バーと同じ状態語彙へ統一した。
- 自動ペルソナゲートは商用品質ではなく仕様充足ゲートであることを、`scripts/persona-score-check.mjs` の出力に明示した。
- `app.js` からDOM安全ユーティリティ、BGM/SE制御、初期状態・リセット、案件スキーマ検証を分離した。
  - `app-utils.js`
  - `audio-controller.js`
  - `game-state.js`
  - `case-schema.js`
- 追加商用案件の一部に不足していた `difficulty` を、バッジ由来の既定値で補完するようにした。
- 案件001〜003の鑑定判断フェーズへ「最有効使用」マトリクスを追加した。
  - 001: 標準的住宅地としての継続利用を前提に、取引事例比較法で調整。
  - 002: 店舗・事務所複合ビルとしての継続運用を前提に、収益還元法で査定。
  - 003: どの用途・規模で開発するのが最有効使用かを中心に、開発法の前提を判断。

## 変更ファイル

- `/mnt/c/Users/minou/appraisal-detective/app.js`
- `/mnt/c/Users/minou/appraisal-detective/app-utils.js`
- `/mnt/c/Users/minou/appraisal-detective/audio-controller.js`
- `/mnt/c/Users/minou/appraisal-detective/game-state.js`
- `/mnt/c/Users/minou/appraisal-detective/case-schema.js`
- `/mnt/c/Users/minou/appraisal-detective/commercial-case-pack.js`
- `/mnt/c/Users/minou/appraisal-detective/case-data.js`
- `/mnt/c/Users/minou/appraisal-detective/index.html`
- `/mnt/c/Users/minou/appraisal-detective/README.md`
- `/mnt/c/Users/minou/appraisal-detective/scoring.js`
- `/mnt/c/Users/minou/appraisal-detective/styles.css`
- `/mnt/c/Users/minou/appraisal-detective/tests/appraisal-detective-flow.spec.js`
- `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs`
- `/mnt/c/Users/minou/appraisal-detective/scripts/persona-score-check.mjs`
- `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`
- `/mnt/c/Users/minou/appraisal-detective/assets/kohoku-factory.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/aobadai-leasehold.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/shirahama-leasedland.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/asagiri-condo.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/lakeside-hotel.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/bay-logistics.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/singapore-overseas.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/ehara-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/kubo-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/segawa-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/tachibana-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/hayami-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/onuki-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/kanzaki-client.generated.png`

## 検証

- `node --check app.js`
- `node --check app-utils.js`
- `node --check audio-controller.js`
- `node --check game-state.js`
- `node --check case-schema.js`
- `node --check case-data.js`
- `node --check commercial-case-pack.js`
- `node --check scoring.js`
- `node --check tests/appraisal-detective-flow.spec.js`
- `node --check scripts/generate-image-assets.mjs`
- `node --check scripts/persona-score-check.mjs`
- `npm run generate:assets`
  - 既存画像はスキップ。`assets-manifest.json` を更新済み。
- `npm run test:persona`
  - `persona_gate_type=spec_coverage_not_human_commercial_quality`
  - `spec_coverage_gate_average=100.0`
  - `persona_average=100.0`
- `npm run test:e2e`
  - `64 passed`
- `npm run test:production`
  - `production_server_checks=passed`

## Issue / PR

- Issue: `not_applicable`
  - 理由: このディレクトリは `/mnt/c/Users/minou` 配下のローカル作業ツリーで、`appraisal-detective` 単独のGitHub Issue運用が未接続。
- PR: `not_applicable`
  - 理由: 外部公開・push・PR作成はユーザー明示確認が必要なため未実施。

## 残リスク

- 追加案件の法務・鑑定実務監修は、ゲーム内教材としての概念整理段階。実務教材として公開する場合は専門家レビューが必要。
- 現在の本番検証はローカル配信前提。公開配信時はHTTPS、キャッシュ、CSP、アセットライセンス表記、クレジットの精査が必要。
- 生成画像は `assets-manifest.json` に台帳化済みだが、商用公開前には最終的な権利表示・利用規約確認を別途行う。
- `app.js` は2323行まで縮小し主要責務は分離済みだが、将来の大規模拡張では `renderers/`、`dialogue-runner.js`、`field-survey.js`、`document-review.js`、`report-battle.js` への追加分割余地が残る。
- 案件001〜003は最有効使用マトリクスまで入ったが、95点判定には人間プレイテストで「続きが気になる」かを確認する必要がある。

## 商用公開前の人間レビュー

自動テストでは測れない体験品質、権利確認、ストア素材確認は以下に切り出した。

- `/mnt/c/Users/minou/appraisal-detective/docs/human-commercial-review-checklist-2026-05-07.md`

このチェックリストはコード上の未完了ではなく、商用公開前の外部確認待ちとして扱う。
