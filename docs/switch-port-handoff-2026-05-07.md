# 鑑定DE探偵 Nintendo Switch 完全移植ハンドオフ

作成日: 2026-05-07

対象URL: `https://minougun.github.io/appraisal-detective/`

対象ローカルパス: `/mnt/c/Users/minou/appraisal-detective/`

既存Unity試作: `/mnt/c/Users/minou/appraisal-detective-unity/`

## 結論

Switch完全移植は、現時点では「SDK入手前に完了できる範囲」と「Nintendo承認後にしか完了できない範囲」に分かれる。

この文書と同時に、SDKなしで進められる移植準備を実装した。

- Web版にSwitch想定のゲームパッド/キーボード操作レイヤーを追加。
- Switch/Unityへ渡す正規化データを書き出す `dist/switch-port/appraisal-detective-switch-data.json` を追加。
- `npm run test:switch-readiness` で、データ、入力、保存スキーマ、素材参照、SDK境界の検証を走らせる。

ただし、Nintendo Switch向けの実バイナリ、NACP/NSP等のプラットフォーム固有パッケージ、実機検証、Lotcheck/プラットフォーム審査相当の確認は、Nintendo Developer Portalの承認、Switch開発環境、Unity Switch platform support add-on、実機開発機材がない限り生成できない。SDKなしでは生成できない。

## 公式情報で固定した前提

- Nintendo Developer Portal: `https://developer.nintendo.com/`
  - 個人でも登録でき、Switch向け開発とeShopセルフパブリッシュの導線がある。
- Nintendo Developer Portal 登録: `https://developer.nintendo.com/register`
  - Switch開発リソースへアクセスするには登録後にNintendo Switch Access Requestを提出する。
  - UnityやネイティブC++等の複数開発環境向けリソースが提供される。
- Unity for Nintendo Switch: `https://unity.com/solutions/nintendo-switch`
  - Nintendo承認、closed console platform申請、platform support add-on、実機テスト、最適化、プラットフォームパッケージ、審査、ストアアセット作成が必要。
  - Unity Proまたはplatform holder提供のPreferred Platform license keyが必要。

## 移植方針

### 推奨ルート

Unity移植を推奨する。

理由:

- 既存Unity試作 `/mnt/c/Users/minou/appraisal-detective-unity/` があり、机上UI、証拠カード、報告対決の縦切りが存在する。
- 現行Web版はDOM/CSS/ローカルストレージに依存しており、Switch向けブラウザランタイムとしてそのまま製品化する前提は弱い。
- UnityならNintendo承認後にSwitch platform support add-onへ接続できる。
- テキストADV/2D UI中心のゲームなので、Unity uGUIまたはUI Toolkitへデータ駆動で移植するのが最短。

### 非推奨ルート

非公式homebrew、脱獄、本体改造、未承認SDK、エミュレータ依存の配布は採用しない。商用リリース、権利、レビュー、ストア公開の全てで不適切。

## Switch版の到達条件

### 入力

Web版に追加した `platform-controller.js` をSwitch操作仕様の基準にする。

| Switch操作 | 意味 |
| --- | --- |
| A | 決定、次へ、選択中ボタン実行 |
| B | 戻る、閉じる、ノベルスキップ |
| X | 証拠ボード表示/非表示 |
| Y | 目標/ヒント読み上げ |
| + | 設定 |
| - | 低刺激切替 |
| D-pad / 左スティック | フォーカス移動 |

Web検証では、同等操作を `Enter`, `Space`, `Escape`, `X`, `Y`, `+`, `-`, 矢印キーで確認する。

### 画面

- 1280x720 handheld、1920x1080 TVの両方で文字が読める。
- 画面端に重要操作を置かず、安全余白を確保する。
- 低刺激モードでは、フェーズカットイン、ランク光線、カード揺れ、BGM/SEを抑制する。
- タッチ操作なしでも全フェーズを完走できる。

### セーブ

現行Web版の `localStorage` レコードを、Switch版ではプラットフォーム保存APIへ移す。

保存キー相当:

```text
appraisal-detective-records-v1
```

必須フィールド:

- `bestNormal`
- `bestAudit`
- `completions`
- `lastRank`
- `lastPlayed`
- `scenarioRuns`
- `bestScenarioMastery`
- `lastScenario`
- `lastScenarioTitle`
- `lastScenarioSeed`
- `lastScenarioMastery`
- `titles`

### データ

Web版からSwitch/Unity移植用に以下を出力する。

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run export:switch
```

出力:

```text
/mnt/c/Users/minou/appraisal-detective/dist/switch-port/appraisal-detective-switch-data.json
```

内容:

- 10案件
- 証拠カタログ
- HBUマトリクス
- 監査基準
- 現地調査ホットスポット
- ダミーホットスポット
- 資料照合
- ダミー資料
- 案件固有メカニクス
- 調整幅
- 再反論
- 市場シナリオ
- 画像/ポートレート素材台帳
- Switch操作割当
- セーブデータschema

## 既存Unity試作との差分

既存Unity試作 `/mnt/c/Users/minou/appraisal-detective-unity/` は、案件001の縦切りMVPであり、商用95点版のWeb仕様とは差が大きい。

不足:

- 10案件
- 生成画像/依頼者ポートレートの取り込み
- ノベルADVシーン
- 監査レビュー
- HBUマトリクス
- 市場シナリオとリプレイ称号
- 資料ドラッグ照合
- 低刺激/音声設定の製品UI
- アセット台帳/AI開示/クレジット画面
- Switch入力前提のフォーカス移動
- プラットフォーム保存API

Unity側の次作業は、旧 `AppraisalDetectivePrototype.cs` を肥大化させるのではなく、次の分割にする。

```text
Assets/Scripts/AppraisalDetective/
  Core/GameState.cs
  Core/CaseRepository.cs
  Core/ScoringService.cs
  Input/SwitchInputMap.cs
  UI/DialogueRunner.cs
  UI/CaseSelectView.cs
  UI/FieldSurveyView.cs
  UI/DocumentReviewView.cs
  UI/AppraisalJudgmentView.cs
  UI/ReportBattleView.cs
  UI/ResultReviewView.cs
  Platform/SaveDataService.cs
  Platform/AudioSettingsService.cs
```

## 実装済みローカル成果

### 1. Web版Switch操作レイヤー

ファイル:

```text
/mnt/c/Users/minou/appraisal-detective/platform-controller.js
```

内容:

- Gamepad API polling
- A/B/X/Y/+/-/D-pad相当の操作割当
- キーボード代替操作
- 証拠ボード開閉
- 目標読み上げ
- 設定/低刺激切替

### 2. UIヒント

ファイル:

```text
/mnt/c/Users/minou/appraisal-detective/index.html
/mnt/c/Users/minou/appraisal-detective/styles.css
```

内容:

- 上部バーに `操作 A決定 / B戻る / X証拠 / +設定` を表示
- コントローラー操作で証拠ボードを一時拡張

### 3. Switch移植データexport

ファイル:

```text
/mnt/c/Users/minou/appraisal-detective/scripts/export-switch-port-data.mjs
```

コマンド:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run export:switch
```

### 4. Switch readiness検証

ファイル:

```text
/mnt/c/Users/minou/appraisal-detective/scripts/verify-switch-readiness.mjs
```

コマンド:

```bash
cd /mnt/c/Users/minou/appraisal-detective
npm run test:switch-readiness
```

### 5. CSP対応

Switch入力対応に合わせて、本番CSP `style-src 'self'` でブロックされるインラインstyle経路を撤去した。

対象:

```text
/mnt/c/Users/minou/appraisal-detective/app.js
/mnt/c/Users/minou/appraisal-detective/styles.css
```

内容:

- 現地調査ホットスポット位置をHTMLの `style="left/top"` からCSSクラスへ移動。
- 案件ファイル選択アニメの動的CSS変数注入をやめ、既存の左右/中央ファイル用CSS transformへ固定。
- これにより、Nintendo/Steam等の本番相当CSPでもゲームフロー中にstyle違反を出さない。

## 検証結果

2026-05-07時点で以下を確認済み。

```bash
cd /mnt/c/Users/minou/appraisal-detective
node --check app.js
node --check platform-controller.js
node --check scripts/export-switch-port-data.mjs
node --check scripts/verify-switch-readiness.mjs
npm run export:switch
npm run test:switch-readiness
npm run test:production
npm run test:persona
npm run test:e2e
```

結果:

```text
switch_port_cases=10
switch_port_assets=22
switch_readiness_checks=passed
production_server_checks=passed
persona_gate_type=spec_coverage_not_human_commercial_quality
persona_average=100.0
74 passed
```

ローカル確認URL:

```text
http://127.0.0.1:44561/
```

## SDK取得後のStop Condition

Nintendo承認後に、次が揃った時点で「Switch完全移植版」と呼べる。

1. Unity Switch targetで全10案件が起動する。
2. Joy-Con/Pro Controllerだけで全フェーズ完走できる。
3. TV/handheldで文字可読性と安全余白を確認済み。
4. 低刺激モードでBGM/SE/フラッシュ/揺れが抑制される。
5. プラットフォーム保存APIで記録、実績、設定を保存できる。
6. 生成画像、BGM、フォント、AI利用開示、クレジットがSwitch版クレジットに入っている。
7. 実機でクラッシュなし、メモリ/ロード時間/入力遅延が許容範囲。
8. Nintendoの提出要件に沿ったパッケージを生成し、プラットフォーム審査へ提出可能。

## 現時点のブロッカー

実装上のローカルP0はない。

外部ブロッカー:

- Nintendo Developer Portal承認
- Switch Access Request承認
- Unity ProまたはPreferred Platform license key
- Unity Switch platform support add-on
- Switch開発機材
- Nintendoの非公開ドキュメント/提出要件へのアクセス

## GitHub / Issue / PR

- GitHub Issue: not_applicable
- PR: not_applicable
- 理由: 現時点ではローカルのSwitch移植準備。Nintendo SDK/実機が必要な公開・提出・プラットフォームビルドは行っていない。
