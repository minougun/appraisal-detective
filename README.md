# 鑑定DE探偵 Appraisal Detective

物件の真実を暴く、不動産鑑定評価ゲームのローカル版です。

## 遊び方

ブラウザで `/mnt/c/Users/minou/appraisal-detective/index.html` を直接開くか、ローカルサーバーで配信します。

標準起動:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start
```

軽いSimpleHTTP確認だけなら:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run start:dev
```

その後、以下にアクセスします。

```text
http://127.0.0.1:44561/
```

## 実装内容

- 1周8〜10分想定の5フェーズ構成
- 各フェーズ冒頭に、背景画像・人物立ち絵・「次へ」/「スキップ」で進むノベルADV風シーン
- 国内住宅地、収益物件、再開発予定地、担保、借地権、底地、区分所有、ホテル、物流倉庫、海外案件の10案件
- 現地調査の証拠発見
- 価格形成要因として弱い対象を見分けるダミーホットスポット
- ImageGen 2 API系の生成PNGを使った現地調査ビジュアル
- 登記、取引事例、レントロール、都市計画、権利関係の資料照合
- 案件ごとに異なる資料照合メカニクス
  - 案件001: 地積換算と坪数概算入力
  - 案件002: DCR確認と安定NOI概算入力
  - 案件003: 用途地域マップと斜線後の実現階数概算入力
- 資料照合で、正しいが今回の価格形成要因として弱いダミー資料を選別
- 取引事例比較法、収益還元法、開発法、最有効使用の判断
- 案件001〜003では鑑定判断画面に最有効使用マトリクスを表示
  - 住宅地: 標準的住宅地としての継続利用を前提に比準価格を調整
  - 収益物件: 店舗・事務所複合ビルとしての継続運用を前提に収益価格を査定
  - 再開発予定地: 用途・規模の最有効使用を中心に開発法の前提を判断
- 根拠カードに合わせた試算価格の調整幅選択
- 調整幅の判断には証拠カード2枚の根拠提示が必要
- 証拠カード3枚による報告・対決
- 提示証拠に応じた依頼者反論
- 依頼者反論に対する再反論と、提示済み証拠による反論根拠カード選択
- 周回ごとに市場シナリオが変わり、同じ案件でも重視すべき根拠が揺れる
- プレイ中タイマーと、案件別の目標時間超過表示
- 経過時間、固有チェック、数値検算、調整幅、再反論、弱い根拠選択、論証構成によるスコア分散
- 通常レビューと監査レビュー
- 案件別のローカル記録保存
- 最終レビューの別解ルート候補、次周メモ、案件別リプレイ目標
- クリア記録一覧の次周目標
- Sランク論証、HBU審査官などの実績
- 案件・証拠・資料・メカニクス定義を `case-data.js` に分離
- 追加商用案件を `commercial-case-pack.js` に分離
- DOM安全ユーティリティを `app-utils.js` に分離
- BGM/SE/低刺激制御を `audio-controller.js` に分離
- 初期状態・記録正規化・リセット処理を `game-state.js` に分離
- 案件定義の必須項目検証を `case-schema.js` に分離
- スコア計算を `scoring.js` に分離
- 専門用語を主表示にした鑑定士追体験
- `prefers-reduced-motion` 対応
- 圧力フラッシュを抑える低刺激モード
- 低刺激モードでは全SEを抑制
- オーバーレイ内容をスクリーンリーダー用ライブリージョンへ通知
- SEのON/OFFトグル
- 日本語表示安定化のため、`assets/fonts/NotoSansJP-VF.ttf` を同梱して自己ホスト
- CSPとキャッシュヘッダ付きの本番風ローカル静的サーバ

## 品質ゲートの位置づけ

`npm run test:persona` の `persona_average=100.0` は、商用レビューの平均点ではなく仕様充足ゲートです。出力上も `persona_gate_type=spec_coverage_not_human_commercial_quality` として区別しています。商用95点判定には、別途人間プレイテスト、ストア素材、アセット権利確認、案件001〜003の初見体験レビューが必要です。

## 画像生成

`OPENAI_API_KEY` または `/mnt/c/Users/minou/.openai-api-key` がある環境では、以下で現地調査画像を再生成できます。既存画像がある場合は再生成せず、商用台帳 `assets-manifest.json` だけを更新できます。APIキー値はログへ出しません。

新規・更新対象の生成は現行デフォルトモデルを使い、既存画像は個別レビューで置換するまで記録済みのモデル情報を保持します。特定画像だけを更新する場合は `OPENAI_IMAGE_ASSET_FILES` にカンマ区切りのファイル名を指定します。

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run generate:assets
```

生成先:

- `/mnt/c/Users/minou/appraisal-detective/assets/kawabe-estate.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/ekimae-commercial.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/minamiguchi-redevelopment.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/tanaka-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/saeki-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/kurokawa-client.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/mentor-appraiser.generated.png`
- `/mnt/c/Users/minou/appraisal-detective/assets/fonts/NotoSansJP-VF.ttf`

生成画像台帳:

- `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`

台帳には `caseId`, `assetType`, `usage`, `altText`, `promptSummary`, `creditText`, `regenerationPolicy`, `modelRationale`, `sha256`, `width`, `height`, `bytes`, `reviewStatus`, `reviewedAt`, `reviewer`, `storeUseAllowed`, `aiDisclosureCategory` を含めます。

画像刷新時は `previousModel`, `previousSha256`, `refreshReason`, `inGameUseAllowed`, `storeUseAllowed` も記録し、A/B確認前の素材をストア採用済みとして扱わないようにします。

AI利用開示の暫定文:

> 本作の一部背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。ゲーム実行中にプレイヤー入力から画像を生成する機能はありません。

## ローカル参照

- 実装ノート: `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`
- goal95商用化残課題クローズ記録: `/mnt/c/Users/minou/appraisal-detective/docs/goal95-commercial-readiness-2026-05-07.md`
- GPT-5.5 Pro商用95点レビュー依頼: `/mnt/c/Users/minou/appraisal-detective/docs/gpt55-pro-review-request-commercial-average95-final-2026-05-07.md`
- UI参照: `/mnt/c/Users/minou/DESIGN.md`
- DESIGN.md運用: `/mnt/c/Users/minou/docs/design-md-operational-guide-2026-04-25.md`
