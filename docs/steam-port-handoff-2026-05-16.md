# Steam配信移植ハンドオフ 2026-05-16

## 目的

`鑑定DE探偵` をSteam配信用のデスクトップアプリとして配布できる形へ移植する。現行Web版のゲーム本体は維持し、Steam向けにはElectronでローカルHTMLを読み込むオフライン実行パッケージを作る。

## 今回ローカルで完了した範囲

- Electronデスクトップ起動面を追加。
- renderer側は `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。
- 外部遷移と新規ウィンドウを制限。
- Steam向けWindows depot候補を作る `build:steam:win-dir` を追加。
- SteamPipe用VDFテンプレートを追加。
- `test:steam-readiness` で移植前提を検証。
- Steam配信用パッケージに含めるファイルを `package.json` の `build.files` に固定。
- 非公開の `.asset-provenance.private.json` はパッケージ対象外。

## 境界

ここまでで「Steamに載せられるデスクトップビルドを作る基盤」は入った。ただし、Steamworks側の以下はローカルだけでは完了できない。

- Steam Direct fee支払い。
- Steam App ID / Depot ID発行。
- Steamworks SDKの取得。
- SteamPipeへの実アップロード。
- ストアページ、価格、税務、銀行情報、審査提出。
- Coming Soon公開。
- Valveレビュー。
- 最終リリースボタン操作。

## 公式要件メモ

Steamworks公式ドキュメント上、リリース前にはストアページとビルドのレビューが必要。ストアページレビューは通常3〜5営業日目安で、余裕を見て7営業日前提出が推奨されている。

SteamのRelease Optionsでは、Coming Soonページを最低2週間公開してからリリースする必要がある。

Steam Directでは、アプリ費用支払いからゲームリリースまで30日の待機期間がある。

SteamPipeのビルドアップロードは、Steamworks SDKに含まれるコマンドラインツールで実行する。今回の `steamworks/*.vdf` はそのテンプレート。

参照:

- https://partner.steamgames.com/doc/store/review_process
- https://partner.steamgames.com/doc/store/releasing
- https://partner.steamgames.com/doc/store/types
- https://partner.steamgames.com/steamdirect
- https://partner.steamgames.com/doc/sdk/uploading

## 推奨作業順

1. `npm run test:steam-readiness`
2. `npm run build:desktop:dir`
3. Windows実機、またはwine入りLinux CIで `npm run build:steam:win-dir`
4. 出力された `dist/desktop/win-unpacked` をWindows実機で起動確認。
5. SteamworksでApp ID / Windows Depot IDを取得。
6. `steamworks/app_build_template.vdf` と `steamworks/depot_build_windows_template.vdf` のプレースホルダをローカル作業コピーで置換。
7. Steamworks SDKの `steamcmd` でアップロード。
8. Steamクライアントからインストール・起動確認。
9. ストアページ、価格、ビルドをレビュー提出。

## Steamストア素材の残タスク

- カプセル画像一式。
- スクリーンショット。
- トレーラー。
- 日本語/英語ストア説明。
- AI生成素材の開示文。
- サードパーティ音源クレジット。
- サポート連絡先。

## 残リスク

- WSL/Linux環境での `build:steam:win-dir` は、ElectronのWindows exe resource更新にwineが必要なため未完了。Windows実機またはwine入りCIで再実行する。
- Windows実機での起動確認は未実施。
- Steamクライアント経由の起動確認は未実施。
- Steam overlay / achievements / cloud saveは未実装。
- Steamworks SDKは未同梱。SDKのライセンスと認証が必要。
- 実ユーザー3分観察、実機スマホ確認はSteam移植とは別に未実施。
