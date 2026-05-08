# 鑑定探偵 完成形v1仕様

## 目的

`鑑定探偵` を単発試作ではなく、完成版として伸ばせるゲームにする。完成形v1では、単に1件を遊べるだけでなく、案件選択、周回目標、記録、複数案件追加の受け皿、職業追体験としての専門用語の快感を持つことを到達点にする。

## 完成形v1の必須条件

- タイトル/案件選択画面があり、いきなり業務フォームから始まらない。
- 案件ごとにテーマ、目的、主要論点、難度、記録が表示される。
- 1案件は10分以内に完走できる。
- 初回プレイと二周目で評価観点が変わる。
- 専門用語は削らず、証拠カード、提示演出、スコア評価に接続する。
- プレイヤーの選択は、調査、推理、鑑定判断、倫理、専門性へ反映される。
- 結果画面に次周の具体目標が表示される。
- ローカルに最高スコアと完了回数が保存される。
- 新しい案件を追加するための画面上の枠がある。

## 現在実装済み

- タイトル/案件選択画面。
- 案件001 `川辺町住宅地 / 相続時価把握`。
- 案件001の通常レビューと監査レビュー。
- 案件002 `駅前商業地 / 収益還元法`。
- 案件002の通常レビューと監査レビュー。
- 案件003 `南口再開発予定地 / 開発法・最有効使用`。
- 案件003の通常レビューと監査レビュー。
- 監査レビューの3条件:
  - 現地調査 5/5
  - 重要3カード提示
  - 中立性維持
- `localStorage` による案件別の記録保存:
  - 通常最高
  - 監査最高
  - 完了回数
  - 最終ランク
  - 最終プレイ日
- 案件002専用の現地調査イラスト:
  - テナント構成
  - 長期空室
  - 修繕遅れ
  - 駅前動線
  - 短期看板契約
- 案件002専用の専門用語カード:
  - 価格時点
  - 対象不動産の確定
  - 収益性
  - 空室リスク
  - 必要諸経費
  - 賃料水準
  - 還元利回り
  - 直接還元法
  - 収益価格の査定
- 案件003専用の現地調査イラスト:
  - 既存テナント
  - 狭い路地
  - 高度地区・斜線制限
  - 浸水履歴
  - 既存倉庫の解体リスク
- 案件003専用の専門用語カード:
  - 開発素地価格
  - 権利関係
  - 公法上の規制
  - 権利調整
  - 開発負担
  - 開発法
  - 最有効使用

## 完成形v1で到達済み

- 3案件すべてに通常レビューと監査レビューがある。
- 案件ごとの現地調査、資料照合、鑑定判断、報告対決、監査条件が切り替わる。
- 案件ごとの専門用語カードが結果画面と次周メモに反映される。
- Playwrightで全案件の通常/監査レビュー完走を確認済み。

## 次に必要な完成形v2要素

1. データ駆動化
   - `evidenceCatalog`
   - `caseHotspots`
   - 資料照合項目
   - 取引事例
   - 監査条件
   - 依頼者台詞

2. 完成版演出
   - 依頼者・先輩の表情差分
   - 証拠提示の段階演出
   - 結果ランクの強い演出
   - SEのミュート設定

3. 品質保証
   - `prefers-reduced-motion` 対応維持
   - 日本語UIのモバイル表示確認
   - 監査レビューの失敗パターンテスト
   - スコア境界値テスト

## 2026-05-06 goal継続で進めたv2要素

- ImageGen 2 API系の画像生成パイプラインを追加した。
  - Script: `/mnt/c/Users/minou/appraisal-detective/scripts/generate-image-assets.mjs`
  - Default model: `gpt-image-1.5`
  - Generated assets:
    - `/mnt/c/Users/minou/appraisal-detective/assets/kawabe-estate.generated.png`
    - `/mnt/c/Users/minou/appraisal-detective/assets/ekimae-commercial.generated.png`
    - `/mnt/c/Users/minou/appraisal-detective/assets/minamiguchi-redevelopment.generated.png`
- 現地調査画像は生成PNGを優先し、読み込み失敗時は既存SVGへフォールバックする。
- 報告フェーズの証拠カードに提示順を表示し、3枚の論証として見えるようにした。
- 結果画面にランクの大型スタンプ演出を追加した。
- SEのON/OFFトグルを追加し、`localStorage` で保存する。
- Playwrightで以下を追加検証した。
  - 生成PNG 3枚のHTTP配信。
  - 監査レビューの失敗パターン。
  - SEトグルのアクセシビリティ属性と永続化。
  - デスクトップとモバイルのスクリーンショット確認。

## v2でまだ残るもの

- 資料照合、鑑定判断、依頼者台詞を完全にデータ定義へ寄せるリファクタリング。
- スコア境界値の単体テスト。
- 案件4以降の量産テンプレート化。

## 完成判断

完成形v1は、少なくとも3案件、各案件に通常/監査レビュー、ローカル記録、案件ごとの専門論点、結果画面の次周目標が揃った状態とする。

2026-05-06時点でこの条件は達成済み。

## ローカル参照

- App: `/mnt/c/Users/minou/appraisal-detective/`
- Main script: `/mnt/c/Users/minou/appraisal-detective/app.js`
- Style: `/mnt/c/Users/minou/appraisal-detective/styles.css`
- Assets: `/mnt/c/Users/minou/appraisal-detective/assets/`
- Tests: `/mnt/c/Users/minou/appraisal-detective/tests/`
- UI参照: `/mnt/c/Users/minou/DESIGN.md`

## Web / 一次情報

- 国土交通省 不動産鑑定評価基準等: https://www.mlit.go.jp/totikensangyo/totikensangyo_tk4_000024.html
- 不動産鑑定評価基準 PDF: https://www.mlit.go.jp/common/001204057.pdf
- 不動産鑑定評価基準運用上の留意事項 PDF: https://www.mlit.go.jp/common/001204044.pdf
- OpenAI Image generation guide: https://platform.openai.com/docs/guides/image-generation
- OpenAI Images API reference: https://platform.openai.com/docs/api-reference/images/generate
- OpenAI GPT Image 1.5 model page: https://platform.openai.com/docs/models/gpt-image-1.5

## GitHub / Issue / PR

- GitHub Issue: not_applicable
- PR: not_applicable
- 理由: ローカル版の完成形設計と実装であり、外部公開・push・PR作成は行っていない。
