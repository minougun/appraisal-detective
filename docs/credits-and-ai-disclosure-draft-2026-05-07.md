# 鑑定探偵 クレジット / AI利用開示ドラフト

作成日: 2026-05-07

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

## ゲーム内クレジット案

### Images

Some background images and character portraits were generated during development with OpenAI image models.

一部の背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。

Asset ledger:

- `/mnt/c/Users/minou/appraisal-detective/assets-manifest.json`

### Music

Music tracks are stored locally under `/mnt/c/Users/minou/appraisal-detective/assets/audio/`.

Detailed notices:

- `/mnt/c/Users/minou/appraisal-detective/docs/third-party-audio-notices.md`

### Fonts

Japanese UI font is self-hosted for stable local display:

- `/mnt/c/Users/minou/appraisal-detective/assets/fonts/NotoSansJP-VF.ttf`

## Steam Content Survey用ドラフト

Pre-Generated AI Content:

> Some in-game field survey backgrounds and visual-novel character portraits were generated during development using OpenAI image models. These are fixed, pre-generated image assets included in the game build. The game does not generate image, audio, or text content from player input during runtime.

Live-Generated AI Content:

> None. The game does not use live AI generation during gameplay.

## itch.ioページ用ドラフト

> 本作の一部背景画像およびキャラクターポートレートは、開発中にOpenAIの画像生成モデルで作成した事前生成アセットです。ゲームプレイ中にAIがプレイヤー入力から画像や文章を生成する機能はありません。

## 公開前チェック

- `assets-manifest.json` の全assetに `caseId / assetType / usage / altText / creditText / sha256 / width / height / bytes / reviewStatus / storeUseAllowed / aiDisclosureCategory` があること。
- `storeUseAllowed: true` は内部beta向け承認であり、Steam/itch.io公開前にはストア用スクリーンショット、クレジット、AI開示文、法務/ライセンス確認を別途完了すること。
- BGMの出典とライセンスは `third-party-audio-notices.md` とゲーム内クレジットで一致させること。
- Steam/itch.ioへ公開する場合は、各プラットフォームの最新AI開示要件を公開直前に再確認すること。
