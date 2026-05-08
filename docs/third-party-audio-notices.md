# Third-Party Audio Notices

Date accessed: 2026-05-06

The prototype uses the following local BGM files from Mixkit's free stock music catalog. The tracks are stored under `assets/audio/` so the local build does not depend on a remote audio CDN during play.

| Scene | Local file | Track | Artist | Source | License |
| --- | --- | --- | --- | --- | --- |
| 案件選択 / 結果 | `assets/audio/mixkit-echoes-188.mp3` | Echoes | Andrew Ev | `https://mixkit.co/free-stock-music/tag/mystery/` | Mixkit Stock Music Free License |
| 現地調査 / 資料照合 / 鑑定判断 | `assets/audio/mixkit-tapis-615.mp3` | Tapis | Eugenio Mininni | `https://mixkit.co/free-stock-music/tag/mystery/` | Mixkit Stock Music Free License |
| 報告・対決 | `assets/audio/mixkit-piano-horror-671.mp3` | Piano Horror | Francisco Alvear | `https://mixkit.co/free-stock-music/tag/mystery/` | Mixkit Stock Music Free License |

License reference: `https://mixkit.co/license/#musicFree`

Implementation notes:

- BGM is user-controllable through the `#bgm-toggle` button.
- Low-stimulus mode suppresses BGM in addition to SE, pressure flash, and evidence-board pulse feedback.
- Audio starts only after a user gesture, following browser autoplay rules.
