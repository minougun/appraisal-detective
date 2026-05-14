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
- Dialogue voice playback is user-controllable through the `#voice-toggle` button.
- Dialogue voice playback first tries a local VOICEVOX Engine through the same-origin `/voicevox/*` proxy exposed by `scripts/serve-production.mjs`, then directly tries `http://127.0.0.1:50021` and `http://localhost:50021`.
- The proxy allowlists only `/version`, `/speakers`, `/presets`, `/audio_query`, `/accent_phrases`, and `/synthesis`, and points to `VOICEVOX_ENGINE_URL` or `http://127.0.0.1:50021`.
- If the local engine is not running, playback falls back to browser or OS Japanese SpeechSynthesis voices. No remote paid TTS request is made and no generated voice asset is stored in this repository.
- Character casting is handled by local VOICEVOX speaker-name and style-name preferences plus acting profiles for narrator, player, mentor, and client archetypes.
- Dialogue playback uses a spoken-text layer separate from display text. The spoken layer applies real-estate term pronunciation replacements, mentor/client emotion tags, meaning-based phrase grouping, and VOICEVOX query tuning before synthesis.
- The UI distinguishes `VOICE VOICEVOX` from `VOICE 代替音声` so fallback playback is not mistaken for VOICEVOX quality.
- Low-stimulus mode suppresses BGM in addition to SE, pressure flash, and evidence-board pulse feedback.
- Audio starts only after a user gesture, following browser autoplay rules.
