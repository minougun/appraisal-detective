# 鑑定DE探偵 クレジット / AI利用開示 最終ローカル版

作成日: 2026-05-07

対象URL: `http://127.0.0.1:44561/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## 扱い

この文書は、ローカル版・限定公開β・ストア審査準備で使うAI利用開示とクレジット文言の確定版です。Steam、itch.io、その他外部ストアへ実際に提出する直前には、各プラットフォームの最新入力フォームへ合わせて文言を再確認します。

## ゲーム内クレジット文

### Images

一部の現地調査背景画像および依頼者ポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。これらの画像はゲームビルドに同梱された固定画像であり、ゲームプレイ中にプレイヤー入力から画像を生成する機能はありません。

Asset ledger:

- `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`

### Music

BGM素材はローカル同梱ファイルとして `/mnt/c/Users/minou/appraisal-detective/assets/audio/` に格納しています。

Detailed notices:

- `/mnt/c/Users/minou/appraisal-detective/docs/third-party-audio-notices.md`

### Fonts

日本語UIの安定表示のため、以下のフォントを同梱しています。

- `/mnt/c/Users/minou/appraisal-detective/assets/fonts/NotoSansJP-VF.ttf`

## Steam Content Survey用文言

### Pre-Generated AI Content

Some in-game field survey backgrounds and visual-novel character portraits were generated during development using OpenAI image models. These are fixed, pre-generated image assets included in the game build. The game does not generate images, audio, dialogue, or text from player input during runtime.

### Live-Generated AI Content

None. The game does not use live AI generation during gameplay.

## itch.ioページ用文言

本作の一部背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。ゲームプレイ中にAIがプレイヤー入力から画像、音声、会話、文章を生成する機能はありません。

## 台帳との対応

AI生成画像は `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json` で管理します。各assetは最低限、次の項目を持ちます。

- `file`
- `caseId`
- `assetType`
- `usage`
- `altText`
- `promptSummary`
- `promptHash`
- `creditText`
- `regenerationPolicy`
- `sha256`
- `width`
- `height`
- `bytes`
- `generationPath`
- `reviewStatus`
- `storeUseAllowed`
- `aiDisclosureCategory`

フルプロンプト、ローカル生成候補の絶対パス、rejected候補の詳細は公開用 `assets-manifest.json` には含めません。これらは非公開の `.asset-provenance.private.json` で管理し、公開配布物・GitHub Pages・ストア素材には含めません。

`storeUseAllowed: true` はローカルβ・レビュー用素材としての内部承認です。外部公開前には、ストア提出用のキーアート、スクリーンショット、法務/ライセンス確認、プラットフォーム入力フォームとの照合を別途完了します。
