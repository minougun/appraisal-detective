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
- 会話音声のON/OFFトグル
- ローカルの VOICEVOX Engine が起動中なら `/voicevox/*` プロキシまたは `127.0.0.1:50021` 直結で実音声を生成し、未起動時はブラウザ/OSの日本語音声合成へフォールバック
- ストーリー、依頼者、先輩、新人鑑定士の会話を、キャラ・感情・VOICEVOX style優先度に基づく演技プランで読み上げ
- 表示文と読み上げ文を分け、専門語の読み替え、意味単位のphrase、依頼者圧力、先輩の断定口調に合わせたプロソディ制御を適用
- VOICEトグルは実音声時に `VOICE VOICEVOX`、代替音声時に `VOICE 代替音声` を表示
- 日本語表示安定化のため、`assets/fonts/NotoSansJP-VF.ttf` を同梱して自己ホスト
- CSP、キャッシュヘッダ、VOICEVOX allowlist proxy付きの本番風ローカル静的サーバ

## 品質ゲートの位置づけ

`npm run test:persona` の `persona_average=100.0` は、商用レビューの平均点ではなく仕様充足ゲートです。出力上も `persona_gate_type=spec_coverage_not_human_commercial_quality` として区別しています。商用95点判定には、別途人間プレイテスト、ストア素材、アセット権利確認、案件001〜003の初見体験レビューが必要です。

## Steam配信用デスクトップ版

Steam配信向けにはElectronでローカルHTMLを読み込むデスクトップ版を用意しています。Steamworks側のApp ID、Depot ID、審査提出、費用支払い、リリース操作はSteamworks権限が必要です。

```bash
cd /mnt/c/Users/minou/appraisal-detective

# Steam移植前提の静的検証
npm run test:steam-readiness

# 現在のOS向けに未圧縮デスクトップビルドを作る
npm run build:desktop:dir

# Windows Steam depot候補を作る
npm run build:steam:win-dir
```

SteamPipe用テンプレート:

- `steamworks/app_build_template.vdf`
- `steamworks/depot_build_windows_template.vdf`
- `steamworks/store-release-checklist.md`

移植ハンドオフ:

- `docs/steam-port-handoff-2026-05-16.md`
- `docs/steam-store-page-draft-2026-05-17.md`

Windows depot候補は、Windows実機またはGitHub Actionsの `Steam Windows Build` workflowで生成します。WSL/Linuxで直接 `build:steam:win-dir` を走らせる場合はwineが必要です。

## 画像生成

画像制作の標準入口は app server 側の imagegen / ImageGen 実行面です。新規背景、キャラクター、カード、サムネイル、ストア素材は、まず imagegen で候補を作り、採用する画像だけ `scripts/adopt-image-asset.mjs` で `assets/` と台帳へ取り込みます。

OpenAI Images API を直接使う `scripts/refresh-image-assets.mjs` は、通常の新規制作入口ではありません。採用済み素材の対象指定刷新、A/B比較、manifest保守のための道具です。従量課金を伴うため、対象ファイルと刷新理由を明示し、全件刷新は明示フラグなしでは拒否します。APIキー値はログへ出しません。

```bash
cd /mnt/c/Users/minou/appraisal-detective

# imagegen候補を正式assetへ採用
npm run adopt:asset -- \
  --src /path/to/imagegen-candidate.png \
  --dest assets/new-asset.generated.png \
  --case-id case001 \
  --asset-type field-image \
  --usage "in-game field survey" \
  --alt-text "画面読み上げ用の代替テキスト" \
  --prompt-summary "公開台帳用の短いプロンプト概要" \
  --selection-reason "UI内で証拠ヒントが最も読み取りやすい"

# 採用済み素材の対象指定API刷新
OPENAI_IMAGE_ASSET_FILES=kawabe-estate.generated.png \
IMAGE_REFRESH_REASON=case001_ab_refresh \
FORCE_IMAGE_ASSETS=true \
npm run refresh:assets

# 画像を再生成せず公開manifestだけv2形式で再計算
UPDATE_ASSETS_MANIFEST_ONLY=true npm run refresh:assets
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
- `/mnt/c/Users/minou/appraisal-detective/.asset-provenance.private.json`（非公開・gitignore）

公開台帳には `caseId`, `assetType`, `usage`, `altText`, `promptSummary`, `promptHash`, `creditText`, `regenerationPolicy`, `sha256`, `width`, `height`, `bytes`, `generationPath`, `reviewStatus`, `reviewedAt`, `reviewer`, `storeUseAllowed`, `aiDisclosureCategory` を含めます。フルプロンプト、ローカル絶対パス、rejected候補の詳細は公開台帳へ入れず、非公開provenanceへ分離します。

画像刷新時は `previousModel`, `previousSha256`, `refreshReason`, `inGameUseAllowed`, `storeUseAllowed` も記録し、A/B確認前の素材をストア採用済みとして扱わないようにします。

AI利用開示の暫定文:

> 本作の一部背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。ゲーム実行中にプレイヤー入力から画像を生成する機能はありません。

## ローカル参照

- 実装ノート: `/mnt/c/Users/minou/appraisal-detective/docs/implementation-notes.md`
- goal95商用化残課題クローズ記録: `/mnt/c/Users/minou/appraisal-detective/docs/goal95-commercial-readiness-2026-05-07.md`
- GPT-5.5 Pro商用95点レビュー依頼: `/mnt/c/Users/minou/appraisal-detective/docs/gpt55-pro-review-request-commercial-average95-final-2026-05-07.md`
- UI参照: `/mnt/c/Users/minou/DESIGN.md`
- DESIGN.md運用: `/mnt/c/Users/minou/docs/design-md-operational-guide-2026-04-25.md`
