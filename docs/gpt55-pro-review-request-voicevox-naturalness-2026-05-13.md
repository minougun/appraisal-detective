# GPT-5.5 Pro Review Request: VOICEVOX Naturalness Pass

Date: 2026-05-13
Project: 鑑定DE探偵 / Appraisal Detective
Local app URL: `http://127.0.0.1:44561/`
Repository root: `/mnt/c/Users/minou/appraisal-detective`

## Review Goal

Please give a severe, implementation-level critique of the current dialogue voice system.

The user complaint is:

> まだまだ全然機械音声っぽい。抑揚のない棒読み丸出し。

The goal is not merely "make it use VOICEVOX." It already attempts to use VOICEVOX. The goal is to identify why the actual perceived acting still sounds flat, robotic, monotone, and mechanically segmented, and to propose concrete code/data changes that would make it closer to human-like game dialogue.

Be blunt. Do not reassure. Prioritize actionable defects and missing design decisions.

## Current Implementation Summary

Main files:

- `audio-controller.js`
- `app.js`
- `scripts/serve-production.mjs`
- `tests/appraisal-detective-flow.spec.js`
- `docs/third-party-audio-notices.md`

The app currently:

- Adds a `VOICE` toggle.
- Tries VOICEVOX first, then falls back to browser/OS `SpeechSynthesis`.
- Talks to VOICEVOX through:
  - direct browser fetch to `http://127.0.0.1:50021` / `http://localhost:50021`
  - same-origin proxy `/voicevox/*` from `scripts/serve-production.mjs`
- Uses VOICEVOX endpoints:
  - `/speakers`
  - `/audio_query`
  - `/synthesis`
- Splits dialogue into short punctuation-based parts before synthesis.
- Applies simple profile-based tuning:
  - `speedScale`
  - `pitchScale`
  - `intonationScale`
  - `volumeScale`
  - `prePhonemeLength`
  - `postPhonemeLength`
- Chooses speakers by matching VOICEVOX speaker names against hardcoded preference lists.
- Caches synthesized blobs by speaker, text, and profile parameters.

VOICEVOX Engine status observed locally:

- Windows-side `http://127.0.0.1:50021/version` returns `0.25.1`.
- A direct synthesis smoke test returned a WAV-sized response.
- From WSL, direct access to Windows `127.0.0.1:50021` may not be visible, so tests use stubs.

## Relevant Code Pointers

In `audio-controller.js`, review these functions and constants:

- `voicevoxSpeakerPreferences`
- `voiceProfile`
- `voiceParts`
- `expressiveProfile`
- `speakVoicevoxQueue`
- `speakVoicevoxPart`
- `pickVoicevoxSpeaker`
- `tuneVoicevoxQuery`
- `voicevoxFetch`
- `playVoicevoxAudio`

In `app.js`, review:

- `voiceLine`
- `speakMentorLine`
- `speakVisibleConversation`
- `visibleDialogueVoiceLines`
- `gameplayCastVoiceLines`

In `tests/appraisal-detective-flow.spec.js`, review:

- `installVoiceStub`
- `installVoicevoxStub`
- `VOICE toggle persists and reads dialogue with character voice profiles`
- `VOICE prefers local VOICEVOX Engine audio through the production proxy`

## Suspected Failure Points To Challenge

Please verify, reject, or refine these hypotheses. Do not accept them blindly.

1. Over-segmentation may be destroying natural phrasing.
   The current `voiceParts` splits by punctuation and then synthesizes each segment independently. This may create unnatural reset points, inconsistent pitch baselines, and clipped delivery. Human speech needs phrase continuity, not isolated sentence fragments.

2. VOICEVOX parameter mapping may be naive.
   Current code maps internal `pitch` and `rate` profiles into `pitchScale`, `speedScale`, and `intonationScale` with simple formulas. This may not match how VOICEVOX actually performs emotional prosody. The result may change pitch but not acting.

3. Speaker selection is too shallow.
   `pickVoicevoxSpeaker` chooses only the first style for a matched speaker. It ignores style variants such as normal, whisper, angry, sad, happy, etc. This likely wastes the most important expressive control VOICEVOX offers.

4. Character casting is under-specified.
   The mapping currently picks plausible speaker names, but there is no per-character acting direction: age, energy, confidence, anxiety, sarcasm, authority, pressure, hesitation, or emotional arc.

5. Dialogue text may not be written for TTS.
   The current lines may be visually readable but not speakable. Natural VOICEVOX delivery may require punctuation, breath markers, rewritten contractions, explicit hesitation, and shorter clauses in the source copy or a separate spoken-script layer.

6. No pronunciation/accent pass exists.
   Real-estate terms such as `鑑定評価`, `最有効使用`, `収益還元法`, `取引事例比較法`, `地積`, `NOI`, and place/case names may be read unnaturally. There is no user dictionary, kana override, or AquesTalk-style correction workflow.

7. The tests prove plumbing, not quality.
   Current tests verify that requests are made and parameters change. They do not catch monotone delivery, wrong style choice, broken phrase continuity, awkward pauses, or bad pronunciation.

8. Browser fallback may mask VOICEVOX failures.
   The toggle can show enabled while falling back. The user may hear the fallback without knowing it. The UI may need a clear status such as `VOICE VOICEVOX`, `VOICE 代替音声`, or a debug indicator.

9. Cache keys may lock in poor acting.
   Cached blobs are keyed by text/profile, but if style selection or dictionary tuning changes, stale blobs may still play unless cache invalidation is strong enough.

10. Runtime generation may feel laggy or clipped.
    Since audio is generated at line time, there may be pauses before speech. Prewarming or pre-rendering the next visible line may be needed for natural pacing.

## What I Need From You

Return a review in this exact structure:

```md
# VOICEVOX Naturalness Review

## Critical Findings

List the highest-impact defects first. Each finding must include:

- Severity: critical / high / medium / low
- File/function
- Why it causes robotic or monotone speech
- Concrete fix
- Test or manual verification method

## Speaker Casting Plan

For narrator, player, mentor, and every client portrait class, propose:

- Preferred VOICEVOX speaker
- Preferred style name or style-selection rule
- Acting direction
- Speed / pitch / intonation / pause targets
- Lines where the current casting likely fails

## Prosody and Text Pipeline Plan

Propose a replacement pipeline for:

- spoken-script generation or markup
- phrase grouping
- breath pauses
- emotional tags
- question endings
- hesitation / pressure / mentor correction
- dictionary or kana overrides

## Code Change Plan

Give a small, reviewable implementation plan. Include:

- functions to delete or rewrite
- new data structures needed
- how to preserve fallback behavior
- cache invalidation strategy
- how to avoid making CSP or local proxy riskier

## Test Plan

Give automated and manual tests. Include:

- unit-level checks
- Playwright checks
- manual listening script
- specific sample lines that should be evaluated
- pass/fail criteria for "not棒読み"

## Questions For The Human

Ask only questions that materially affect the solution.
```

## Constraints

- Use free/local voice material. Paid cloud TTS is out of scope.
- Prefer VOICEVOX if available.
- Keep browser/OS SpeechSynthesis fallback for environments without VOICEVOX.
- No external network dependency during play.
- Do not require bundling generated WAV assets unless you argue strongly for pre-rendering and explain storage/licensing impact.
- Keep low-stimulus mode suppressing voice and sound.
- Avoid broad unrelated UI redesign.
- Keep changes testable in this repo.

## Current Validation Evidence

Recent checks after the VOICEVOX integration:

- `npm run test:production` passed.
- `npm run test:deploy-config` passed.
- `npx playwright test tests/appraisal-detective-flow.spec.js -g "VOICE"` passed.
- `npm run test:e2e` passed: 87 tests.
- `http://127.0.0.1:44561/` returns 200.
- Windows-side VOICEVOX Engine `http://127.0.0.1:50021/version` returns `0.25.1`.

These checks prove integration stability. They do not prove audio naturalness.

## Review Standard

Do not give generic TTS advice. Tie every recommendation to this codebase, VOICEVOX behavior, or the current game dialogue.

Prefer changes that will audibly improve the first 60 seconds of play:

1. opening narration by the player/new appraiser
2. mentor line: `数字の裏に人の都合がある。だが、鑑定評価は同情ではなく根拠で切り分けろ。`
3. first client pressure line in a selected case
4. result/mentor feedback

The review is successful only if it produces a concrete next implementation pass that can be executed without another round of vague interpretation.
